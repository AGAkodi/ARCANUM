export interface PaymentTransaction {
  id: string;
  timestamp: string;
  type: 'Sent' | 'Received';
  counterparty: string;
  counterpartyMasked: string;
  amount: number;
  amountMasked: string;
  currency: string;
  complianceStatus: 'Compliant' | 'Pending' | 'Failed';
  proofVerified: boolean;
  zkProofHash: string;
  stellarTxHash: string;
  isPrivate: boolean;
  memo: string;
}

export const mockPayments: PaymentTransaction[] = [
  {
    id: 'tx_90823412',
    timestamp: '2026-06-30T14:10:00Z',
    type: 'Sent',
    counterparty: 'GB7Y4ZK9XZOPQLW12456ASDFGHJKLQWERT123456',
    counterpartyMasked: 'GB...4ZK9',
    amount: 1500000.00,
    amountMasked: '••••••••••',
    currency: 'USDX',
    complianceStatus: 'Compliant',
    proofVerified: true,
    zkProofHash: 'zk_snark_proof_0x5f3a7c...a2d9',
    stellarTxHash: 'st_tx_0x9d4b...c8e1',
    isPrivate: true,
    memo: 'Supplier invoice #4928'
  },
  {
    id: 'tx_90823413',
    timestamp: '2026-06-30T12:05:00Z',
    type: 'Received',
    counterparty: 'GD23JSHWYU8923KLHSADFJKLHGWERPOIU1234890',
    counterpartyMasked: 'GD...4890',
    amount: 320000.00,
    amountMasked: '••••••••••',
    currency: 'USDX',
    complianceStatus: 'Compliant',
    proofVerified: true,
    zkProofHash: 'zk_snark_proof_0x8c2b7f...c9d0',
    stellarTxHash: 'st_tx_0x4e2a...f7d3',
    isPrivate: true,
    memo: 'Liquidity provider replenishment'
  },
  {
    id: 'tx_90823414',
    timestamp: '2026-06-30T09:30:00Z',
    type: 'Sent',
    counterparty: 'GACD87SDHFJWEKL39201LKJDSAFHJKLMN1238902',
    counterpartyMasked: 'GA...8902',
    amount: 8500000.00,
    amountMasked: '••••••••••',
    currency: 'EURX',
    complianceStatus: 'Compliant',
    proofVerified: true,
    zkProofHash: 'zk_snark_proof_0x3e1d6c...f4a0',
    stellarTxHash: 'st_tx_0x8f3c...d8b2',
    isPrivate: true,
    memo: 'Cross-border liquidity sweep'
  },
  {
    id: 'tx_90823415',
    timestamp: '2026-06-29T16:45:00Z',
    type: 'Sent',
    counterparty: 'GBOFAC_SANCTIONED_ADDRESS_TEST_1234567890',
    counterpartyMasked: 'GB...7890',
    amount: 50000.00,
    amountMasked: '••••••••••',
    currency: 'USDX',
    complianceStatus: 'Failed',
    proofVerified: false,
    zkProofHash: 'N/A - Proof generation rejected',
    stellarTxHash: 'N/A - Transaction blocked',
    isPrivate: true,
    memo: 'Simulated compliance violation'
  },
  {
    id: 'tx_90823416',
    timestamp: '2026-06-29T11:15:00Z',
    type: 'Received',
    counterparty: 'GC28SKDHWERPOIUYTREWQASDFGHJKLMNBVCX1234',
    counterpartyMasked: 'GC...1234',
    amount: 450000.00,
    amountMasked: '••••••••••',
    currency: 'USDX',
    complianceStatus: 'Compliant',
    proofVerified: true,
    zkProofHash: 'zk_snark_proof_0x7d9a1c...e3b9',
    stellarTxHash: 'st_tx_0x2c1f...a5d8',
    isPrivate: true,
    memo: 'Treasury deployment refund'
  }
];
