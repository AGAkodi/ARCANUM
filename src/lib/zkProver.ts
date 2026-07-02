import { Noir } from '@noir-lang/noir_js';
import type { CompiledCircuit, InputMap } from '@noir-lang/noir_js';

export interface ProofResult {
  /** Raw UltraHonk proof bytes (keccak transcript, matches the on-chain verifier) */
  proof: Uint8Array;
  /** Public inputs as field-element hex strings */
  publicInputs: string[];
  /** Proof bytes as a 0x-prefixed hex string (for display / hashing) */
  proofHex: string;
  /** SHA-256 hash of the circuit's verification key, 0x-prefixed */
  vkHash: string;
}

interface ProofData {
  proof: Uint8Array;
  publicInputs: string[];
}

interface UltraHonkBackendLike {
  generateProof(witness: Uint8Array, opts?: { keccak?: boolean }): Promise<ProofData>;
  verifyProof(proofData: ProofData, opts?: { keccak?: boolean }): Promise<boolean>;
  getVerificationKey(opts?: { keccak?: boolean }): Promise<Uint8Array>;
}

interface BbModule {
  UltraHonkBackend: new (
    acirBytecode: string,
    options?: { threads?: number }
  ) => UltraHonkBackendLike;
}

// Proofs use the keccak oracle so the Soroban verifier contract (which uses
// the keccak256 host function for its transcript) can verify them on-chain.
// Versions are pinned to match the contract's verifier crate: noir_js
// 1.0.0-beta.9 + bb.js 0.87.0.
const PROVE_OPTS = { keccak: true };

// bb.js 0.87's prebuilt browser bundle breaks when webpack processes it
// ("Object.defineProperty called on non-object"), so it is served verbatim
// from public/bb (see scripts/copy-bb.mjs) and loaded at runtime here.
let bbPromise: Promise<BbModule> | null = null;
function loadBb(): Promise<BbModule> {
  if (!bbPromise) {
    const url = '/bb/index.js';
    bbPromise = import(/* webpackIgnore: true */ url) as Promise<BbModule>;
  }
  return bbPromise;
}

// Single-threaded: multithreaded proving needs SharedArrayBuffer, which
// requires COOP/COEP cross-origin isolation headers that would break the
// app's cross-origin assets (Google Fonts). Our circuits are tiny, so one
// thread proves in well under a second.
const backendCache = new Map<string, UltraHonkBackendLike>();
const vkHashCache = new Map<string, string>();

async function getBackend(circuit: CompiledCircuit): Promise<UltraHonkBackendLike> {
  let backend = backendCache.get(circuit.bytecode);
  if (!backend) {
    const { UltraHonkBackend } = await loadBb();
    backend = new UltraHonkBackend(circuit.bytecode, { threads: 1 });
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
    const vk = await backend.getVerificationKey(PROVE_OPTS);
    const digest = await crypto.subtle.digest('SHA-256', vk.slice().buffer as ArrayBuffer);
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
  const { proof, publicInputs } = await backend.generateProof(witness, PROVE_OPTS);
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
  return backend.verifyProof(
    { proof: result.proof, publicInputs: result.publicInputs },
    PROVE_OPTS
  );
}

/**
 * Concatenates public-input field hex strings into the 32-byte-per-field
 * buffer the Soroban verifier contract expects.
 */
export function publicInputsToBytes(publicInputs: string[]): Uint8Array {
  const out = new Uint8Array(publicInputs.length * 32);
  publicInputs.forEach((field, i) => {
    const hex = field.replace(/^0x/, '').padStart(64, '0');
    for (let j = 0; j < 32; j++) {
      out[i * 32 + j] = parseInt(hex.slice(j * 2, j * 2 + 2), 16);
    }
  });
  return out;
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
