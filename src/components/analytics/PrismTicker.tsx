import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PrismTickerProps {
  text: string;
  className?: string;
  /** Stagger delay per character in ms */
  stagger?: number;
  /** Max chars before splitting on word (perf) */
  maxChars?: number;
}

/**
 * PrismTicker — char-by-char reveal animation.
 * Used for headline insights. Respects prefers-reduced-motion via CSS.
 */
export function PrismTicker({ text, className, stagger = 22, maxChars = 80 }: PrismTickerProps) {
  const chars = useMemo(() => {
    const safe = (text ?? "").slice(0, maxChars);
    return Array.from(safe);
  }, [text, maxChars]);

  return (
    <span className={cn("inline-block", className)} aria-label={text}>
      {chars.map((c, i) => (
        <span
          key={`${i}-${c}`}
          className="prism-ticker-char"
          style={{ animationDelay: `${i * stagger}ms` }}
          aria-hidden
        >
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </span>
  );
}