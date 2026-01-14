import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
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

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-modal rounded-xl px-4 py-3 shadow-2xl"
      >
        <p className="text-xs text-slate-400 font-medium mb-1">{data.name}</p>
        <p className="text-base font-semibold text-white tabular-nums">
          {formatCurrency(data.value, currency)}
        </p>
      </motion.div>
    );
  }
  return null;
};

// Animated number component
function AnimatedNumber({ value, currency, isPositive }: { value: number; currency: string; isPositive: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span className={`neu-hero-balance ${!isPositive ? 'negative' : ''}`}>
      {isPositive ? '+' : ''}{formatCurrency(displayValue, currency)}
    </span>
  );
}

// Savings Rate Ring
function SavingsRateRing({ rate, size = 80 }: { rate: number; size?: number }) {
  const normalizedRate = Math.min(Math.max(rate, -100), 100);
  const isPositive = rate >= 0;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (Math.abs(normalizedRate) / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="savings-ring-track"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isPositive ? '#34d399' : '#fb7185'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="savings-ring-progress"
          style={{ '--progress': progress } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {Math.abs(rate)}%
        </span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          {isPositive ? 'saved' : 'deficit'}
        </span>
      </div>
    </div>
  );
}

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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Main Neumorphic Card */}
      <div className="neu-card p-8 md:p-12 relative overflow-hidden">
        {/* Ambient glow effect */}
        <div 
          className={`absolute inset-0 opacity-40 blur-[100px] transition-colors duration-1000 ${
            isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'
          }`} 
        />
        
        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 mesh-gradient-bg opacity-50" />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header with savings ring */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Monthly Balance
                </span>
                <p className="text-xs text-slate-600">Current period</p>
              </div>
            </div>
            
            {totalIncome > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              >
                <SavingsRateRing rate={savingsRate} />
              </motion.div>
            )}
          </div>

          {/* Main Balance Display */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-10"
          >
            <div className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <AnimatedNumber value={netBalance} currency={currency} isPositive={isPositive} />
            </div>
          </motion.div>

          {/* Income / Expenses Cards with Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="neu-inset p-6 rounded-2xl relative overflow-hidden"
            >
              {/* Subtle emerald glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] to-transparent" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shadow-[0_0_20px_hsla(160,80%,50%,0.2)]">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">Income</span>
                    <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                      +{formatCurrency(totalIncome, currency)}
                    </p>
                  </div>
                </div>
                
                {/* Pie Chart */}
                {hasIncomeData && (
                  <div className="mt-4">
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            {incomeByCategory.map((entry, index) => (
                              <linearGradient key={`income-gradient-${index}`} id={`income-gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                              </linearGradient>
                            ))}
                          </defs>
                          <Pie
                            data={incomeByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={3}
                            dataKey="value"
                            animationBegin={500}
                            animationDuration={1000}
                          >
                            {incomeByCategory.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`url(#income-gradient-${index})`}
                                stroke={entry.color}
                                strokeWidth={1}
                                strokeOpacity={0.3}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip currency={currency} />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {incomeByCategory.slice(0, 4).map((cat, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div 
                            className="w-2 h-2 rounded-full shadow-sm" 
                            style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}40` }} 
                          />
                          <span className="text-slate-400 truncate flex-1">{cat.name}</span>
                          <span className="text-slate-300 tabular-nums font-medium">
                            {Math.round((cat.value / totalIncome) * 100)}%
                          </span>
                        </motion.div>
                      ))}
                    </div>
                    {incomeByCategory.length > 4 && (
                      <p className="text-[10px] text-slate-600 mt-2">+{incomeByCategory.length - 4} more categories</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Expenses Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="neu-inset p-6 rounded-2xl relative overflow-hidden"
            >
              {/* Subtle rose glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.08] to-transparent" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center shadow-[0_0_20px_hsla(350,80%,60%,0.2)]">
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-rose-400/80 uppercase tracking-wider">Expenses</span>
                    <p className="text-2xl font-bold text-rose-400 tabular-nums">
                      -{formatCurrency(totalExpenses, currency)}
                    </p>
                  </div>
                </div>
                
                {/* Pie Chart */}
                {hasExpenseData && (
                  <div className="mt-4">
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            {expensesByCategory.map((entry, index) => (
                              <linearGradient key={`expense-gradient-${index}`} id={`expense-gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                              </linearGradient>
                            ))}
                          </defs>
                          <Pie
                            data={expensesByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={3}
                            dataKey="value"
                            animationBegin={500}
                            animationDuration={1000}
                          >
                            {expensesByCategory.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`url(#expense-gradient-${index})`}
                                stroke={entry.color}
                                strokeWidth={1}
                                strokeOpacity={0.3}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip currency={currency} />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {expensesByCategory.slice(0, 4).map((cat, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div 
                            className="w-2 h-2 rounded-full shadow-sm" 
                            style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}40` }} 
                          />
                          <span className="text-slate-400 truncate flex-1">{cat.name}</span>
                          <span className="text-slate-300 tabular-nums font-medium">
                            {Math.round((cat.value / totalExpenses) * 100)}%
                          </span>
                        </motion.div>
                      ))}
                    </div>
                    {expensesByCategory.length > 4 && (
                      <p className="text-[10px] text-slate-600 mt-2">+{expensesByCategory.length - 4} more categories</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}