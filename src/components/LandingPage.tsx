'use client';

import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { Lock, Wallet, ArrowRight, ExternalLink, AlertTriangle } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { FeatureBreakdown } from './FeatureBreakdown';
import { SupportingFeatureGrid } from './SupportingFeatureGrid';
import { LiveOnChainStrip } from './LiveOnChainStrip';
import { PageFooter } from './PageFooter';

export const LandingPage: React.FC = () => {
  const { connectWallet, freighterInstalled, connectError } = useSession();
  const [connecting, setConnecting] = useState(false);

  const handleConnectClick = async () => {
    setConnecting(true);
    try {
      await connectWallet();
    } catch (err) {
      console.error(err);
      if (freighterInstalled === false) {
        window.open('https://www.freighter.app/', '_blank', 'noopener,noreferrer');
      }
    } finally {
      setConnecting(false);
    }
  };

  const isChecking = freighterInstalled === null;
  const notInstalled = freighterInstalled === false;

  const landingFeatures = [
    {
      id: 'confidential_payments',
      name: 'Confidential Payments',
      subtext: 'Transact without exposing your book',
      body: 'Every payment your institution makes is visible to anyone monitoring your wallet address on a public blockchain. ΛRCΛNUM eliminates that exposure. Transaction amounts and counterparty addresses are cryptographically hidden before hitting the chain — replaced with a zero-knowledge proof that confirms the payment is valid and funds exist, without revealing a single number. What the network sees: verified. What it knows: nothing.',
      visualType: 'payments' as const
    },
    {
      id: 'zk_compliance',
      name: 'Zero Knowledge Compliance',
      subtext: 'Compliant by proof, not disclosure',
      body: "Regulatory compliance shouldn't require handing over raw identity data. ΛRCΛNUM runs KYC matching and OFAC SDN sanctions screening locally, off-chain, before a transaction is submitted. The result is a cryptographic compliance proof — a mathematical guarantee that all checks passed — submitted on-chain in place of the underlying data. Regulators and counterparties receive confirmation of compliance, not access to your client records.",
      visualType: 'compliance' as const
    },
    {
      id: 'selective_disclosure',
      name: 'Selective Disclosure',
      subtext: 'Privacy by default',
      body: "Not everyone should see everything, but some people need to see something. ΛRCΛNUM's selective disclosure system lets institutions issue specific viewing permissions to auditors, regulators, or internal finance teams — granting access to decrypt and view particular transaction records without opening up the full ledger. Everyone else sees zero. Permissions can be granted and revoked at any time from the Compliance Panel.",
      visualType: 'disclosure' as const
    },
    {
      id: 'provable_solvency',
      name: 'Provable Solvency',
      subtext: 'Prove your position without revealing it',
      body: "Prove your financial stability without exposing actual treasury holdings. ΛRCΛNUM generates a zero-knowledge range proof validating that your assets exceed liabilities, satisfying auditing requirements while keeping specific balances, counterparty profiles, and vault structures entirely hidden.",
      visualType: 'solvency' as const
    }
  ];

  return (
    <div className="landing-page-container animate-fade-in">
      
      {/* Landing Header */}
      <header className="landing-header">
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="ΛRCΛNUM Logo" style={{ height: '24px', width: 'auto', filter: 'drop-shadow(0 0 8px rgba(243, 183, 36, 0.35))' }} />
          <span className="logo-text" style={{ fontStyle: 'normal', letterSpacing: '0.15em' }}>ΛRCΛNUM</span>
        </div>
        <button
          className="btn-primary"
          style={{ padding: '6px 11px', fontSize: '0.65rem' }}
          disabled={connecting || isChecking}
          onClick={handleConnectClick}
        >
          {connecting ? (
            <>
              <div className="proof-loader animate-spin-fast" style={{ width: 14, height: 14 }} />
              <span>Connecting...</span>
            </>
          ) : notInstalled ? (
            <>
              <ExternalLink size={14} />
              <span>Install Freighter</span>
            </>
          ) : (
            <>
              <Wallet size={15} />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-grid">
          
          {/* Left Column: Hero Text */}
          <div className="landing-hero-text">
            <div className="landing-badge">
              <span className="landing-badge-dot"></span>
              ZK-STELLAR PLATFORM
            </div>
            <h1 className="landing-title">
              Confidential Institutional Payments on Stellar
            </h1>
            <p className="landing-subtitle">
              Transact securely on a public blockchain with absolute financial privacy. Enforce local compliance controls, prove treasury solvency, and manage audit disclosures using zero-knowledge proofs.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  className="btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.75rem' }}
                  disabled={connecting || isChecking}
                  onClick={handleConnectClick}
                >
                  {connecting ? (
                    <>
                      <div className="proof-loader animate-spin-fast" style={{ width: 16, height: 16 }} />
                      <span>Connecting Wallet...</span>
                    </>
                  ) : notInstalled ? (
                    <>
                      <ExternalLink size={16} />
                      <span>Install Freighter Extension</span>
                    </>
                  ) : (
                    <>
                      <Wallet size={16} />
                      <span>Connect Stellar Wallet</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

              {/* Freighter not installed notice */}
              {notInstalled && (
                <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: 'rgba(255, 152, 0, 0.06)', border: '1px solid rgba(255, 152, 0, 0.2)', borderRadius: '8px', maxWidth: '480px' }}>
                  <AlertTriangle size={14} style={{ color: '#ff9800', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    Freighter wallet extension is required. Install it from{' '}
                    <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#ff9800', textDecoration: 'underline' }}>
                      freighter.app
                    </a>
                    , then refresh this page.
                  </p>
                </div>
              )}

              {/* Connection error notice */}
              {connectError && !notInstalled && (
                <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: 'var(--color-error-dim)', border: '1px solid rgba(255, 23, 68, 0.2)', borderRadius: '8px', maxWidth: '480px' }}>
                  <AlertTriangle size={14} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {connectError}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Visual Preview Card (Redacted styling) */}
          <div className="landing-hero-preview">
            <div className="card-premium accented landing-preview-card">
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '0.05em' }}>
                  SIMULATED LEDGER ENTRY
                </span>
                <span className="badge-proof" style={{ fontSize: '0.65rem' }}>
                  zk_snark_proof_0x8f3c...
                </span>
              </div>

              {/* Redacted Balance Element */}
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Shielded Treasury Assets
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.25rem' }}>
                  <span className="card-val" style={{ fontSize: '1.75rem', margin: 0, letterSpacing: '-0.02em' }}>
                    <span className="redacted-blur" style={{ filter: 'blur(4px)' }}>$142,590,480.00</span>
                  </span>
                  <VerifiedBadge type="solvency" text="Solvency Verified" glow={false} />
                </div>
              </div>

              {/* Redacted Transactions Table Row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Destination Address</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Amount (Redacted)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>GB...4ZK9</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="redacted-dot-bar" style={{ width: '60px' }} />
                    <span className="redacted-status" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>
                      Shielded
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={12} style={{ color: 'var(--color-accent)' }} />
                <span>Balances are validated cryptographically without exposing quantities.</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Live on-chain trust strip — real deployed contracts + verified privacy */}
      <div className="landing-sub-section" style={{ marginTop: '1rem' }}>
        <LiveOnChainStrip />
      </div>

      {/* Alternating Feature Explanations */}
      <div className="landing-sub-section">
        <FeatureBreakdown features={landingFeatures} />
      </div>

      {/* Supporting Grid */}
      <div className="landing-sub-section">
        <SupportingFeatureGrid />
      </div>

      {/* Reusable Brand Footer */}
      <PageFooter onNavClick={handleConnectClick} />

    </div>
  );
};
export default LandingPage;
