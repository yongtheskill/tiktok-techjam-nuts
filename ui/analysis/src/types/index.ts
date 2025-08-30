export type RawTransaction = {
  _creationTime: number;
  _id: string;
  amount: string;
  createdAt: number;
  giftId?: string;
  livestreamId?: string;
  owner: string;
  receiverId: string;
  senderId: string;
  status: string;
  type: 'fee' | 'gift-receive' | 'gift-give' | 'top-up';
  txHash?: string;
};

export type Transaction = {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  riskScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
  fraudFlags: string[];
  gasUsed: number;
  blockNumber: number;
  type: string;
  status: string;
  txHash?: string;
};

export type AnalysisData = {
  transactions: Transaction[];
  totalTransactions: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  minimalRiskCount: number;
  totalVolume: number;
  suspiciousPatterns: string[];
  fraudDetectionResult?: FraudDetectionResult;
};

export type MainProps = {
  token: string;
};

export type RiskLevel = {
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
  color: string;
  bgColor: string;
};

export type RiskDistributionData = {
  high: number;
  medium: number;
  low: number;
  minimal: number;
};

export type UserRiskData = {
  userId: string;
  fraudScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
  reasons: Record<string, string>;
  features: {
    transactionCount: number;
    totalAmount: number;
    avgAmount: number;
    highVelocityPeriods: number;
    roundAmountRatio: number;
    largeTransactionCount: number;
    offHoursRatio: number;
    uniqueCounterparties: number;
    circularTransactions: boolean;
    amountOutliers: number;
  };
};

export type FraudDetectionResult = {
  users: Record<string, UserRiskData>;
  overall: {
    fraudScore: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
    reasons: Record<string, string>;
    features: {
      totalTransactions: number;
      uniqueUsers: number;
      totalVolume: number;
      avgTransactionSize: number;
      timeSpanHours: number;
      transactionRate: number;
      volumeConcentration: number;
    };
  };
};
