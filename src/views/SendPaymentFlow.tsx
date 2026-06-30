import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { ProofGenerationFlow } from '../components/ProofGenerationFlow';
import { ComplianceFailureResult } from '../components/ComplianceFailureResult';
import { ShieldCheck, ArrowRight, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { VerifiedBadge } from '../components/VerifiedBadge';

export const SendPaymentFlow: React.FC = () => {
  const { addPayment, setActiveTab } = useSession();
  
  // Step navigation: 'input' | 'proving'
  const [step, setStep] = useState<'input' | 'proving'>('input');
  const [resultState, setResultState] = useState<'none' | 'success' | 'failed'>('none');
  
  // Form inputs
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [memo, setMemo] = useState('');
  const [currency, setCurrency] = useState('USDX');
  const [simulateFailure, setSimulateFailure] = useState(false);
  
  // Collapsible explainer toggle
  const [explainerOpen, setExplainerOpen] = useState(true);

  const [generatedTx, setGeneratedTx] = useState<any>(null);

  // Handle address pre-population for demo convenience
  const setDemoAddress = (type: 'valid' | 'sanctioned') => {
    if (type === 'valid') {
      setRecipient('GB7Y4ZK9XZOPQLW12456ASDFGHJKLQWERT123456');
      setSimulateFailure(false);
    } else {
      setRecipient('GBOFAC_SANCTIONED_ADDRESS_TEST_1234567890');
      setSimulateFailure(true);
    }
  };

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || amount <= 0) return;
    setResultState('none');
    setStep('proving');
  };

  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setMemo('');
    setSimulateFailure(false);
    setResultState('none');
    setStep('input');
  };

  return (
    <div className="animate-fade-in">
      <div className="view-title-block">
        <h1 className="view-title">Confidential Payment Generator</h1>
        <p className="view-desc">
          Transact securely on Stellar without revealing identities or transaction sizes. Compliance rules are enforced via privacy-preserving proofs.
        </p>
      </div>

      {step === 'input' && (
        <div className="card-premium form-card">
          <form onSubmit={handleStartPayment}>
            {/* Quick Demo Pre-fill */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
                DEMO PRESETS:
              </span>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px' }}
                onClick={() => setDemoAddress('valid')}
              >
                Clear Recipient
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255, 23, 68, 0.3)', color: 'var(--color-error)' }}
                onClick={() => setDemoAddress('sanctioned')}
              >
                Sanctioned Recipient (Fail Demo)
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Recipient Stellar Address (Public Key)</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. GB7Y4ZK9..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                Full G-address format. This will be completely redacted from the public ledger record.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem' }} className="form-group">
              <div>
                <label className="form-label">Transaction Amount</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="0.01"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                />
              </div>
              <div>
                <label className="form-label">Asset</label>
                <select
                  className="form-input"
                  style={{ cursor: 'pointer' }}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USDX">USDX</option>
                  <option value="EURX">EURX</option>
                  <option value="USDC">USDC</option>
                  <option value="XLM">XLM</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Audit Memo (Reference)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Supplier payment / payroll sweep"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                Only readable by authorized auditors through selective disclosure keys.
              </span>
            </div>

            {/* Simulated failure trigger */}
            <div className="form-group" style={{ padding: '1rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', margin: '2rem 0 1.5rem 0' }}>
              <label className="form-toggle-label">
                <input
                  type="checkbox"
                  className="form-toggle-input"
                  checked={simulateFailure}
                  onChange={(e) => {
                    setSimulateFailure(e.target.checked);
                    if (e.target.checked) {
                      setRecipient('GBOFAC_SANCTIONED_ADDRESS_TEST_1234567890');
                    } else if (recipient === 'GBOFAC_SANCTIONED_ADDRESS_TEST_1234567890') {
                      setRecipient('');
                    }
                  }}
                />
                <span className="checkbox-custom"></span>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block' }}>
                    Simulate Blocked/Sanctioned Recipient
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                    Test the OFAC sanctions screening alert. Demonstrates automated compliance rejection.
                  </span>
                </div>
              </label>
            </div>

            <div className="form-actions-flex">
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Powered by zk-SNARK & Stellar Soroban Contracts
              </span>
              <button
                type="submit"
                className="btn-primary"
              >
                <span>Generate & Submit Proofs</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'proving' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <ProofGenerationFlow
            recipient={recipient}
            amount={Number(amount)}
            currency={currency}
            memo={memo}
            simulateFailure={simulateFailure}
            onSuccess={(tx) => {
              addPayment(tx);
              setGeneratedTx(tx);
              setResultState('success');
            }}
            onFailure={() => {
              setGeneratedTx(null);
              setResultState('failed');
            }}
          />

          {resultState === 'success' && generatedTx && (
            <div className="result-box success animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
              <div className="result-icon-wrapper success">
                <ShieldCheck size={32} />
              </div>
              <h2 className="result-title">Payment Confirmed & Shielded</h2>
              <p className="result-desc">
                ZK parameters verified successfully. The transaction ledger entry has been published to Stellar with amount and counterparty details encrypted.
              </p>

              <div className="result-details-card">
                <div className="result-detail-row">
                  <span className="result-detail-lbl">Ledger Status</span>
                  <span className="result-detail-val" style={{ color: 'var(--color-success)' }}>PROVEN & COMPLIANT</span>
                </div>
                <div className="result-detail-row">
                  <span className="result-detail-lbl">Transaction Hash</span>
                  <span className="result-detail-val">{generatedTx.stellarTxHash}</span>
                </div>
                <div className="result-detail-row">
                  <span className="result-detail-lbl">ZKP zk-SNARK Hash</span>
                  <span className="result-detail-val">{generatedTx.zkProofHash}</span>
                </div>
                <div className="result-detail-row">
                  <span className="result-detail-lbl">Recipient</span>
                  <span className="result-detail-val">{generatedTx.counterpartyMasked}</span>
                </div>
                <div className="result-detail-row">
                  <span className="result-detail-lbl">Transaction Amount</span>
                  <span className="result-detail-val" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span className="redacted-blur" style={{ filter: 'blur(3px)' }}>{amount} {currency}</span>
                    <VerifiedBadge type="shielded" text="Hidden" glow={false} />
                  </span>
                </div>
              </div>

              {/* Explainer Panel */}
              <div className="explainer-collapsible">
                <button
                  className="explainer-toggle-btn"
                  onClick={() => setExplainerOpen(!explainerOpen)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HelpCircle size={14} />
                    What was cryptographically proven?
                  </span>
                  {explainerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {explainerOpen && (
                  <div className="explainer-body animate-fade-in">
                    We proved to the Stellar smart contract validator that you possess sufficient funds for this transfer and that the recipient address has passed onboarding compliance, without revealing your balance, the target destination, or the payment amount.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={resetForm}
                >
                  Send Another Payment
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => setActiveTab('overview')}
                >
                  Go to Dashboard Overview
                </button>
              </div>
            </div>
          )}

          {resultState === 'failed' && (
            <ComplianceFailureResult
              reasonCode={simulateFailure ? 'sanctioned' : 'compliance_fail'}
              recipient={recipient}
              amount={Number(amount)}
              currency={currency}
              onTryAgain={resetForm}
              onReviewCompliance={() => setActiveTab('compliance')}
            />
          )}
        </div>
      )}
    </div>
  );
};
