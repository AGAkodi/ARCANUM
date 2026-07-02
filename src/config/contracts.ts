/**
 * On-chain deployment config (Stellar testnet).
 *
 * The verifier contract holds the three circuit VKs (immutable, set at
 * deploy). Redeploying after a circuit change requires updating `verifier`.
 * Deployed 2026-07-02 from circuits built with nargo 1.0.0-beta.9 +
 * bb 0.87.0 (keccak oracle).
 */
export const CONTRACTS = {
  /** ARCANUM Verifier contract id */
  verifier: 'CAHC6LH4MWQXFSZ7Z4UNY3ZCHGU4III6SKA5YKKXMTIMARYIO72PMCXV',
  /** Native XLM Stellar Asset Contract on testnet */
  nativeToken: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  network: 'testnet',
  networkPassphrase: 'Test SDF Network ; September 2015',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
} as const;

export function explorerTxUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

export function explorerContractUrl(): string {
  return `https://stellar.expert/explorer/testnet/contract/${CONTRACTS.verifier}`;
}
