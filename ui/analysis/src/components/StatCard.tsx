type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
};

const getColorShades = (color: string) => {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    '#3b82f6': { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
    '#dc2626': { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
    '#059669': { bg: '#f0fdf4', border: '#bbf7d0', text: '#065f46' },
    '#d97706': { bg: '#fffbeb', border: '#fed7aa', text: '#92400e' },
  };
  return colors[color] || colors['#3b82f6'];
};

export const StatCard = ({
  title,
  value,
  subtitle,
  color = '#3b82f6',
}: StatCardProps) => {
  const colorShades = getColorShades(color);

  return (
    <view
      style={{
        backgroundColor: colorShades.bg,
        border: `1px solid ${colorShades.border}`,
        borderRadius: '8px',
        padding: '16px',
        color: colorShades.text,
      }}
    >
      <text style={{ fontSize: '14px', fontWeight: '500', opacity: 0.8 }}>
        {title}
      </text>
      <text
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginTop: '4px',
          display: 'block',
        }}
      >
        {value}
      </text>
      {subtitle && (
        <text
          style={{
            fontSize: '14px',
            opacity: 0.8,
            marginTop: '4px',
            display: 'block',
          }}
        >
          {subtitle}
        </text>
      )}
    </view>
  );
};
