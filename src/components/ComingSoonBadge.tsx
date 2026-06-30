import React from 'react';
import { EyeOff } from 'lucide-react';

interface ComingSoonBadgeProps {
  label?: string;
}

export const ComingSoonBadge: React.FC<ComingSoonBadgeProps> = ({ label = 'Simulated' }) => {
  return (
    <span className="coming-soon-badge">
      <EyeOff size={10} style={{ marginRight: 3, verticalAlign: 'middle', display: 'inline-block' }} />
      <span>{label}</span>
    </span>
  );
};
