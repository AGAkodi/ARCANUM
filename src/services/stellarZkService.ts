import type { PaymentTransaction } from '../mocks/payments';
import type { ProofResult } from '../lib/zkProver';
import { CONTRACTS } from '../config/contracts';

export interface ProofGenerationStep {
  label: string;
  status: 'idle' | 'generating' | 'success' | 'failed';
  message?: string;
}

type ProgressCallback = (status: 'generating' | 'success' | 'failed', message?: string) => void;

export interface PaymentOptions {
  /** Demo toggle: force the recipient onto the sanctions register */
  simulateFailure?: boolean;
  /** Connected Freighter wallet (proof balance source + tx sender) */
  walletAddress?: string | null;
  /** Freighter's active network — on-chain submission requires testnet */
  network?: 'mainnet' | 'testnet';
}

/**
 * Demo sanctions register. In production this list is published by the
 * compliance authority; here it seeds the circuit's public sanctions_list.
 * The circuit takes exactly 10 entries — unused slots are filled with
 * reserved sentinel values no 31-byte address hash can collide with.
 */
const SANCTIONED_ADDRESSES = ['GBOFAC_SANCTIONED_ADDRESS_TEST_1234567890'];
const SANCTIONS_LIST_SIZE = 10;

/**
 * Fallback balance (in stroops) for the range proof when no wallet is
 * connected or Horizon is unreachable. 10,000,000 XLM.
 */
const FALLBACK_BALANCE_STROOPS = 10_000_000n * 10_000_000n;

/** Amounts are proven and transferred in stroops (1 XLM = 10^7 stroops). */
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
  const fillers = Array.from(
    { length: SANCTIONS_LIST_SIZE - hashes.length },
    (_, i) => '0x' + (BigInt(0xdead0000) + BigInt(i)).toString(16)
  );
  return [...hashes, ...fillers];
}

/** Real XLM balance (in stroops) of the connected wallet via Horizon. */
async function fetchBalanceStroops(walletAddress: string): Promise<bigint> {
  const res = await fetch(`${CONTRACTS.horizonUrl}/accounts/${walletAddress}`);
  if (!res.ok) throw new Error(`Horizon returned ${res.status}`);
  const account = await res.json();
  const native = account.balances?.find(
    (b: { asset_type: string; balance: string }) => b.asset_type === 'native'
  );
  if (!native) throw new Error('No native balance on account');
  return toStroops(parseFloat(native.balance));
}

/**
 * ZK Proof & Stellar Integration Service.
 * Proof generation is REAL (Noir + UltraHonk, keccak transcript, in the
 * browser) and verification is REAL and ON-CHAIN: the zbank_verifier Soroban
 * contract on testnet verifies both proofs and executes the transfer
 * atomically — if either proof fails, no funds move.
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
    options?: PaymentOptions
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
   * amount <= balance, with both amount and balance kept private. The balance
   * is the connected wallet's real XLM balance from Horizon.
   */
  async generateConfidentialAmountProof(
    amount: number,
    onProgress: ProgressCallback,
    options?: PaymentOptions
  ): Promise<ProofResult> {
    onProgress('generating', 'Proving amount is within balance range without revealing values...');
    const { generateProof } = await loadProver();
    const { default: amountCircuit } = await import('../circuits/amount_circuit.json');

    let balance = FALLBACK_BALANCE_STROOPS;
    if (options?.walletAddress) {
      try {
        balance = await fetchBalanceStroops(options.walletAddress);
      } catch (err) {
        console.warn('Horizon balance fetch failed, using fallback balance:', err);
      }
    }

    try {
      const proof = await generateProof(amountCircuit as never, {
        amount: toStroops(amount).toString(),
        balance: balance.toString(),
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
   * Submits both proofs to the zbank_verifier Soroban contract on testnet.
   * The contract verifies the UltraHonk proofs on-chain and, only if both
   * hold, transfers the amount (native XLM) from sender to recipient.
   * The user signs the transaction in the Freighter popup.
   */
  async verifyOnStellar(
    complianceProof: ProofResult,
    amountProof: ProofResult,
    payment: { sender: string; recipient: string; amount: number },
    onProgress: ProgressCallback
  ): Promise<{ txHash: string; ledgerIndex: number }> {
    onProgress('generating', 'Building Soroban transaction for on-chain proof verification...');

    const [{ publicInputsToBytes }, sdk, freighter] = await Promise.all([
      loadProver(),
      import('@stellar/stellar-sdk'),
      import('@stellar/freighter-api'),
    ]);
    const { Contract, TransactionBuilder, Address, nativeToScVal, BASE_FEE, rpc } = sdk;

    const server = new rpc.Server(CONTRACTS.sorobanRpcUrl);
    const account = await server.getAccount(payment.sender);

    const contract = new Contract(CONTRACTS.verifier);
    const operation = contract.call(
      'verify_payment',
      Address.fromString(payment.sender).toScVal(),
      Address.fromString(payment.recipient).toScVal(),
      Address.fromString(CONTRACTS.nativeToken).toScVal(),
      nativeToScVal(toStroops(payment.amount), { type: 'i128' }),
      nativeToScVal(publicInputsToBytes(complianceProof.publicInputs), { type: 'bytes' }),
      nativeToScVal(complianceProof.proof, { type: 'bytes' }),
      nativeToScVal(publicInputsToBytes(amountProof.publicInputs), { type: 'bytes' }),
      nativeToScVal(amountProof.proof, { type: 'bytes' })
    );

    const tx = new TransactionBuilder(account, {
      fee: (Number(BASE_FEE) * 10).toString(),
      networkPassphrase: CONTRACTS.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(120)
      .build();

    // Simulation attaches the auth entries and resource fees — and is also
    // where an invalid proof gets rejected before the user signs anything.
    const prepared = await server.prepareTransaction(tx);

    onProgress('generating', 'Awaiting signature in Freighter...');
    const signed = await freighter.signTransaction(prepared.toXDR(), {
      networkPassphrase: CONTRACTS.networkPassphrase,
      address: payment.sender,
    });
    if (signed.error || !signed.signedTxXdr) {
      onProgress('failed', signed.error?.message || 'Signature rejected in Freighter.');
      throw new Error(signed.error?.message || 'Transaction signing rejected');
    }

    onProgress('generating', 'Submitting to Stellar testnet and verifying proofs on-chain...');
    const sendResponse = await server.sendTransaction(
      TransactionBuilder.fromXDR(signed.signedTxXdr, CONTRACTS.networkPassphrase)
    );
    if (sendResponse.status === 'ERROR') {
      onProgress('failed', 'Transaction rejected by the network.');
      throw new Error('Transaction submission failed');
    }

    // Poll until the transaction lands in a ledger
    const deadline = Date.now() + 60_000;
    for (;;) {
      const result = await server.getTransaction(sendResponse.hash);
      if (result.status === 'SUCCESS') {
        onProgress(
          'success',
          `Proofs verified on-chain by ${CONTRACTS.verifier.slice(0, 8)}…. Funds transferred.`
        );
        return { txHash: sendResponse.hash, ledgerIndex: result.ledger };
      }
      if (result.status === 'FAILED') {
        onProgress('failed', 'On-chain proof verification failed. Transaction reverted — no funds moved.');
        throw new Error('On-chain verification failed');
      }
      if (Date.now() > deadline) {
        onProgress('failed', 'Timed out waiting for transaction confirmation.');
        throw new Error('Confirmation timeout');
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  },

  /**
   * Combined workflow for sending a confidential payment: two ZK proofs in
   * the browser, then one Soroban transaction that verifies both on-chain and
   * settles the transfer.
   */
  async submitConfidentialPayment(
    recipient: string,
    amount: number,
    memo: string,
    currency: string,
    onStepChange: (stepIndex: number, status: 'generating' | 'success' | 'failed', msg?: string) => void,
    options?: PaymentOptions
  ): Promise<PaymentTransaction> {
    try {
      if (!options?.walletAddress) {
        onStepChange(0, 'failed', 'No wallet connected.');
        throw new Error('Connect a Freighter wallet before sending');
      }
      if (options.network && options.network !== 'testnet') {
        onStepChange(0, 'failed', 'Switch Freighter to TESTNET — the verifier contract lives there.');
        throw new Error('Wrong network: switch Freighter to testnet');
      }

      // Step 1: Compliance
      const compProof = await this.generateComplianceProof(
        recipient,
        (status, msg) => onStepChange(0, status, msg),
        options
      );

      // Step 2: Amount Proof
      const amtProof = await this.generateConfidentialAmountProof(
        amount,
        (status, msg) => onStepChange(1, status, msg),
        options
      );

      // Step 3: On-chain verification + settlement
      const stellarResult = await this.verifyOnStellar(
        compProof,
        amtProof,
        { sender: options.walletAddress, recipient, amount },
        (status, msg) => onStepChange(2, status, msg)
      );

      // Assemble final transaction with the real proof artifacts
      const newTx: PaymentTransaction = {
        id: 'tx_' + stellarResult.txHash.slice(0, 8),
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
   * Simulates toggle of selective disclosure (real crypto lands in Phase 6).
   */
  async setAuditorAccess(auditorId: string, grant: boolean): Promise<boolean> {
    console.log(`Setting access for ${auditorId} to ${grant}`);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return grant;
  }
};
