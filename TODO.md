# Zero-Knowledge Confidential Payments on Stellar

Last Updated: Active Hackathon Build

Mark items `[x]` as we finish them.

---

## Phase 0 — Vite → Next.js Migration ✅ COMPLETE

- [x] Replace Vite with Next.js 15 (App Router)
- [x] Create `src/app/layout.tsx` and `src/app/page.tsx`
- [x] Move CSS imports to root layout
- [x] Add 'use client' to all interactive components, views, and context
- [x] Update `tsconfig.json` for Next.js
- [x] Add `next.config.ts` with Stellar SDK webpack fallbacks
- [x] Configure `pnpm-workspace.yaml` to allow sharp native build
- [x] Delete Vite artifacts (index.html, vite.config.ts, src/main.tsx, tsconfig.app.json, tsconfig.node.json)
- [x] Production build passes clean

---

## Phase 1 — Frontend Bug Fixes ✅ COMPLETE

- [x] Fix WatchWalletChanges callback — address and network always defined
- [x] Fix useCallback dep bug in SessionContext
- [x] Fix hardcoded sender address in `ExplorerComparison.tsx` — now reads real walletAddress from context
- [x] Fix Treasury solvency card gridColumn: span 2 breaking on mobile
- [x] Make header position: sticky; top: 0
- [x] Fix ZK proof hash overflow in SendPayment success box on small screens
- [x] Fix Amount + Asset fields — stack vertically on screens below 480px
- [x] Network toggle — read-only, reflects real Freighter network

---

## Phase 1.5 — UI Screens & Flow ✅ COMPLETE (via Lovable)

- [x] Landing page — full viewport, hero section, feature highlights, Connect Wallet CTA
- [x] Wallet-gate flow — dashboard locked until Freighter connected
- [x] Full-page dashboard shell — no boxed container, edge-to-edge layout
- [x] Overview dashboard — summary cards, recent payments table, treasury status
- [x] Send Payment flow — multi-step form (recipient, amount, memo)
- [x] Proof generation staged UI — 3-stage sequence with pending/active/complete states
- [x] Compliance failure result screen — polished blocked-payment state
- [x] ZK Explorer comparison screen — Institution View vs Public Chain View side-by-side
- [x] Treasury Solvency screen — shielded balance, solvency badge, volume chart
- [x] Compliance & Audit panel — proof log, selective disclosure toggles, policy badges
- [x] Features section on landing — alternating layout with plain-language explanations
- [x] Supporting features grid — 6 placeholder cards with Simulated badges
- [x] Footer — brand, navigation, built-with links
- [x] Site-wide animation layer — staggered fades, proof stage animations, ambient shield pulse
- [x] Freighter wallet connect — real connection, real public key in navbar

---

## Phase 2 — Real ZK Circuits (Noir) 🔴 IN PROGRESS

### Immediate Fix First

- [ ] Push compiled toy circuit artifacts to GitHub (target/ was gitignored)
  ```bash
  git add -f circuits/toy_circuit/target/
  git commit -m "fix: add compiled circuit artifacts"
  git push
  ```

### Environment

- [ ] Document exact `nargo --version` and `bb --version` in `circuits/README.md`
- [ ] Confirm all three circuits compile and prove before moving to Phase 3

### Circuit 1 — Compliance / Sanctions Check 🔴 PRIORITY
*Proves: Recipient address is NOT on sanctions list — no address revealed on-chain*

- [ ] `nargo new compliance_circuit` inside `circuits/`
- [ ] Write circuit (`src/main.nr`):
  - Private inputs: `recipient_hash: Field`, `merkle_path: [Field; 10]`, `merkle_indices: [u1; 10]`
  - Public inputs: `sanctions_root: pub Field`
  - Assert non-membership via Poseidon2 Merkle proof
  - (Simplified alternative if Merkle takes too long: hardcode 10 sanctioned address hashes in an array, assert recipient_hash does not match any)
- [ ] Write passing `Prover.toml` — address NOT on list
- [ ] Write failing test case — address IS on list (assert should fail)
- [ ] `nargo check`
- [ ] `nargo execute witness`
- [ ] `bb prove_ultra_honk -b ./target/compliance_circuit.json -w ./target/witness.gz -o ./target/proof`
- [ ] `bb write_vk_ultra_honk -b ./target/compliance_circuit.json -o ./target/vk`
- [ ] `git add -f circuits/compliance_circuit/target/` and push

### Circuit 2 — Amount Range Proof 🔴 PRIORITY
*Proves: Payment amount > 0 AND amount ≤ wallet balance — neither number revealed*

- [ ] `nargo new amount_circuit` inside `circuits/`
- [ ] Write circuit (`src/main.nr`):
  ```rust
  fn main(amount: u64, balance: u64, min_amount: pub u64) {
      assert(amount >= min_amount);
      assert(amount <= balance);
  }
  ```
- [ ] Passing `Prover.toml`: `amount = "5000"`, `balance = "10000"`, `min_amount = "1"`
- [ ] Failing test: `amount = "15000"`, `balance = "10000"` — should fail
- [ ] `nargo check`
- [ ] `nargo execute witness`
- [ ] `bb prove_ultra_honk -b ./target/amount_circuit.json -w ./target/witness.gz -o ./target/proof`
- [ ] `bb write_vk_ultra_honk -b ./target/amount_circuit.json -o ./target/vk`
- [ ] `git add -f circuits/amount_circuit/target/` and push

### Circuit 3 — Solvency Proof 🟡 DO IF TIME ALLOWS
*Proves: Total assets > total liabilities — balance sheet stays hidden*

- [ ] `nargo new solvency_circuit` inside `circuits/`
- [ ] Write circuit:
  ```rust
  fn main(total_assets: u64, total_liabilities: u64) {
      assert(total_assets > total_liabilities);
  }
  ```
- [ ] Compile, prove, push same as above

### Compile to WASM for Browser

- [ ] `nargo compile` for each circuit
- [ ] `pnpm add @noir-lang/noir_js @noir-lang/backend_barretenberg` in root
- [ ] Copy compiled `.json` files into `src/circuits/`:
  - `src/circuits/compliance_circuit.json`
  - `src/circuits/amount_circuit.json`
  - `src/circuits/solvency_circuit.json`
- [ ] Write `src/lib/zkProver.ts`:
  ```typescript
  import { Noir } from '@noir-lang/noir_js';
  import { UltraHonkBackend } from '@noir-lang/backend_barretenberg';

  export async function generateProof(
    circuitJson: object,
    inputs: Record<string, string>
  ) {
    const backend = new UltraHonkBackend(circuitJson as any);
    const noir = new Noir(circuitJson as any);
    const { witness } = await noir.execute(inputs);
    const proof = await backend.generateProof(witness);
    return proof;
  }

  export async function verifyProofLocally(
    circuitJson: object,
    proof: object
  ) {
    const backend = new UltraHonkBackend(circuitJson as any);
    return await backend.verifyProof(proof as any);
  }
  ```
- [ ] Replace all fake `setTimeout` steps in `stellarZkService.ts` with real `generateProof()` calls
- [ ] Test proof generation works in browser (check console for errors)
- [ ] Push all changes

---

## Phase 3 — Soroban Smart Contract 🔴 NOT STARTED

### Environment Setup

- [ ] Confirm Rust installed: `rustc --version`
- [ ] Add WASM target: `rustup target add wasm32-unknown-unknown`
- [ ] Install Stellar CLI: `cargo install --locked soroban-cli`
- [ ] Confirm: `stellar --version`
- [ ] Clone verifier reference:
  ```bash
  git clone https://github.com/yugocabrio/rs-soroban-ultrahonk
  ```

### Contract 1 — ZK Payment Verifier (main contract)
*Does: Receives ZK proof → verifies on-chain → executes transfer if valid → reverts if invalid → emits event with proof hash only*

- [ ] `mkdir contracts && cd contracts`
- [ ] `stellar contract init zbank_verifier`
- [ ] Write `contracts/zbank_verifier/src/lib.rs`:
  - Accept proof: `Bytes` and `public_inputs: Vec<u256>`
  - Port UltraHonk verification logic from cloned verifier reference
  - On success: call `token::Client::transfer()` to move funds
  - On failure: `panic!("proof verification failed")`
  - Emit event: `env.events().publish(("zbank", "payment"), proof_hash)`
- [ ] Write contract tests in `src/test.rs` — test with toy circuit proof first, then real proofs
- [ ] Build:
  ```bash
  cd contracts/zbank_verifier
  cargo build --target wasm32-unknown-unknown --release
  ```
- [ ] Fix all build errors

### Contract 2 — Solvency Attestation 🟡 DO IF TIME ALLOWS

- [ ] Add `attest_solvency(proof: Bytes, public_inputs: Vec<u256>)` function
- [ ] On success: store `(timestamp, proof_hash)` in contract storage
- [ ] Add read function: `get_solvency_attestation() -> (u64, BytesN<32>)`

### Deploy to Stellar Testnet

- [ ] Generate and fund deployer wallet:
  ```bash
  stellar keys generate deployer --network testnet
  stellar keys fund deployer --network testnet
  ```
- [ ] Deploy verifier contract:
  ```bash
  stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/zbank_verifier.wasm \
    --source deployer \
    --network testnet
  ```
- [ ] Save returned contract address into `src/config/contracts.ts`:
  ```typescript
  export const CONTRACT_ADDRESSES = {
    verifier: 'C...YOUR_CONTRACT_ADDRESS',
    network: 'testnet'
  }
  ```
- [ ] Test with toy circuit proof first:
  ```bash
  stellar contract invoke \
    --id YOUR_CONTRACT_ADDRESS \
    --source deployer \
    --network testnet \
    -- verify_payment \
    --proof <toy_proof_hex> \
    --public_inputs <public_inputs>
  ```
- [ ] Confirm successful verification tx on Stellar testnet explorer
- [ ] Push contract code and updated `contracts.ts`

---

## Phase 4 — Wire Frontend to Real Chain 🔴 NOT STARTED
*All changes in `stellarZkService.ts` unless noted.*

### Proof Generation (replace all `setTimeout` stubs)

- [ ] Step 1 — Real compliance proof:
  - Hash recipient address with Poseidon
  - Call `generateProof(complianceCircuit, { recipient_hash, sanctions_root, ... })`
  - Return real proof bytes
- [ ] Step 2 — Real amount proof:
  - Fetch real wallet balance from Horizon API
  - Call `generateProof(amountCircuit, { amount, balance, min_amount: "1" })`
  - Return real proof bytes

### Stellar Transaction

- [ ] Step 3 — Build Soroban transaction:
  ```typescript
  import { Contract, SorobanRpc, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
  const contract = new Contract(CONTRACT_ADDRESSES.verifier);
  const operation = contract.call(
    'verify_payment',
    xdr.ScVal.scvBytes(complianceProofBytes),
    xdr.ScVal.scvBytes(amountProofBytes)
  );
  ```
- [ ] Step 4 — Freighter signing:
  ```typescript
  import { signTransaction } from '@stellar/freighter-api';
  const signedTx = await signTransaction(tx.toXDR(), { network: 'TESTNET' });
  ```
- [ ] Step 5 — Submit to network:
  ```typescript
  const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org');
  const result = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedTx, Networks.TESTNET)
  );
  ```
- [ ] Step 6 — Return real result to UI:
  - Return real `txHash` and `ledgerIndex`
  - Link tx hash to `https://stellar.expert/explorer/testnet/tx/{txHash}`
  - Update proof generation flow stages with real status

### Frontend Updates

- [ ] Update [ExplorerComparison.tsx](file:///c:/Users/akodi/OneDrive/Desktop/ZBank/src/components/ExplorerComparison.tsx) — pull real tx data from Horizon API for public ledger view
- [ ] Update Dashboard transaction table — show real on-chain confirmation status
- [ ] Quick win: wire live XLM balance in Treasury from Horizon API:
  ```typescript
  const server = new Horizon.Server('https://horizon-testnet.stellar.org');
  const account = await server.loadAccount(publicKey);
  const balance = account.balances.find(b => b.asset_type === 'native')?.balance;
  ```

---

## Phase 5 — Shielded Pool 🟡 STRETCH GOAL
*Do only if Phases 2-4 are fully complete*

- [ ] Design shielded pool architecture — shared Soroban contract, internal encrypted balances
- [ ] Add deposit flow to frontend
- [ ] Add withdraw flow to frontend
- [ ] Update SendPayment to use pool instead of direct transfer

---

## Phase 6 — Real Selective Disclosure 🟡 STRETCH GOAL
*Do only if Phases 2-4 are fully complete*

- [ ] Generate one-time encryption keypair per payment
- [ ] Encrypt tx details (amount, sender, recipient, memo) with keypair
- [ ] Store encrypted blob on-chain or IPFS
- [ ] "Grant access" = share decryption key with auditor
- [ ] "Revoke access" = invalidate/rotate key
- [ ] Update SelectiveDisclosure component with real key grant/revoke flow

---

## Phase 7 — Live Treasury Data 🟡 PARTIAL — DO EARLY
*The balance fetch is a 30-minute task — do this during Phase 4*

- [ ] Fetch real XLM balance from Horizon API on wallet connect
- [ ] Display real (blurred) balance in Treasury view
- [ ] Derive volume chart from real `payments[]` state
- [ ] When solvency proof stamped on-chain (Phase 3), read proof hash back and display in Treasury
- [ ] Add "Generate Solvency Proof" button — runs Noir circuit, submits to contract

---

## Phase 8 — Persistence 🟡 STRETCH GOAL
*Do only if everything else is done*

- [ ] Save payment history to localStorage (survives page refresh)
- [ ] Save auditor access state to localStorage
- [ ] On wallet connect, load history keyed by wallet address
- [ ] Optional: index real transactions from Stellar ledger on connect

---

## Phase 9 — Submission Requirements 🔴 NOT STARTED
*Start README now, finish video last*

- [ ] README.md — write this now, update as things complete:
  - What ZBank is and what problem it solves
  - What ZK is doing (load-bearing, not just named in the README)
  - Tech stack: Noir, Barretenberg, Soroban, Stellar, Next.js, Freighter
  - Clear table: Real vs Simulated features
  - How to run locally
  - Contract addresses on testnet
  - Team names
- [ ] Demo video (2-3 min) — record last, after everything is wired:
  - Open with the ZK Explorer comparison screen — Institution View vs Public Chain View
  - Show a successful payment: proof stages completing, Freighter popup, real txHash
  - Show the failure case: sanctioned recipient, compliance check blocked, payment never moves
  - Narrate why this matters for institutions in plain language
  - Link to GitHub repo at the end
- [ ] GitHub repo — confirm before submitting:
  - Repo is public
  - All circuit artifact folders pushed
  - Contract addresses in config
  - README complete and honest about what's real vs simulated

---

## Definition of Done — Minimum for Valid Hackathon Submission

- [ ] Circuit 1 (compliance) generating real proofs in browser
- [ ] Circuit 2 (amount) generating real proofs in browser
- [ ] Soroban verifier contract deployed on Stellar testnet
- [ ] At least one confirmed verification transaction on testnet explorer
- [ ] End-to-end flow: form → real proof → Freighter sign → on-chain verify → real txHash shown in UI
- [ ] Failure case working: sanctioned recipient blocks payment
- [ ] Real XLM balance in Treasury from Horizon API
- [ ] README published and honest
- [ ] Demo video recorded and uploaded

---

## Current Status Summary

| Feature | Status |
| --- | --- |
| Next.js migration | ✅ Done |
| Frontend bug fixes | ✅ Done |
| UI screens & flows | ✅ Done |
| Wallet connect (Freighter) | ✅ Done |
| Noir circuits | 🔴 In progress |
| Proof generation (real) | 🔴 Not started |
| Soroban contract | 🔴 Not started |
| Frontend ↔ chain wiring | 🔴 Not started |
| Live treasury balance | 🔴 Not started |
| README | 🔴 Not started |
| Demo video | 🔴 Not started |
