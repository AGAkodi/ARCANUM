#!/usr/bin/env bash
# Deploy arcanum_pool to Stellar testnet.
#
# This is the ONE step that needs your key: it signs with the `zbank-deployer`
# identity in your Stellar CLI keychain and pays the (testnet, valueless) fee.
# Nothing here touches mainnet or real funds.
#
# Constructor args (must match contracts/arcanum_pool/src/lib.rs):
#   token         — the pool's custody token (native XLM SAC, from contracts.ts)
#   vk_compliance — compliance circuit VK bytes
#   vk_amount     — amount circuit VK bytes
#
# Usage:
#   bash scripts/deploy-pool.sh                              # testnet (default)
#   NETWORK=mainnet SOURCE=my-mainnet-key bash scripts/deploy-pool.sh
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
SOURCE="${SOURCE:-zbank-deployer}"

# Native XLM SAC per network (verify: stellar contract id asset --asset native --network <net>)
case "$NETWORK" in
  testnet) TOKEN="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" ;;
  mainnet) TOKEN="CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA" ;;
  *) echo "Unknown NETWORK '$NETWORK' (use testnet|mainnet)"; exit 1 ;;
esac
WASM="contracts/target/wasm32v1-none/release/arcanum_pool.wasm"
VK_COMPLIANCE="circuits/compliance_circuit/target/vk"
VK_AMOUNT="circuits/amount_circuit/target/vk"

command -v stellar >/dev/null || { echo "stellar CLI not found"; exit 1; }
command -v xxd >/dev/null     || { echo "xxd not found (needed to hex-encode VKs)"; exit 1; }

echo "→ building arcanum_pool wasm (wasm32v1-none)…"
( cd contracts && cargo build -p arcanum_pool --target wasm32v1-none --release )
[ -f "$WASM" ] || { echo "wasm not found at $WASM"; exit 1; }

for f in "$VK_COMPLIANCE" "$VK_AMOUNT"; do
  [ -f "$f" ] || { echo "missing VK: $f — run circuits build first"; exit 1; }
done

VK_C_HEX="$(xxd -p "$VK_COMPLIANCE" | tr -d '\n')"
VK_A_HEX="$(xxd -p "$VK_AMOUNT" | tr -d '\n')"

echo "→ deploying with source '$SOURCE' on $NETWORK…"
CONTRACT_ID="$(stellar contract deploy \
  --wasm "$WASM" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  -- \
  --token "$TOKEN" \
  --vk_compliance "$VK_C_HEX" \
  --vk_amount "$VK_A_HEX")"

echo ""
echo "✓ arcanum_pool deployed:"
echo "    $CONTRACT_ID"
echo ""
echo "Next: set this in src/config/contracts.ts →  pool: '$CONTRACT_ID',"
echo "Then isPoolDeployed() flips true and the shielded-pool flow goes live."
