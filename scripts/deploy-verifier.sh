#!/usr/bin/env bash
# Deploy arcanum_verifier (the ZK payment verifier + solvency attestation).
#
# Constructor args (contracts/arcanum_verifier/src/lib.rs):
#   vk_compliance, vk_amount, vk_solvency  — the three circuit VKs (immutable).
#
# Usage:
#   bash scripts/deploy-verifier.sh                              # testnet (default)
#   NETWORK=mainnet SOURCE=my-mainnet-key bash scripts/deploy-verifier.sh
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
SOURCE="${SOURCE:-zbank-deployer}"
WASM="contracts/target/wasm32v1-none/release/arcanum_verifier.wasm"
VK_COMPLIANCE="circuits/compliance_circuit/target/vk"
VK_AMOUNT="circuits/amount_circuit/target/vk"
VK_SOLVENCY="circuits/solvency_circuit/target/vk"

command -v stellar >/dev/null || { echo "stellar CLI not found"; exit 1; }
command -v xxd >/dev/null     || { echo "xxd not found"; exit 1; }

echo "→ building arcanum_verifier wasm (wasm32v1-none)…"
( cd contracts && cargo build -p arcanum_verifier --target wasm32v1-none --release )
[ -f "$WASM" ] || { echo "wasm not found at $WASM"; exit 1; }

for f in "$VK_COMPLIANCE" "$VK_AMOUNT" "$VK_SOLVENCY"; do
  [ -f "$f" ] || { echo "missing VK: $f — build the circuits first"; exit 1; }
done

VK_C_HEX="$(xxd -p "$VK_COMPLIANCE" | tr -d '\n')"
VK_A_HEX="$(xxd -p "$VK_AMOUNT"     | tr -d '\n')"
VK_S_HEX="$(xxd -p "$VK_SOLVENCY"   | tr -d '\n')"

echo "→ deploying verifier with source '$SOURCE' on $NETWORK…"
CONTRACT_ID="$(stellar contract deploy \
  --wasm "$WASM" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  -- \
  --vk_compliance "$VK_C_HEX" \
  --vk_amount "$VK_A_HEX" \
  --vk_solvency "$VK_S_HEX")"

echo ""
echo "✓ arcanum_verifier deployed:"
echo "    $CONTRACT_ID"
echo ""
echo "Next: set this as 'verifier' for the $NETWORK block in src/config/contracts.ts."
