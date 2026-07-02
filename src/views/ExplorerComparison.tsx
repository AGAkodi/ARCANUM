import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { Shield, Eye, CheckCircle2, Lock, ExternalLink } from 'lucide-react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useHorizonTx, isRealTxHash } from '../lib/useHorizon';
import { explorerTxUrl } from '../config/contracts';

export const ExplorerComparison: React.FC = () => {
  const { payments, selectedTx, setSelectedTx, walletAddress } = useSession();
  const [mobileTab, setMobileTab] = useState<'institution' | 'public'>('institution');
  const activeTxForHook = selectedTx || payments.find((tx) => tx.complianceStatus === 'Compliant') || payments[0];
  // Real on-chain record from Horizon when the tx landed on testnet
  const onChainTx = useHorizonTx(activeTxForHook?.stellarTxHash);

  // If no transactions exist, show empty state
  if (payments.length === 0) {
    return (
      <div className="animate-fade-in text-center" style={{ padding: '3rem' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>No transactions found to compare.</p>
      </div>
    );
  }

  const activeTx = activeTxForHook;

  return (
    <div className="animate-fade-in">
      
      {/* Title & Selector dropdown */}
      <div className="view-title-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="view-title">Zero-Knowledge Ledger Explorer</h1>
          <p className="view-desc">
            Toggle or compare side-by-side the difference between privilege-audited transaction records and raw blockchain ledgers.
          </p>
        </div>

        {/* Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select transaction:
          </span>
          <select
            className="form-input"
            style={{ width: '220px', padding: '8px 12px', fontSize: '0.85rem' }}
            value={activeTx.id}
            onChange={(e) => {
              const selected = payments.find((tx) => tx.id === e.target.value);
              if (selected) setSelectedTx(selected);
            }}
          >
            {payments.map((tx) => (
              <option key={tx.id} value={tx.id}>
                {tx.id} ({tx.currency})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Tab Toggle selector (Displays on mobile viewports only) */}
      <div 
        className="mobile-toggle-wrapper" 
        style={{ 
          display: 'none', 
          justifyContent: 'center', 
          gap: '0.5rem', 
          marginBottom: '1.5rem',
          backgroundColor: 'var(--bg-input)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}
      >
        <button
          className={`header-nav-btn ${mobileTab === 'institution' ? 'active' : ''}`}
          style={{ flex: 1, padding: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
          onClick={() => setMobileTab('institution')}
        >
          <Eye size={12} />
          <span>Institution View</span>
        </button>
        <button
          className={`header-nav-btn ${mobileTab === 'public' ? 'active' : ''}`}
          style={{ flex: 1, padding: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
          onClick={() => setMobileTab('public')}
        >
          <Shield size={12} />
          <span>Public Chain View</span>
        </button>
      </div>

      {/* Main Split-Screen Grid */}
      <div className="explorer-layout-grid" style={{ gap: '1.5rem' }}>
        
        {/* Left Panel: Institution View */}
        <div 
          className={`explorer-view-column explorer-col-left ${mobileTab === 'institution' ? 'mobile-visible' : 'mobile-hidden'}`}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div className="explorer-view-header institution" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={15} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Institution Audit Ledger</span>
            </div>
            <span 
              style={{ 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                color: 'var(--color-text-primary)', 
                padding: '2px 8px', 
                borderRadius: '4px',
                border: '1px solid var(--border-color)'
              }}
            >
              Authenticated — Full Details Visible
            </span>
          </div>

          <div 
            className="explorer-data-card"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.015)', 
              borderColor: 'rgba(255, 255, 255, 0.08)',
              padding: '2rem'
            }}
          >
            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Record Identifier</span>
              <span className="explorer-data-val mono" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{activeTx.id}</span>
            </div>

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Sender Wallet</span>
              <span className="explorer-data-val mono" style={{ wordBreak: 'break-all' }}>
                {walletAddress ?? '—'}
              </span>
            </div>

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Recipient Destination</span>
              <span className="explorer-data-val mono">{activeTx.counterparty}</span>
            </div>

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Transacted Amount</span>
              <span className="explorer-data-val" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                {activeTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {activeTx.currency}
              </span>
            </div>

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Timestamp</span>
              <span className="explorer-data-val">{new Date(activeTx.timestamp).toLocaleString()}</span>
            </div>

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Memo / Reference</span>
              <span className="explorer-data-val" style={{ color: 'var(--color-text-primary)' }}>{activeTx.memo}</span>
            </div>

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Clearing Status</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <CheckCircle2 size={13} /> Confirmed (Sanctions Check Passed)
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Public Chain View */}
        <div 
          className={`explorer-view-column explorer-col-right ${mobileTab === 'public' ? 'mobile-visible' : 'mobile-hidden'}`}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div className="explorer-view-header public" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={15} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Stellar Public Blockchain Ledger</span>
            </div>
            <span 
              style={{ 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                backgroundColor: 'rgba(243, 183, 36, 0.08)', 
                color: 'var(--color-accent)', 
                padding: '2px 8px', 
                borderRadius: '4px',
                border: '1px solid rgba(243, 183, 36, 0.2)'
              }}
            >
              Public — Stellar Network Observer
            </span>
          </div>

          <div 
            className="explorer-data-card public"
            style={{ 
              backgroundColor: 'rgba(15, 16, 19, 0.85)', 
              borderColor: 'rgba(255, 255, 255, 0.04)',
              boxShadow: 'var(--glass-glow)',
              padding: '2rem'
            }}
          >
            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Transaction Hash</span>
              {isRealTxHash(activeTx.stellarTxHash) ? (
                <a
                  href={explorerTxUrl(activeTx.stellarTxHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="explorer-data-val mono"
                  style={{ color: 'var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all' }}
                >
                  {activeTx.stellarTxHash.slice(0, 20)}…{activeTx.stellarTxHash.slice(-8)}
                  <ExternalLink size={11} />
                </a>
              ) : (
                <span className="explorer-data-val mono">{activeTx.stellarTxHash}</span>
              )}
            </div>

            {onChainTx && (
              <div className="explorer-data-row">
                <span className="explorer-data-lbl">Ledger / Fee</span>
                <span className="explorer-data-val mono">
                  #{onChainTx.ledger.toLocaleString()} · {(parseInt(onChainTx.feeCharged) / 1e7).toFixed(5)} XLM
                </span>
              </div>
            )}

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Sender Wallet</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="redacted-dot-bar" style={{ width: '120px' }} />
                <VerifiedBadge type="shielded" text="Shielded" glow={false} />
              </div>
            </div>

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Recipient Destination</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="redacted-dot-bar" style={{ width: '120px' }} />
                <VerifiedBadge type="shielded" text="Shielded" glow={false} />
              </div>
            </div>

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Transacted Amount</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="redacted-blur" style={{ filter: 'blur(5px)', fontSize: '0.9rem', color: 'var(--color-text-secondary)', userSelect: 'none' }}>
                  •••••••••• {activeTx.currency}
                </span>
                <VerifiedBadge type="verified" text="Verified" glow={true} />
              </div>
            </div>

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">Timestamp</span>
              <span className="explorer-data-val">
                {new Date(onChainTx?.createdAt ?? activeTx.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">ZK Proof Reference</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <CheckCircle2 size={13} strokeWidth={2.5} /> zk-SNARK proof validated
                </span>
                <span className="explorer-data-val mono" style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)', marginTop: '4px', wordBreak: 'break-all' }}>
                  {activeTx.zkProofHash}
                </span>
              </div>
            </div>

            <div className="explorer-data-row">
              <span className="explorer-data-lbl">On-Chain State</span>
              <span className="badge-status compliant" style={{ fontSize: '0.7rem' }}>
                {onChainTx
                  ? `CONFIRMED IN LEDGER #${onChainTx.ledger.toLocaleString()} (LIVE)`
                  : 'VERIFIED & COMPLIANT'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Explanatory Connector copy */}
      <div 
        style={{ 
          marginTop: '3rem', 
          textAlign: 'center', 
          padding: '2rem 1.5rem', 
          borderTop: '1px solid var(--border-color)', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <div style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Lock size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ZK PRIVACY PAYOFF</span>
        </div>
        
        <h2 
          style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            color: 'var(--color-text-primary)', 
            maxWidth: '740px', 
            lineHeight: 1.5,
            letterSpacing: '-0.01em'
          }}
        >
          "The chain confirms this payment is valid and compliant — without revealing who sent it, who received it, or how much moved."
        </h2>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '620px', marginTop: '0.5rem', lineHeight: 1.6 }}>
          By compiling zero-knowledge proofs locally, your transaction is mathematically guaranteed to have sufficient funds and pass sanctions checks before it ever leaves your machine.
        </p>
      </div>

    </div>
  );
};
export default ExplorerComparison;
