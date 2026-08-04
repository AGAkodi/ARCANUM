/**
 * On-chain deployment config.
 *
 * TO GO LIVE ON MAINNET: deploy the contracts to mainnet, fill in the three
 * `mainnet` addresses below, then flip ACTIVE_NETWORK to 'mainnet' (or set
 * NEXT_PUBLIC_STELLAR_NETWORK=mainnet). Nothing else in the app needs to change —
 * every consumer reads endpoints and addresses from CONTRACTS.
 *
 * The verifier holds the three circuit VKs; the pool holds the compliance +
 * amount VKs and custodies XLM. VKs are immutable — redeploy to change a circuit.
 */
export type StellarNetwork = 'testnet' | 'mainnet';

interface NetworkConfig {
  /** ZK payment verifier contract id */
  verifier: string;
  /** Shielded pool (`arcanum_pool`) contract id — '' until deployed */
  pool: string;
  /** Native XLM Stellar Asset Contract id */
  nativeToken: string;
  networkPassphrase: string;
  sorobanRpcUrl: string;
  horizonUrl: string;
  /** stellar.expert explorer base for this network */
  explorerBase: string;
}

const NETWORKS: Record<StellarNetwork, NetworkConfig> = {
  testnet: {
    verifier: 'CAHC6LH4MWQXFSZ7Z4UNY3ZCHGU4III6SKA5YKKXMTIMARYIO72PMCXV',
    pool: 'CCC3C2GXO7F57LWXBDXNE423WUC2ZJBRPMZ2O2Y6WVEVJZQ676MIE27B',
    nativeToken: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    networkPassphrase: 'Test SDF Network ; September 2015',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    explorerBase: 'https://stellar.expert/explorer/testnet',
  },
  mainnet: {
    // TODO(mainnet): set after `bash scripts/deploy-pool.sh` (with SOURCE/NETWORK
    // pointed at mainnet) and the verifier redeploy. Leave '' until then.
    verifier: '',
    pool: '',
    // Native XLM SAC on mainnet. Verify with:
    //   stellar contract id asset --asset native --network mainnet
    nativeToken: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    // Public Soroban RPC — swap for your own provider in production.
    sorobanRpcUrl: 'https://mainnet.sorobanrpc.com',
    horizonUrl: 'https://horizon.stellar.org',
    explorerBase: 'https://stellar.expert/explorer/public',
  },
};

/** Flip this (or set NEXT_PUBLIC_STELLAR_NETWORK) to switch networks. */
export const ACTIVE_NETWORK: StellarNetwork =
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK as StellarNetwork) === 'mainnet'
    ? 'mainnet'
    : 'testnet';

const active = NETWORKS[ACTIVE_NETWORK];

export const CONTRACTS = {
  network: ACTIVE_NETWORK,
  verifier: active.verifier,
  pool: active.pool,
  nativeToken: active.nativeToken,
  networkPassphrase: active.networkPassphrase,
  sorobanRpcUrl: active.sorobanRpcUrl,
  horizonUrl: active.horizonUrl,
} as const;

/** True once the shielded pool contract id has been set for the active network. */
export function isPoolDeployed(): boolean {
  return CONTRACTS.pool.length > 0;
}

/** True once the verifier is set — guards mainnet before its contracts exist. */
export function isVerifierDeployed(): boolean {
  return CONTRACTS.verifier.length > 0;
}

export function explorerTxUrl(txHash: string): string {
  return `${active.explorerBase}/tx/${txHash}`;
}

export function explorerContractUrl(contractId: string = CONTRACTS.verifier): string {
  return `${active.explorerBase}/contract/${contractId}`;
}
