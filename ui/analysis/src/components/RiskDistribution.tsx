import type { RiskDistributionData } from '../types/index.js';

type RiskDistributionProps = {
  riskDistribution: RiskDistributionData;
  totalTransactions: number;
};

export const RiskDistribution = ({
  riskDistribution,
  totalTransactions,
}: RiskDistributionProps) => {
  return (
    <view
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '24px',
        marginBottom: '32px',
      }}
    >
      <text
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '16px',
          display: 'block',
        }}
      >
        Risk Distribution
      </text>
      <view
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        <view style={{ textAlign: 'center' }}>
          <text
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#dc2626',
              display: 'block',
            }}
          >
            {riskDistribution.high}
          </text>
          <text
            style={{ fontSize: '14px', color: '#6b7280', display: 'block' }}
          >
            High Risk
          </text>
          <view
            style={{
              width: '100%',
              backgroundColor: '#fecaca',
              borderRadius: '4px',
              height: '8px',
              marginTop: '8px',
              overflow: 'hidden',
            }}
          >
            <view
              style={{
                backgroundColor: '#dc2626',
                height: '8px',
                borderRadius: '4px',
                width: `${(riskDistribution.high / totalTransactions) * 100}%`,
              }}
            />
          </view>
        </view>
        <view style={{ textAlign: 'center' }}>
          <text
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#d97706',
              display: 'block',
            }}
          >
            {riskDistribution.medium}
          </text>
          <text
            style={{ fontSize: '14px', color: '#6b7280', display: 'block' }}
          >
            Medium Risk
          </text>
          <view
            style={{
              width: '100%',
              backgroundColor: '#fed7aa',
              borderRadius: '4px',
              height: '8px',
              marginTop: '8px',
              overflow: 'hidden',
            }}
          >
            <view
              style={{
                backgroundColor: '#d97706',
                height: '8px',
                borderRadius: '4px',
                width: `${(riskDistribution.medium / totalTransactions) * 100}%`,
              }}
            />
          </view>
        </view>
        <view style={{ textAlign: 'center' }}>
          <text
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#059669',
              display: 'block',
            }}
          >
            {riskDistribution.low}
          </text>
          <text
            style={{ fontSize: '14px', color: '#6b7280', display: 'block' }}
          >
            Low Risk
          </text>
          <view
            style={{
              width: '100%',
              backgroundColor: '#bbf7d0',
              borderRadius: '4px',
              height: '8px',
              marginTop: '8px',
              overflow: 'hidden',
            }}
          >
            <view
              style={{
                backgroundColor: '#059669',
                height: '8px',
                borderRadius: '4px',
                width: `${(riskDistribution.low / totalTransactions) * 100}%`,
              }}
            />
          </view>
        </view>

        {/* Minimal Risk */}
        <view style={{ flex: 1 }}>
          <text
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#6b7280',
              display: 'block',
            }}
          >
            {riskDistribution.minimal}
          </text>
          <text
            style={{ fontSize: '14px', color: '#6b7280', display: 'block' }}
          >
            Minimal Risk
          </text>
          <view
            style={{
              width: '100%',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              height: '8px',
              marginTop: '8px',
              overflow: 'hidden',
            }}
          >
            <view
              style={{
                backgroundColor: '#6b7280',
                height: '8px',
                borderRadius: '4px',
                width: `${(riskDistribution.minimal / totalTransactions) * 100}%`,
              }}
            />
          </view>
        </view>
      </view>
    </view>
  );
};
