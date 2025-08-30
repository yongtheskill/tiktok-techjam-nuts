type SuspiciousPatternsProps = {
  patterns: string[];
};

export const SuspiciousPatterns = ({ patterns }: SuspiciousPatternsProps) => {
  if (patterns.length === 0) return null;

  return (
    <view
      style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '32px',
      }}
    >
      <text
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#991b1b',
          marginBottom: '16px',
          display: 'block',
        }}
      >
        🚨 Detected Suspicious Patterns
      </text>
      <view style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {patterns.map((pattern, index) => (
          <view
            key={index}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <view
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#dc2626',
                borderRadius: '50%',
              }}
            />
            <text style={{ color: '#991b1b' }}>{pattern}</text>
          </view>
        ))}
      </view>
    </view>
  );
};
