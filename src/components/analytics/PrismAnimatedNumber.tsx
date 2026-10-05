import { useEffect, useRef, useState } from "react";

interface PrismAnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

/**
 * PrismAnimatedNumber — interpolates from previous value to new value.
 * Always animates from 0 on first mount (per AnimatedNumber standard).
 */
export function PrismAnimatedNumber({
  value,
  duration = 700,
  format,
  className,
}: PrismAnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    const t0 = performance.now();

    const tick = (now: number) => {
      const elapsed = now - t0;
      const p = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + diff * eased;
      setDisplay(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = value;
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {format ? format(display) : Math.round(display).toLocaleString()}
    </span>
  );
}