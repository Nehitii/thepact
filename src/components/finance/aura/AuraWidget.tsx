import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

type AuraTone = 'mint' | 'rose' | 'electric' | 'amber';

interface AuraWidgetProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string | null;
  sparkline?: number[];
  tone?: AuraTone;
  delay?: number;
}

const TONE: Record<AuraTone, { glow: string; ring: string; spark: string }> = {
  mint: {
    glow: 'hsl(var(--aura-mint) / 0.45)',
    ring: 'hsl(var(--aura-mint) / 0.6)',
    spark: 'hsl(var(--aura-mint))',
  },
  rose: {
    glow: 'hsl(350 80% 60% / 0.4)',
    ring: 'hsl(350 80% 65% / 0.6)',
    spark: 'hsl(350 80% 65%)',
  },
  electric: {
    glow: 'hsl(var(--aura-electric) / 0.4)',
    ring: 'hsl(var(--aura-electric) / 0.55)',
    spark: 'hsl(var(--aura-electric))',
  },
  amber: {
    glow: 'hsl(40 95% 60% / 0.4)',
    ring: 'hsl(40 95% 60% / 0.55)',
    spark: 'hsl(40 95% 60%)',
  },
};

export function AuraWidget({
  icon: Icon,
  label,
  value,
  sublabel,
  sparkline,
  tone = 'electric',
  delay = 0,
}: AuraWidgetProps) {
  const t = TONE[tone];

  const sparkPath = (() => {
    if (!sparkline || sparkline.length < 2) return null;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const w = 100;
    const h = 24;
    const step = w / (sparkline.length - 1);
    const pts = sparkline.map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${pts.join(' L ')}`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="aura-glass aura-widget group relative overflow-hidden p-5"
      style={{ ['--tone-glow' as string]: t.glow, ['--tone-ring' as string]: t.ring }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 0%, ${t.glow}, transparent 60%)` }}
      />

      <div className="relative">
        {/* Icon orb */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${t.glow}, transparent 70%)`,
              boxShadow: `0 0 0 1px ${t.ring} inset`,
            }}
          >
            <Icon className="w-4 h-4" style={{ color: t.spark }} />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
            {label}
          </span>
        </div>

        {/* Value */}
        <p className="font-mono tabular-nums text-2xl sm:text-[26px] font-semibold text-foreground leading-none break-all">
          {value}
        </p>

        {sublabel && (
          <p className="mt-1.5 text-[11px] text-muted-foreground/70 truncate">{sublabel}</p>
        )}

        {/* Sparkline */}
        {sparkPath && (
          <svg
            viewBox="0 0 100 24"
            preserveAspectRatio="none"
            className="mt-4 w-full h-6 opacity-70 group-hover:opacity-100 transition-opacity"
          >
            <path
              d={sparkPath}
              fill="none"
              stroke={t.spark}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </motion.div>
  );
}
