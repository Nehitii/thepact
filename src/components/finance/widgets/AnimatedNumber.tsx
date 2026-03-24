import { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '@/lib/currency';

interface AnimatedNumberProps {
  value: number;
  currency: string;
  isPositive: boolean;
  className?: string;
}

export function AnimatedNumber({ value, currency, isPositive, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const duration = 800;
    const steps = 50;
    const start = prevValue.current;
    const diff = value - start;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      if (frame >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        // Ease-out interpolation
        const progress = 1 - Math.pow(1 - frame / steps, 3);
        setDisplayValue(start + diff * progress);
      }
    }, duration / steps);

    prevValue.current = value;
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={className || `neu-hero-balance ${!isPositive ? 'negative' : ''}`}>
      {isPositive && value >= 0 ? '+' : ''}{formatCurrency(displayValue, currency)}
    </span>
  );
}
