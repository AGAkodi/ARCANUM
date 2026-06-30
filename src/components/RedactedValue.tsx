import React, { useState } from 'react';
import { VerifiedBadge } from './VerifiedBadge';
import { Eye, EyeOff } from 'lucide-react';

interface RedactedValueProps {
  value: string;
  type?: 'blur' | 'dotted';
  badgeText?: string;
  isPrivate?: boolean;
  allowReveal?: boolean;
  tooltipText?: string;
}

export const RedactedValue: React.FC<RedactedValueProps> = ({
  value,
  type = 'blur',
  badgeText = 'Shielded',
  isPrivate = true,
  allowReveal = true,
  tooltipText = 'Zero-Knowledge Proof Verified'
}) => {
  const [revealed, setRevealed] = useState(false);

  if (!isPrivate) {
    return <span>{value}</span>;
  }

  const handleToggle = (e: React.MouseEvent) => {
    if (!allowReveal) return;
    e.stopPropagation();
    setRevealed(!revealed);
  };

  return (
    <div className="redacted-wrapper" title={tooltipText}>
      {revealed ? (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9em' }}>{value}</span>
      ) : type === 'blur' ? (
        <span className="redacted-blur">{value}</span>
      ) : (
        <span className="redacted-dot-bar" />
      )}
      
      <VerifiedBadge type="shielded" text={badgeText} glow={false} />
      
      {allowReveal && (
        <button
          onClick={handleToggle}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '2px',
            display: 'inline-flex',
            alignItems: 'center',
            marginLeft: '2px',
            transition: 'color 0.2s'
          }}
          title={revealed ? "Redact details" : "Simulate authorized reveal"}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          {revealed ? <EyeOff size={11} /> : <Eye size={11} />}
        </button>
      )}
    </div>
  );
};
