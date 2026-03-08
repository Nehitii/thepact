import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';

interface AnimatedNumberProps {
  value: number;
  currency: string;
  isPositive: boolean;
  className?: string;
}

export function AnimatedNumber({ value, currency, isPositive, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={className || `neu-hero-balance ${!isPositive ? 'negative' : ''}`}>
      {isPositive ? '+' : ''}{formatCurrency(displayValue, currency)}
    </span>
  );
}