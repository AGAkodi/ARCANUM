# ARCANUM — Post-Hackathon TODO
### Based on Stellar Team Review Feedback
### Goal: Fully functional application + Stellar Community Fund application

Mark items [x] as we finish them.

---

## Feedback response scorecard

Direct answer to each point in the Stellar team's review:

| Reviewer point | Our response | Status |
|---|---|---|
| Confirmed working: cargo 4/4 (incl. corrupted-proof + VK-mismatch), nargo 3/3, full bb.js→Freighter→testnet pipeline, Real-vs-Simulated table | Preserved untouched | ✅ locked |
| "build that Phase 5 pool contract so no plaintext transfer touches the chain" | `arcanum_pool` contract: `shielded_transfer` moves internal balances only, emits proof hash, **no SEP-41 transfer event** — 6/6 tests incl. one asserting the ledger is untouched | 🟡 **contract done**, deploy + frontend pending |
| "add one 'Coming Soon' module with a real circuit to show the pattern generalizes" | Payroll circuit (Phase 5b) | ⬜ not started |
| "pin a setup script for nargo beta.9 + bb 0.87.0 … without toolchain skew" | Phase 5c script → installs to `~/.zbank-toolchain/` | ⬜ not started — **skew is live on this machine** (see note) |
| "worth bringing to the Stellar Community Fund" | SCF application (Phase 7) | ⬜ not started |

> **Session corrections (2026-07):**
> - New contract named `arcanum_pool`, not `zbank_pool` (the `zbank_*` names were retired for ΛRCΛNUM).
> - Build target is `wasm32v1-none`, not the TODO's `wasm32-unknown-unknown` (soroban-sdk 26 rejects the old target).
> - ⚠️ **Toolchain skew is currently active**: the default `nargo`/`bb` on PATH are beta.22 / bb 5.0-nightly, while the project requires beta.9 / bb 0.87.0. The correct pinned binaries exist at `~/.zbank-toolchain/{nargo/nargo, bb/bb}`. Phase 5c must fix this — see the corrected section below.

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

> ⚠️ **Corrected from the original draft.** The first draft used `noirup --version beta.9`
> and `bbup --version 0.87.0`, which install to the *default* PATH location and would
> **overwrite** whatever nargo/bb the user already has. This repo deliberately pins the
> binaries in `~/.zbank-toolchain/` (see `circuits/README.md`) so they never clobber the
> default. The script below installs there via release tarballs and invokes the pinned
> paths explicitly — matching how the project actually works.

- [ ] Create `scripts/setup-toolchain.sh`:

```bash
#!/usr/bin/env bash
# ARCANUM Toolchain Setup — pins the EXACT versions the on-chain UltraHonk verifier
# expects (bb 0.87 keccak-transcript format). Installs into ~/.zbank-toolchain so it
# never clobbers a default nargo/bb on PATH. Usage: bash scripts/setup-toolchain.sh
set -euo pipefail

TC="$HOME/.zbank-toolchain"
NARGO_VER="v1.0.0-beta.9"
BB_VER="v0.87.0"

# arch/os → release asset name
case "$(uname -s)-$(uname -m)" in
  Darwin-arm64)  NARGO_ASSET="nargo-aarch64-apple-darwin.tar.gz";  BB_ASSET="barretenberg-arm64-darwin.tar.gz" ;;
  Darwin-x86_64) NARGO_ASSET="nargo-x86_64-apple-darwin.tar.gz";   BB_ASSET="barretenberg-x86_64-darwin.tar.gz" ;;
  Linux-x86_64)  NARGO_ASSET="nargo-x86_64-unknown-linux-gnu.tar.gz"; BB_ASSET="barretenberg-x86_64-linux-gnu.tar.gz" ;;
  *) echo "Unsupported platform: $(uname -s)-$(uname -m)"; exit 1 ;;
esac

mkdir -p "$TC/nargo" "$TC/bb"
echo "Installing nargo $NARGO_VER → $TC/nargo"
curl -sL "https://github.com/noir-lang/noir/releases/download/$NARGO_VER/$NARGO_ASSET" | tar -xz -C "$TC/nargo"
echo "Installing bb $BB_VER → $TC/bb"
curl -sL "https://github.com/AztecProtocol/aztec-packages/releases/download/$BB_VER/$BB_ASSET" | tar -xz -C "$TC/bb"

echo ""
echo "Pinned toolchain ready (do NOT use bare 'nargo'/'bb' — they may be a newer PATH version):"
echo "  nargo: $("$TC/nargo/nargo" --version | head -1)   # expect 1.0.0-beta.9"
echo "  bb:    $("$TC/bb/bb" --version | head -1)          # expect 0.87.0"
echo ""
echo "Regenerate proofs with the pinned binaries and a keccak transcript, e.g.:"
echo "  cd circuits/amount_circuit"
echo "  \"$TC/nargo/nargo\" execute"
echo "  \"$TC/bb/bb\" prove --scheme ultra_honk --oracle_hash keccak \\"
echo "     --bytecode_path target/amount_circuit.json --witness_path target/amount_circuit.gz \\"
echo "     --output_path target --output_format bytes_and_fields"
```

> Flags verified against `circuits/README.md`: `--scheme ultra_honk --oracle_hash keccak`
> and `--output_format bytes_and_fields` are mandatory — without `--oracle_hash keccak`
> the proof uses a poseidon transcript and the Soroban verifier rejects it.

- [ ] `chmod +x scripts/setup-toolchain.sh`
- [ ] Verify pinned versions print `1.0.0-beta.9` and `0.87.0` (NOT the PATH beta.22 / bb 5.0)
- [ ] Confirm exact `bb prove` flags against `circuits/README.md` (scheme/oracle_hash must match the verifier crate's format)
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
