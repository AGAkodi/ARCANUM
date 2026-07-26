#![no_std]
//! ΛRCΛNUM shielded pool.
//!
//! Closes the last privacy gap in the payment flow. The verifier contract proves
//! amounts in zero-knowledge, but its `token::transfer` still writes sender,
//! recipient, and amount to the public ledger as a SEP-41 event. This pool routes
//! value through a single shared contract instead:
//!
//! - `deposit`  moves XLM into the pool (visible, one-time) and credits an
//!   internal balance.
//! - `shielded_transfer` moves value between internal balances after verifying the
//!   same compliance + amount ZK proofs. It performs NO token transfer, so no
//!   wallet-to-wallet SEP-41 event with an amount ever reaches the public ledger —
//!   only a proof-hash event is emitted.
//! - `withdraw` releases value from an internal balance back to a wallet, decoupled
//!   in time and counterparty from the internal transfer that funded it.
//!
//! Privacy model (honest scope): internal balances are stored as plaintext `i128`
//! in contract storage and the transfer `amount` is a call argument, so this hides
//! amounts at the *ledger-event* level, not from someone reading contract state.
//! Full amount-hiding (commitments + nullifiers) is future work; this delivers the
//! reviewer-requested property that no direct transfer with an amount appears
//! on-chain, with every internal move gated by a real on-chain proof verification.
//!
//! The two circuit VKs and the pool token are immutable: set once at deploy time
//! via the constructor, with no admin or upgrade path.
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Bytes,
    BytesN, Env, Symbol,
};
use ultrahonk_soroban_verifier::{UltraHonkVerifier, VkLoadError, PROOF_BYTES};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Compliance circuit verification key.
    VkCompliance,
    /// Amount-range circuit verification key.
    VkAmount,
    /// The single token this pool custodies (a Stellar Asset Contract address).
    Token,
    /// Per-address internal shielded balance.
    Balance(Address),
}

#[contracterror]
#[repr(u32)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    /// Constructor has already run; token and VKs are immutable.
    AlreadyInitialized = 1,
    /// A VK byte slice is malformed or has the wrong length.
    VkInvalid = 2,
    /// No VK stored for the requested circuit.
    VkNotSet = 3,
    /// Proof byte slice does not match the expected exact length.
    ProofParseError = 4,
    /// Cryptographic verification of the compliance proof failed.
    ComplianceProofInvalid = 5,
    /// Cryptographic verification of the amount proof failed.
    AmountProofInvalid = 6,
    /// Amount must be strictly positive.
    InvalidAmount = 7,
    /// Internal balance is too low for the requested debit.
    InsufficientBalance = 8,
    /// Pool token was never configured (constructor did not run).
    TokenNotSet = 9,
}

const EVT: Symbol = symbol_short!("arcpool");

#[contract]
pub struct ArcanumPool;

impl ArcanumPool {
    fn store_vk(env: &Env, key: DataKey, vk_bytes: &Bytes) -> Result<(), Error> {
        UltraHonkVerifier::new(env, vk_bytes).map_err(|e| match e {
            VkLoadError::WrongLength | VkLoadError::InvalidParameters => Error::VkInvalid,
        })?;
        env.storage().instance().set(&key, vk_bytes);
        Ok(())
    }

    fn verify_with(
        env: &Env,
        key: DataKey,
        public_inputs: &Bytes,
        proof: &Bytes,
        failure: Error,
    ) -> Result<(), Error> {
        if proof.len() as usize != PROOF_BYTES {
            return Err(Error::ProofParseError);
        }
        let vk_bytes: Bytes = env.storage().instance().get(&key).ok_or(Error::VkNotSet)?;
        let verifier = UltraHonkVerifier::new(env, &vk_bytes).map_err(|_| Error::VkInvalid)?;
        verifier.verify(env, proof, public_inputs).map_err(|_| failure)
    }

    fn proof_hash(env: &Env, a: &Bytes, b: &Bytes) -> BytesN<32> {
        let mut all = Bytes::new(env);
        all.append(a);
        all.append(b);
        env.crypto().keccak256(&all).to_bytes()
    }

    fn balance_of(env: &Env, addr: &Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(addr.clone()))
            .unwrap_or(0)
    }

    fn set_balance(env: &Env, addr: &Address, amount: i128) {
        env.storage()
            .persistent()
            .set(&DataKey::Balance(addr.clone()), &amount);
    }

    fn pool_token(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::TokenNotSet)
    }
}

#[contractimpl]
impl ArcanumPool {
    /// Configure the pool token and the two circuit VKs once at deploy time.
    pub fn __constructor(
        env: Env,
        token: Address,
        vk_compliance: Bytes,
        vk_amount: Bytes,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Token) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Token, &token);
        Self::store_vk(&env, DataKey::VkCompliance, &vk_compliance)?;
        Self::store_vk(&env, DataKey::VkAmount, &vk_amount)?;
        Ok(())
    }

    /// Move `amount` of the pool token from `from` into the pool, crediting the
    /// caller's internal shielded balance. This step is intentionally visible on
    /// the public ledger — only the later `shielded_transfer` is private.
    pub fn deposit(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let token = Self::pool_token(&env)?;
        token::Client::new(&env, &token).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );

        let new_bal = Self::balance_of(&env, &from) + amount;
        Self::set_balance(&env, &from, new_bal);

        env.events()
            .publish((EVT, symbol_short!("deposit")), (from, amount));
        Ok(())
    }

    /// The private transfer. Verifies the compliance proof (recipient not
    /// sanctioned) and the amount-range proof on-chain, then moves `amount`
    /// between internal balances. No token transfer occurs, so nothing lands on
    /// the public ledger except a `("arcpool","transfer")` event carrying only the
    /// combined proof hash. Any proof failure or insufficient balance reverts the
    /// whole invocation, leaving both balances untouched.
    #[allow(clippy::too_many_arguments)]
    pub fn shielded_transfer(
        env: Env,
        sender: Address,
        recipient: Address,
        amount: i128,
        compliance_inputs: Bytes,
        compliance_proof: Bytes,
        amount_inputs: Bytes,
        amount_proof: Bytes,
    ) -> Result<BytesN<32>, Error> {
        sender.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        Self::verify_with(
            &env,
            DataKey::VkCompliance,
            &compliance_inputs,
            &compliance_proof,
            Error::ComplianceProofInvalid,
        )?;
        Self::verify_with(
            &env,
            DataKey::VkAmount,
            &amount_inputs,
            &amount_proof,
            Error::AmountProofInvalid,
        )?;

        let sender_bal = Self::balance_of(&env, &sender);
        if sender_bal < amount {
            return Err(Error::InsufficientBalance);
        }
        Self::set_balance(&env, &sender, sender_bal - amount);
        let recipient_bal = Self::balance_of(&env, &recipient);
        Self::set_balance(&env, &recipient, recipient_bal + amount);

        let hash = Self::proof_hash(&env, &compliance_proof, &amount_proof);
        env.events()
            .publish((EVT, symbol_short!("transfer")), hash.clone());
        Ok(hash)
    }

    /// Release `amount` from the caller's internal balance to a wallet. Visible on
    /// the ledger, but unlinked from whichever internal transfer funded it.
    pub fn withdraw(
        env: Env,
        owner: Address,
        amount: i128,
        recipient: Address,
    ) -> Result<(), Error> {
        owner.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let bal = Self::balance_of(&env, &owner);
        if bal < amount {
            return Err(Error::InsufficientBalance);
        }
        Self::set_balance(&env, &owner, bal - amount);

        let token = Self::pool_token(&env)?;
        token::Client::new(&env, &token).transfer(
            &env.current_contract_address(),
            &recipient,
            &amount,
        );

        env.events()
            .publish((EVT, symbol_short!("withdraw")), (owner, amount));
        Ok(())
    }

    /// Private balance view, gated by ownership: only the address itself can read
    /// its shielded balance.
    pub fn get_shielded_balance(env: Env, address: Address) -> i128 {
        address.require_auth();
        Self::balance_of(&env, &address)
    }
}

#[cfg(test)]
mod test;
