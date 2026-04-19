import { useMemo } from "react";

export function PrismBackground() {
  // Static constellation — generated once
  const stars = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.6 + 0.6,
        opacity: Math.random() * 0.5 + 0.2,
      })),
    [],
  );

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ background: "hsl(var(--prism-bg))" }}
      aria-hidden
    >
      {/* Hexagonal grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--prism-cyan)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--prism-cyan)) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

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

      {/* Vertical scan ray */}
      <div
        className="absolute left-0 right-0 h-[200px] motion-reduce:hidden"
        style={{
          background:
            "linear-gradient(180deg, transparent, hsl(var(--prism-cyan) / 0.04), transparent)",
          animation: "prism-scan-ray 18s linear infinite",
        }}
      />
    </div>
  );
}
