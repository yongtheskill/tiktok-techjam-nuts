import type { Transaction } from '../types/index.js';
import { RiskBadge } from './RiskBadge.js';

type TransactionCardProps = {
  transaction: Transaction;
};

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  return (
    <view
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}
    >
      <view
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <view style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <text style={{ fontSize: '14px', color: '#6b7280' }}>
            Block #{transaction.blockNumber}
          </text>
          <view
            style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              padding: '2px 6px',
              fontSize: '12px',
              borderRadius: '4px',
              textTransform: 'capitalize',
            }}
          >
            <text>{transaction.type}</text>
          </view>
          <view
            style={{
              backgroundColor:
                transaction.status === 'completed' ? '#f0fdf4' : '#fef2f2',
              color: transaction.status === 'completed' ? '#065f46' : '#991b1b',
              padding: '2px 6px',
              fontSize: '12px',
              borderRadius: '4px',
              textTransform: 'capitalize',
            }}
          >
            <text>{transaction.status}</text>
          </view>
        </view>
        <RiskBadge
          score={transaction.riskScore}
          level={transaction.riskLevel}
        />
      </view>

      <view style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <view style={{ display: 'flex', justifyContent: 'space-between' }}>
          <text style={{ fontSize: '14px', color: '#6b7280' }}>From:</text>
          <text
            style={{
              fontSize: '14px',
              fontFamily: 'monospace',
              color: '#111827',
              maxWidth: '500px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {transaction.from}
          </text>
        </view>
        <view style={{ display: 'flex', justifyContent: 'space-between' }}>
          <text style={{ fontSize: '14px', color: '#6b7280' }}>To:</text>
          <text
            style={{
              fontSize: '14px',
              fontFamily: 'monospace',
              color: '#111827',
              maxWidth: '500px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {transaction.to}
          </text>
        </view>
        <view style={{ display: 'flex', justifyContent: 'space-between' }}>
          <text style={{ fontSize: '14px', color: '#6b7280' }}>Amount:</text>
          <text
            style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827' }}
          >
            {transaction.amount.toFixed(2)} ttcoins
          </text>
        </view>
        {transaction.txHash && (
          <view style={{ display: 'flex', justifyContent: 'space-between' }}>
            <text style={{ fontSize: '14px', color: '#6b7280' }}>Tx Hash:</text>
            <text
              style={{
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#111827',
                maxWidth: '250px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {transaction.txHash}
            </text>
          </view>
        )}
        <view style={{ display: 'flex', justifyContent: 'space-between' }}>
          <text style={{ fontSize: '14px', color: '#6b7280' }}>Gas Used:</text>
          <text style={{ fontSize: '14px', color: '#111827' }}>
            {transaction.gasUsed.toLocaleString()}
          </text>
        </view>
      </view>

      {transaction.fraudFlags.length > 0 && (
        <view
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #f3f4f6',
          }}
        >
          <text
            style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}
          >
            Fraud Indicators:
          </text>
          <view style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {transaction.fraudFlags.map((flag, index) => (
              <view
                key={index}
                style={{
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  padding: '2px 6px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #fecaca',
                }}
              >
                <text>{flag}</text>
              </view>
            ))}
          </view>
        </view>
      )}
    </view>
  );
};
