#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::StellarAssetClient,
    Bytes, Env,
};
use std::{fs, path::Path, vec::Vec};

extern crate std;

fn load(env: &Env, circuit: &str, file: &str) -> Bytes {
    let path = Path::new("../../circuits").join(circuit).join("target").join(file);
    let bytes: Vec<u8> = fs::read(&path)
        .unwrap_or_else(|e| panic!("failed to read {}: {e}", path.display()));
    Bytes::from_slice(env, &bytes)
}

struct Setup<'a> {
    env: Env,
    client: ZBankVerifierClient<'a>,
}

fn setup() -> Setup<'static> {
    let env = Env::default();
    env.ledger().set_protocol_version(26);
    // UltraHonk verification far exceeds the default test budget
    env.cost_estimate().budget().reset_unlimited();
    env.mock_all_auths();

    let vk_compliance = load(&env, "compliance_circuit", "vk");
    let vk_amount = load(&env, "amount_circuit", "vk");
    let vk_solvency = load(&env, "solvency_circuit", "vk");

    let contract_id = env.register(
        ZBankVerifier,
        (vk_compliance, vk_amount, vk_solvency),
    );
    let client = ZBankVerifierClient::new(&env, &contract_id);
    Setup { env, client }
}

#[test]
fn verify_payment_transfers_and_returns_proof_hash() {
    let Setup { env, client } = setup();

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let sac = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_id = sac.address();
    StellarAssetClient::new(&env, &token_id).mint(&sender, &1_000_000);

    let hash = client.verify_payment(
        &sender,
        &recipient,
        &token_id,
        &250_000,
        &load(&env, "compliance_circuit", "public_inputs"),
        &load(&env, "compliance_circuit", "proof"),
        &load(&env, "amount_circuit", "public_inputs"),
        &load(&env, "amount_circuit", "proof"),
    );

    assert_eq!(hash.len(), 32);
    let token = token::Client::new(&env, &token_id);
    assert_eq!(token.balance(&sender), 750_000);
    assert_eq!(token.balance(&recipient), 250_000);
}

#[test]
fn verify_payment_rejects_corrupted_proof_and_moves_no_funds() {
    let Setup { env, client } = setup();

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let sac = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let token_id = sac.address();
    StellarAssetClient::new(&env, &token_id).mint(&sender, &1_000_000);

    // Flip one byte inside the witness commitments (the tail of the proof is
    // padding for small circuits, so corruption there would go unnoticed)
    let good = load(&env, "compliance_circuit", "proof");
    let mut raw = std::vec![0u8; good.len() as usize];
    good.copy_into_slice(&mut raw);
    raw[600] ^= 0xff;
    let corrupted = Bytes::from_slice(&env, &raw);

    let result = client.try_verify_payment(
        &sender,
        &recipient,
        &token_id,
        &250_000,
        &load(&env, "compliance_circuit", "public_inputs"),
        &corrupted,
        &load(&env, "amount_circuit", "public_inputs"),
        &load(&env, "amount_circuit", "proof"),
    );

    assert_eq!(result, Err(Ok(Error::ComplianceProofInvalid)));
    let token = token::Client::new(&env, &token_id);
    assert_eq!(token.balance(&sender), 1_000_000);
    assert_eq!(token.balance(&recipient), 0);
}

#[test]
fn attest_solvency_stores_and_returns_attestation() {
    let Setup { env, client } = setup();

    assert_eq!(client.get_solvency_attestation(), None);

    let attestation = client.attest_solvency(
        &load(&env, "solvency_circuit", "public_inputs"),
        &load(&env, "solvency_circuit", "proof"),
    );
    assert_eq!(attestation.proof_hash.len(), 32);

    let stored = client.get_solvency_attestation().unwrap();
    assert_eq!(stored.proof_hash, attestation.proof_hash);
}

#[test]
fn wrong_circuit_proof_fails_against_other_vk() {
    let Setup { env, client } = setup();

    // Solvency proof presented as a solvency attestation but against the
    // amount circuit's shape of inputs: use amount proof with solvency vk
    let result = client.try_attest_solvency(
        &load(&env, "amount_circuit", "public_inputs"),
        &load(&env, "amount_circuit", "proof"),
    );
    assert_eq!(result, Err(Ok(Error::SolvencyProofInvalid)));
}
