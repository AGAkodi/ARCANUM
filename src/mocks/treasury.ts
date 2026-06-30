export interface TreasurySnapshot {
  assetsVerified: boolean;
  liabilitiesVerified: boolean;
  solvencyStatus: 'Solvent' | 'Unverified';
  lastSolvencyAudit: string;
  totalAssetsRedacted: string;
  totalLiabilitiesRedacted: string;
  proofHash: string;
  stellarLedgerIndex: number;
}

export interface VolumeLog {
  date: string;
  paymentCount: number;
}

export const mockTreasury: TreasurySnapshot = {
  assetsVerified: true,
  liabilitiesVerified: true,
  solvencyStatus: 'Solvent',
  lastSolvencyAudit: '2026-06-30T12:00:00Z',
  totalAssetsRedacted: '$142,590,•••.••',
  totalLiabilitiesRedacted: '$91,240,•••.••',
  proofHash: 'zk_solvency_proof_0x1f8b4d...c29a',
  stellarLedgerIndex: 61892842
};

export const mockVolumeHistory: VolumeLog[] = [
  { date: 'Jun 20', paymentCount: 28 },
  { date: 'Jun 21', paymentCount: 35 },
  { date: 'Jun 22', paymentCount: 42 },
  { date: 'Jun 23', paymentCount: 30 },
  { date: 'Jun 24', paymentCount: 48 },
  { date: 'Jun 25', paymentCount: 52 },
  { date: 'Jun 26', paymentCount: 61 },
  { date: 'Jun 27', paymentCount: 45 },
  { date: 'Jun 28', paymentCount: 38 },
  { date: 'Jun 29', paymentCount: 55 },
  { date: 'Jun 30', paymentCount: 68 }
];
