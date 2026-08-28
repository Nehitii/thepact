import { useMemo } from "react";

interface DSDataNoiseProps {
  count?: number;
  className?: string;
}

const FRAGMENTS = [
  "0xFA42", "SEQ.7B3", ">EXEC", "RDY", "02:14:09", "LOG.OK",
  "0xC0DE", "SYS.UP", "PKT.0019", "ACK", "TX.4F", "CRC.PASS",
  "BUF.99%", "I/O", "<HALT>", "0x7E", "EVT.RX", "MAP.01",
];

/**
 * Pacte OS — Ambient data noise overlay.
 * Static (non-animated) low-opacity mono fragments scattered as background texture.
 * Use inside a position:relative container; auto position: absolute inset-0.
 */
export function DSDataNoise({ count = 10, className }: DSDataNoiseProps) {
  const items = useMemo(() => {
    return Array.from({ length: count }, () => ({
      text: FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)],
      top:  Math.random() * 100,
      left: Math.random() * 100,
      size: 10 + Math.random() * 4,
    }));
  }, [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className ?? ""}`} aria-hidden>
      {items.map((it, i) => (
        <span
          key={i}
          className="absolute font-mono uppercase tracking-wider text-ds-accent-primary"
          style={{
            top: `${it.top}%`,
            left: `${it.left}%`,
            fontSize: `${it.size}px`,
            opacity: 0.04,
          }}
        >
          {it.text}
        </span>
      ))}
    </div>
  );
}