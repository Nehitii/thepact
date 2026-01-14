import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyBalanceHeroProps {
  totalIncome: number;
  totalExpenses: number;
  expensesByCategory?: CategoryData[];
  incomeByCategory?: CategoryData[];
}

const RADIAN = Math.PI / 180;

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-slate-300 font-medium">{data.name}</p>
        <p className="text-sm font-semibold text-white">
          {formatCurrency(data.value, currency)}
        </p>
      </div>
    );
  }
  return null;
};

export function MonthlyBalanceHero({ 
  totalIncome, 
  totalExpenses,
  expensesByCategory = [],
  incomeByCategory = []
}: MonthlyBalanceHeroProps) {
  const { currency } = useCurrency();
  const netBalance = totalIncome - totalExpenses;
  const isPositive = netBalance >= 0;
  
  const savingsRate = useMemo(() => {
    if (totalIncome === 0) return 0;
    return Math.round((netBalance / totalIncome) * 100);
  }, [netBalance, totalIncome]);

  const hasExpenseData = expensesByCategory.length > 0;
  const hasIncomeData = incomeByCategory.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden"
    >
      {/* Neumorphic Card */}
      <div className="relative rounded-3xl p-8 md:p-10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-800/40 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
        {/* Subtle glow effect */}
        <div className={`absolute inset-0 rounded-3xl opacity-30 blur-3xl ${isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`} />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Label */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Scale className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium tracking-wide text-slate-400 uppercase">
              Monthly Balance
            </span>
          </div>

          {/* Main Balance */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-8"
          >
            <span className={`text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight tabular-nums ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isPositive ? '+' : ''}{formatCurrency(netBalance, currency)}
            </span>
            
            {/* Savings Rate Badge */}
            {totalIncome > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-4"
              >
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium ${
                  savingsRate >= 20 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : savingsRate >= 0
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {savingsRate >= 0 ? 'Saving' : 'Deficit'} {Math.abs(savingsRate)}%
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Income / Expenses Split with Pie Charts */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {/* Income */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="relative p-5 rounded-2xl bg-gradient-to-br from-emerald-500/[0.08] to-emerald-500/[0.02] border border-emerald-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">Income</span>
              </div>
              <p className="text-2xl md:text-3xl font-semibold text-emerald-400 tabular-nums mb-4">
                +{formatCurrency(totalIncome, currency)}
              </p>
              
              {/* Income Pie Chart */}
              {hasIncomeData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="h-32"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                        animationBegin={400}
                        animationDuration={800}
                      >
                        {incomeByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
              
              {/* Legend */}
              {hasIncomeData && (
                <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                  {incomeByCategory.slice(0, 4).map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-slate-400 truncate max-w-[80px]">{cat.name}</span>
                      </div>
                      <span className="text-slate-300 tabular-nums">
                        {Math.round((cat.value / totalIncome) * 100)}%
                      </span>
                    </div>
                  ))}
                  {incomeByCategory.length > 4 && (
                    <p className="text-[10px] text-slate-500">+{incomeByCategory.length - 4} more</p>
                  )}
                </div>
              )}
            </motion.div>

            {/* Expenses */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="relative p-5 rounded-2xl bg-gradient-to-br from-rose-500/[0.08] to-rose-500/[0.02] border border-rose-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                </div>
                <span className="text-xs font-medium text-rose-400/80 uppercase tracking-wider">Expenses</span>
              </div>
              <p className="text-2xl md:text-3xl font-semibold text-rose-400 tabular-nums mb-4">
                -{formatCurrency(totalExpenses, currency)}
              </p>
              
              {/* Expenses Pie Chart */}
              {hasExpenseData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="h-32"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                        animationBegin={400}
                        animationDuration={800}
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
              
              {/* Legend */}
              {hasExpenseData && (
                <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                  {expensesByCategory.slice(0, 4).map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-slate-400 truncate max-w-[80px]">{cat.name}</span>
                      </div>
                      <span className="text-slate-300 tabular-nums">
                        {Math.round((cat.value / totalExpenses) * 100)}%
                      </span>
                    </div>
                  ))}
                  {expensesByCategory.length > 4 && (
                    <p className="text-[10px] text-slate-500">+{expensesByCategory.length - 4} more</p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
