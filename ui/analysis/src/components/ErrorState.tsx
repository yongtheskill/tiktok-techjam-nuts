type ErrorStateProps = {
  error: string;
};

export const ErrorState = ({ error }: ErrorStateProps) => {
  return (
    <view
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <view style={{ textAlign: 'center' }}>
        <view
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <text style={{ fontSize: '24px' }}>⚠️</text>
        </view>
        <text
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '8px',
            display: 'block',
          }}
        >
          Analysis Failed
        </text>
        <text style={{ color: '#6b7280' }}>{error}</text>
      </view>
    </view>
  );
};
