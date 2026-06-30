import React from 'react';
import { Shield, Check, Lock, ShieldAlert } from 'lucide-react';

interface VerifiedBadgeProps {
  type: 'verified' | 'shielded' | 'granted' | 'solvency' | 'failed' | 'pending';
  text?: string;
  glow?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ type, text, glow = true }) => {
  let icon = <Check size={12} />;
  let badgeClass = 'card-indicator success';
  let defaultText = 'Verified';

  switch (type) {
    case 'verified':
      icon = <Check size={12} />;
      badgeClass = 'card-indicator success';
      defaultText = 'Verified';
      break;
    case 'shielded':
      icon = <Shield size={12} />;
      badgeClass = 'card-indicator success';
      defaultText = 'Shielded';
      break;
    case 'granted':
      icon = <Lock size={12} />;
      badgeClass = 'card-indicator success';
      defaultText = 'Access Granted';
      break;
    case 'solvency':
      icon = <Check size={12} />;
      badgeClass = 'card-indicator success';
      defaultText = 'Solvency Verified';
      break;
    case 'failed':
      icon = <ShieldAlert size={12} />;
      badgeClass = 'badge-status failed';
      defaultText = 'Compliance Failed';
      break;
    case 'pending':
      icon = <span className="proof-loader" style={{ width: 10, height: 10, borderWidth: 1.5 }} />;
      badgeClass = 'badge-status pending';
      defaultText = 'Pending Proof';
      break;
  }

  const animationStyle = glow && type !== 'failed' && type !== 'pending'
    ? { animation: 'pulseGreenGlow 2s infinite' }
    : undefined;

  return (
    <span 
      className={badgeClass} 
      style={animationStyle}
    >
      {icon}
      <span>{text || defaultText}</span>
    </span>
  );
};
