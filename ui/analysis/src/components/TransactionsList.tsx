import type { Transaction } from '../types/index.js';
import { TransactionCard } from './TransactionCard.js';

type TransactionsListProps = {
  transactions: Transaction[];
};

export const TransactionsList = ({ transactions }: TransactionsListProps) => {
  return (
    <view
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        padding: '24px',
      }}
    >
      <view
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <text
          style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}
        >
          Transaction Analysis
        </text>
        <text style={{ fontSize: '14px', color: '#6b7280' }}>
          Showing {transactions.length} transactions
        </text>
      </view>

      {transactions.length > 0 ? (
        <view>
          {transactions
            .sort((a, b) => b.riskScore - a.riskScore)
            .map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
        </view>
      ) : (
        <view style={{ textAlign: 'center', padding: '48px 0' }}>
          <view
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#f3f4f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <text style={{ fontSize: '24px' }}>📊</text>
          </view>
          <text
            style={{
              fontSize: '18px',
              fontWeight: '500',
              color: '#111827',
              marginBottom: '8px',
              display: 'block',
            }}
          >
            No Transactions Found
          </text>
          <text style={{ color: '#6b7280' }}>
            No transaction data available for analysis
          </text>
        </view>
      )}
    </view>
  );
};
