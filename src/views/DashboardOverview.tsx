import React from 'react';
import { useSession } from '../context/SessionContext';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { RedactedValue } from '../components/RedactedValue';
import { ArrowUpRight, ArrowDownLeft, Shield, Eye, Network } from 'lucide-react';
import type { PaymentTransaction } from '../mocks/payments';

export const DashboardOverview: React.FC = () => {
  const { 
    payments, 
    network, 
    toggleNetwork, 
    setActiveTab, 
    setSelectedTx 
  } = useSession();

  const handleInspectTx = (tx: PaymentTransaction) => {
    setSelectedTx(tx);
    setActiveTab('explorer');
  };

  // Calculations for overview cards
  const activePayments = payments.filter(p => p.complianceStatus !== 'Failed');
  const totalCount = activePayments.length;
  
  return (
    <div className="animate-fade-in">
      <div className="view-title-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="view-title">Institutional Overview</h1>
          <p className="view-desc">
            Secure confidential transactions built on Stellar. Complete privacy enabled via zero-knowledge proofs.
          </p>
        </div>
        
        {/* Network Status Toggle Card */}
        <div className="card-premium" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Network size={16} className="logo-icon" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
              NETWORK STATUS:
            </span>
          </div>
          <div className="network-selector">
            <button 
              className={`network-btn ${network === 'testnet' ? 'active' : ''}`}
              onClick={toggleNetwork}
            >
              Testnet
            </button>
            <button 
              className={`network-btn ${network === 'mainnet' ? 'active mainnet' : ''}`}
              onClick={toggleNetwork}
            >
              Mainnet
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid">
        <div className="card-premium accented">
          <div className="card-header-flex">
            <span className="card-label">Confidential Transfers</span>
            <div style={{ color: 'var(--color-accent)' }}>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="card-val">
            {totalCount} <span className="card-val-sub">transfers</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            All balances & addresses cryptographically shielded on-chain.
          </p>
        </div>

        <div className="card-premium">
          <div className="card-header-flex">
            <span className="card-label">Compliance Status</span>
            <VerifiedBadge type="verified" text="Active ✓" />
          </div>
          <div className="card-val" style={{ color: 'var(--color-success)', textShadow: '0 0 10px rgba(0,230,118,0.2)' }}>
            Compliant
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Real-time OFAC / sanctions validation executed via zk-proof parameters.
          </p>
        </div>

        <div className="card-premium">
          <div className="card-header-flex">
            <span className="card-label">Shielded Treasury</span>
            <VerifiedBadge type="solvency" text="Verified ✓" />
          </div>
          <div className="card-val">
            <RedactedValue 
              value="$142,590,480.00" 
              type="blur" 
              badgeText="Solvent" 
              allowReveal={true}
              tooltipText="Proof of solvency verified: Assets exceed liabilities" 
            />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Assets: Liabilities ratio verified without exposing exact ledger balance.
          </p>
        </div>
      </div>

      {/* Hero Call to Action Row */}
      <div className="card-premium" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', background: 'radial-gradient(ellipse at top right, rgba(0, 229, 255, 0.08), transparent)' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Send Confidential Transfer</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Submit a secure payment on Stellar. The transaction amount and recipient identity will be completely redacted from public ledgers, while remaining verified and audit-compliant.
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setActiveTab('send')}
        >
          <Shield size={16} />
          Send Confidential Payment
        </button>
      </div>

      {/* Recent Payments Table */}
      <div className="table-container">
        <div className="table-header-bar">
          <h3 className="table-title">Recent Confidential Ledger Transactions</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Stellar testnet ledger index: #61892842
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID & Time</th>
                <th>Transfer Type</th>
                <th>Counterparty</th>
                <th>Amount (Redacted)</th>
                <th>Compliance Proof</th>
                <th>Explorer Comparison</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{tx.id}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {tx.type === 'Sent' ? (
                        <>
                          <ArrowUpRight size={14} style={{ color: 'var(--color-accent)' }} />
                          <span>Sent</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft size={14} style={{ color: 'var(--color-success)' }} />
                          <span>Received</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {tx.counterpartyMasked}
                    </span>
                  </td>
                  <td>
                    <RedactedValue 
                      value={`${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${tx.currency}`}
                      type="dotted"
                      badgeText="Verified"
                      allowReveal={tx.complianceStatus === 'Compliant'}
                    />
                  </td>
                  <td>
                    <span className={`badge-status ${tx.complianceStatus.toLowerCase()}`}>
                      {tx.complianceStatus === 'Compliant' ? 'Compliant' : tx.complianceStatus === 'Pending' ? 'Pending' : 'Failed'}
                    </span>
                  </td>
                  <td>
                    {tx.complianceStatus === 'Compliant' ? (
                      <button 
                        className="badge-proof"
                        onClick={() => handleInspectTx(tx)}
                      >
                        <Eye size={12} />
                        Compare
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        N/A - Blocked
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
