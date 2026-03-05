import React from 'react';
import { useTranslation } from 'react-i18next';

interface SavingsRateRingProps {
  rate: number;
  size?: number;
}

export function SavingsRateRing({ rate, size = 80 }: SavingsRateRingProps) {
  const { t } = useTranslation();
  const normalizedRate = Math.min(Math.max(rate, -100), 100);
  const isPositive = rate >= 0;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (Math.abs(normalizedRate) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="savings-ring-track"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isPositive ? '#34d399' : '#fb7185'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="savings-ring-progress"
          style={{ '--progress': progress } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {Math.abs(rate)}%
        </span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          {isPositive ? t('finance.monthly.saved') : t('finance.monthly.deficit')}
        </span>
      </div>
    </div>
  );
}
