# Going to mainnet

Everything is wired so that going live is **deploy the two contracts, paste three
addresses, flip one switch**. No application code changes.

> ⚠️ **Audit first.** Mainnet moves real XLM. The Soroban contracts and ZK circuits
> should have a professional security audit before handling real funds (this is the
> first line of the SCF funding ask). Treat the steps below as the mechanical
> procedure once that's done.

## 1. Prerequisites
- A funded **mainnet** Stellar account/key in your `stellar` CLI keychain (real XLM
  for deploy fees). Create/import one and note its name (e.g. `arcanum-mainnet`).
- The pinned toolchain (`bash scripts/setup-toolchain.sh`) and built circuit VKs.

## 2. Deploy the contracts to mainnet
Both deploy scripts take `NETWORK` and `SOURCE`:

```bash
NETWORK=mainnet SOURCE=arcanum-mainnet bash scripts/deploy-verifier.sh
NETWORK=mainnet SOURCE=arcanum-mainnet bash scripts/deploy-pool.sh
```

Each prints a contract id. The verifier holds the three circuit VKs; the pool holds
the compliance + amount VKs and custodies XLM.

## 3. Paste the addresses
In `src/config/contracts.ts`, fill the `mainnet` block:

```ts
mainnet: {
  verifier: 'C...',      // from deploy-verifier.sh
  pool:     'C...',      // from deploy-pool.sh
  nativeToken: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
  // ...endpoints already set
}
```

Verify the native XLM SAC id for mainnet:

```bash
stellar contract id asset --asset native --network mainnet
```

## 4. Flip the switch
Either set the env var (preferred for deploys):

```bash
NEXT_PUBLIC_STELLAR_NETWORK=mainnet
```

…or change `ACTIVE_NETWORK` in `src/config/contracts.ts` to `'mainnet'`.

That's it — every endpoint (Horizon, Soroban RPC, explorer) and every contract
address across the app is read from `CONTRACTS`, so nothing else needs editing.

## 5. Smoke-test on mainnet
- Connect Freighter set to **Public/Mainnet**.
- Treasury → deposit a small amount into the pool, confirm the shielded balance.
- Send a shielded payment, confirm on stellar.expert that the transfer emits only a
  proof-hash event (no amount).
- Withdraw.

## What already handles the switch for you
- `src/config/contracts.ts` — per-network config blocks + `ACTIVE_NETWORK`.
- `isPoolDeployed()` / `isVerifierDeployed()` — the UI gates itself if a mainnet
  address isn't set yet, so a half-configured mainnet won't crash the app.
- `explorerTxUrl()` / `explorerContractUrl()` — resolve to the right explorer per
  network automatically.
- `scripts/deploy-verifier.sh` / `scripts/deploy-pool.sh` — `NETWORK`-parameterized.
