import React, { createContext, useContext, useState, useEffect } from 'react';
import type { PaymentTransaction } from '../mocks/payments';
import { mockPayments } from '../mocks/payments';
import type { SelectiveDisclosureViewer, ComplianceProof } from '../mocks/compliance';
import { mockAuditors, mockComplianceProofs } from '../mocks/compliance';

export type ActiveTab = 'overview' | 'send' | 'explorer' | 'compliance' | 'treasury';
export type NetworkType = 'mainnet' | 'testnet';

interface SessionContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  network: NetworkType;
  toggleNetwork: () => void;
  payments: PaymentTransaction[];
  addPayment: (payment: PaymentTransaction) => void;
  auditors: SelectiveDisclosureViewer[];
  toggleAuditorAccess: (auditorId: string) => void;
  complianceProofs: ComplianceProof[];
  addComplianceProof: (proof: ComplianceProof) => void;
  selectedTx: PaymentTransaction | null;
  setSelectedTx: (tx: PaymentTransaction | null) => void;
  walletConnected: boolean;
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [network, setNetwork] = useState<NetworkType>('testnet');
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [auditors, setAuditors] = useState<SelectiveDisclosureViewer[]>([]);
  const [complianceProofs, setComplianceProofs] = useState<ComplianceProof[]>([]);
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  
  // Wallet Connection States
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Initialize state from mock files
  useEffect(() => {
    setPayments(mockPayments);
    setAuditors(mockAuditors);
    setComplianceProofs(mockComplianceProofs);
    if (mockPayments.length > 0) {
      setSelectedTx(mockPayments[0]);
    }
  }, []);

  const toggleNetwork = () => {
    setNetwork((prev) => (prev === 'mainnet' ? 'testnet' : 'mainnet'));
  };

  const connectWallet = async () => {
    // Simulate interactive wallet extension authorization
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setWalletAddress('GA_ARCANUM_TREASURY_CORP_3891023812');
    setWalletConnected(true);
    setActiveTab('overview');
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress(null);
  };

  const addPayment = (payment: PaymentTransaction) => {
    setPayments((prev) => [payment, ...prev]);
    
    // Auto-select for Explorer view
    setSelectedTx(payment);

    // Also auto-add a compliance proof
    if (payment.complianceStatus === 'Compliant') {
      const newCompliance: ComplianceProof = {
        id: 'proof_' + Math.floor(Math.random() * 1000),
        timestamp: payment.timestamp,
        proofType: 'Sanctions Check',
        associatedEntity: payment.counterpartyMasked,
        status: 'Passed',
        verificationHash: payment.zkProofHash,
        policyDetails: 'OFAC SDN screening check'
      };
      addComplianceProof(newCompliance);
    }
  };

  const toggleAuditorAccess = (auditorId: string) => {
    setAuditors((prev) =>
      prev.map((auditor) =>
        auditor.id === auditorId
          ? {
              ...auditor,
              accessGranted: !auditor.accessGranted,
              lastAccessed: !auditor.accessGranted ? new Date().toISOString() : auditor.lastAccessed
            }
          : auditor
      )
    );
  };

  const addComplianceProof = (proof: ComplianceProof) => {
    setComplianceProofs((prev) => [proof, ...prev]);
  };

  return (
    <SessionContext.Provider
      value={{
        activeTab,
        setActiveTab,
        network,
        toggleNetwork,
        payments,
        addPayment,
        auditors,
        toggleAuditorAccess,
        complianceProofs,
        addComplianceProof,
        selectedTx,
        setSelectedTx,
        walletConnected,
        walletAddress,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
