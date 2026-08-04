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
| "build that Phase 5 pool contract so no plaintext transfer touches the chain" | `arcanum_pool` deployed to testnet (`CCC3C2GX…E27B`) and **privacy verified live**: shielded transfer of 40 XLM emitted only a proof-hash event, recipient wallet unchanged (0 delta). Full deposit→transfer→withdraw cycle passed. | ✅ **done on-chain** — UI wiring pending |
| "add one 'Coming Soon' module with a real circuit to show the pattern generalizes" | `payroll_circuit`: proves pool covers payroll + every recipient approved, salaries/identities private — nargo test 3/3, proof verifies (14,592 B), UI badge → "Circuit Ready" | ✅ **done** |
| "pin a setup script for nargo beta.9 + bb 0.87.0 … without toolchain skew" | `scripts/setup-toolchain.sh` → installs pinned binaries to `~/.zbank-toolchain/`, verified beta.9 / bb 0.87.0 resolve | ✅ **done** (clean-machine test pending) |
| "worth bringing to the Stellar Community Fund" | `SCF-APPLICATION.md` drafted (all fields, verified figures) | 🟡 draft ready — needs demo video + submit |

**Final cleanup + mainnet prep (this session):**
- ✅ Payroll badge → "Circuit Ready" in `SupportingFeatureGrid` (gold accent, verified in-app); Treasury card already done.
- ✅ Phase 6 README complete (pool address, setup script, regenerating proofs with correct bb 0.87 flags, architecture, tables).
- ✅ Mainnet-ready: `config/contracts.ts` per-network blocks behind `ACTIVE_NETWORK`; `deploy-verifier.sh` + `deploy-pool.sh` NETWORK-parameterized; `MAINNET.md` go-live guide. Going live = 3 addresses + one flag.
- ✅ `SCF-APPLICATION.md` drafted.
- ⬜ Web refinement (open-ended) + record demo video + submit SCF.

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
- [x] Deploy to Stellar testnet — deployed `CCC3C2GXO7F57LWXBDXNE423WUC2ZJBRPMZ2O2Y6WVEVJZQ676MIE27B` via `scripts/deploy-pool.sh`
- [x] Save pool contract address to `src/config/contracts.ts` (`pool: 'CCC3C2GX…E27B'`)
- [x] **On-chain privacy test passed**: deposit 100 → shielded_transfer 40 (only proof-hash event, recipient wallet delta 0) → withdraw 60. Internal balances tracked exactly.

### Frontend Updates (SendPayment + Treasury)

> Service layer is ready and deploy-gated: `CONTRACTS.pool` + `isPoolDeployed()` in
> `config/contracts.ts`, and `depositToPool` / `shieldedTransfer` / `withdrawFromPool` /
> `getShieldedBalance` in `stellarZkService.ts`. The UI-component wiring below is
> intentionally left until the pool is deployed and `CONTRACTS.pool` is set, so the
> currently-working (reviewer-praised) verify_payment demo isn't broken beforehand.

- [x] Update `stellarZkService.ts` — pool methods added (deposit, shielded_transfer, withdraw, get_shielded_balance), all guarded by `requirePool()`
- [x] Update `SendPayment` flow — routes through `shieldedTransfer()` when `isPoolDeployed()` and the sender has enough shielded balance; falls back to `verifyOnStellar()` otherwise so the demo never breaks
- [x] Add "Deposit to Pool" button in Treasury view — `ShieldedPoolPanel` component
- [x] Add "Withdraw from Pool" button in Treasury view — same panel
- [x] Update Treasury balance display — panel shows `getShieldedBalance()` live
- [x] Contract-level end-to-end verified on testnet (deposit→shielded_transfer→withdraw, no amount on ledger)
- [ ] Interactive UI end-to-end (click deposit → send → withdraw signing in Freighter) — needs a connected Freighter wallet; app compiles + lints clean, panel gated by `isPoolDeployed()`

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

> Built with the codebase's public-list membership style (like `compliance_circuit`),
> not Merkle — consistent with the repo and robust on the pinned bb 0.87 toolchain.
> Privacy model matches the sketch: only `approved_employees` + `min_balance_after`
> are public; salaries, identities, and `pool_balance` stay private. Merkle root over
> the approved set is the scale-up path for larger employee counts.

- [x] Create `circuits/payroll_circuit` (Nargo.toml + `src/main.nr`)
- [x] Write circuit in `src/main.nr` — sums hidden salaries, asserts `pool_balance >= total + min_balance_after`, asserts every recipient on the approved list
- [x] Write passing `Prover.toml` — sufficient balance, all employees on list
- [x] Failing cases covered by `#[test(should_fail)]` (insufficient balance + unapproved employee) instead of a second Prover.toml — cleaner and runs under `nargo test`
- [x] `nargo execute` (compile + witness) with pinned nargo beta.9
- [x] `bb prove --scheme ultra_honk --oracle_hash keccak …` (bb 0.87 syntax, NOT the old `prove_ultra_honk`) → proof = **14,592 B** ✓
- [x] `bb write_vk --scheme ultra_honk --oracle_hash keccak …` → vk = 1,760 B
- [x] `bb verify` round-trips: **Proof verified successfully**
- [x] `nargo test` — **3/3 pass** (valid, insufficient-balance fails, unapproved fails)
- [x] `git add -f circuits/payroll_circuit/target/` (push pending)
- [x] Add compiled JSON to `src/circuits/payroll_circuit.json`
- [x] Document circuit in `circuits/README.md`
- [x] Update payroll card badge in the UI from "Simulated" to "Circuit Ready" (Treasury "Private Batch Payroll" module)

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

- [x] Create `scripts/setup-toolchain.sh` (idempotent: verifies pinned binaries, only downloads if missing/wrong)

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

- [x] `chmod +x scripts/setup-toolchain.sh`
- [x] Verify pinned versions print `1.0.0-beta.9` and `0.87.0` (NOT the PATH beta.22 / bb 5.0) — confirmed on this machine
- [x] Confirm exact `bb prove` flags against `circuits/README.md` (scheme/oracle_hash must match the verifier crate's format)
- [ ] Test on a clean Mac environment (needs a machine without the toolchain pre-installed)
- [ ] Push to repo

---

## Phase 6 — README Updates 🟡
**Who:** Monarch | **Estimated time:** 2 hours
*Do this after shielded pool is deployed*

- [x] Update Real-vs-Simulated table:
  - "Transfer amount hiding" → ✅ Real (shielded pool deployed + verified on-chain)
  - "Private Payroll" → 🔵 Circuit Ready (nargo test 3/3, proof verifies)
- [x] Add shielded pool contract address to Contract Addresses table (+ note on the privacy property)
- [x] Add setup script instructions under "How to Run Locally" (`bash scripts/setup-toolchain.sh`)
- [x] Update architecture diagram to include pool contract flow (Route A/B + deposit/transfer/withdraw)
- [x] Add "Regenerating Proofs" section (with the correct bb 0.87 `prove --scheme ultra_honk --oracle_hash keccak` flags, not the old `prove_ultra_honk`)
- [x] Also fixed: toolchain path `~/.arcanum-toolchain` → `~/.zbank-toolchain`; repo structure; roadmap; known-limitations (resolved + honest scope note)

---

## Phase 7 — Stellar Community Fund Application 🟡
**Who:** Monarch | **Estimated time:** 1 day
*Do this after shielded pool is deployed and README is updated*

The Stellar review said: "Worth bringing to the Stellar Community Fund for continued support."
Apply at: https://communityfund.stellar.org

> All written content drafted in `SCF-APPLICATION.md`. Remaining: record the demo
> video and actually submit (both are Monarch's to do — cannot be automated).

- [x] Project description (in `SCF-APPLICATION.md`)
- [x] Problem statement — institutions can't transact privately on a public chain
- [x] Solution — ZK confidential payments + shielded pool for full on-chain privacy on Stellar
- [x] Current state — 4/4 cargo tests, 3/3 nargo tests, pool deployed + privacy verified on testnet
- [x] Roadmap — shielded pool (done), payroll circuit, commitment-based hiding, selective disclosure, mainnet audit
- [x] Team — Monarch (@0xMonarch) + DGrayArea
- [ ] Demo video link + GitHub link — GitHub link ready; **record the demo video**
- [x] Funding ask — audit + 3 additional circuits (payroll, escrow, supplier payments) + mainnet deployment
- [ ] Submit application at communityfund.stellar.org

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

- [x] Shielded pool contract deployed on testnet — no plaintext transfer amount in ledger events (verified on-chain)
- [x] Full send payment flow routed through pool contract (service + UI; contract-level cycle verified end-to-end)
- [x] Payroll circuit compiles, proves, and passes `nargo test` (3/3, proof verified 14,592 B)
- [ ] Setup script tested and working on a clean Mac environment (works on this machine; clean-machine run pending)
- [x] README fully updated — all tables accurate, new contracts listed, setup script documented
- [ ] SCF application submitted at communityfund.stellar.org (drafted in `SCF-APPLICATION.md`; submit + demo video pending)

### Still open (all require you, not code)
- [ ] Interactive UI click-through with a Freighter wallet (deposit → send → withdraw)
- [ ] Record demo video + submit SCF
- [ ] Clean-machine toolchain test
- [ ] Mainnet deploy (prepared; intentionally post-audit — see `MAINNET.md`)
- [ ] Optional web polish remaining: deeper landing pass, ShieldedPoolPanel visual polish, full mobile/dashboard responsive audit
      (done this session: trust strip, Send settlement-route indicator)

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
