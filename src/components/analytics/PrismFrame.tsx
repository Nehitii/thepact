/**
 * PrismFrame — Holographic 4-corner framing around the analytics canvas.
 * Pure decorative SVG/CSS, pointer-events disabled.
 */
export function PrismFrame() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 hidden md:block" aria-hidden>
      {/* Top-left L bracket + pulse dot */}
      <div className="absolute -top-2 -left-2">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path
            d="M2 20 L2 2 L20 2"
            stroke="hsl(var(--prism-cyan) / 0.45)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
        <span
          className="absolute top-[1px] left-[1px] h-1.5 w-1.5 rounded-full bg-[hsl(var(--prism-cyan))] motion-reduce:animate-none"
          style={{ animation: "prism-pulse-cyan 2.4s ease-in-out infinite" }}
        />
      </div>

      {/* Top-right horizontal bar + tag */}
      <div className="absolute -top-2 -right-2 flex items-center gap-2">
        <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-[hsl(var(--prism-cyan))]/60">
          [ OBSERVATORY // ACTIVE ]
        </span>
        <span className="block h-px w-[80px] bg-gradient-to-l from-[hsl(var(--prism-cyan))]/50 to-transparent" />
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M2 2 L18 2 L18 18"
            stroke="hsl(var(--prism-cyan) / 0.45)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>

      {/* Bottom-left graduation */}
      <div className="absolute -bottom-2 -left-2 flex items-end gap-1">
        <div className="flex flex-col gap-2 items-end">
          {[100, 75, 50, 25, 0].map((tick) => (
            <div key={tick} className="flex items-center gap-1">
              <span className="font-mono text-[7px] tabular-nums text-[hsl(var(--prism-cyan))]/40">
                {String(tick).padStart(3, "0")}
              </span>
              <span className="block h-px w-2 bg-[hsl(var(--prism-cyan))]/40" />
            </div>
          ))}
        </div>
        <span className="block w-px h-[80px] bg-gradient-to-t from-[hsl(var(--prism-cyan))]/40 to-transparent" />
      </div>

      {/* Bottom-right inverted L + chevron blink */}
      <div className="absolute -bottom-2 -right-2">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path
            d="M40 58 L58 58 L58 40"
            stroke="hsl(var(--prism-cyan) / 0.45)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M48 50 L52 54 L48 58"
            stroke="hsl(var(--prism-cyan) / 0.7)"
            strokeWidth="1"
            fill="none"
            className="motion-reduce:hidden"
            style={{ animation: "prism-pulse-cyan 2s ease-in-out infinite" }}
          />
        </svg>
      </div>
    </div>
  );
}
