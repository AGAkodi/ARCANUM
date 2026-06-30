export interface ComplianceProof {
  id: string;
  timestamp: string;
  proofType: 'Sanctions Check' | 'KYC Verification' | 'AML Flow Review' | 'Assets & Liabilities Matching';
  associatedEntity: string;
  status: 'Passed' | 'Pending' | 'Failed';
  verificationHash: string;
  policyDetails: string;
}

export interface SelectiveDisclosureViewer {
  id: string;
  name: string;
  role: string;
  organization: string;
  accessGranted: boolean;
  lastAccessed: string;
}

export const mockComplianceProofs: ComplianceProof[] = [
  {
    id: 'proof_901',
    timestamp: '2026-06-30T14:10:00Z',
    proofType: 'Sanctions Check',
    associatedEntity: 'GB7Y4ZK9...2345',
    status: 'Passed',
    verificationHash: 'zk_p_sanctions_0x7b11c...4f2a',
    policyDetails: 'OFAC SDN screening check'
  },
  {
    id: 'proof_902',
    timestamp: '2026-06-30T14:09:59Z',
    proofType: 'KYC Verification',
    associatedEntity: 'GB7Y4ZK9...2345',
    status: 'Passed',
    verificationHash: 'zk_p_kyc_0x9a32b...1e8f',
    policyDetails: 'Institutional KYC registry check'
  },
  {
    id: 'proof_903',
    timestamp: '2026-06-30T12:05:00Z',
    proofType: 'KYC Verification',
    associatedEntity: 'GD23JSHW...4890',
    status: 'Passed',
    verificationHash: 'zk_p_kyc_0x45ef1...33d2',
    policyDetails: 'FinCEN accredited onboarding proof'
  },
  {
    id: 'proof_904',
    timestamp: '2026-06-30T09:30:00Z',
    proofType: 'Sanctions Check',
    associatedEntity: 'GACD87SD...8902',
    status: 'Passed',
    verificationHash: 'zk_p_sanctions_0x82ffc...d5a1',
    policyDetails: 'EU Sanctions List verification check'
  },
  {
    id: 'proof_905',
    timestamp: '2026-06-29T16:45:00Z',
    proofType: 'Sanctions Check',
    associatedEntity: 'GBOFAC_SA...7890',
    status: 'Failed',
    verificationHash: 'N/A - Screening rejected address',
    policyDetails: 'OFAC SDN Match - Specially Designated National'
  }
];

export const mockAuditors: SelectiveDisclosureViewer[] = [
  {
    id: 'auditor_01',
    name: 'Institutional Compliance Team',
    role: 'Internal Auditor',
    organization: 'ZBank Treasury Group',
    accessGranted: true,
    lastAccessed: '2026-06-30T10:14:00Z'
  },
  {
    id: 'auditor_02',
    name: 'Regulator Portal Beta',
    role: 'Federal Regulator',
    organization: 'FinCEN Audit Terminal',
    accessGranted: false,
    lastAccessed: '2026-06-28T09:30:00Z'
  },
  {
    id: 'auditor_03',
    name: 'External Audit Desk (PwC)',
    role: 'Independent Auditor',
    organization: 'PwC Global Assurance',
    accessGranted: true,
    lastAccessed: '2026-06-29T15:20:00Z'
  },
  {
    id: 'auditor_04',
    name: 'SEC Audit Desk',
    role: 'Federal Commission Regulator',
    organization: 'SEC FinHub Division',
    accessGranted: false,
    lastAccessed: 'Never'
  }
];
