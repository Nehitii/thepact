import { useMemo } from "react";

const FRAGMENTS = [
  "0xFA42",
  "SEQ.7B3",
  ">EXEC",
  "RDY",
  "02:14:09",
  "LOG.OK",
  "0x91C0",
  "TX.4A2",
  "ACK",
  "PKT.55",
  ">SYNC",
  "0xDE7F",
  "BUF.3E",
  "REQ.OK",
  "0xB1A9",
];

interface PrismDataNoiseProps {
  count?: number;
}

/**
 * PrismDataNoise — Static cyber data fragments scattered as ambient background.
 * No animation to avoid distraction.
 */
export function PrismDataNoise({ count = 10 }: PrismDataNoiseProps) {
  const fragments = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        text: FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)],
        x: Math.random() * 95,
        y: Math.random() * 95,
        size: 10 + Math.random() * 4,
        opacity: 0.03 + Math.random() * 0.04,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10" aria-hidden>
      {fragments.map((f) => (
        <span
          key={f.id}
          className="absolute font-mono uppercase tracking-wider text-[hsl(var(--prism-cyan))] select-none whitespace-nowrap"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            fontSize: `${f.size}px`,
            opacity: f.opacity,
          }}
        >
          {f.text}
        </span>
      ))}
    </div>
  );
}
