/**
 * AURA Neo-Banking background.
 * Deep midnight base + slow drifting radial orbs (electric blue + mint).
 * Very subtle 120px grid. No tactical particles.
 */
export function AuraBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[hsl(var(--aura-bg))]">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
        }}
      />

      {/* Electric Blue orb */}
      <div
        className="absolute -top-[20%] -left-[10%] h-[60vw] w-[60vw] max-h-[800px] max-w-[800px] rounded-full blur-3xl opacity-[0.18] motion-safe:animate-[aura-orb-drift_28s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(circle, hsl(var(--aura-electric) / 0.55), transparent 65%)' }}
      />

      {/* Mint orb */}
      <div
        className="absolute -bottom-[20%] -right-[10%] h-[55vw] w-[55vw] max-h-[700px] max-w-[700px] rounded-full blur-3xl opacity-[0.14] motion-safe:animate-[aura-orb-drift_34s_ease-in-out_infinite_reverse]"
        style={{ background: 'radial-gradient(circle, hsl(var(--aura-mint) / 0.5), transparent 65%)' }}
      />

      {/* Soft center violet hint */}
      <div
        className="absolute top-[40%] left-[50%] -translate-x-1/2 h-[40vw] w-[40vw] max-h-[500px] max-w-[500px] rounded-full blur-3xl opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, hsl(260 80% 60% / 0.4), transparent 70%)' }}
      />

      {/* Top vignette */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[hsl(var(--aura-bg))] to-transparent" />
    </div>
  );
}
