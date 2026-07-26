#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::StellarAssetClient,
    Address, Bytes, Env,
};
use std::{fs, path::Path, vec::Vec};

extern crate std;

fn load(env: &Env, circuit: &str, file: &str) -> Bytes {
    let path = Path::new("../../circuits").join(circuit).join("target").join(file);
    let bytes: Vec<u8> =
        fs::read(&path).unwrap_or_else(|e| panic!("failed to read {}: {e}", path.display()));
    Bytes::from_slice(env, &bytes)
}

struct Setup<'a> {
    env: Env,
    client: ArcanumPoolClient<'a>,
    token: token::Client<'a>,
}

/// Register the pool over a fresh Stellar Asset Contract and mint `mint_to_first`
/// of it to a returned depositor address.
fn setup() -> (Setup<'static>, Address) {
    let env = Env::default();
    env.ledger().set_protocol_version(26);
    // UltraHonk verification far exceeds the default test budget.
    env.cost_estimate().budget().reset_unlimited();
    env.mock_all_auths();

    let sac = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_id = sac.address();

    let vk_compliance = load(&env, "compliance_circuit", "vk");
    let vk_amount = load(&env, "amount_circuit", "vk");

    let contract_id = env.register(ArcanumPool, (token_id.clone(), vk_compliance, vk_amount));
    let client = ArcanumPoolClient::new(&env, &contract_id);
    let token = token::Client::new(&env, &token_id);

    let depositor = Address::generate(&env);
    StellarAssetClient::new(&env, &token_id).mint(&depositor, &1_000_000);

    (Setup { env, client, token }, depositor)
}

#[test]
fn deposit_credits_internal_balance_and_custodies_token() {
    let (Setup { client, token, .. }, depositor) = setup();

    client.deposit(&depositor, &1_000_000);

    // internal balance credited, token moved into the pool contract
    assert_eq!(client.get_shielded_balance(&depositor), 1_000_000);
    assert_eq!(token.balance(&depositor), 0);
    assert_eq!(token.balance(&client.address), 1_000_000);
}

#[test]
fn shielded_transfer_moves_internal_balance_without_touching_ledger() {
    let (
        Setup {
            env, client, token, ..
        },
        sender,
    ) = setup();
    let recipient = Address::generate(&env);

    client.deposit(&sender, &1_000_000);
    let contract_token_before = token.balance(&client.address);

    let hash = client.shielded_transfer(
        &sender,
        &recipient,
        &250_000,
        &load(&env, "compliance_circuit", "public_inputs"),
        &load(&env, "compliance_circuit", "proof"),
        &load(&env, "amount_circuit", "public_inputs"),
        &load(&env, "amount_circuit", "proof"),
    );

    assert_eq!(hash.len(), 32);
    // internal balances updated
    assert_eq!(client.get_shielded_balance(&sender), 750_000);
    assert_eq!(client.get_shielded_balance(&recipient), 250_000);
    // NOTHING moved on the public ledger: no wallet received tokens, pool custody
    // is unchanged.
    assert_eq!(token.balance(&recipient), 0);
    assert_eq!(token.balance(&client.address), contract_token_before);
}

#[test]
fn shielded_transfer_rejects_corrupted_proof_and_moves_no_balance() {
    let (
        Setup {
            env, client, ..
        },
        sender,
    ) = setup();
    let recipient = Address::generate(&env);

    client.deposit(&sender, &1_000_000);

    // Flip one byte inside the witness commitments (the proof tail is padding for
    // small circuits, so corruption there could go unnoticed).
    let good = load(&env, "compliance_circuit", "proof");
    let mut raw = std::vec![0u8; good.len() as usize];
    good.copy_into_slice(&mut raw);
    raw[600] ^= 0xff;
    let corrupted = Bytes::from_slice(&env, &raw);

    let result = client.try_shielded_transfer(
        &sender,
        &recipient,
        &250_000,
        &load(&env, "compliance_circuit", "public_inputs"),
        &corrupted,
        &load(&env, "amount_circuit", "public_inputs"),
        &load(&env, "amount_circuit", "proof"),
    );

    assert_eq!(result, Err(Ok(Error::ComplianceProofInvalid)));
    // balances untouched
    assert_eq!(client.get_shielded_balance(&sender), 1_000_000);
    assert_eq!(client.get_shielded_balance(&recipient), 0);
}

#[test]
fn shielded_transfer_rejects_insufficient_balance() {
    let (
        Setup {
            env, client, ..
        },
        sender,
    ) = setup();
    let recipient = Address::generate(&env);

    // deposit less than we try to send
    client.deposit(&sender, &100_000);

    let result = client.try_shielded_transfer(
        &sender,
        &recipient,
        &250_000,
        &load(&env, "compliance_circuit", "public_inputs"),
        &load(&env, "compliance_circuit", "proof"),
        &load(&env, "amount_circuit", "public_inputs"),
        &load(&env, "amount_circuit", "proof"),
    );

    assert_eq!(result, Err(Ok(Error::InsufficientBalance)));
    assert_eq!(client.get_shielded_balance(&sender), 100_000);
    assert_eq!(client.get_shielded_balance(&recipient), 0);
}

#[test]
fn withdraw_releases_correct_amount_to_wallet() {
    let (
        Setup {
            env, client, token, ..
        },
        owner,
    ) = setup();
    let external = Address::generate(&env);

    client.deposit(&owner, &1_000_000);
    client.withdraw(&owner, &400_000, &external);

    // internal balance reduced, token released to the external wallet
    assert_eq!(client.get_shielded_balance(&owner), 600_000);
    assert_eq!(token.balance(&external), 400_000);
    assert_eq!(token.balance(&client.address), 600_000);
}

#[test]
fn withdraw_rejects_overdraw() {
    let (Setup { env, client, .. }, owner) = setup();
    let external = Address::generate(&env);

    client.deposit(&owner, &100_000);
    let result = client.try_withdraw(&owner, &500_000, &external);
    assert_eq!(result, Err(Ok(Error::InsufficientBalance)));
    assert_eq!(client.get_shielded_balance(&owner), 100_000);
}
