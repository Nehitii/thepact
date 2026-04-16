import { useMemo } from "react";

interface HealthBioMeshProps {
  /** 0-100. Shifts the ambient color cyan → amber → red. */
  score?: number;
}

/**
 * Score-reactive bio-medical background.
 * Layers:
 *  1. Hexagonal mesh (DNA/circuit feel)
 *  2. Slow vertical scanline (8s loop)
 *  3. Floating bio-particles (3-5 dots)
 *  4. Score-reactive radial ambient glow
 *
 * All layers respect motion-reduce.
 */
export function HealthBioMesh({ score = 75 }: HealthBioMeshProps) {
  // Score → ambient color
  const ambientColor =
    score >= 80
      ? "hsl(187, 100%, 50%)" // phosphor cyan
      : score >= 50
        ? "hsl(43, 100%, 50%)" // amber
        : "hsl(0, 85%, 60%)"; // critical

  const particles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: 15 + Math.random() * 70,
        top: 10 + Math.random() * 80,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 6,
        duration: 8 + Math.random() * 6,
      })),
    []
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden motion-reduce:hidden"
      aria-hidden="true"
    >
      {/* Layer 1: Score-reactive ambient orbs */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-full blur-[140px] transition-all duration-[3000ms]"
        style={{
          background: `radial-gradient(ellipse at center, ${ambientColor}10 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full blur-[120px]"
        style={{
          background: `radial-gradient(circle, hsl(var(--hud-amber) / 0.04) 0%, transparent 65%)`,
        }}
      />

      {/* Layer 2: Hexagonal bio-mesh */}
      <div
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'%3E%3Cpath d='M30 0L60 17.32V34.64L30 52L0 34.64V17.32z' fill='none' stroke='${encodeURIComponent(
            ambientColor
          )}' stroke-width='0.5' stroke-opacity='0.6'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 52px",
        }}
      />

      {/* Layer 3: Subtle data grid */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(${ambientColor} 1px, transparent 1px),
            linear-gradient(90deg, ${ambientColor} 1px, transparent 1px)
          `,
          backgroundSize: "120px 120px",
        }}
      />

      {/* Layer 4: Slow vertical scanline */}
      <div
        className="absolute left-0 right-0 h-[180px] pointer-events-none"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${ambientColor}08 50%, transparent 100%)`,
          animation: "health-bio-vscan 12s linear infinite",
          willChange: "transform",
        }}
      />

      {/* Layer 5: Floating bio-particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: ambientColor,
            boxShadow: `0 0 ${p.size * 3}px ${ambientColor}`,
            opacity: 0.4,
            animation: `health-bio-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            willChange: "transform, opacity",
          }}
        />
      ))}

      {/* Layer 6: Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, hsl(var(--background) / 0.4) 100%)",
        }}
      />
    </div>
  );
}
