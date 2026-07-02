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

## Phase 2 — Real ZK Circuits (Noir) ✅ COMPLETE

*Implementation notes (2026-07-02, supersedes the 07-01 note): the whole stack is now pinned to **Noir 1.0.0-beta.9 + bb 0.87.0 with the keccak oracle**, because that is the proof format the on-chain verifier crate (rs-soroban-ultrahonk) expects — the newer bb 5.x nightly proofs (458 fields) are incompatible with its 456-field format. Pinned binaries live in `~/.zbank-toolchain/` (see `circuits/README.md`). Browser proving uses `@noir-lang/noir_js@1.0.0-beta.9` + `@aztec/bb.js@0.87.0`; bb.js 0.87's browser bundle breaks under Next's webpack, so `scripts/copy-bb.mjs` (postinstall) serves it verbatim from `public/bb/` and `zkProver.ts` loads it at runtime. Proofs take ~1-2 s in-browser, single-threaded (no SharedArrayBuffer without COOP/COEP headers, which would break Google Fonts). Dev harness at `/zk-test` runs all circuits without the wallet gate.*

### Immediate Fix First

- [x] Push compiled toy circuit artifacts to GitHub (was done in commit `2c40826`)

### Environment

- [x] Document exact `nargo --version` and `bb --version` in `circuits/README.md`
- [x] Confirm all three circuits compile and prove before moving to Phase 3

### Circuit 1 — Compliance / Sanctions Check 🔴 PRIORITY

*Proves: Recipient address is NOT on sanctions list — no address revealed on-chain*

- [x] Create `compliance_circuit` inside `circuits/`
- [x] Write circuit (`src/main.nr`) — simplified list variant: private `recipient_hash: Field`, public `sanctions_list: [Field; 10]`, assert recipient_hash differs from every entry
- [x] Write passing `Prover.toml` — address NOT on list
- [x] Write failing test case — address IS on list (`#[test(should_fail)]`, passes)
- [x] `nargo check` + `nargo test`
- [x] `nargo execute witness`
- [x] `bb prove` + `bb write_vk` + `bb verify` — proof verified
- [x] `target/` artifacts committed

### Circuit 2 — Amount Range Proof 🔴 PRIORITY

*Proves: Payment amount > 0 AND amount ≤ wallet balance — neither number revealed*

- [x] Create `amount_circuit` inside `circuits/`
- [x] Write circuit — `assert(amount >= min_amount); assert(amount <= balance);` (amount/balance private, min_amount public)
- [x] Passing `Prover.toml`: `amount = "5000"`, `balance = "10000"`, `min_amount = "1"`
- [x] Failing tests: amount over balance + zero amount (`should_fail`, both pass)
- [x] `nargo check` + `nargo test` + `nargo execute witness`
- [x] `bb prove` + `bb write_vk` + `bb verify` — proof verified
- [x] `target/` artifacts committed

### Circuit 3 — Solvency Proof ✅ DONE (was stretch)

*Proves: Total assets > total liabilities — balance sheet stays hidden*

- [x] Create `solvency_circuit` inside `circuits/`
- [x] Write circuit — `assert(total_assets > total_liabilities);` (both private, no public inputs)
- [x] Compile, test, prove, verify — `target/` artifacts committed

### Compile to WASM for Browser

- [x] Compiled ACIR (`target/<name>.json`) produced for each circuit
- [x] `pnpm add @noir-lang/noir_js@1.0.0-beta.22 @aztec/bb.js@5.0.0-nightly.20260522`
- [x] Copy compiled `.json` files into `src/circuits/` (compliance, amount, solvency)
- [x] Write `src/lib/zkProver.ts` — `generateProof`, `verifyProofLocally`, `hashToField`; shared WASM instance, cached backends, vk-hash caching
- [x] Replace all fake `setTimeout` steps in `stellarZkService.ts` with real `generateProof()` calls (`ProofGenerationFlow` now drives the UI from real prover progress; local verification runs in step 3, on-chain submission still simulated until Phase 3/4)
- [x] Test proof generation works in browser — all 3 circuits prove + verify at `/zk-test`, sanctioned-address case correctly fails
- [x] Push all changes

---

## Phase 3 — Soroban Smart Contract ✅ COMPLETE

*Implementation notes (2026-07-02): instead of porting verifier internals, `contracts/zbank_verifier` depends on the `ultrahonk_soroban_verifier` crate (git dep pinned to rev `661db07`). One contract holds all three circuit VKs (immutable, set in `__constructor`). `verify_payment` verifies BOTH proofs + executes the transfer atomically in a single transaction — it fits testnet resource limits. Deployed contract: `CAHC6LH4MWQXFSZ7Z4UNY3ZCHGU4III6SKA5YKKXMTIMARYIO72PMCXV` (deployer key alias: `zbank-deployer`).*

### Environment Setup

- [x] Confirm Rust installed (needed `rustup update` — soroban-sdk 26 requires rustc ≥ 1.91)
- [x] Add WASM target: `wasm32v1-none` (current Soroban target, not wasm32-unknown-unknown)
- [x] Install Stellar CLI (`brew install stellar-cli`, v27.0.0)
- [x] Verifier reference: used as a crate dependency rather than cloned/ported

### Contract 1 — ZK Payment Verifier (main contract)

*Does: Receives ZK proofs → verifies on-chain → executes transfer if valid → reverts if invalid → emits event with proof hash only*

- [x] `contracts/` cargo workspace with `zbank_verifier` member
- [x] `contracts/zbank_verifier/src/lib.rs`:
  - `verify_payment(sender, recipient, token, amount, compliance_inputs, compliance_proof, amount_inputs, amount_proof)`
  - `sender.require_auth()` + both UltraHonk proofs verified via stored VKs
  - On success: `token::Client::transfer()` moves the funds
  - On failure: typed `Error` return reverts the invocation — no funds move
  - Emits `("zbank", "payment")` event with the keccak proof hash only
- [x] Tests in `src/test.rs` with the real circuit artifacts: happy path (funds move), corrupted proof (typed error, no funds move), solvency attestation, wrong-circuit proof rejected — 4/4 pass
- [x] Build clean: `stellar contract build` → 23 KB wasm

### Contract 2 — Solvency Attestation ✅ DONE (same contract)

- [x] `attest_solvency(public_inputs: Bytes, proof: Bytes)` — verifies against the solvency VK
- [x] On success: stores `SolvencyAttestation { timestamp, ledger, proof_hash }` in contract storage + emits event
- [x] Read function: `get_solvency_attestation() -> Option<SolvencyAttestation>`

### Deploy to Stellar Testnet

- [x] Deployer wallet generated + friendbot-funded (`stellar keys generate zbank-deployer --network testnet --fund`)
- [x] Deployed with all three VKs as constructor args
- [x] Contract address saved in `src/config/contracts.ts` (with native XLM SAC address, RPC/Horizon URLs, explorer helpers)
- [x] Tested on testnet with real proofs (CLI-generated AND browser-generated):
  - verify_payment: [06b237bc…](https://stellar.expert/explorer/testnet/tx/06b237bce8a3796229284785d31613ac2e7928d118f2b7fad486cdfdf4451a84) (CLI proofs), [c2573f1d…](https://stellar.expert/explorer/testnet/tx/c2573f1d430f8d4c9fec9a9c3cd501cbc409b7bf1de47dda5f665bbefd71a7f9) (browser proofs)
  - attest_solvency: [440d3998…](https://stellar.expert/explorer/testnet/tx/440d3998f6a190601b9dabd4544e663db0a5d213d6af592d634a4ba765cf1984)
- [x] Push contract code and updated `contracts.ts`

---

## Phase 4 — Wire Frontend to Real Chain ✅ COMPLETE

*Implementation notes (2026-07-02): end-to-end verified — proofs generated by the app's browser prover were submitted to the deployed contract and verified on-chain ([c2573f1d…](https://stellar.expert/explorer/testnet/tx/c2573f1d430f8d4c9fec9a9c3cd501cbc409b7bf1de47dda5f665bbefd71a7f9)). The only step not exercised headlessly is the Freighter signing popup itself (needs the extension) — same code path, CLI signature swapped for Freighter's. Transfers are native XLM via the SAC; amount is visible in the transfer event on-chain until the Phase 5 shielded pool. The proof is keccak (non-ZK-mode) UltraHonk — fine for the demo, worth revisiting for stronger privacy later.*

### Proof Generation (replace all `setTimeout` stubs)

- [x] Step 1 — Real compliance proof (recipient hashed with SHA-256→field; sanctions list as public inputs)
- [x] Step 2 — Real amount proof: real wallet balance fetched from Horizon (falls back to demo constant if no wallet/Horizon error)

### Stellar Transaction

- [x] Step 3 — Build Soroban transaction: `Contract.call('verify_payment', …)` with sender/recipient/token/amount + both proofs and public inputs; `rpc.Server.prepareTransaction` simulates (an invalid proof is rejected here, before the user signs)
- [x] Step 4 — Freighter signing: `signTransaction(prepared.toXDR(), { networkPassphrase, address })`; rejects surface as a failed step (needs the wrong-network guard: submission refuses unless Freighter is on TESTNET)
- [x] Step 5 — Submit via `rpc.Server.sendTransaction` + poll `getTransaction` until SUCCESS/FAILED (60 s deadline)
- [x] Step 6 — Real `txHash` + `ledgerIndex` returned to the UI; tx hash links to stellar.expert; `ProofGenerationFlow` stages driven by real prover/chain progress

### Frontend Updates

- [x] `ExplorerComparison.tsx` — public ledger panel pulls the real tx record from Horizon (ledger #, fee charged, on-chain timestamp, live-confirmed state, stellar.expert link)
- [x] Dashboard transaction table — real transactions get a "Testnet ↗" confirmation link to stellar.expert
- [x] Quick win — Treasury shows the connected wallet's live testnet XLM balance via Horizon (blurred, revealable), falls back to mock when disconnected

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

- [x] Fetch real XLM balance from Horizon API on wallet connect (done in Phase 4, `src/lib/useHorizon.ts`)
- [x] Display real (blurred) balance in Treasury view (done in Phase 4)
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
  - What ARCANUM is and what problem it solves
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
| Noir circuits | ✅ Done |
| Proof generation (real) | ✅ Done |
| Soroban contract | ✅ Done |
| Frontend ↔ chain wiring | ✅ Done |
| Live treasury balance | 🟡 In progress |
| README | 🟡 In progress |
| Demo video | 🔴 Not started |
