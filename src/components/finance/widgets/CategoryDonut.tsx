import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/currency';
import type { LucideIcon } from 'lucide-react';

interface CategoryData {
  name: string;
  label?: string;
  value: number;
  color: string;
  icon?: LucideIcon;
}

interface CategoryDonutProps {
  data: CategoryData[];
  currency: string;
  title: string;
  total: number;
  colorAccent: 'emerald' | 'rose';
  maxLegendItems?: number;
}

const DonutTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-modal rounded-xl px-4 py-3 shadow-2xl"
      >
        <p className="text-xs text-muted-foreground font-medium mb-1">{data.label || data.name}</p>
        <p className="text-base font-semibold text-foreground tabular-nums">
          {formatCurrency(data.value, currency)}
        </p>
      </motion.div>
    );
  }
  return null;
};

export function CategoryDonut({ data, currency, title, total, colorAccent, maxLegendItems = 4 }: CategoryDonutProps) {
  const { t } = useTranslation();
  if (data.length === 0) return null;

  const accentClasses = colorAccent === 'emerald'
    ? { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25' }
    : { text: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/25' };

  const gradientBg = colorAccent === 'emerald'
    ? 'rgba(16, 185, 129, 0.05)'
    : 'rgba(244, 63, 94, 0.05)';

  return (
    <div className="neu-inset p-5 rounded-2xl relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom right, ${gradientBg}, transparent)` }} />
      <div className="relative z-10">
        <h4 className={`text-xs font-medium ${accentClasses.text} uppercase tracking-wider mb-3`}>{title}</h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {data.map((entry, index) => (
                  <linearGradient key={`donut-grad-${index}`} id={`donut-grad-${index}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                paddingAngle={3}
                dataKey="value"
                animationBegin={300}
                animationDuration={800}
              >
                {data.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#donut-grad-${index})`}
                    stroke={data[index].color}
                    strokeWidth={1}
                    strokeOpacity={0.3}
                  />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip currency={currency} />} />
              {/* Center label */}
              <text x="50%" y="48%" textAnchor="middle" dominantBaseline="central" className="fill-foreground" style={{ fontSize: '11px', fontWeight: 700 }}>
                {formatCurrency(total, currency).replace(/\.00$/, '')}
              </text>
              <text x="50%" y="62%" textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground" style={{ fontSize: '8px' }}>
                {title}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-1.5">
          {data.slice(0, maxLegendItems).map((cat, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}40` }}
              />
              <span className="text-muted-foreground truncate flex-1">{cat.label || cat.name}</span>
              <span className="text-foreground/80 tabular-nums font-medium">
                {total > 0 ? Math.round((cat.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
          {data.length > maxLegendItems && (
            <p className="text-[10px] text-muted-foreground/60">+{data.length - maxLegendItems} {t('common.more')}</p>
          )}
        </div>
      </div>
    </div>
  );
}