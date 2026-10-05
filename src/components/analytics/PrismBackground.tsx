import { useMemo } from "react";

export function PrismBackground() {
  // Static constellation — generated once (reduced count, larger stars)
  const stars = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.8 + 1,
        opacity: Math.random() * 0.5 + 0.25,
      })),
    [],
  );

  // Ambient drifting particles (very subtle)
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 14,
        duration: 12 + Math.random() * 10,
      })),
    [],
  );

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, hsl(220 50% 6%) 0%, hsl(220 60% 2%) 75%)",
      }}
      aria-hidden
    >
      {/* Hex grid — wider, slightly brighter */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--prism-cyan)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--prism-cyan)) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
        }}
      />

      {/* Subtle X scope lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <line x1="0" y1="0" x2="100" y2="100" stroke="hsl(var(--prism-cyan) / 0.05)" strokeWidth="0.05" />
        <line x1="100" y1="0" x2="0" y2="100" stroke="hsl(var(--prism-cyan) / 0.05)" strokeWidth="0.05" />
      </svg>

      {/* Radial glow center */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--prism-cyan) / 0.15) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[500px] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--prism-violet) / 0.18) 0%, transparent 70%)",
        }}
      />

      {/* Constellation */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: "hsl(var(--prism-cyan))",
            opacity: s.opacity,
            boxShadow: `0 0 ${s.size * 3}px hsl(var(--prism-cyan) / 0.5)`,
          }}
        />
      ))}

      {/* Drifting particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="prism-particle motion-reduce:hidden"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
