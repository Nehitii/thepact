import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface TrendDataPoint {
  month: string;
  label: string;
  balance: number;
}

interface BalanceTrendSparklineProps {
  data: TrendDataPoint[];
  currency: string;
}

const SparklineTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-modal rounded-lg px-3 py-2 shadow-xl"
      >
        <p className="text-[10px] text-slate-400 font-medium">{data.label}</p>
        <p className={`text-sm font-bold tabular-nums ${data.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {data.balance >= 0 ? '+' : ''}{formatCurrency(data.balance, currency)}
        </p>
      </motion.div>
    );
  }
  return null;
};

export function BalanceTrendSparkline({ data, currency }: BalanceTrendSparklineProps) {
  const { t } = useTranslation();

  if (data.length < 2) return null;

  const minBalance = Math.min(...data.map(d => d.balance));
  const maxBalance = Math.max(...data.map(d => d.balance));
  const hasPositive = maxBalance > 0;
  const hasNegative = minBalance < 0;

  const firstBalance = data[0]?.balance || 0;
  const lastBalance = data[data.length - 1]?.balance || 0;
  const trendPercent = firstBalance !== 0
    ? Math.round(((lastBalance - firstBalance) / Math.abs(firstBalance)) * 100)
    : lastBalance > 0 ? 100 : lastBalance < 0 ? -100 : 0;
  const isUpward = trendPercent >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="neu-inset p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {t('finance.monthly.sixMonthTrend')}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isUpward
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
            }`}>
              {isUpward ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="tabular-nums">{isUpward ? '+' : ''}{trendPercent}%</span>
            </div>
          </div>

          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="sparkGradPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sparkGradNeg" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sparkStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={hasNegative ? '#fb7185' : '#34d399'} />
                    <stop offset="100%" stopColor={hasPositive ? '#34d399' : '#fb7185'} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Tooltip content={<SparklineTooltip currency={currency} />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="url(#sparkStroke)"
                  strokeWidth={2.5}
                  fill={hasPositive ? "url(#sparkGradPos)" : "url(#sparkGradNeg)"}
                  animationDuration={1500}
                  animationBegin={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between mt-2 px-1">
            {data.map((point, i) => (
              <span key={i} className="text-[10px] text-slate-600 font-medium">{point.label}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
