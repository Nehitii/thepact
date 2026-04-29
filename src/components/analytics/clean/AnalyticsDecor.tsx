import { useMemo } from "react";

/**
 * Soft decorative background for Analytics: floating orbs + subtle grid.
 * Editorial / data-viz vibe — not futuristic.
 */
export function AnalyticsDecor() {
  const orbs = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * 80,
        y: 5 + Math.random() * 80,
        size: 280 + Math.random() * 220,
        delay: i * 1.4,
        duration: 14 + Math.random() * 8,
        hue: i % 2 === 0 ? "var(--primary)" : "var(--primary)",
        opacity: 0.06 + Math.random() * 0.05,
      })),
    [],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* faint dotted grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* floating orbs */}
      {orbs.map((o) => (
        <span
          key={o.id}
          className="absolute rounded-full blur-3xl motion-reduce:hidden"
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            width: o.size,
            height: o.size,
            background: `radial-gradient(circle, hsl(${o.hue} / ${o.opacity}) 0%, transparent 70%)`,
            transform: "translate(-50%, -50%)",
            animation: `analyticsOrb ${o.duration}s ease-in-out ${o.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes analyticsOrb {
          0%   { transform: translate(-50%, -50%) translate(0, 0) scale(1); }
          50%  { transform: translate(-50%, -50%) translate(20px, -30px) scale(1.08); }
          100% { transform: translate(-50%, -50%) translate(-25px, 25px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}