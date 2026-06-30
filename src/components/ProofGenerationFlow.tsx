import React, { useState, useEffect } from 'react';
import { ShieldAlert, Cpu, Check, Loader2 } from 'lucide-react';
import { stellarZkService } from '../services/stellarZkService';

interface ProofGenerationFlowProps {
  recipient: string;
  amount: number;
  currency: string;
  memo: string;
  simulateFailure: boolean;
  onSuccess: (tx: any) => void;
  onFailure: (errorMessage: string) => void;
}

export type StepState = 'pending' | 'active' | 'complete' | 'failed';

interface ProverStep {
  id: number;
  label: string;
  subtext: string;
  activeMessage: string;
  successMessage: string;
}

export const ProofGenerationFlow: React.FC<ProofGenerationFlowProps> = ({
  recipient,
  amount,
  currency,
  memo,
  simulateFailure,
  onSuccess,
  onFailure
}) => {
  const steps: ProverStep[] = [
    {
      id: 0,
      label: 'Generating Compliance Proof',
      subtext: 'Proving identity & SDN whitelist status without exposing public keys',
      activeMessage: 'Hashing compliance credentials & querying OFAC SDN local Merkle trees...',
      successMessage: 'Compliance proof compiled. Zero watchlist matches found.'
    },
    {
      id: 1,
      label: 'Generating Confidential Amount Proof',
      subtext: 'Proving positive range & asset limits without revealing quantities',
      activeMessage: 'Assembling zk-SNARK constraint matrix for balance commitment range...',
      successMessage: 'Range proof generated. Ledger balances validated.'
    },
    {
      id: 2,
      label: 'Verifying on Stellar',
      subtext: 'Publishing proof credentials to Soroban anchors for on-chain validation',
      activeMessage: 'Invoking Stellar Soroban verifier smart contract. Simulating consensus...',
      successMessage: 'Verification complete. Ledger block synced successfully.'
    }
  ];

  // Visual state machine
  const [stepStates, setStepStates] = useState<StepState[]>(['active', 'pending', 'pending']);
  const [consoleLog, setConsoleLog] = useState<string>(steps[0].activeMessage);
  const [progressPercent, setProgressPercent] = useState<number>(0); // 0%, 50%, 100% connector line

  // Run a random delay helper
  const getRandomDelay = (min: number = 1800, max: number = 3200) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  useEffect(() => {
    let active = true;

    const runZKEngine = async () => {
      // ----------------------------------------------------
      // STAGE 1: COMPLIANCE PROOF
      // ----------------------------------------------------
      if (!active) return;
      setConsoleLog(steps[0].activeMessage);
      const delay1 = getRandomDelay();
      await new Promise((resolve) => setTimeout(resolve, delay1));

      if (simulateFailure || recipient.toUpperCase().includes('SANCTION')) {
        if (!active) return;
        setStepStates(['failed', 'pending', 'pending']);
        setConsoleLog('Error: Recipient address matched global sanction node index 491a. Aborting compilation.');
        
        // Wait briefly so the user sees the fail state before transitioning to the error screen
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (!active) return;
        onFailure('Compliance screening rejected recipient address (OFAC SDN matching flag).');
        return;
      }

      // Stage 1 Success
      if (!active) return;
      setStepStates(['complete', 'active', 'pending']);
      setProgressPercent(33);
      setConsoleLog(steps[0].successMessage);

      // ----------------------------------------------------
      // STAGE 2: AMOUNT PROOF
      // ----------------------------------------------------
      const delay2 = getRandomDelay();
      await new Promise((resolve) => setTimeout(resolve, delay2));
      if (!active) return;
      setConsoleLog(steps[1].activeMessage);

      // Stage 2 Success
      if (!active) return;
      setStepStates(['complete', 'complete', 'active']);
      setProgressPercent(66);
      setConsoleLog(steps[1].successMessage);

      // ----------------------------------------------------
      // STAGE 3: STELLAR VERIFICATION
      // ----------------------------------------------------
      const delay3 = getRandomDelay();
      await new Promise((resolve) => setTimeout(resolve, delay3));
      if (!active) return;
      setConsoleLog(steps[2].activeMessage);

      // Generate actual payload parameters via our service mock
      try {
        const result = await stellarZkService.verifyOnStellar(
          'zk_comp_proof_0x' + Math.random().toString(16).substr(2, 8),
          'zk_amt_proof_0x' + Math.random().toString(16).substr(2, 8),
          () => {}
        );

        if (!active) return;
        setStepStates(['complete', 'complete', 'complete']);
        setProgressPercent(100);
        setConsoleLog(steps[2].successMessage);

        // Construct final mock transaction payload
        const transaction = {
          id: 'tx_' + Math.floor(Math.random() * 100000000),
          timestamp: new Date().toISOString(),
          type: 'Sent' as const,
          counterparty: recipient,
          counterpartyMasked: recipient.slice(0, 4) + '...' + recipient.slice(-4),
          amount: amount,
          amountMasked: '••••••••••',
          currency: currency,
          complianceStatus: 'Compliant' as const,
          proofVerified: true,
          zkProofHash: 'zk_snark_proof_0x' + Math.random().toString(16).substr(2, 16),
          stellarTxHash: result.txHash,
          isPrivate: true,
          memo: memo || 'Institutional transfer'
        };

        // Brief delay for success visual highlight
        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (!active) return;
        onSuccess(transaction);
      } catch (err: any) {
        if (!active) return;
        setStepStates(['complete', 'complete', 'failed']);
        setConsoleLog('Error: Soroban verification signatures validation failed.');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (!active) return;
        onFailure(err.message || 'On-chain proof verification rejected.');
      }
    };

    runZKEngine();

    return () => {
      active = false;
    };
  }, [recipient, amount, currency, memo, simulateFailure]);

  // Helper to render icon based on step state
  const renderStepIcon = (state: StepState, index: number) => {
    switch (state) {
      case 'complete':
        return (
          <div 
            className="prover-step-icon complete"
            style={{
              backgroundColor: 'var(--color-success-dim)',
              borderColor: 'var(--color-success)',
              color: 'var(--color-success)',
              boxShadow: '0 0 10px rgba(0, 230, 118, 0.2)'
            }}
          >
            <Check size={14} strokeWidth={3} />
          </div>
        );
      case 'failed':
        return (
          <div 
            className="prover-step-icon failed"
            style={{
              backgroundColor: 'var(--color-error-dim)',
              borderColor: 'var(--color-error)',
              color: 'var(--color-error)',
              boxShadow: '0 0 10px rgba(255, 23, 68, 0.2)'
            }}
          >
            <ShieldAlert size={14} />
          </div>
        );
      case 'active':
        return (
          <div 
            className="prover-step-icon active"
            style={{
              backgroundColor: 'var(--color-accent-dim)',
              borderColor: 'var(--color-accent)',
              color: 'var(--color-accent)',
              boxShadow: '0 0 12px rgba(243, 183, 36, 0.25)',
              animation: 'pulseGlow 2s infinite'
            }}
          >
            <Loader2 size={13} className="animate-spin-fast" />
          </div>
        );
      case 'pending':
      default:
        return (
          <div 
            className="prover-step-icon pending"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--color-text-muted)',
              color: 'var(--color-text-muted)'
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{index + 1}</span>
          </div>
        );
    }
  };

  return (
    <div className="card-premium prover-flow-container animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto', padding: '2.5rem' }}>
      
      {/* Header section of prover flow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
        <Cpu size={22} className="logo-icon" />
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Cryptographic ZK Proof Engine
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Compiling and validating client transaction credentials locally...
          </p>
        </div>
      </div>

      {/* Steps Sequence Container */}
      <div className="prover-steps-wrapper" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Background track line */}
        <div 
          style={{
            position: 'absolute',
            top: '12px',
            left: '17px',
            bottom: '12px',
            width: '2px',
            backgroundColor: 'var(--border-color)',
            zIndex: 1
          }}
        />

        {/* Filling Progress line */}
        <div 
          style={{
            position: 'absolute',
            top: '12px',
            left: '17px',
            height: `calc(${progressPercent}% - 24px)`,
            width: '2px',
            backgroundColor: progressPercent === 100 ? 'var(--color-success)' : 'var(--color-accent)',
            boxShadow: progressPercent === 100 
              ? '0 0 6px var(--color-success)' 
              : '0 0 6px var(--color-accent)',
            zIndex: 1,
            transition: 'height 0.4s ease-out, background-color 0.4s ease-out'
          }}
        />

        {/* Render Steps */}
        {steps.map((s, idx) => {
          const state = stepStates[idx];
          const isActive = state === 'active';
          const isComplete = state === 'complete';
          const isFailed = state === 'failed';

          let titleColor = 'var(--color-text-muted)';
          if (isActive) titleColor = 'var(--color-accent)';
          if (isComplete) titleColor = 'var(--color-text-primary)';
          if (isFailed) titleColor = 'var(--color-error)';

          return (
            <div 
              key={s.id} 
              style={{ 
                display: 'flex', 
                gap: '1.25rem', 
                position: 'relative', 
                zIndex: 2,
                opacity: state === 'pending' ? 0.45 : 1,
                transition: 'opacity 0.3s ease'
              }}
            >
              {/* Prover icon col */}
              {renderStepIcon(state, idx)}

              {/* Prover step text labels */}
              <div style={{ flex: 1, paddingTop: '1px' }}>
                <h4 
                  style={{ 
                    fontSize: '0.925rem', 
                    fontWeight: 700, 
                    color: titleColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'color 0.3s ease'
                  }}
                >
                  {s.label}
                  {isActive && (
                    <span 
                      style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 600, 
                        letterSpacing: '0.05em', 
                        color: 'var(--color-accent)',
                        background: 'var(--color-accent-dim)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      Compiling
                    </span>
                  )}
                </h4>
                <p style={{ fontSize: '0.775rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {s.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal logs console */}
      <div 
        style={{
          marginTop: '2.5rem',
          backgroundColor: '#0c0d0f',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ width: '4px', height: '12px', backgroundColor: 'var(--color-accent)', animation: 'spin 1.5s infinite linear' }} />
        <span style={{ color: consoleLog.startsWith('Error') ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
          {consoleLog}
        </span>
      </div>

    </div>
  );
};
export default ProofGenerationFlow;
