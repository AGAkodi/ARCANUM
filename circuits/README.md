# ΛRCΛNUM ZK Circuits

Noir circuits powering the confidential payment flow.

## Toolchain (pinned for on-chain compatibility)

The on-chain verifier ([ultrahonk-soroban-verifier](https://github.com/yugocabrio/rs-soroban-ultrahonk), used by `contracts/zbank_verifier`) expects the bb 0.87 proof format with a **keccak transcript**, so the whole stack is pinned to:

| Tool | Version | Where |
|---|---|---|
| `nargo` | `1.0.0-beta.9` | `~/.zbank-toolchain/nargo/nargo` |
| `bb` (Barretenberg) | `0.87.0` | `~/.zbank-toolchain/bb/bb` |
| `@noir-lang/noir_js` | `1.0.0-beta.9` | package.json |
| `@aztec/bb.js` | `0.87.0` | package.json (served from `public/bb`, see below) |

The pinned binaries live in `~/.zbank-toolchain/` so they don't clobber a newer default nargo/bb install. To reinstall:

```sh
mkdir -p ~/.zbank-toolchain/nargo ~/.zbank-toolchain/bb
curl -sL https://github.com/noir-lang/noir/releases/download/v1.0.0-beta.9/nargo-aarch64-apple-darwin.tar.gz | tar -xz -C ~/.zbank-toolchain/nargo
curl -sL https://github.com/AztecProtocol/aztec-packages/releases/download/v0.87.0/barretenberg-arm64-darwin.tar.gz | tar -xz -C ~/.zbank-toolchain/bb
```

## Circuits

| Circuit | Proves | Private inputs | Public inputs |
|---|---|---|---|
| `compliance_circuit` | Recipient is NOT on the sanctions list | `recipient_hash` | `sanctions_list[10]` |
| `amount_circuit` | `amount >= min_amount && amount <= balance` | `amount`, `balance` | `min_amount` |
| `solvency_circuit` | `total_assets > total_liabilities` | `total_assets`, `total_liabilities` | — |
| `toy_circuit` | `age >= min_age` (hello-world example) | `age` | `min_age` |

## Build, prove, verify

From a circuit directory (e.g. `circuits/amount_circuit`), with `NARGO=~/.zbank-toolchain/nargo/nargo` and `BB=~/.zbank-toolchain/bb/bb`:

```sh
$NARGO test          # run passing + should_fail test cases
$NARGO execute       # compile + solve witness from Prover.toml
$BB prove    --scheme ultra_honk --oracle_hash keccak \
  --bytecode_path target/<name>.json --witness_path target/<name>.gz \
  --output_path target --output_format bytes_and_fields
$BB write_vk --scheme ultra_honk --oracle_hash keccak \
  --bytecode_path target/<name>.json \
  --output_path target --output_format bytes_and_fields
$BB verify   --scheme ultra_honk --oracle_hash keccak \
  -k target/vk -p target/proof -i target/public_inputs
```

Artifacts land in `target/`: compiled ACIR (`<name>.json`), witness (`<name>.gz`), `proof` (14592 bytes = 456 fields), `public_inputs` (32 bytes per field), `vk` (1760 bytes), plus `*_fields.json` variants. The `target/` folders are force-added to git so the compiled artifacts ship with the repo.

Careful:
- `nargo check --overwrite` resets `Prover.toml` to zeroed inputs — don't run it after filling in real values.
- Noir beta.9 rejects non-ASCII characters in comments (no em dashes).
- Without `--oracle_hash keccak` the proof uses the poseidon transcript and the Soroban contract will reject it.

## Browser proving

The compiled `<name>.json` files are copied to `src/circuits/` and consumed by
`src/lib/zkProver.ts` (`@noir-lang/noir_js` + bb.js `UltraHonkBackend`, keccak
transcript) to generate on-chain-verifiable proofs client-side. bb.js 0.87's
browser bundle breaks under Next's webpack, so `scripts/copy-bb.mjs`
(postinstall) copies it to `public/bb/` and the app loads it at runtime.

After changing a circuit: recompile + reprove (commands above), copy the new
ACIR to `src/circuits/`, and **redeploy `contracts/zbank_verifier`** — the VKs
stored in the deployed contract are immutable, and stale VKs will reject the
new proofs. Update `src/config/contracts.ts` with the new contract id.
