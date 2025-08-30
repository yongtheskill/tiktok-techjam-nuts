import type {
  RawTransaction,
  Transaction,
  AnalysisData,
  UserRiskData,
  FraudDetectionResult,
} from '../types/index.js';

// Fraud detection thresholds (matching Python model)
const THRESHOLDS = {
  highVelocityWindow: 300, // 5 minutes in seconds
  highVelocityCount: 3,
  largeAmountThreshold: 1000000000, // 1B units
  offHoursStart: 22,
  offHoursEnd: 6,
  roundAmountThreshold: 1000000, // 1M units
};

// Helper function to calculate entropy
const calculateEntropy = (valueCounts: Record<string, number>): number => {
  const values = Object.values(valueCounts);
  const total = values.reduce((sum, count) => sum + count, 0);

  if (total <= 1) return 0;

  const probs = values.map((count) => count / total);
  return -probs.reduce((entropy, prob) => entropy + prob * Math.log2(prob), 0);
};

// Calculate user features (matching Python model logic)
const calculateUserFeatures = (
  transactions: RawTransaction[],
  userId: string,
): UserRiskData['features'] => {
  const userTxns = transactions.filter(
    (tx) =>
      tx.senderId === userId || tx.receiverId === userId || tx.owner === userId,
  );

  if (userTxns.length === 0) {
    return {
      transactionCount: 0,
      totalAmount: 0,
      avgAmount: 0,
      highVelocityPeriods: 0,
      roundAmountRatio: 0,
      largeTransactionCount: 0,
      offHoursRatio: 0,
      uniqueCounterparties: 0,
      circularTransactions: false,
      amountOutliers: 0,
    };
  }

  // Sort by timestamp
  const sortedTxns = userTxns.sort((a, b) => a.createdAt - b.createdAt);
  const amounts = sortedTxns.map((tx) => parseFloat(tx.amount));

  // Basic stats
  const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
  const avgAmount = totalAmount / amounts.length;
  const median = amounts.sort()[Math.floor(amounts.length / 2)];
  const variance =
    amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) /
    amounts.length;
  const std = Math.sqrt(variance);

  // High velocity periods
  let highVelocityPeriods = 0;
  for (let i = 0; i < sortedTxns.length - 1; i++) {
    const windowEnd =
      sortedTxns[i].createdAt + THRESHOLDS.highVelocityWindow * 1000; // Convert to ms
    const windowTxns = sortedTxns.filter(
      (tx) =>
        tx.createdAt >= sortedTxns[i].createdAt && tx.createdAt <= windowEnd,
    );
    if (windowTxns.length >= THRESHOLDS.highVelocityCount) {
      highVelocityPeriods++;
    }
  }

  // Round amount ratio
  const roundAmounts = amounts.filter(
    (amount) => amount % THRESHOLDS.roundAmountThreshold === 0,
  ).length;
  const roundAmountRatio = roundAmounts / amounts.length;

  // Large transactions
  const largeTransactionCount = amounts.filter(
    (amount) => amount >= THRESHOLDS.largeAmountThreshold,
  ).length;

  // Off-hours activity
  const offHoursCount = sortedTxns.filter((tx) => {
    const hour = new Date(tx.createdAt).getHours();
    return hour >= THRESHOLDS.offHoursStart || hour < THRESHOLDS.offHoursEnd;
  }).length;
  const offHoursRatio = offHoursCount / sortedTxns.length;

  // Network features
  const senders = new Set(sortedTxns.map((tx) => tx.senderId).filter(Boolean));
  const receivers = new Set(
    sortedTxns.map((tx) => tx.receiverId).filter(Boolean),
  );
  const uniqueCounterparties = senders.size + receivers.size - 1; // Exclude self
  const circularTransactions =
    senders.size > 0 &&
    receivers.size > 0 &&
    Array.from(senders).some((sender) => receivers.has(sender));

  // Amount outliers (using z-score > 3)
  const amountOutliers =
    std > 0
      ? amounts.filter((amount) => Math.abs((amount - avgAmount) / std) > 3)
          .length
      : 0;

  return {
    transactionCount: sortedTxns.length,
    totalAmount,
    avgAmount,
    highVelocityPeriods,
    roundAmountRatio,
    largeTransactionCount,
    offHoursRatio,
    uniqueCounterparties,
    circularTransactions,
    amountOutliers,
  };
};

// Calculate fraud score (matching Python model logic)
const calculateFraudScore = (
  features: UserRiskData['features'],
): [number, Record<string, string>] => {
  if (features.transactionCount === 0) {
    return [0, {}];
  }

  let score = 0;
  const reasons: Record<string, string> = {};

  // High velocity scoring (0-25 points)
  if (features.highVelocityPeriods > 0) {
    const velocityScore = Math.min(features.highVelocityPeriods * 10, 25);
    score += velocityScore;
    reasons['high_velocity'] =
      `${features.highVelocityPeriods} rapid transaction periods`;
  }

  // Amount anomaly scoring (0-20 points)
  if (features.amountOutliers > 0) {
    const outlierScore = Math.min(features.amountOutliers * 5, 20);
    score += outlierScore;
    reasons['amount_outliers'] =
      `${features.amountOutliers} transactions with unusual amounts`;
  }

  // Round amounts scoring (0-15 points)
  if (features.roundAmountRatio > 0.5) {
    const roundScore = features.roundAmountRatio * 15;
    score += roundScore;
    reasons['round_amounts'] =
      `${(features.roundAmountRatio * 100).toFixed(1)}% of amounts are round numbers`;
  }

  // Large transaction scoring (0-20 points)
  if (features.largeTransactionCount > 0) {
    const largeTxnRatio =
      features.largeTransactionCount / features.transactionCount;
    const largeScore = Math.min(largeTxnRatio * 20, 20);
    score += largeScore;
    reasons['large_transactions'] =
      `${features.largeTransactionCount} very large transactions`;
  }

  // Off-hours activity scoring (0-15 points)
  if (features.offHoursRatio > 0.3) {
    const offHoursScore = features.offHoursRatio * 15;
    score += offHoursScore;
    reasons['off_hours'] =
      `${(features.offHoursRatio * 100).toFixed(1)}% of transactions during off hours`;
  }

  // Circular transaction scoring (0-10 points)
  if (features.circularTransactions) {
    score += 10;
    reasons['circular_transactions'] =
      'Potential circular transaction patterns detected';
  }

  // Low diversity scoring (0-5 points)
  if (features.transactionCount > 5 && features.uniqueCounterparties <= 2) {
    score += 5;
    reasons['low_diversity'] =
      `Only ${features.uniqueCounterparties} unique counterparties`;
  }

  return [Math.min(score, 100), reasons];
};

// Get risk level from score
const getRiskLevel = (score: number): 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL' => {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  if (score >= 20) return 'LOW';
  return 'MINIMAL';
};

// Calculate overall features for the transaction set
const calculateOverallFeatures = (transactions: RawTransaction[]) => {
  const uniqueUsers = new Set(
    [
      ...transactions.map((tx) => tx.senderId),
      ...transactions.map((tx) => tx.receiverId),
      ...transactions.map((tx) => tx.owner),
    ].filter(Boolean),
  ).size;

  const totalVolume = transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.amount),
    0,
  );
  const avgTransactionSize = totalVolume / transactions.length;

  // Time span analysis
  const timestamps = transactions.map((tx) => tx.createdAt).sort();
  const timeSpanMs = timestamps[timestamps.length - 1] - timestamps[0];
  const timeSpanHours = timeSpanMs / (1000 * 60 * 60);
  const transactionRate = transactions.length / Math.max(timeSpanHours, 0.01);

  // Volume concentration
  const userVolumes = transactions.reduce(
    (acc, tx) => {
      const userId = tx.senderId || tx.owner;
      if (userId) {
        acc[userId] = (acc[userId] || 0) + parseFloat(tx.amount);
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const maxUserVolume = Math.max(...Object.values(userVolumes));
  const volumeConcentration = maxUserVolume / totalVolume;

  return {
    totalTransactions: transactions.length,
    uniqueUsers,
    totalVolume,
    avgTransactionSize,
    timeSpanHours,
    transactionRate,
    volumeConcentration,
  };
};

// Calculate overall fraud score
const calculateOverallScore = (
  features: any,
): [number, Record<string, string>] => {
  let score = 0;
  const reasons: Record<string, string> = {};

  // High transaction rate (0-20 points)
  if (features.transactionRate > 10) {
    const rateScore = Math.min((features.transactionRate - 10) * 2, 20);
    score += rateScore;
    reasons['high_rate'] =
      `High transaction rate: ${features.transactionRate.toFixed(1)} per hour`;
  }

  // Volume concentration (0-15 points)
  if (features.volumeConcentration > 0.8) {
    const concScore = features.volumeConcentration * 15;
    score += concScore;
    reasons['concentration'] =
      `High volume concentration: ${(features.volumeConcentration * 100).toFixed(1)}%`;
  }

  return [Math.min(score, 100), reasons];
};

// Run fraud detection analysis
const runFraudDetection = (
  transactions: RawTransaction[],
): FraudDetectionResult => {
  // Get all unique users
  const allUsers = new Set(
    [
      ...transactions.map((tx) => tx.senderId),
      ...transactions.map((tx) => tx.receiverId),
      ...transactions.map((tx) => tx.owner),
    ].filter(Boolean),
  );

  const users: Record<string, UserRiskData> = {};

  // Analyze each user
  for (const userId of allUsers) {
    const features = calculateUserFeatures(transactions, userId);
    if (features.transactionCount > 0) {
      const [fraudScore, reasons] = calculateFraudScore(features);
      users[userId] = {
        userId,
        fraudScore,
        riskLevel: getRiskLevel(fraudScore),
        reasons,
        features,
      };
    }
  }

  // Calculate overall analysis
  const overallFeatures = calculateOverallFeatures(transactions);
  const [overallScore, overallReasons] = calculateOverallScore(overallFeatures);

  return {
    users,
    overall: {
      fraudScore: overallScore,
      riskLevel: getRiskLevel(overallScore),
      reasons: overallReasons,
      features: overallFeatures,
    },
  };
};

// Calculate transaction-specific fraud flags
const getTransactionFraudFlags = (
  rawTransaction: RawTransaction,
  userRiskData?: UserRiskData,
): string[] => {
  const flags: string[] = [];
  const rawAmount = parseFloat(rawTransaction.amount);

  // Transaction-specific flags
  if (rawAmount >= THRESHOLDS.largeAmountThreshold) {
    flags.push('Very large amount');
  } else if (rawAmount > 500000000) {
    flags.push('Large amount');
  }

  if (rawTransaction.status !== 'completed') {
    flags.push('Incomplete transaction');
  }

  if (rawTransaction.type === 'top-up' && rawAmount > 500000000) {
    flags.push('Suspicious top-up');
  }

  // Check if transaction is during off-hours
  const hour = new Date(rawTransaction.createdAt).getHours();
  if (hour >= THRESHOLDS.offHoursStart || hour < THRESHOLDS.offHoursEnd) {
    flags.push('Off-hours transaction');
  }

  // Add user-level flags if available
  if (userRiskData) {
    if (userRiskData.features.highVelocityPeriods > 0) {
      flags.push('User has rapid transaction patterns');
    }
    if (userRiskData.features.circularTransactions) {
      flags.push('User involved in circular transactions');
    }
    if (userRiskData.features.amountOutliers > 0) {
      flags.push('User has unusual transaction amounts');
    }
    if (userRiskData.features.offHoursRatio > 0.5) {
      flags.push('User frequently transacts off-hours');
    }
    if (
      userRiskData.features.uniqueCounterparties <= 2 &&
      userRiskData.features.transactionCount > 5
    ) {
      flags.push('User has limited counterparties');
    }
  }

  return flags;
};

// Calculate transaction-specific risk score
const getTransactionRiskScore = (
  rawTransaction: RawTransaction,
  userRiskData?: UserRiskData,
): number => {
  let score = 0;
  const rawAmount = parseFloat(rawTransaction.amount);

  // Amount-based scoring
  if (rawAmount >= THRESHOLDS.largeAmountThreshold) {
    score += 40; // Very large amount
  } else if (rawAmount > 500000000) {
    score += 25; // Large amount
  } else if (rawAmount > 100000000) {
    score += 15; // Medium amount
  }

  // Round amount scoring
  if (rawAmount % THRESHOLDS.roundAmountThreshold === 0) {
    score += 10;
  }

  // Status scoring
  if (rawTransaction.status !== 'completed') {
    score += 30;
  }

  // Type-based scoring
  switch (rawTransaction.type) {
    case 'top-up':
      if (rawAmount > 500000000) score += 20;
      else score += 10;
      break;
    case 'gift-give':
      if (rawAmount > 1000000000) score += 15;
      else score += 5;
      break;
    case 'fee':
      score += 5;
      break;
    case 'gift-receive':
      score += 3;
      break;
  }

  // Off-hours scoring
  const hour = new Date(rawTransaction.createdAt).getHours();
  if (hour >= THRESHOLDS.offHoursStart || hour < THRESHOLDS.offHoursEnd) {
    score += 15;
  }

  // Add user risk influence (but cap it to avoid overwhelming transaction-specific factors)
  if (userRiskData) {
    const userInfluence = Math.min(userRiskData.fraudScore * 0.3, 25); // Max 25 points from user risk
    score += userInfluence;
  }

  return Math.min(score, 100);
};

// Transform transaction with enhanced fraud detection
export const transformTransaction = (
  rawTransaction: RawTransaction,
  userRiskData?: UserRiskData,
): Transaction => {
  const amount = parseFloat(rawTransaction.amount) / 1000000; // Convert to readable format

  // Calculate transaction-specific risk score and flags
  const riskScore = getTransactionRiskScore(rawTransaction, userRiskData);
  const riskLevel = getRiskLevel(riskScore);
  const fraudFlags = getTransactionFraudFlags(rawTransaction, userRiskData);

  return {
    id: rawTransaction._id,
    from: rawTransaction.senderId,
    to: rawTransaction.receiverId,
    amount,
    timestamp: rawTransaction.createdAt,
    riskScore,
    riskLevel,
    fraudFlags,
    gasUsed: Math.floor(Math.random() * 200000) + 21000,
    blockNumber: Math.floor(Math.random() * 1000000) + 18950000,
    type: rawTransaction.type,
    status: rawTransaction.status,
    txHash: rawTransaction.txHash,
  };
};

// Transform API response with comprehensive fraud detection
export const transformApiResponse = (
  rawTransactions: RawTransaction[],
): AnalysisData => {
  // Run fraud detection analysis
  const fraudDetectionResult = runFraudDetection(rawTransactions);

  // Transform transactions with fraud detection data
  const transactions = rawTransactions.map((rawTx) => {
    // Find user risk data for this transaction
    const senderId = rawTx.senderId;
    const userRiskData = senderId
      ? fraudDetectionResult.users[senderId]
      : undefined;
    return transformTransaction(rawTx, userRiskData);
  });

  const totalTransactions = transactions.length;
  const highRiskCount = transactions.filter(
    (tx) => tx.riskLevel === 'HIGH',
  ).length;
  const mediumRiskCount = transactions.filter(
    (tx) => tx.riskLevel === 'MEDIUM',
  ).length;
  const lowRiskCount = transactions.filter(
    (tx) => tx.riskLevel === 'LOW',
  ).length;
  const minimalRiskCount = transactions.filter(
    (tx) => tx.riskLevel === 'MINIMAL',
  ).length;
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Generate comprehensive suspicious patterns
  const suspiciousPatterns: string[] = [];

  // Add patterns from overall fraud detection
  Object.values(fraudDetectionResult.overall.reasons).forEach((reason) => {
    suspiciousPatterns.push(reason);
  });

  // Add high-risk user patterns
  const highRiskUsers = Object.values(fraudDetectionResult.users).filter(
    (user) => user.riskLevel === 'HIGH',
  );

  if (highRiskUsers.length > 0) {
    suspiciousPatterns.push(`${highRiskUsers.length} high-risk users detected`);
  }

  // Add specific pattern detections
  if (highRiskCount > totalTransactions * 0.3) {
    suspiciousPatterns.push('High proportion of risky transactions detected');
  }

  const rapidTransactionUsers = Object.values(
    fraudDetectionResult.users,
  ).filter((user) => user.features.highVelocityPeriods > 0);
  if (rapidTransactionUsers.length > 0) {
    suspiciousPatterns.push(
      `${rapidTransactionUsers.length} users with rapid transaction patterns`,
    );
  }

  const circularTransactionUsers = Object.values(
    fraudDetectionResult.users,
  ).filter((user) => user.features.circularTransactions);
  if (circularTransactionUsers.length > 0) {
    suspiciousPatterns.push(
      `${circularTransactionUsers.length} users with circular transaction patterns`,
    );
  }

  return {
    transactions,
    totalTransactions,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    minimalRiskCount,
    totalVolume,
    suspiciousPatterns,
    fraudDetectionResult,
  };
};
