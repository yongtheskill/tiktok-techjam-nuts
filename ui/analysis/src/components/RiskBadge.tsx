import type { RiskLevel } from '../types/index.js';

type RiskBadgeProps = {
  score: number;
  level?: 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
};

const getRiskLevel = (score: number): RiskLevel => {
  if (score >= 70)
    return { level: 'HIGH', color: '#dc2626', bgColor: '#fef2f2' };
  if (score >= 40)
    return { level: 'MEDIUM', color: '#d97706', bgColor: '#fffbeb' };
  if (score >= 20)
    return { level: 'LOW', color: '#059669', bgColor: '#f0fdf4' };
  return { level: 'MINIMAL', color: '#6b7280', bgColor: '#f9fafb' };
};

const getRiskLevelFromString = (
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL',
): RiskLevel => {
  switch (level) {
    case 'HIGH':
      return { level: 'HIGH', color: '#dc2626', bgColor: '#fef2f2' };
    case 'MEDIUM':
      return { level: 'MEDIUM', color: '#d97706', bgColor: '#fffbeb' };
    case 'LOW':
      return { level: 'LOW', color: '#059669', bgColor: '#f0fdf4' };
    case 'MINIMAL':
      return { level: 'MINIMAL', color: '#6b7280', bgColor: '#f9fafb' };
  }
};

export const RiskBadge = ({ score, level }: RiskBadgeProps) => {
  const risk = level ? getRiskLevelFromString(level) : getRiskLevel(score);

  return (
    <view
      style={{
        backgroundColor: risk.bgColor,
        color: risk.color,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        border: `1px solid ${risk.color}20`,
      }}
    >
      <text>
        {risk.level} ({score.toFixed(2)}%)
      </text>
    </view>
  );
};
