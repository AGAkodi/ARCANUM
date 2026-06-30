import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { Shield, ShieldCheck, Lock, CheckCircle, Wallet, ArrowRight } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';

export const LandingPage: React.FC = () => {
  const { connectWallet } = useSession();
  const [connecting, setConnecting] = useState(false);

  const handleConnectClick = async () => {
    setConnecting(true);
    try {
      await connectWallet();
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="landing-page-container animate-fade-in">
      
      {/* Landing Header */}
      <header className="landing-header">
        <div className="logo-section">
          <Shield size={24} className="logo-icon" />
          <span className="logo-text">ZBank</span>
        </div>
        <button 
          className="btn-primary"
          style={{ padding: '8px 16px' }}
          disabled={connecting}
          onClick={handleConnectClick}
        >
          {connecting ? (
            <>
              <div className="proof-loader animate-spin-fast" style={{ width: 14, height: 14 }} />
              <span>Connecting...</span>
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
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                className="btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.95rem' }}
                disabled={connecting}
                onClick={handleConnectClick}
              >
                {connecting ? (
                  <>
                    <div className="proof-loader animate-spin-fast" style={{ width: 16, height: 16 }} />
                    <span>Connecting Wallet...</span>
                  </>
                ) : (
                  <>
                    <span>Connect Stellar Wallet</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
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
                      Shielded ✓
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

      {/* Marketing Features Highlights */}
      <section className="landing-features-section">
        <div className="landing-features-grid">
          
          <div className="feature-block">
            <div className="feature-icon-wrapper">
              <Shield size={20} />
            </div>
            <h3 className="feature-title">Confidential Payments</h3>
            <p className="feature-desc">
              Completely redact transaction balances and recipient addresses from public blockchain watchers, maintaining total commercial privacy.
            </p>
          </div>

          <div className="feature-block">
            <div className="feature-icon-wrapper">
              <CheckCircle size={20} />
            </div>
            <h3 className="feature-title">Zero-Knowledge Compliance</h3>
            <p className="feature-desc">
              Execute client KYC matching and OFAC SDN registry screenings locally before compiling ZK proofs, ensuring strict regulatory safety.
            </p>
          </div>

          <div className="feature-block">
            <div className="feature-icon-wrapper">
              <Lock size={20} />
            </div>
            <h3 className="feature-title">Selective Disclosure</h3>
            <p className="feature-desc">
              Issue specific viewing keys to regulators or internal compliance departments to decrypt specific records, satisfying tax and legal mandates.
            </p>
          </div>

          <div className="feature-block">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={20} />
            </div>
            <h3 className="feature-title">Provable Solvency</h3>
            <p className="feature-desc">
              Prove assets exceed liabilities directly to trading partners without publishing full treasury volumes or exposing liquid account lists.
            </p>
          </div>

        </div>
      </section>

      {/* Landing Footer */}
      <footer className="landing-footer">
        <span style={{ color: 'var(--color-text-muted)' }}>
          © 2026 ZBank Inc. Powered by Stellar Soroban contracts and zk-SNARKs.
        </span>
        <span style={{ color: 'var(--color-text-muted)' }}>
          Institutional Grade Blockchain Privacy
        </span>
      </footer>

    </div>
  );
};
export default LandingPage;
