'use client';

import React from 'react';
import { 
  Users, 
  Briefcase, 
  HelpCircle, 
  RefreshCw, 
  UserCheck, 
  Layers 
} from 'lucide-react';

interface SupportCard {
  title: string;
  desc: string;
  icon: React.ReactNode;
  /** Real circuit exists (nargo tests pass) — badge reads "Circuit Ready" in accent. */
  ready?: boolean;
}

export const SupportingFeatureGrid: React.FC = () => {
  const cards: SupportCard[] = [
    {
      title: 'Private Payroll',
      desc: 'Process cross-border employee payments with amounts and identities shielded end-to-end.',
      icon: <Users size={18} />,
      ready: true
    },
    {
      title: 'Private Supplier Payments',
      desc: 'Hide invoice values and vendor relationships from public view while keeping payments verifiable.',
      icon: <Briefcase size={18} />
    },
    {
      title: 'Confidential Escrow',
      desc: 'Release funds only when zero-knowledge conditions are met, without exposing contract terms.',
      icon: <HelpCircle size={18} />
    },
    {
      title: 'Recurring Private Payments',
      desc: 'Automate subscription or recurring transfers with amounts and schedules fully hidden.',
      icon: <RefreshCw size={18} />
    },
    {
      title: 'Multi-Signature Approval Proof',
      desc: 'Prove required internal approvals were obtained without revealing who approved or workflow details.',
      icon: <UserCheck size={18} />
    },
    {
      title: 'Tokenized Asset Settlement',
      desc: 'Settle bonds, invoices, and real-world assets on-chain with full transaction privacy.',
      icon: <Layers size={18} />
    }
  ];

  return (
    <div className="supporting-features-section-container" style={{ margin: '6rem 0 4rem 0', borderTop: '1px solid var(--border-color)', paddingTop: '4rem' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          Also in ΛRCΛNUM
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '540px', margin: '0 auto' }}>
          An institutional-grade platform designed to support full compliance across all treasury transactions.
        </p>
      </div>

      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto'
        }}
        className="supporting-features-grid"
      >
        {cards.map((c, idx) => (
          <div 
            key={idx} 
            className="card-premium" 
            style={{ 
              padding: '1.75rem', 
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start',
              gap: '0.75rem',
              overflow: 'hidden'
            }}
          >
            {/* Status badge: accent "Circuit Ready" for cards with a real circuit, muted "Simulated" otherwise */}
            <span
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                fontSize: '0.6rem',
                fontWeight: 700,
                color: c.ready ? 'var(--color-accent)' : 'var(--color-text-muted)',
                backgroundColor: c.ready ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.04)',
                border: c.ready ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.05em'
              }}
            >
              {c.ready ? 'CIRCUIT READY' : 'SIMULATED'}
            </span>

            {/* Icon Wrapper */}
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {c.icon}
            </div>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
              {c.title}
            </h3>
            
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {c.desc}
            </p>

          </div>
        ))}
      </div>

    </div>
  );
};
export default SupportingFeatureGrid;