# ARCANUM — Confidential Institutional Payments on Stellar

Zero-knowledge payments for banks, fintechs, and institutions that need to transact on a public blockchain without exposing their financial activity to anyone watching their wallet address.

## The Problem

Every transaction on a public blockchain is visible to anyone monitoring a wallet address — sender, receiver, and amount. For institutions, this is a fundamental blocker to adopting on-chain payments. A bank's counterparties, competitors, and the public can watch every payment in real time. There is no enterprise-grade financial privacy on a public chain.

## What ARCANUM Does

ARCANUM enables confidential, compliant institutional payments on Stellar using zero-knowledge proofs. Transactions are verified on-chain — but sensitive data stays hidden.

Specifically:

* **Payment amounts are hidden** — a ZK proof confirms sufficient balance and valid transfer without revealing the number
* **Compliance is provable without disclosure** — KYC and sanctions checks run locally, off-chain, and produce a cryptographic proof submitted on-chain instead of raw identity data
* **The public chain sees nothing sensitive** — only a proof hash and a "Verified ✓" status, never the amount, sender identity, or recipient identity

The result: an institution can prove every payment is valid and compliant without leaking a single number or identity to the public.

## Live Demo

* **App**: https://arcanum.vercel.app
* **Network**: Stellar Testnet
* **Wallet**: Freighter (Chrome extension required)

To test the full flow:

1. Install Freighter and switch it to Testnet
2. Fund your testnet wallet at https://lab.stellar.org/account/fund
3. Connect your wallet in ARCANUM
4. Send a confidential payment — watch the ZK proof stages complete, sign with Freighter, confirm the real txHash on Stellar testnet

## What ZK Is Actually Doing

ZK is load-bearing in this project, not a label in the README. Here is exactly what each circuit proves:

### Circuit 1 — Compliance / Sanctions Check

* **Private inputs**: recipient address hash, Merkle path through sanctions list
* **Public inputs**: sanctions list Merkle root
* **Proves**: recipient address is NOT on the sanctions list
* **What stays hidden**: the actual recipient address — never appears on-chain

### Circuit 2 — Amount Range Proof

* **Private inputs**: payment amount, wallet balance
* **Public inputs**: minimum valid amount (1)
* **Proves**: amount > 0 AND amount ≤ wallet balance
* **What stays hidden**: both the payment amount and the wallet balance — neither number appears on-chain

Both proofs are generated client-side in the browser using Noir + Barretenberg (bb.js), then submitted to a Soroban smart contract on Stellar testnet for on-chain verification. If either proof fails, the contract reverts and no funds move.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Blockchain | Stellar (Testnet) |
| Smart contracts | Soroban (Rust) |
| ZK language | Noir (beta.9) |
| ZK proof engine | Barretenberg (bb 0.87.0, keccak transcripts) |
| Browser proof generation | bb.js (loaded at runtime from public/bb/) |
| Frontend | Next.js 15 (App Router), TypeScript |
| Wallet | Freighter (via @stellar/freighter-api) |
| Stellar SDK | @stellar/stellar-sdk |
| On-chain data | Stellar Horizon API (testnet) |

## Architecture

```
User fills payment form (recipient, amount)
        │
        ▼
[Browser — off-chain]
  Circuit 1: Compliance proof
  → Noir circuit hashes recipient address
  → Proves non-membership in sanctions list
  → Returns proof bytes

  Circuit 2: Amount range proof  
  → Proves amount > 0 AND amount ≤ balance
  → Returns proof bytes
        │
        ▼
[Freighter — user signs]
  Transaction built with both proof bytes
  User approves in Freighter popup
        │
        ▼
[Stellar Testnet — on-chain]
  Route A — verifier contract (visible settlement):
    Verifies both proofs → executes token transfer → emits proof-hash event
  Route B — shielded pool (Phase 5, when sender has a pool balance):
    Verifies both proofs → moves INTERNAL balances only → NO token transfer
    → emits proof-hash event, so no amount/sender/recipient hits the ledger
  Either route reverts with no state change if a proof is invalid.
        │
        ▼
[Frontend — result]
  Real txHash returned
  Transaction visible on Stellar testnet explorer
  Amount and identities: not visible to public
```

Shielded pool flow (Phase 5):

```
Deposit:   wallet ──(visible)──▶ arcanum_pool   (credits internal balance)
Transfer:  proofs ──▶ shielded_transfer ──▶ internal balances only (no ledger event)
Withdraw:  arcanum_pool ──(visible)──▶ wallet   (debits internal balance)
```

## Contract Addresses (Stellar Testnet)

| Contract | Address |
| :--- | :--- |
| ZK Payment Verifier | CAHC6LH4MWQXFSZ7Z4UNY3ZCHGU4III6SKA5YKKXMTIMARYIO72PMCXV |
| Solvency Attestation | CAHC6LH4MWQXFSZ7Z4UNY3ZCHGU4III6SKA5YKKXMTIMARYIO72PMCXV |
| Shielded Pool (`arcanum_pool`) | CCC3C2GXO7F57LWXBDXNE423WUC2ZJBRPMZ2O2Y6WVEVJZQ676MIE27B |

Verification keys (VKs) are stored immutably in the contract. Changing a circuit requires redeploying.

The shielded pool holds the compliance + amount VKs and custodies XLM. Verified on
testnet: a shielded transfer emits only a proof-hash event — no sender, recipient,
or amount reaches the public ledger.

## Repo Structure

```
ARCANUM/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # UI components
│   │   ├── views/              # Screen-level components
│   │   │   ├── Overview.tsx
│   │   │   ├── SendPayment.tsx
│   │   │   ├── ExplorerComparison.tsx
│   │   │   ├── CompliancePanel.tsx
│   │   │   └── TreasurySolvency.tsx
│   │   └── ui/                 # Shared UI primitives
│   ├── lib/
│   │   ├── zkProver.ts         # Noir proof generation (browser)
│   │   └── stellarZkService.ts # End-to-end payment orchestration
│   ├── config/
│   │   └── contracts.ts        # Deployed contract addresses
│   └── circuits/               # Compiled circuit JSON files
│       ├── compliance_circuit.json
│       └── amount_circuit.json
├── circuits/                   # Noir circuit source code
│   ├── README.md               # Pinned toolchain versions
│   ├── toy_circuit/            # Pipeline validation circuit
│   ├── compliance_circuit/     # Sanctions check circuit
│   ├── amount_circuit/         # Range proof circuit
│   ├── solvency_circuit/       # Assets > liabilities circuit
│   └── payroll_circuit/        # Private payroll circuit (Phase 5b)
├── contracts/
│   ├── arcanum_verifier/       # Verifier Soroban contract (Rust)
│   └── arcanum_pool/           # Shielded pool Soroban contract (Phase 5)
├── scripts/
│   ├── setup-toolchain.sh      # Pin nargo beta.9 + bb 0.87.0
│   └── deploy-pool.sh          # Deploy arcanum_pool to testnet
└── public/
    └── bb/                     # bb.js runtime bundle (auto-copied on pnpm install)
```

## How to Run Locally

### Prerequisites

* Node.js 18+
* pnpm (`npm install -g pnpm`)
* Freighter browser extension

### Setup

```bash
git clone https://github.com/AGAkodi/ARCANUM
cd ARCANUM
pnpm install
```

The `postinstall` script automatically copies the `bb.js` bundle to `public/bb/`. No manual steps needed to run the app — the compiled circuits ship with the repo.

To **regenerate proofs** (only needed if you change a circuit), first pin the exact toolchain:

```bash
bash scripts/setup-toolchain.sh
```

### Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_VERIFIER_CONTRACT_ID=CAHC6LH4MWQXFSZ7Z4UNY3ZCHGU4III6SKA5YKKXMTIMARYIO72PMCXV
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

### Run

```bash
pnpm dev
```

Open `http://localhost:3000`, connect Freighter (set to Testnet), fund your wallet at `lab.stellar.org/account/fund`, and send a payment.

## Toolchain (Circuits)

Pinned versions — do not upgrade without redeploying the contract:

* **nargo**: `1.0.0-beta.9`
* **bb**: `0.87.0` (keccak transcripts)
* **Binaries**: `~/.zbank-toolchain/{nargo/nargo, bb/bb}`

Pin them in one step (installs the exact versions without clobbering any default
nargo/bb on your PATH):

```bash
bash scripts/setup-toolchain.sh
```

### Regenerating proofs

With `NARGO=~/.zbank-toolchain/nargo/nargo` and `BB=~/.zbank-toolchain/bb/bb`, from a
circuit directory (e.g. `circuits/amount_circuit`):

```bash
$NARGO execute
$BB prove --scheme ultra_honk --oracle_hash keccak \
  --bytecode_path target/amount_circuit.json --witness_path target/amount_circuit.gz \
  --output_path target --output_format bytes_and_fields
```

The `--oracle_hash keccak` flag is mandatory — without it the proof uses a poseidon
transcript and the Soroban verifier rejects it. Full details in `circuits/README.md`.

## What's Real vs What's Simulated

We're being honest about this as the hackathon brief requests.

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Wallet connect (Freighter) | ✅ Real | Live Freighter integration |
| ZK compliance proof | ✅ Real | Real Noir circuit, real proof bytes |
| ZK amount range proof | ✅ Real | Real Noir circuit, real proof bytes |
| On-chain proof verification | ✅ Real | Soroban contract on Stellar testnet |
| Freighter signing | ✅ Real | Tested end-to-end, real txHash |
| Stellar transaction | ✅ Real | Funds move on testnet |
| Live wallet balance | ✅ Real | Horizon API |
| Compliance failure case | ✅ Real | Sanctioned recipient blocks payment |
| Transfer amount hiding | ✅ Real | Shielded pool (`arcanum_pool`) deployed on testnet; shielded transfers move internal balances and emit only a proof hash — verified on-chain that no amount reaches the ledger. |
| Selective disclosure keys | 🔵 Simulated | UI built, cryptographic key generation not yet implemented |
| Private recurring payments | 🔵 Simulated | UI built, circuit not yet implemented |
| Private payroll | 🔵 Circuit Ready | Real Noir circuit — `nargo test` 3/3, UltraHonk proof verifies (14,592 B). On-chain integration coming. |
| Confidential escrow | 🔵 Simulated | UI built, circuit not yet implemented |
| Solvency proof | 🔵 Simulated | Circuit written, on-chain attestation pending |
| Payment history persistence | 🔵 Simulated | Resets on refresh — localStorage planned in Phase 8 |

## Known Limitations

### Transfer amount visible in on-chain event — ✅ RESOLVED (Phase 5)
Previously, the ZK amount range proof hid the amount from the proof itself, but the
underlying Stellar token transfer still recorded the amount in the transaction event
log. The shielded pool (`arcanum_pool`) fixes this: transfers happen inside a shared
pool via `shielded_transfer`, which verifies the proofs and moves internal balances
without any token transfer — so no sender, recipient, or amount is ever recorded.
Verified on testnet (a shielded transfer left the recipient's wallet balance
unchanged while its internal balance updated). Deposits and withdrawals remain
visible by design.

### Amount hiding is at the ledger-event level, not full commitment-based
The pool stores internal balances as plaintext `i128` in contract storage, so amounts
are hidden from ledger *events* but not from someone reading contract state. Full
amount-hiding (commitments + nullifiers) is future work; the current design delivers
the reviewer-requested property that no plaintext transfer appears on-chain, with
every internal move gated by a real on-chain proof verification.

### Testnet only
ARCANUM runs on Stellar Testnet. Mainnet deployment requires a security audit of the Soroban contract and the ZK circuits before handling real funds.

### Single-device proof generation
Proof generation runs client-side in the browser. On slower devices, the compliance circuit can take 10-30 seconds. A prover service would resolve this for production.

## Roadmap

| Phase | Feature | Status |
| :--- | :--- | :--- |
| Phase 5 | Shielded pool — no plaintext transfer on-chain | ✅ Deployed + verified on testnet |
| Phase 5b | Private payroll circuit | ✅ Circuit ready (`nargo test` 3/3, proof verifies) |
| Phase 5c | Pinned toolchain setup script | ✅ `scripts/setup-toolchain.sh` |
| Phase 6 | Real selective disclosure with encryption keys | Planned |
| Phase 7 | Commitment-based amount hiding + mainnet audit | Planned |
| Phase 8 | Payment history persistence | Planned |

## Team

Built for the Real-World ZK on Stellar Hackathon

* **Name**: DGrayArea (ZK Circuits + Soroban Contract)
* **Name**: Monarch (@0xMonarch) (Product, UI/UX, Frontend Integration)

## Resources

* [Stellar Docs](https://developers.stellar.org/)
* [Noir Language](https://noir-lang.org/)
* [Barretenberg](https://github.com/AztecProtocol/barretenberg)
* [Soroban Smart Contracts](https://soroban.stellar.org/)
* [Freighter Wallet](https://www.freighter.app/)
* [rs-soroban-ultrahonk verifier](https://github.com/yugocabrio/rs-soroban-ultrahonk)
* [Stellar Expert Testnet Explorer](https://stellar.expert/explorer/testnet/)
