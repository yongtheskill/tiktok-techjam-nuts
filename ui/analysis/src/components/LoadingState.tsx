export const LoadingState = () => {
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
            width: '32px',
            height: '32px',
            border: '4px solid #3b82f6',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite',
          }}
        />
        <text style={{ color: '#6b7280' }}>
          Analyzing platform transactions...
        </text>
      </view>
    </view>
  );
};
