import type { PaymentTransaction } from '../mocks/payments';
import type { ProofResult } from '../lib/zkProver';

export interface ProofGenerationStep {
  label: string;
  status: 'idle' | 'generating' | 'success' | 'failed';
  message?: string;
}

type ProgressCallback = (status: 'generating' | 'success' | 'failed', message?: string) => void;

/**
 * Demo sanctions register. In production this list is published by the
 * compliance authority; here it seeds the circuit's public sanctions_list.
 * The circuit takes exactly 10 entries — unused slots are filled with
 * reserved sentinel hashes.
 */
const SANCTIONED_ADDRESSES = ['GBOFAC_SANCTIONED_ADDRESS_TEST_1234567890'];
const SANCTIONS_LIST_SIZE = 10;

/**
 * Demo balance (in stroops) used for the amount range proof until the real
 * Horizon balance is wired in (Phase 4/7). 10,000,000 XLM.
 */
const DEMO_BALANCE_STROOPS = 10_000_000n * 10_000_000n;

/** Amounts are proven in stroops (1 XLM = 10^7 stroops) as u64 field inputs. */
function toStroops(amount: number): bigint {
  return BigInt(Math.round(amount * 1e7));
}

// The prover and circuit artifacts are heavy (WASM + ACIR), so they are
// loaded lazily on first proof rather than in the initial bundle.
async function loadProver() {
  return import('../lib/zkProver');
}

async function buildSanctionsList(extraSanctioned?: string): Promise<string[]> {
  const { hashToField } = await loadProver();
  const flagged = extraSanctioned
    ? [...SANCTIONED_ADDRESSES, extraSanctioned]
    : SANCTIONED_ADDRESSES;
  const hashes = await Promise.all(flagged.map(hashToField));
  // Pad to the circuit's fixed list size with sentinel values that no real
  // address hash can collide with (hashToField output is always 31 bytes).
  const fillers = Array.from(
    { length: SANCTIONS_LIST_SIZE - hashes.length },
    (_, i) => '0x' + (BigInt(0xdead0000) + BigInt(i)).toString(16)
  );
  return [...hashes, ...fillers];
}

/**
 * ZK Proof & Stellar Integration Service.
 * Proof generation and local verification are REAL (Noir + UltraHonk in the
 * browser). On-chain submission is still simulated until the Soroban verifier
 * contract lands (Phase 3/4).
 */
export const stellarZkService = {
  /**
   * Generates a real zero-knowledge compliance proof: the recipient's hash is
   * proven to differ from every entry of the public sanctions list, without
   * revealing the recipient. Throws if the recipient is on the list — the
   * circuit constraint itself fails, no proof can be produced.
   */
  async generateComplianceProof(
    recipientAddress: string,
    onProgress: ProgressCallback,
    options?: { simulateFailure?: boolean }
  ): Promise<ProofResult> {
    onProgress('generating', 'Hashing recipient and proving non-membership of sanctions register...');
    const { generateProof, hashToField } = await loadProver();
    const { default: complianceCircuit } = await import('../circuits/compliance_circuit.json');

    // Demo triggers: addresses containing SANCTION (or the simulate-failure
    // toggle) are treated as present on the OFAC register.
    const isFlagged =
      options?.simulateFailure || recipientAddress.toUpperCase().includes('SANCTION');

    const recipient_hash = await hashToField(recipientAddress);
    const sanctions_list = await buildSanctionsList(isFlagged ? recipientAddress : undefined);

    try {
      const proof = await generateProof(complianceCircuit as never, {
        recipient_hash,
        sanctions_list,
      });
      onProgress('success', 'Compliance proof generated. Address not on the sanctions register.');
      return proof;
    } catch {
      onProgress('failed', 'Address flagged by OFAC SDN register. Transaction blocked.');
      throw new Error('Compliance verification failed: Sanctioned address match');
    }
  },

  /**
   * Generates a real zero-knowledge range proof: amount >= 1 stroop and
   * amount <= balance, with both amount and balance kept private.
   */
  async generateConfidentialAmountProof(
    amount: number,
    onProgress: ProgressCallback
  ): Promise<ProofResult> {
    onProgress('generating', 'Proving amount is within balance range without revealing values...');
    const { generateProof } = await loadProver();
    const { default: amountCircuit } = await import('../circuits/amount_circuit.json');

    try {
      const proof = await generateProof(amountCircuit as never, {
        amount: toStroops(amount).toString(),
        balance: DEMO_BALANCE_STROOPS.toString(),
        min_amount: '1',
      });
      onProgress('success', 'Amount proven to be within balance range and asset limits.');
      return proof;
    } catch {
      onProgress('failed', 'Insufficient assets or invalid amount.');
      throw new Error('Range proof generation failed: Invalid amount');
    }
  },

  /**
   * Verifies both proofs against their verification keys. Verification is
   * real but runs locally; submission to the Soroban verifier contract is
   * simulated until Phase 3/4.
   */
  async verifyOnStellar(
    complianceProof: ProofResult,
    amountProof: ProofResult,
    onProgress: ProgressCallback
  ): Promise<{ txHash: string; ledgerIndex: number }> {
    onProgress('generating', 'Verifying UltraHonk proofs against circuit verification keys...');
    const { verifyProofLocally } = await loadProver();
    const [{ default: complianceCircuit }, { default: amountCircuit }] = await Promise.all([
      import('../circuits/compliance_circuit.json'),
      import('../circuits/amount_circuit.json'),
    ]);

    const [complianceOk, amountOk] = await Promise.all([
      verifyProofLocally(complianceCircuit as never, complianceProof),
      verifyProofLocally(amountCircuit as never, amountProof),
    ]);

    if (!complianceOk || !amountOk) {
      onProgress('failed', 'Proof verification failed.');
      throw new Error('Proof verification failed');
    }

    onProgress(
      'success',
      `Proofs verified. VK hashes ${complianceProof.vkHash.slice(0, 10)}… / ${amountProof.vkHash.slice(0, 10)}…`
    );
    // Simulated on-chain result — replaced by a real Soroban contract call in Phase 3/4
    return {
      txHash: 'st_tx_0x' + Math.random().toString(16).substring(2, 18),
      ledgerIndex: Math.floor(Math.random() * 1000000) + 61000000,
    };
  },

  /**
   * Combined workflow for sending a confidential payment.
   */
  async submitConfidentialPayment(
    recipient: string,
    amount: number,
    memo: string,
    currency: string,
    onStepChange: (stepIndex: number, status: 'generating' | 'success' | 'failed', msg?: string) => void,
    options?: { simulateFailure?: boolean }
  ): Promise<PaymentTransaction> {
    try {
      // Step 1: Compliance
      const compProof = await this.generateComplianceProof(
        recipient,
        (status, msg) => onStepChange(0, status, msg),
        options
      );

      // Step 2: Amount Proof
      const amtProof = await this.generateConfidentialAmountProof(amount, (status, msg) => {
        onStepChange(1, status, msg);
      });

      // Step 3: Verification
      const stellarResult = await this.verifyOnStellar(compProof, amtProof, (status, msg) => {
        onStepChange(2, status, msg);
      });

      // Assemble final transaction with the real proof artifacts
      const newTx: PaymentTransaction = {
        id: 'tx_' + Math.floor(Math.random() * 100000000),
        timestamp: new Date().toISOString(),
        type: 'Sent',
        counterparty: recipient,
        counterpartyMasked: recipient.slice(0, 4) + '...' + recipient.slice(-4),
        amount: amount,
        amountMasked: '••••••••••',
        currency: currency,
        complianceStatus: 'Compliant',
        proofVerified: true,
        zkProofHash: compProof.proofHex.slice(0, 34),
        stellarTxHash: stellarResult.txHash,
        isPrivate: true,
        memo: memo || 'Institutional transfer'
      };

      return newTx;
    } catch (error) {
      console.error('Confidential payment failed:', error);
      throw error;
    }
  },

  /**
   * Simulates toggle of selective disclosure.
   */
  async setAuditorAccess(auditorId: string, grant: boolean): Promise<boolean> {
    console.log(`Setting access for ${auditorId} to ${grant}`);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return grant;
  }
};
