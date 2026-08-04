'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, ShieldCheck, ExternalLink } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { stellarZkService } from '../services/stellarZkService';
import { isPoolDeployed, CONTRACTS, explorerContractUrl } from '../config/contracts';

type Busy = null | 'deposit' | 'withdraw' | 'refresh';
type Status = { kind: 'idle' | 'progress' | 'success' | 'error'; msg: string };

/**
 * Shielded pool controls: deposit XLM into the pool, withdraw back to the
 * wallet, and view the internal shielded balance. Deposits and withdrawals are
 * visible on the ledger by design; transfers between pool balances (done in the
 * Send flow) reveal no amount. Renders only when the pool is deployed.
 */
export const ShieldedPoolPanel: React.FC = () => {
  const { walletAddress } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle', msg: '' });

  const refresh = useCallback(async () => {
    if (!walletAddress) return;
    setBusy('refresh');
    try {
      setBalance(await stellarZkService.getShieldedBalance(walletAddress));
    } catch {
      setBalance(null);
    } finally {
      setBusy(null);
    }
  }, [walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onProgress = (s: 'generating' | 'success' | 'failed', m?: string) =>
    setStatus({ kind: s === 'failed' ? 'error' : s === 'success' ? 'success' : 'progress', msg: m || '' });

  const run = async (kind: 'deposit' | 'withdraw') => {
    const raw = kind === 'deposit' ? depositAmt : withdrawAmt;
    const amt = parseFloat(raw);
    if (!walletAddress || !amt || amt <= 0) return;
    setBusy(kind);
    try {
      if (kind === 'deposit') {
        await stellarZkService.depositToPool(walletAddress, amt, onProgress);
        setDepositAmt('');
      } else {
        await stellarZkService.withdrawFromPool(walletAddress, amt, walletAddress, onProgress);
        setWithdrawAmt('');
      }
      await refresh();
    } catch (e) {
      setStatus({ kind: 'error', msg: e instanceof Error ? e.message : 'Transaction failed' });
    } finally {
      setBusy(null);
    }
  };

  if (!isPoolDeployed()) return null;

  const rowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' };
  const inputStyle: React.CSSProperties = {
    flex: '1 1 160px',
    minWidth: '140px',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--color-text-primary)',
    fontSize: '0.9rem',
  };
  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--color-text-primary)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  return (
    <div className="card-premium accented" style={{ marginBottom: '3rem', padding: '1.75rem' }}>
      <div className="card-header-flex">
        <span className="card-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} style={{ color: 'var(--color-accent)' }} /> Shielded Pool
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a
            href={explorerContractUrl(CONTRACTS.pool)}
            target="_blank"
            rel="noopener noreferrer"
            title="View pool contract on stellar.expert"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}
          >
            contract <ExternalLink size={12} />
          </a>
          <button
            onClick={() => void refresh()}
            disabled={busy !== null}
            aria-label="Refresh shielded balance"
            style={{ ...btnStyle, padding: '0.4rem 0.6rem' }}
          >
            <RefreshCw size={14} className={busy === 'refresh' ? 'animate-spin' : undefined} />
          </button>
        </div>
      </div>

      <div style={{ margin: '1rem 0' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Your shielded balance
        </span>
        <div className="card-val" style={{ fontSize: '2.25rem', margin: '0.25rem 0 0' }}>
          {walletAddress
            ? balance === null
              ? '—'
              : `${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} XLM`
            : 'Connect wallet'}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
          Deposits and withdrawals are visible on-chain. Sending between pool balances reveals no amount — only a proof hash.
        </p>
      </div>

      <div style={rowStyle}>
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Amount to deposit"
          value={depositAmt}
          onChange={(e) => setDepositAmt(e.target.value)}
          disabled={!walletAddress || busy !== null}
          style={inputStyle}
        />
        <button onClick={() => void run('deposit')} disabled={!walletAddress || busy !== null} style={btnStyle}>
          <ArrowDownToLine size={15} /> {busy === 'deposit' ? 'Depositing…' : 'Deposit'}
        </button>
      </div>

      <div style={rowStyle}>
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Amount to withdraw"
          value={withdrawAmt}
          onChange={(e) => setWithdrawAmt(e.target.value)}
          disabled={!walletAddress || busy !== null}
          style={inputStyle}
        />
        <button onClick={() => void run('withdraw')} disabled={!walletAddress || busy !== null} style={btnStyle}>
          <ArrowUpFromLine size={15} /> {busy === 'withdraw' ? 'Withdrawing…' : 'Withdraw'}
        </button>
      </div>

      {status.kind !== 'idle' && (
        <p
          style={{
            fontSize: '0.8rem',
            marginTop: '0.9rem',
            color:
              status.kind === 'error'
                ? 'var(--color-danger, #e5484d)'
                : status.kind === 'success'
                  ? 'var(--color-success, #30a46c)'
                  : 'var(--color-text-secondary)',
          }}
        >
          {status.msg}
        </p>
      )}
    </div>
  );
};

export default ShieldedPoolPanel;
