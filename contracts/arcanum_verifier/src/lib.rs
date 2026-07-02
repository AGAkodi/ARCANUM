#![no_std]
//! ΛRCΛNUM on-chain gatekeeper.
//!
//! Verifies UltraHonk ZK proofs (compliance + amount range) and executes the
//! token transfer only if both proofs hold. Emits events carrying the proof
//! hash — never the private inputs. Also stamps solvency attestations.
//!
//! The three verification keys are immutable: set once at deploy time via the
//! constructor, with no admin or upgrade path. Callers can audit them through
//! `vk_bytes`.
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Bytes,
    BytesN, Env, Symbol,
};
use ultrahonk_soroban_verifier::{UltraHonkVerifier, VkLoadError, PROOF_BYTES};

#[contracttype]
#[derive(Clone, Copy)]
pub enum DataKey {
    VkCompliance,
    VkAmount,
    VkSolvency,
    Solvency,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SolvencyAttestation {
    pub timestamp: u64,
    pub ledger: u32,
    pub proof_hash: BytesN<32>,
}

#[contracterror]
#[repr(u32)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    /// Constructor has already run; VKs are immutable.
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
    /// Cryptographic verification of the solvency proof failed.
    SolvencyProofInvalid = 7,
}

const EVT: Symbol = symbol_short!("arcanum");

#[contract]
pub struct ArcanumVerifier;

impl ArcanumVerifier {
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
        let vk_bytes: Bytes = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(Error::VkNotSet)?;
        let verifier = UltraHonkVerifier::new(env, &vk_bytes).map_err(|_| Error::VkInvalid)?;
        verifier
            .verify(env, proof, public_inputs)
            .map_err(|_| failure)
    }

    fn proof_hash(env: &Env, a: &Bytes, b: &Bytes) -> BytesN<32> {
        let mut all = Bytes::new(env);
        all.append(a);
        all.append(b);
        env.crypto().keccak256(&all).to_bytes()
    }
}

#[contractimpl]
impl ArcanumVerifier {
    /// Set the three circuit VKs once at deploy time.
    pub fn __constructor(
        env: Env,
        vk_compliance: Bytes,
        vk_amount: Bytes,
        vk_solvency: Bytes,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::VkCompliance) {
            return Err(Error::AlreadyInitialized);
        }
        Self::store_vk(&env, DataKey::VkCompliance, &vk_compliance)?;
        Self::store_vk(&env, DataKey::VkAmount, &vk_amount)?;
        Self::store_vk(&env, DataKey::VkSolvency, &vk_solvency)?;
        Ok(())
    }

    /// Return a stored VK for auditability.
    pub fn vk_bytes(env: Env, key: DataKey) -> Result<Bytes, Error> {
        env.storage().instance().get(&key).ok_or(Error::VkNotSet)
    }

    /// The on-chain gate for a confidential payment.
    ///
    /// Verifies the compliance proof (recipient not sanctioned) and the amount
    /// range proof on-chain. Only if BOTH hold does the token transfer
    /// execute; any failure reverts the whole invocation and no funds move.
    /// Emits a `("arcanum","payment")` event carrying only the proof hash.
    #[allow(clippy::too_many_arguments)]
    pub fn verify_payment(
        env: Env,
        sender: Address,
        recipient: Address,
        token: Address,
        amount: i128,
        compliance_inputs: Bytes,
        compliance_proof: Bytes,
        amount_inputs: Bytes,
        amount_proof: Bytes,
    ) -> Result<BytesN<32>, Error> {
        sender.require_auth();

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

        token::Client::new(&env, &token).transfer(&sender, &recipient, &amount);

        let hash = Self::proof_hash(&env, &compliance_proof, &amount_proof);
        env.events()
            .publish((EVT, symbol_short!("payment")), hash.clone());
        Ok(hash)
    }

    /// Verify a solvency proof and stamp it on-chain with the ledger time.
    /// The balance sheet itself never leaves the prover.
    pub fn attest_solvency(
        env: Env,
        public_inputs: Bytes,
        proof: Bytes,
    ) -> Result<SolvencyAttestation, Error> {
        Self::verify_with(
            &env,
            DataKey::VkSolvency,
            &public_inputs,
            &proof,
            Error::SolvencyProofInvalid,
        )?;

        let attestation = SolvencyAttestation {
            timestamp: env.ledger().timestamp(),
            ledger: env.ledger().sequence(),
            proof_hash: env.crypto().keccak256(&proof).to_bytes(),
        };
        env.storage()
            .instance()
            .set(&DataKey::Solvency, &attestation);
        env.events().publish(
            (EVT, symbol_short!("solvency")),
            attestation.proof_hash.clone(),
        );
        Ok(attestation)
    }

    /// Latest solvency attestation, if any.
    pub fn get_solvency_attestation(env: Env) -> Option<SolvencyAttestation> {
        env.storage().instance().get(&DataKey::Solvency)
    }
}

#[cfg(test)]
mod test;
