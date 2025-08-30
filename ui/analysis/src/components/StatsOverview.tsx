import type { RiskDistributionData } from '../types/index.js';
import { StatCard } from './StatCard.js';

type StatsOverviewProps = {
  totalTransactions: number;
  riskDistribution: RiskDistributionData;
  totalVolume: number;
  suspiciousPatternsCount: number;
};

export const StatsOverview = ({
  totalTransactions,
  riskDistribution,
  totalVolume,
  suspiciousPatternsCount,
}: StatsOverviewProps) => {
  return (
    <view
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '24px',
        marginBottom: '32px',
      }}
    >
      <StatCard
        title="Total Transactions"
        value={totalTransactions.toLocaleString()}
        color="#3b82f6"
      />
      <StatCard
        title="High Risk Transactions"
        value={riskDistribution.high}
        subtitle={`${((riskDistribution.high / totalTransactions) * 100).toFixed(1)}% of total`}
        color="#dc2626"
      />
      <StatCard
        title="Total Volume"
        value={`${totalVolume.toFixed(2)} ttcoins`}
        color="#059669"
      />
      <StatCard
        title="Suspicious Patterns"
        value={suspiciousPatternsCount}
        color="#d97706"
      />
    </view>
  );
};
