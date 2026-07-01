# ΛRCΛNUM ZK Circuits

Noir circuits powering the confidential payment flow.

## Toolchain

| Tool | Version |
|---|---|
| `nargo` | `1.0.0-beta.22` (noirc `1.0.0-beta.22+c57152f9`) |
| `bb` (Barretenberg) | `5.0.0-nightly.20260522` |

Proving scheme: **UltraHonk** (bb's default — the older `bb prove_ultra_honk` subcommand is now just `bb prove`).

## Circuits

| Circuit | Proves | Private inputs | Public inputs |
|---|---|---|---|
| `compliance_circuit` | Recipient is NOT on the sanctions list | `recipient_hash` | `sanctions_list[10]` |
| `amount_circuit` | `amount >= min_amount && amount <= balance` | `amount`, `balance` | `min_amount` |
| `solvency_circuit` | `total_assets > total_liabilities` | `total_assets`, `total_liabilities` | — |
| `toy_circuit` | `age >= min_age` (hello-world example) | `age` | `min_age` |

## Build, prove, verify

From a circuit directory (e.g. `circuits/amount_circuit`):

```sh
nargo test                # run passing + should_fail test cases
nargo execute witness     # compile + solve witness from Prover.toml
mkdir -p target/vk target/proof
bb write_vk -b ./target/<name>.json -o ./target/vk
bb prove -b ./target/<name>.json -w ./target/witness.gz -k ./target/vk/vk -o ./target/proof
bb verify -p ./target/proof/proof -i ./target/proof/public_inputs -k ./target/vk/vk
```

Artifacts land in `target/`: compiled ACIR (`<name>.json`), `witness.gz`, `proof/proof`, `proof/public_inputs`, `vk/vk`, `vk/vk_hash`. The `target/` folders are force-added to git so the compiled artifacts ship with the repo.

Careful: `nargo check --overwrite` resets `Prover.toml` to zeroed inputs — don't run it after filling in real values.

## Browser proving

The compiled `<name>.json` files are copied to `src/circuits/` and consumed by
`src/lib/zkProver.ts` (`@noir-lang/noir_js` + UltraHonk backend) to generate the
same proofs client-side.
