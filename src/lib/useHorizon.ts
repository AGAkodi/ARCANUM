'use client';

import { useEffect, useState } from 'react';
import { CONTRACTS } from '../config/contracts';

/** True for real 64-hex-char Stellar tx hashes (vs. legacy mock ids). */
export function isRealTxHash(hash: string | undefined | null): hash is string {
  return !!hash && /^[0-9a-f]{64}$/i.test(hash);
}

/** Live XLM balance of an account via Horizon. Null until loaded. */
export function useXlmBalance(walletAddress: string | null): string | null {
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setBalance(null);
      return;
    }
    let active = true;
    fetch(`${CONTRACTS.horizonUrl}/accounts/${walletAddress}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((account) => {
        if (!active || !account) return;
        const native = account.balances?.find(
          (b: { asset_type: string; balance: string }) => b.asset_type === 'native'
        );
        if (native) setBalance(native.balance);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [walletAddress]);

  return balance;
}

export interface HorizonTx {
  ledger: number;
  feeCharged: string;
  createdAt: string;
  successful: boolean;
}

/** Real on-chain transaction record via Horizon (null for mock/legacy ids). */
export function useHorizonTx(txHash: string | undefined | null): HorizonTx | null {
  const [tx, setTx] = useState<HorizonTx | null>(null);

  useEffect(() => {
    setTx(null);
    if (!isRealTxHash(txHash)) return;
    let active = true;
    fetch(`${CONTRACTS.horizonUrl}/transactions/${txHash}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((record) => {
        if (!active || !record) return;
        setTx({
          ledger: record.ledger,
          feeCharged: record.fee_charged,
          createdAt: record.created_at,
          successful: record.successful,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [txHash]);

  return tx;
}
