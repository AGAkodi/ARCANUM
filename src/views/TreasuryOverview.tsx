import React from 'react';
import { mockTreasury, mockVolumeHistory } from '../mocks/treasury';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { RedactedValue } from '../components/RedactedValue';
import { ComingSoonBadge } from '../components/ComingSoonBadge';
import { 
  Briefcase, 
  Layers, 
  Calendar, 
  Users, 
  FileCheck, 
  FileSpreadsheet, 
  TrendingUp,
  Cpu
} from 'lucide-react';

export const TreasuryOverview: React.FC = () => {
  // Find max volume to calculate percentage heights for chart columns
  const maxVolume = Math.max(...mockVolumeHistory.map(d => d.paymentCount));

  return (
    <div className="animate-fade-in">
      <div className="view-title-block">
        <h1 className="view-title">Shielded Treasury & Advanced Modules</h1>
        <p className="view-desc">
          Monitor your corporate liquidity levels and configure private settlement pipelines. Treasury solvency remains provable without revealing absolute holdings.
        </p>
      </div>

      {/* Solvency & Balance Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '3rem' }}>
        
        <div className="card-premium accented" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header-flex">
              <span className="card-label">Corporate Solvency Verification</span>
              <VerifiedBadge type="solvency" text="Assets > Liabilities Verified ✓" />
            </div>
            <div style={{ margin: '1rem 0' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SHIELDED TREASURY BALANCE
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginTop: '0.5rem' }}>
                <span className="card-val" style={{ fontSize: '2.5rem', margin: 0 }}>
                  <RedactedValue 
                    value={mockTreasury.totalAssetsRedacted} 
                    type="blur" 
                    badgeText="Assets Shielded" 
                    allowReveal={true} 
                  />
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>USDX Pool</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase' }}>Liabilities Proof Claim</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                Verified &lt; Assets
                <VerifiedBadge type="verified" text="Shielded" glow={false} />
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase' }}>Public Proof Reference</span>
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', display: 'block', marginTop: '4px', wordBreak: 'break-all' }}>
                {mockTreasury.proofHash}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Activity Sparkline/Chart Card */}
        <div className="card-premium">
          <div className="card-header-flex">
            <div>
              <span className="card-label">Daily Transfer Frequency</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2px', color: 'var(--color-text-primary)' }}>Volume Metrics Only</h3>
            </div>
            <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
              <TrendingUp size={14} />
              <span>+18% Vol</span>
            </div>
          </div>

          {/* Core Interactive Bar Chart */}
          <div className="chart-container-premium">
            {mockVolumeHistory.map((h, idx) => {
              const percentage = (h.paymentCount / maxVolume) * 100;
              return (
                <div key={idx} className="chart-bar-col">
                  {/* Tooltip */}
                  <div className="chart-tooltip-data">
                    {h.paymentCount} payments
                  </div>
                  {/* Bar */}
                  <div 
                    className="chart-bar-active" 
                    style={{ height: `${percentage * 0.7}%` }} 
                  />
                  <span className="chart-bar-lbl">{h.date.split(' ')[1]}</span>
                </div>
              );
            })}
          </div>
          
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', textAlign: 'center', marginTop: '1rem' }}>
            Reflects frequency of ledger proofs created. Monetary amounts remain strictly encrypted.
          </span>
        </div>

      </div>

      {/* Advanced Modules Section with Coming Soon Shells */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Cpu size={20} style={{ color: 'var(--color-accent)' }} />
        Programmable Private Modules
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        Configure advanced smart contract workflows verified with zero-knowledge assertions.
      </p>

      <div className="coming-soon-grid">
        
        {/* Module 1: Private Recurring Payments */}
        <div className="coming-soon-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Calendar size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <ComingSoonBadge />
          </div>
          <div>
            <h3 className="coming-soon-title">Private Recurring Transfers</h3>
            <p className="coming-soon-desc">Automate shielded institutional subscription plans or liquidity sweeps.</p>
          </div>
          <div className="coming-soon-skeleton-input">
            <span>Interval: Monthly Sweep • Amount: Hidden</span>
          </div>
        </div>

        {/* Module 2: Private Cross-Border Payroll */}
        <div className="coming-soon-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Users size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <ComingSoonBadge />
          </div>
          <div>
            <h3 className="coming-soon-title">Private Batch Payroll</h3>
            <p className="coming-soon-desc">Disburse worker salaries in bulk without revealing compensation sizes.</p>
          </div>
          <div className="coming-soon-skeleton-input">
            <span>CSV Upload: 142 records • Status: Verifying</span>
          </div>
        </div>

        {/* Module 3: Private Supplier Payments */}
        <div className="coming-soon-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <FileSpreadsheet size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <ComingSoonBadge />
          </div>
          <div>
            <h3 className="coming-soon-title">Confidential Invoicing</h3>
            <p className="coming-soon-desc">Settle supplier accounts while redacting balance sheets from competitors.</p>
          </div>
          <div className="coming-soon-skeleton-input">
            <span>Active: 8 unpaid invoices • Vendor: Masked</span>
          </div>
        </div>

        {/* Module 4: Confidential Escrow */}
        <div className="coming-soon-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Layers size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <ComingSoonBadge />
          </div>
          <div>
            <h3 className="coming-soon-title">Condition-Based Escrow</h3>
            <p className="coming-soon-desc">Lock and release institutional assets automatically based on private oracle logic.</p>
          </div>
          <div className="coming-soon-skeleton-input">
            <span>Condition: Ship confirmation • Pool: Shielded</span>
          </div>
        </div>

        {/* Module 5: Multi-Signature Approval Queue */}
        <div className="coming-soon-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <FileCheck size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <ComingSoonBadge />
          </div>
          <div>
            <h3 className="coming-soon-title">Multi-Sig Approval Queue</h3>
            <p className="coming-soon-desc">Sign private transactions in distributed groups, yielding a single public proof.</p>
          </div>
          <div className="coming-soon-skeleton-input">
            <span>Approvals: 1 of 3 signed • Tx ID: Protected</span>
          </div>
        </div>

        {/* Module 6: Private Tokenized Asset Settlement */}
        <div className="coming-soon-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Briefcase size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <ComingSoonBadge />
          </div>
          <div>
            <h3 className="coming-soon-title">Shielded Asset Settlement</h3>
            <p className="coming-soon-desc">Trade tokenized institutional assets, certificates, and bonds privately.</p>
          </div>
          <div className="coming-soon-skeleton-input">
            <span>Trade Pair: USDX/EURX • Execution: Private</span>
          </div>
        </div>

      </div>
    </div>
  );
};
