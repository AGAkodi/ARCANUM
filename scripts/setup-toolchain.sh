#!/usr/bin/env bash
# ARCANUM Toolchain Setup
#
# Pins the EXACT ZK toolchain the on-chain UltraHonk verifier expects:
#   nargo 1.0.0-beta.9  +  bb (Barretenberg) 0.87.0  with a keccak transcript.
#
# The on-chain verifier (ultrahonk-soroban-verifier) only accepts the bb 0.87
# proof format. A newer nargo/bb produces proofs the contract silently rejects —
# this is the "toolchain skew" the Stellar review flagged.
#
# Everything installs into ~/.zbank-toolchain so it never clobbers whatever
# nargo/bb you have on PATH. ALWAYS invoke the pinned paths, never bare nargo/bb.
#
# Usage: bash scripts/setup-toolchain.sh
set -euo pipefail

TC="$HOME/.zbank-toolchain"
NARGO_VER="v1.0.0-beta.9"
BB_VER="v0.87.0"
NARGO_BIN="$TC/nargo/nargo"
BB_BIN="$TC/bb/bb"

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64)   NARGO_ASSET="nargo-aarch64-apple-darwin.tar.gz";     BB_ASSET="barretenberg-arm64-darwin.tar.gz" ;;
  Darwin-x86_64)  NARGO_ASSET="nargo-x86_64-apple-darwin.tar.gz";      BB_ASSET="barretenberg-x86_64-darwin.tar.gz" ;;
  Linux-x86_64)   NARGO_ASSET="nargo-x86_64-unknown-linux-gnu.tar.gz"; BB_ASSET="barretenberg-x86_64-linux-gnu.tar.gz" ;;
  *) echo "Unsupported platform: $(uname -s)-$(uname -m). Install $NARGO_VER + $BB_VER manually into $TC." >&2; exit 1 ;;
esac

have() { [ -x "$1" ] && "$1" --version 2>/dev/null | grep -q "$2"; }

mkdir -p "$TC/nargo" "$TC/bb"

if have "$NARGO_BIN" "beta.9"; then
  echo "✓ nargo $NARGO_VER already pinned"
else
  echo "→ installing nargo $NARGO_VER into $TC/nargo"
  curl -fsSL "https://github.com/noir-lang/noir/releases/download/$NARGO_VER/$NARGO_ASSET" | tar -xz -C "$TC/nargo"
fi

if have "$BB_BIN" "0.87.0"; then
  echo "✓ bb $BB_VER already pinned"
else
  echo "→ installing bb $BB_VER into $TC/bb"
  curl -fsSL "https://github.com/AztecProtocol/aztec-packages/releases/download/$BB_VER/$BB_ASSET" | tar -xz -C "$TC/bb"
fi

echo ""
echo "Pinned toolchain (do NOT use bare 'nargo'/'bb' — PATH may hold a newer, incompatible version):"
echo "  NARGO=$NARGO_BIN   → $("$NARGO_BIN" --version | head -1)"
echo "  BB=$BB_BIN         → $("$BB_BIN" --version | head -1)"
echo ""
echo "Regenerate a proof (keccak transcript is mandatory), e.g. amount_circuit:"
echo "  cd circuits/amount_circuit"
echo "  \"$NARGO_BIN\" execute"
echo "  \"$BB_BIN\" prove --scheme ultra_honk --oracle_hash keccak \\"
echo "     --bytecode_path target/amount_circuit.json --witness_path target/amount_circuit.gz \\"
echo "     --output_path target --output_format bytes_and_fields"
