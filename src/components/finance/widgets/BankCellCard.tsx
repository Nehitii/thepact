import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';

type LedStatus = 'positive' | 'negative' | 'warning' | 'neutral';

interface BankCellCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  status?: LedStatus;
  deltaLabel?: string | null; // e.g. "+2.1% MoM" or "—"
  deltaPositive?: boolean | null;
  sparkline?: number[]; // last 6 monthly values
  delay?: number;
}

const LED_COLORS: Record<LedStatus, string> = {
  positive: 'bg-emerald-400 text-emerald-400',
  negative: 'bg-rose-400 text-rose-400',
  warning: 'bg-amber-400 text-amber-400',
  neutral: 'bg-primary text-primary',
};

export function BankCellCard({
  icon: Icon,
  label,
  value,
  status = 'neutral',
  deltaLabel,
  deltaPositive,
  sparkline,
  delay = 0,
}: BankCellCardProps) {
  const ledColor = LED_COLORS[status];
  const [bgClass, fgClass] = ledColor.split(' ');

  const sparkPath = (() => {
    if (!sparkline || sparkline.length < 2) return null;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const w = 100;
    const h = 22;
    const step = w / (sparkline.length - 1);
    const pts = sparkline.map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${pts.join(' L ')}`;
  })();

  const sparkColor =
    status === 'positive' ? 'hsl(160 84% 50%)' :
    status === 'negative' ? 'hsl(350 80% 60%)' :
    status === 'warning' ? 'hsl(40 90% 55%)' :
    'hsl(var(--primary))';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="neu-card relative overflow-hidden p-4 sm:p-5 group"
    >
      {/* Subtle inner ledger lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px)`, backgroundSize: '100% 14px' }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${bgClass} shadow-[0_0_8px_currentColor] ${fgClass}`} />
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </span>
          </div>
          <Icon className="h-3.5 w-3.5 text-muted-foreground/60" />
        </div>

        {/* Value */}
        <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground break-all leading-tight">
          {value}
        </p>

        {/* Delta + sparkline */}
        <div className="mt-3 flex items-end justify-between gap-2 min-h-[28px]">
          <div className="text-[10px] font-mono tabular-nums">
            {deltaLabel ? (
              <span className={`inline-flex items-center gap-1 ${deltaPositive === null ? 'text-muted-foreground' : deltaPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {deltaPositive === null ? (
                  <Minus className="w-3 h-3" />
                ) : deltaPositive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {deltaLabel}
              </span>
            ) : (
              <span className="text-muted-foreground/40">—</span>
            )}
          </div>
          {sparkPath && (
            <svg viewBox="0 0 100 22" className="w-20 h-5 sm:w-24 sm:h-6" preserveAspectRatio="none">
              <path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </motion.div>
  );
}
