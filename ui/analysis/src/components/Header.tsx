type HeaderProps = {
  token: string;
};

export const Header = ({ token }: HeaderProps) => {
  return (
    <view
      style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '24px',
        paddingTop: '5px',
      }}
    >
      <view style={{ width: '100%', margin: '0 auto' }}>
        <view
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <view>
            <text
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#111827',
              }}
            >
              🔒 Fraud Detection
            </text>
            <text
              style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}
            >
              Platform transaction security analysis
            </text>
          </view>
          <view
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '10px',
            }}
          >
            <view
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            <text style={{ fontSize: '14px', color: '#6b7280' }}>
              Live Analysis
            </text>
          </view>
        </view>
      </view>
    </view>
  );
};
