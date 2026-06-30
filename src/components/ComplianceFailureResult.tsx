import React from 'react';
import { ShieldAlert, Lock } from 'lucide-react';

interface ComplianceFailureResultProps {
  reasonCode: string;
  recipient: string;
  amount: number;
  currency: string;
  onTryAgain: () => void;
  onReviewCompliance: () => void;
}

export const ComplianceFailureResult: React.FC<ComplianceFailureResultProps> = ({
  reasonCode,
  recipient,
  amount,
  currency,
  onTryAgain,
  onReviewCompliance
}) => {
  // Map compliance error codes to human-readable institutional descriptions
  const getReasonMessage = (code: string) => {
    switch (code) {
      case 'sanctioned':
        return 'Recipient address did not pass sanctions screening (OFAC SDN watchlist match).';
      case 'kyc_incomplete':
        return 'Recipient onboarding credentials are incomplete or corporate KYC is expired.';
      case 'limit_exceeded':
        return 'Transfer amount exceeds single-transaction compliance limits (Range Proof failed).';
      default:
        return 'Transaction blocked by institutional compliance rules (OFAC/KYC screening fail).';
    }
  };

  const truncatedRecipient = recipient 
    ? recipient.slice(0, 8) + '...' + recipient.slice(-8)
    : 'Unknown Address';

  return (
    <div 
      className="result-box failed animate-fade-in"
      style={{
        border: '1px solid rgba(255, 23, 68, 0.25)',
        boxShadow: '0 12px 40px 0 rgba(255, 23, 68, 0.05)',
        backgroundColor: 'var(--bg-card)',
        padding: '2.5rem',
        borderRadius: '12px',
        maxWidth: '640px',
        margin: '2rem auto 0 auto',
        textAlign: 'center'
      }}
    >
      {/* Blocked icon */}
      <div 
        className="result-icon-wrapper failed"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-error-dim)',
          color: 'var(--color-error)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 23, 68, 0.2)',
          boxShadow: '0 0 16px rgba(255, 23, 68, 0.15)'
        }}
      >
        <ShieldAlert size={28} />
      </div>

      <h2 
        className="result-title" 
        style={{ 
          fontSize: '1.35rem', 
          fontWeight: 700, 
          color: 'var(--color-text-primary)',
          marginBottom: '0.75rem',
          letterSpacing: '-0.01em'
        }}
      >
        Compliance Check Failed — Payment Blocked
      </h2>
      
      <p 
        className="result-desc" 
        style={{ 
          fontSize: '0.925rem', 
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
          marginBottom: '2rem'
        }}
      >
        This transaction did not pass required compliance verification. No assets were moved from your treasury balance.
      </p>

      {/* Reason Detail Box */}
      <div 
        className="result-details-card" 
        style={{ 
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderColor: 'rgba(255, 23, 68, 0.15)',
          borderRadius: '8px',
          padding: '1.25rem',
          textAlign: 'left',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Compliance Status</span>
          <span style={{ color: 'var(--color-error)', fontWeight: 700, letterSpacing: '0.05em' }}>BLOCKED</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Screening Logic</span>
          <span style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{getReasonMessage(reasonCode)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Recipient Destination</span>
          <span style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{truncatedRecipient}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Attempted Transfer</span>
          <span style={{ color: 'var(--color-text-primary)' }}>{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
        </div>
      </div>

      {/* Guidance explainer */}
      <div 
        style={{ 
          borderTop: '1px solid var(--border-color)', 
          paddingTop: '1.25rem', 
          textAlign: 'left', 
          fontSize: '0.825rem', 
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          display: 'flex',
          gap: '8px'
        }}
      >
        <Lock size={14} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: '2px' }} />
        <span>
          Compliance checks are processed locally before ZK proofs compile. If a sanctions screening fails, the proof builder immediately aborts execution, ensuring blocked keys are never validated on-chain.
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
        <button
          className="btn-secondary"
          style={{ flex: 1 }}
          onClick={onTryAgain}
        >
          Try Another Payment
        </button>
        <button
          className="btn-primary"
          style={{ 
            flex: 1, 
            backgroundColor: 'var(--color-accent-dim)', 
            color: 'var(--color-accent)', 
            border: '1px solid rgba(243, 183, 36, 0.3)',
            boxShadow: 'none'
          }}
          onClick={onReviewCompliance}
        >
          Review Compliance Details
        </button>
      </div>

    </div>
  );
};
export default ComplianceFailureResult;
