/**
 * PrismDivider — Vertical luminous separator between rail and canvas.
 * Desktop only.
 */
export function PrismDivider() {
  return (
    <div
      className="relative hidden lg:block w-px self-stretch flex-shrink-0"
      style={{
        background:
          "linear-gradient(180deg, transparent, hsl(var(--prism-cyan) / 0.4) 30%, hsl(var(--prism-cyan) / 0.4) 70%, transparent)",
      }}
      aria-hidden
    >
      {[0.15, 0.5, 0.85].map((y, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 left-1/2 h-1.5 w-1.5 rounded-full bg-[hsl(var(--prism-cyan))] motion-reduce:animate-none"
          style={{
            top: `${y * 100}%`,
            animation: `prism-pulse-cyan ${2.2 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.6}s`,
            boxShadow: "0 0 8px hsl(var(--prism-cyan) / 0.7)",
          }}
        />
      ))}
    </div>
  );
}
