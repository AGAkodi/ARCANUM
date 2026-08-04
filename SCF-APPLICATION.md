# ARCANUM — Stellar Community Fund Application (draft)

Submit at https://communityfund.stellar.org. Fields below map to the SCF form;
edit links/figures before submitting.

---

**Project name:** ARCANUM

**One-liner:** Confidential institutional payments on Stellar using zero-knowledge proofs.

**Category:** Financial protocols / privacy infrastructure.

---

## Problem

Every transaction on a public blockchain is visible to anyone watching a wallet
address — amounts, counterparties, and timing. Banks and fintechs cannot expose
their payment flows and client relationships to competitors and the public, so
they cannot use public chains for real settlement. This is the single biggest
blocker to institutional adoption of Stellar for payments.

## Solution

ARCANUM uses Noir zero-knowledge circuits to prove a payment is valid and
compliant — without revealing sender, recipient, or amount. Proofs are verified
on-chain by Soroban smart contracts, and a shielded pool contract ensures no
plaintext transfer event ever appears on the public ledger: value moves between
internal pool balances after the proofs verify, so the chain records only a proof
hash. Compliance checks (KYC, OFAC sanctions screening) run locally and produce a
proof instead of exposing raw identity data — regulators get a cryptographic
guarantee that checks passed, not access to client records.

## Current state (verified, not aspirational)

- **Full pipeline works on Stellar testnet**: browser proving via bb.js →
  Freighter signing → Soroban on-chain verification, returning real tx hashes.
- **Two contracts deployed on testnet**:
  - ZK payment verifier — `CAHC6LH4MWQXFSZ7Z4UNY3ZCHGU4III6SKA5YKKXMTIMARYIO72PMCXV`
  - Shielded pool (`arcanum_pool`) — `CCC3C2GXO7F57LWXBDXNE423WUC2ZJBRPMZ2O2Y6WVEVJZQ676MIE27B`
- **Privacy property proven on-chain**: a shielded transfer of 40 XLM emitted only
  a proof-hash event and left the recipient's wallet balance unchanged — no amount,
  sender, or recipient on the ledger. Deposit → shielded transfer → withdraw cycle
  verified end-to-end.
- **Tests**: `cargo test` 4/4 (including corrupted-proof rejection and cross-circuit
  VK mismatch), `nargo test` 3/3 per circuit. A fourth circuit (private payroll) is
  circuit-ready: `nargo test` 3/3, UltraHonk proof generated and verified (14,592 B).
- **Endorsed by the Stellar hackathon review team**, who confirmed the tests and
  pipeline independently and recommended applying to SCF.

## Roadmap (what SCF funding covers)

1. **Professional security audit** of the Soroban contracts and ZK circuits — the
   prerequisite before touching real funds.
2. **Mainnet deployment** post-audit. (The codebase is already mainnet-switchable:
   fill three addresses and flip one config flag — see `MAINNET.md`.)
3. **Commitment-based amount hiding** (nullifiers/commitments) so amounts are hidden
   from contract state, not just ledger events — the natural hardening of the pool.
4. **Three additional circuits**: payroll (circuit done), confidential escrow, and
   supplier payments.
5. **Real selective disclosure** with on-chain encryption-key management for auditor
   access.
6. **Integration SDK** so institutions can embed ARCANUM into existing payment
   systems.

## Team

- **Monarch** (@0xMonarch) — Product, UI, Frontend
- **DGrayArea** (@DGrayArea) — ZK circuits, Soroban contracts

## Links

- GitHub: https://github.com/AGAkodi/ARCANUM
- Demo video: _(add link)_
- Deployed testnet contracts: verifier + shielded pool (ids above), viewable on
  stellar.expert.

## Funding ask

Scope to cover: security audit ($15–30k), three additional circuits, mainnet
deployment, and ~6 months of continued development toward the integration SDK.

---

### Notes for whoever submits
- Record and attach a 2–3 minute demo video: connect Freighter (testnet), deposit
  into the pool, send a shielded payment, show on stellar.expert that the transfer
  carries no amount, then withdraw.
- The "progress since review" story = the feedback scorecard at the top of `TODO.md`
  (all three reviewer asks delivered).
