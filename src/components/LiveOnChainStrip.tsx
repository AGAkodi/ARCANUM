'use client';

import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { CONTRACTS, explorerContractUrl, isPoolDeployed } from '../config/contracts';

const short = (id: string) => `${id.slice(0, 6)}…${id.slice(-4)}`;

/**
 * Public trust strip: surfaces that ARCANUM is really deployed and that the
 * privacy property was verified on-chain — with live links to the contracts on
 * stellar.expert. Reads addresses from CONTRACTS, so it stays correct across
 * network switches (and hides the pool chip until the pool is deployed).
 */
export const LiveOnChainStrip: React.FC = () => {
  const chips = [
    { label: 'ZK Verifier', id: CONTRACTS.verifier },
    ...(isPoolDeployed() ? [{ label: 'Shielded Pool', id: CONTRACTS.pool }] : []),
  ].filter((c) => c.id);

  const networkLabel = CONTRACTS.network === 'mainnet' ? 'Stellar Mainnet' : 'Stellar Testnet';

  return (
    <section
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.25rem 1.5rem',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        background: 'rgba(212,175,55,0.03)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '260px', flex: '1 1 300px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            border: '1px solid var(--color-accent)',
            background: 'rgba(212,175,55,0.10)',
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-accent)' }}>
            LIVE ON {networkLabel.toUpperCase()}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.45, marginTop: '2px' }}>
            Shielded transfers verified on-chain — no amount, sender, or recipient on the public ledger.
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px', letterSpacing: '0.02em' }}>
            cargo&nbsp;test&nbsp;4/4 · nargo&nbsp;test&nbsp;3/3 · UltraHonk proofs verified
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', flex: '0 1 auto' }}>
        {chips.map((c) => (
          <a
            key={c.label}
            href={explorerContractUrl(c.id)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.5rem 0.75rem',
              borderRadius: '9px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-input)',
              textDecoration: 'none',
              color: 'var(--color-text-primary)',
            }}
          >
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {c.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-accent)' }}>
              {short(c.id)}
            </span>
            <ExternalLink size={13} style={{ color: 'var(--color-text-muted)' }} />
          </a>
        ))}
      </div>
    </section>
  );
};

export default LiveOnChainStrip;
