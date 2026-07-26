# ARCANUM — Post-Hackathon TODO
### Based on Stellar Team Review Feedback
### Goal: Fully functional application + Stellar Community Fund application

Mark items [x] as we finish them.

---

## What the Stellar team confirmed works ✅ DO NOT TOUCH

- [x] cargo test 4/4 — corrupted proof rejection, cross-circuit VK mismatch rejection
- [x] nargo test 3/3 — amount circuit
- [x] Full pipeline: browser proving (bb.js) → Freighter signing → testnet contract verification
- [x] Real-vs-Simulated README table
- [x] Contract deployed at `CAHC6LH4MWQXFSZ7Z4UNY3ZCHGU4III6SKA5YKKXMTIMARYIO72PMCXV`

---

## Phase 5 — Shielded Pool Contract 🔴 HIGHEST PRIORITY
**Who:** DGrayArea | **Estimated time:** 2-3 days

The gap: ZK proof hides amounts at proof level but the Stellar token transfer event still
writes sender, recipient, and amount to the public ledger. The shielded pool routes all
transfers through a shared contract so no direct wallet-to-wallet transfer ever appears on-chain.

### Architecture (how it works)
```
Deposit:   Institution wallet → Pool contract (one-time, visible)
Transfer:  ZK proof submitted → Pool updates internal balances only → nothing on public ledger
Withdraw:  Pool releases funds to recipient wallet (visible but amount is separate from transfer)
```

### Soroban Contract (`contracts/arcanum_pool/src/lib.rs`)

> Named `arcanum_pool`, not `zbank_pool`, to match the existing `arcanum_verifier`
> (the `zbank_*` names were already retired when the brand became ΛRCΛNUM).

- [x] Create new contract: `arcanum_pool` (added to workspace members)
- [x] Add storage: per-address `Balance(Address) -> i128` internal shielded balances
- [x] Add function: `deposit(from: Address, amount: i128)` — pulls the pool token, credits internal balance
- [x] Add function: `shielded_transfer(sender, recipient, amount, compliance_inputs/proof, amount_inputs/proof)` — verifies BOTH ZK proofs on-chain, debits sender, credits recipient, NO token transfer, emits only the proof hash
- [x] Add function: `withdraw(owner, amount, recipient)` — releases funds from internal balance to a wallet
- [x] Add function: `get_shielded_balance(address) -> i128` — private view, gated by `require_auth`
- [x] Write tests — `cargo test` covers (6/6 passing, real proofs):
  - [x] deposit credits balance + custodies token
  - [x] valid shielded transfer updates both balances, moves nothing on the ledger
  - [x] corrupted proof rejected — no balances change
  - [x] withdrawal releases correct amount
  - [x] insufficient-balance transfer rejected
  - [x] overdraw withdrawal rejected
- [x] Build: `cargo build -p arcanum_pool --target wasm32v1-none --release` (SDK 26 requires `wasm32v1-none`, not the older `wasm32-unknown-unknown`) → 51,705 byte wasm
- [ ] Deploy to Stellar testnet (needs `zbank-deployer` key + compliance/amount VK bytes + token SAC address)
- [ ] Save pool contract address to `src/config/contracts.ts`

### Frontend Updates (SendPayment + Treasury)

- [ ] Update `SendPayment` flow — call `shielded_transfer()` on pool contract instead of direct token transfer
- [ ] Add "Deposit to Pool" button in Treasury view — funds institution's pool balance before they can send
- [ ] Add "Withdraw from Pool" button in Treasury view
- [ ] Update Treasury balance display — show shielded pool balance from `get_shielded_balance()` instead of raw XLM wallet balance
- [ ] Update `stellarZkService.ts` — route payment through pool contract
- [ ] Test full end-to-end: deposit → send shielded payment → confirm no amount in ledger event → withdraw

---

## Phase 5b — Payroll Circuit 🔴 PRIORITY (do alongside pool)
**Who:** DGrayArea | **Estimated time:** 4-6 hours

The Stellar review said: "Add one Coming Soon module with a real circuit to show the pattern generalizes."
Pick payroll — it's the strongest standalone use case after payments.

**What it proves:**
- Institution has sufficient pool balance to cover a full payroll run
- Every recipient is on the approved employee list (Merkle membership proof)
- No salary amounts or employee identities revealed on-chain

### Circuit (`circuits/payroll_circuit/src/main.nr`)

```rust
fn main(
    total_payroll_amount: u64,
    pool_balance: u64,
    employee_hashes: [Field; 20],
    merkle_paths: [[Field; 10]; 20],
    approved_employees_root: pub Field,
    min_balance_after: pub u64
) {
    assert(pool_balance >= total_payroll_amount + min_balance_after);
    for i in 0..20 {
        assert(merkle_verify(employee_hashes[i], merkle_paths[i], approved_employees_root));
    }
}
```

- [ ] `nargo new payroll_circuit` inside `circuits/`
- [ ] Write circuit in `src/main.nr`
- [ ] Write passing `Prover.toml` — sufficient balance, all employees on list
- [ ] Write failing `Prover.toml` — insufficient balance (should fail assert)
- [ ] `nargo check`
- [ ] `nargo execute witness`
- [ ] `bb prove_ultra_honk -b ./target/payroll_circuit.json -w ./target/witness.gz -o ./target/proof`
- [ ] `bb write_vk_ultra_honk -b ./target/payroll_circuit.json -o ./target/vk`
- [ ] `nargo test` — confirm all tests pass
- [ ] `git add -f circuits/payroll_circuit/target/` and push
- [ ] Add compiled JSON to `src/circuits/payroll_circuit.json`
- [ ] Document circuit in `circuits/README.md`
- [ ] Update "Private Payroll" card badge in the UI from "Simulated" to "Circuit Ready — Integration Coming"

---

## Phase 5c — Toolchain Setup Script 🟡
**Who:** DGrayArea | **Estimated time:** 1 hour

The Stellar review said: "Pin a setup script for nargo beta.9 + bb 0.87.0 so others can regenerate proofs without toolchain skew."

- [ ] Create `scripts/setup-toolchain.sh`:

```bash
#!/bin/bash
# ARCANUM Toolchain Setup
# Installs exact versions required to regenerate ZK proofs
# nargo beta.9 + bb 0.87.0 (keccak transcripts)
# Usage: bash scripts/setup-toolchain.sh

set -e

echo "Installing nargo beta.9..."
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup --version beta.9
echo "nargo $(nargo --version) installed"

echo "Installing bb 0.87.0..."
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/bbup/install | bash
bbup --version 0.87.0
echo "bb $(bb --version) installed"

echo ""
echo "ARCANUM toolchain ready."
echo "nargo: $(nargo --version)"
echo "bb:    $(bb --version)"
echo ""
echo "To regenerate proofs:"
echo "  cd circuits/compliance_circuit && nargo execute witness && bb prove_ultra_honk ..."
echo "  cd circuits/amount_circuit     && nargo execute witness && bb prove_ultra_honk ..."
echo "  cd circuits/solvency_circuit   && nargo execute witness && bb prove_ultra_honk ..."
```

- [ ] `chmod +x scripts/setup-toolchain.sh`
- [ ] Test on a clean Mac environment
- [ ] Push to repo

---

## Phase 6 — README Updates 🟡
**Who:** Monarch | **Estimated time:** 2 hours
*Do this after shielded pool is deployed*

- [ ] Update Real-vs-Simulated table:
  - "Transfer amount hiding" → ✅ Real (shielded pool deployed)
  - "Private Payroll" → 🔵 Circuit Ready (nargo test passes, UI integration coming)
- [ ] Add shielded pool contract address to Contract Addresses table
- [ ] Add setup script instructions under "How to Run Locally":
  ```bash
  bash scripts/setup-toolchain.sh
  ```
- [ ] Update architecture diagram to include pool contract flow
- [ ] Add "Regenerating Proofs" section:
  ```
  Pinned toolchain: nargo beta.9 + bb 0.87.0 (keccak transcripts)
  bash scripts/setup-toolchain.sh
  cd circuits/compliance_circuit
  nargo execute witness
  bb prove_ultra_honk -b ./target/compliance_circuit.json -w ./target/witness.gz -o ./target/proof
  ```

---

## Phase 7 — Stellar Community Fund Application 🟡
**Who:** Monarch | **Estimated time:** 1 day
*Do this after shielded pool is deployed and README is updated*

The Stellar review said: "Worth bringing to the Stellar Community Fund for continued support."
Apply at: https://communityfund.stellar.org

- [ ] Project description (250 words max — use README intro)
- [ ] Problem statement — institutions can't transact privately on a public chain
- [ ] Solution — ZK confidential payments + shielded pool for full on-chain privacy on Stellar
- [ ] Current state — 4/4 cargo tests, 3/3 nargo tests, full pipeline verified on testnet
- [ ] Roadmap — shielded pool (done by then), payroll circuit, selective disclosure keys, mainnet audit
- [ ] Team — Monarch (@0xMonarch) + DGrayArea
- [ ] Demo video link + GitHub link
- [ ] Funding ask — shielded pool security audit + 3 additional circuits (payroll, escrow, supplier payments) + mainnet deployment
- [ ] Submit application

---

## Priority Order Summary

| Priority | Item | Who | Est. Time |
|---|---|---|---|
| 🔴 1 | Shielded pool Soroban contract | DGrayArea | 2-3 days |
| 🔴 2 | Shielded pool frontend integration | Both | 1 day |
| 🔴 3 | Payroll Noir circuit | DGrayArea | 4-6 hours |
| 🟡 4 | Toolchain setup script | DGrayArea | 1 hour |
| 🟡 5 | README updates | Monarch | 2 hours |
| 🟡 6 | SCF application | Monarch | 1 day |

---

## Definition of Done

- [ ] Shielded pool contract deployed on testnet — no plaintext transfer amount in ledger events
- [ ] Full send payment flow routed through pool contract end-to-end
- [ ] Payroll circuit compiles, proves, and passes `nargo test`
- [ ] Setup script tested and working on a clean Mac environment
- [ ] README fully updated — all tables accurate, new contracts listed, setup script documented
- [ ] SCF application submitted at communityfund.stellar.org

---

## Current Status

| Feature | Hackathon State | Post-Hackathon Goal |
|---|---|---|
| Wallet connect | ✅ Real | Done |
| ZK compliance proof | ✅ Real | Done |
| ZK amount range proof | ✅ Real | Done |
| On-chain proof verification | ✅ Real | Done |
| Freighter signing | ✅ Real | Done |
| Stellar transaction | ✅ Real | Done |
| Transfer amount hiding | ⚠️ Proof-level only | ✅ Full (shielded pool) |
| Private payroll | 🔵 Simulated | 🔵 Circuit Ready |
| Selective disclosure keys | 🔵 Simulated | Planned post-SCF |
| Confidential escrow | 🔵 Simulated | Planned post-SCF |
| Mainnet deployment | ❌ Testnet only | Planned post-audit |
