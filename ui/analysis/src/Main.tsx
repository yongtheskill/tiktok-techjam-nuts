import type { MainProps } from './types/index.js';
import { useAnalysisData } from './hooks/useAnalysisData.js';
import { LoadingState } from './components/LoadingState.js';
import { ErrorState } from './components/ErrorState.js';
import { EmptyState } from './components/EmptyState.js';
import { Header } from './components/Header.js';
import { StatsOverview } from './components/StatsOverview.js';
import { RiskDistribution } from './components/RiskDistribution.js';
import { SuspiciousPatterns } from './components/SuspiciousPatterns.js';
import { TransactionsList } from './components/TransactionsList.js';

export const Main = ({ token }: MainProps) => {
  const { data, loading, error } = useAnalysisData(token);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!data) {
    return <EmptyState />;
  }

  const riskDistribution = {
    high: data.highRiskCount,
    medium: data.mediumRiskCount,
    low: data.lowRiskCount,
    minimal: data.minimalRiskCount,
  };

  return (
    <view
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header token={token} />

      <view style={{ display: 'flex', height: 'calc(100vh - 210px)' }}>
        {/* Left side - Analysis Statistics (Fixed, Non-scrollable) */}
        <view
          style={{
            width: '40%',
            minWidth: '400px',
            padding: '32px 24px',
            backgroundColor: '#f9fafb',
            borderRight: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          <StatsOverview
            totalTransactions={data.totalTransactions}
            riskDistribution={riskDistribution}
            totalVolume={data.totalVolume}
            suspiciousPatternsCount={data.suspiciousPatterns.length}
          />

          <RiskDistribution
            riskDistribution={riskDistribution}
            totalTransactions={data.totalTransactions}
          />

          <SuspiciousPatterns patterns={data.suspiciousPatterns} />
        </view>

        {/* Right side - Transactions List (Scrollable) */}
        <view
          style={{
            width: '60%',
            height: '100%',
            padding: '32px 24px',
            backgroundColor: '#ffffff',
            overflow: 'auto',
          }}
        >
          <TransactionsList transactions={data.transactions} />
        </view>
      </view>
    </view>
  );
};
