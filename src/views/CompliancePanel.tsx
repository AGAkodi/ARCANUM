import React from 'react';
import { useSession } from '../context/SessionContext';
import { Unlock, ShieldCheck } from 'lucide-react';

export const CompliancePanel: React.FC = () => {
  const { complianceProofs, auditors, toggleAuditorAccess } = useSession();

  return (
    <div className="animate-fade-in">
      <div className="view-title-block">
        <h1 className="view-title">Compliance & Regulatory Auditing</h1>
        <p className="view-desc">
          Manage regulatory visibility and view proof verification certificates generated for KYC, AML, and sanctions matching.
        </p>
      </div>

      <div className="compliance-controls-grid">
        {/* Left Column: Selective Disclosure */}
        <div className="card-premium disclosure-card">
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Unlock size={18} style={{ color: 'var(--color-accent)' }} />
              Selective Disclosure Authorizations
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Grant auditing keys to authorities to view decrypted transaction histories. Toggles take effect instantly.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {auditors.map((auditor) => (
              <div key={auditor.id} className="disclosure-row">
                <div className="disclosure-info">
                  <span className="disclosure-title">{auditor.name}</span>
                  <span className="disclosure-meta">
                    {auditor.organization} • <span style={{ fontFamily: 'var(--font-mono)' }}>{auditor.role}</span>
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Last access: {auditor.lastAccessed === 'Never' ? 'Never' : new Date(auditor.lastAccessed).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }} className={auditor.accessGranted ? 'success' : ''}>
                    {auditor.accessGranted ? (
                      <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Active Access
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>Restricted</span>
                    )}
                  </span>
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={auditor.accessGranted}
                      onChange={() => toggleAuditorAccess(auditor.id)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Policy Compliance Dashboard */}
        <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--color-accent)' }} />
              Active Policy Assertions
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Cryptographic guards evaluated for every transfer before ledger submission.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ padding: '12px', borderLeft: '3px solid var(--color-success)', backgroundColor: 'var(--bg-input)', borderRadius: '0 6px 6px 0', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '2px' }}>
                <span>Sanctions Check policy (OFAC SDN)</span>
                <span style={{ color: 'var(--color-success)' }}>Active ✓</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Prevents transaction compilation if target public key matches blacklisted sanction nodes.
              </p>
            </div>

            <div style={{ padding: '12px', borderLeft: '3px solid var(--color-success)', backgroundColor: 'var(--bg-input)', borderRadius: '0 6px 6px 0', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '2px' }}>
                <span>Balance Limit Rule (Range Proofs)</span>
                <span style={{ color: 'var(--color-success)' }}>Active ✓</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Proves spendable tokens are positive and ledger balance is sufficient.
              </p>
            </div>

            <div style={{ padding: '12px', borderLeft: '3px solid var(--color-success)', backgroundColor: 'var(--bg-input)', borderRadius: '0 6px 6px 0', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '2px' }}>
                <span>Multi-Signature Approval Rules</span>
                <span style={{ color: 'var(--color-success)' }}>Active ✓</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Proves 2-of-3 signatures approved the shielded transaction prior to publishing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Proof History Logs */}
      <div className="table-container">
        <div className="table-header-bar">
          <h3 className="table-title">Cryptographic Compliance Verification Logs</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Total generated proofs: {complianceProofs.length}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Proof ID & Time</th>
                <th>Proof Category</th>
                <th>Target Public Hash</th>
                <th>Screening Logic Policy</th>
                <th>Validation Status</th>
                <th>ZK Proof Credentials</th>
              </tr>
            </thead>
            <tbody>
              {complianceProofs.map((proof) => (
                <tr key={proof.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{proof.id}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                        {new Date(proof.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td>{proof.proofType}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{proof.associatedEntity}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{proof.policyDetails}</td>
                  <td>
                    <span className={`badge-status ${proof.status === 'Passed' ? 'compliant' : 'failed'}`}>
                      {proof.status}
                    </span>
                  </td>
                  <td>
                    <span className="badge-proof" style={{ fontSize: '0.7rem' }}>
                      {proof.verificationHash.slice(0, 18)}...
                    </span>
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
