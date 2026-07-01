import { Noir } from '@noir-lang/noir_js';
import type { CompiledCircuit, InputMap } from '@noir-lang/noir_js';
import { Barretenberg, UltraHonkBackend } from '@aztec/bb.js';

export interface ProofResult {
  /** Raw UltraHonk proof bytes */
  proof: Uint8Array;
  /** Public inputs as field-element hex strings */
  publicInputs: string[];
  /** Proof bytes as a 0x-prefixed hex string (for display / hashing) */
  proofHex: string;
  /** SHA-256 hash of the circuit's verification key, 0x-prefixed */
  vkHash: string;
}

// One shared WASM instance for all circuits; spun up on first proof.
// Single-threaded: multithreaded proving needs SharedArrayBuffer, which
// requires COOP/COEP cross-origin isolation headers that would break the
// app's cross-origin assets (Google Fonts). Our circuits are tiny, so one
// thread proves in well under a second.
let apiPromise: Promise<Barretenberg> | null = null;
function getApi(): Promise<Barretenberg> {
  if (!apiPromise) {
    apiPromise = Barretenberg.new({ threads: 1 });
  }
  return apiPromise;
}

const backendCache = new Map<string, UltraHonkBackend>();
const vkHashCache = new Map<string, string>();

async function getBackend(circuit: CompiledCircuit): Promise<UltraHonkBackend> {
  let backend = backendCache.get(circuit.bytecode);
  if (!backend) {
    backend = new UltraHonkBackend(circuit.bytecode, await getApi());
    backendCache.set(circuit.bytecode, backend);
  }
  return backend;
}

function toHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function getVkHash(circuit: CompiledCircuit): Promise<string> {
  let vkHash = vkHashCache.get(circuit.bytecode);
  if (!vkHash) {
    const backend = await getBackend(circuit);
    const vk = await backend.getVerificationKey();
    const digest = await crypto.subtle.digest('SHA-256', vk.slice().buffer);
    vkHash = toHex(new Uint8Array(digest));
    vkHashCache.set(circuit.bytecode, vkHash);
  }
  return vkHash;
}

/**
 * Executes the circuit with the given inputs and generates a real UltraHonk
 * proof in the browser. Throws if the inputs violate a circuit constraint
 * (e.g. sanctioned recipient, amount over balance).
 */
export async function generateProof(
  circuit: CompiledCircuit,
  inputs: InputMap
): Promise<ProofResult> {
  const noir = new Noir(circuit);
  const { witness } = await noir.execute(inputs);
  const backend = await getBackend(circuit);
  const { proof, publicInputs } = await backend.generateProof(witness);
  return {
    proof,
    publicInputs,
    proofHex: toHex(proof),
    vkHash: await getVkHash(circuit),
  };
}

/** Verifies a proof client-side against the circuit's verification key. */
export async function verifyProofLocally(
  circuit: CompiledCircuit,
  result: Pick<ProofResult, 'proof' | 'publicInputs'>
): Promise<boolean> {
  const backend = await getBackend(circuit);
  return backend.verifyProof({ proof: result.proof, publicInputs: result.publicInputs });
}

/**
 * Hashes an arbitrary string (e.g. a Stellar address) to a BN254 field
 * element, returned as a 0x-prefixed hex string. Truncated to 31 bytes so the
 * value always fits below the field modulus.
 */
export async function hashToField(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest).slice(0, 31));
}
