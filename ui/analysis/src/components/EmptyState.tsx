export const EmptyState = () => {
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
            backgroundColor: '#eff6ff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <text style={{ fontSize: '24px' }}>🔍</text>
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
          Ready to Analyze
        </text>
        <text style={{ color: '#6b7280' }}>
          Enter a token address to begin fraud detection analysis
        </text>
      </view>
    </view>
  );
};
