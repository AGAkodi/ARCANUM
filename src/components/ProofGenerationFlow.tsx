'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Cpu, Check, Loader2 } from 'lucide-react';
import { stellarZkService } from '../services/stellarZkService';
import { useSession } from '../context/SessionContext';

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
  const { walletAddress, network } = useSession();
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
      subtext: 'Both proofs verified by the ARCANUM Verifier Soroban contract before funds move',
      activeMessage: 'Invoking Stellar Soroban verifier smart contract on testnet...',
      successMessage: 'Proofs verified on-chain. Transfer settled in ledger.'
    }
  ];

  // Visual state machine
  const [stepStates, setStepStates] = useState<StepState[]>(['active', 'pending', 'pending']);
  const [consoleLog, setConsoleLog] = useState<string>(steps[0].activeMessage);
  const [progressPercent, setProgressPercent] = useState<number>(0); // 0%, 50%, 100% connector line

  useEffect(() => {
    let active = true;

    const runZKEngine = async () => {
      try {
        // Real Noir/UltraHonk proving in the browser — each step's status is
        // driven by the actual prover, not timers.
        const transaction = await stellarZkService.submitConfidentialPayment(
          recipient,
          amount,
          memo,
          currency,
          (stepIndex, status, msg) => {
            if (!active) return;
            if (status === 'generating') {
              setStepStates((prev) =>
                prev.map((s, i) => (i < stepIndex ? 'complete' : i === stepIndex ? 'active' : 'pending'))
              );
              setConsoleLog(msg || steps[stepIndex].activeMessage);
            } else if (status === 'success') {
              setStepStates((prev) =>
                prev.map((s, i) => (i <= stepIndex ? 'complete' : i === stepIndex + 1 ? 'active' : 'pending'))
              );
              setProgressPercent(Math.round(((stepIndex + 1) / steps.length) * 100));
              setConsoleLog(msg || steps[stepIndex].successMessage);
            } else {
              setStepStates((prev) =>
                prev.map((s, i) => (i < stepIndex ? 'complete' : i === stepIndex ? 'failed' : 'pending'))
              );
              setConsoleLog('Error: ' + (msg || 'Proof generation failed.'));
            }
          },
          { simulateFailure, walletAddress, network }
        );

        if (!active) return;
        setConsoleLog(steps[2].successMessage);

        // Brief delay for success visual highlight
        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (!active) return;
        onSuccess(transaction);
      } catch (err: any) {
        // Wait briefly so the user sees the fail state before transitioning to the error screen
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (!active) return;
        onFailure(
          err?.message?.includes('Compliance')
            ? 'Compliance screening rejected recipient address (OFAC SDN matching flag).'
            : err?.message || 'On-chain proof verification rejected.'
        );
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