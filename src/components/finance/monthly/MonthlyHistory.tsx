import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, History, Edit2, Calendar, Clock } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO, subMonths, startOfMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyValidations } from '@/hooks/useFinance';

export function MonthlyHistory() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: allValidations = [] } = useMonthlyValidations(user?.id);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Find the earliest validation month to limit history display
  const earliestValidation = useMemo(() => {
    if (allValidations.length === 0) return null;
    return allValidations.reduce((earliest, v) => {
      return v.month < earliest.month ? v : earliest;
    });
  }, [allValidations]);

  // Generate past months, only going back to the first tracked month
  const pastMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    
    const maxMonthsBack = earliestValidation 
      ? Math.ceil((now.getTime() - parseISO(earliestValidation.month).getTime()) / (30 * 24 * 60 * 60 * 1000)) + 1
      : 3;
    
    const limitedMonths = Math.min(maxMonthsBack, 24);
    
    for (let i = 1; i <= limitedMonths; i++) {
      const monthDate = subMonths(startOfMonth(now), i);
      const monthKey = format(monthDate, 'yyyy-MM-01');
      const validation = allValidations.find(v => v.month === monthKey);
      
      if (validation || i <= 3) {
        months.push({
          key: monthKey,
          label: format(monthDate, 'MMMM yyyy'),
          shortLabel: format(monthDate, 'MMM yyyy'),
          validation,
        });
      }
    }
    return months;
  }, [allValidations, earliestValidation]);

  const validatedCount = pastMonths.filter(m => m.validation?.validated_at).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="neu-card overflow-hidden"
    >
      {/* Header - Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/[0.01] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl neu-inset flex items-center justify-center">
            <History className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-white">Monthly History</h3>
            <p className="text-sm text-slate-500">{validatedCount} validated months</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center"
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-6 pb-6">
              {pastMonths.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl neu-inset flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">No history yet</p>
                  <p className="text-xs text-slate-600 mt-1">Start tracking to build your history</p>
                </motion.div>
              ) : (
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-8 bottom-4 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent rounded-full" />
                  
                  {/* Timeline Items */}
                  <div className="space-y-3">
                    {pastMonths.map((month, index) => {
                      const isSelected = selectedMonth === month.key;
                      const isValidated = !!month.validation?.validated_at;
                      const net = (month.validation?.actual_total_income || 0) - (month.validation?.actual_total_expenses || 0);
                      const isPositive = net >= 0;
                      
                      return (
                        <motion.div
                          key={month.key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative pl-14"
                        >
                          {/* Timeline Node */}
                          <div 
                            className="absolute left-4 top-5 w-4 h-4 rounded-full border-2 transition-all duration-300"
                            style={{
                              backgroundColor: isValidated 
                                ? 'hsla(160, 80%, 50%, 0.2)' 
                                : 'hsla(210, 30%, 20%, 0.5)',
                              borderColor: isValidated 
                                ? 'hsla(160, 80%, 50%, 0.8)' 
                                : 'hsla(210, 30%, 40%, 0.5)',
                              boxShadow: isValidated 
                                ? '0 0 12px hsla(160, 80%, 50%, 0.5)' 
                                : 'none',
                            }}
                          >
                            {isValidated && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              </motion.div>
                            )}
                          </div>
                          
                          {/* Month Card */}
                          <motion.button
                            onClick={() => setSelectedMonth(isSelected ? null : month.key)}
                            whileHover={{ scale: 1.005 }}
                            whileTap={{ scale: 0.995 }}
                            className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                              isSelected 
                                ? 'neu-inset bg-white/[0.02]' 
                                : 'hover:bg-white/[0.02]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-white">{month.label}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {isValidated ? (
                                  <span className={`text-sm font-bold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isPositive ? '+' : ''}{formatCurrency(net, currency)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-600 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.button>
                          
                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isSelected && month.validation && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="mt-2"
                              >
                                <div className="p-5 rounded-xl neu-inset space-y-4">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                      <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider font-medium">Income</p>
                                      <p className="text-lg font-bold text-emerald-400 tabular-nums">
                                        {formatCurrency(month.validation.actual_total_income || 0, currency)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider font-medium">Expenses</p>
                                      <p className="text-lg font-bold text-rose-400 tabular-nums">
                                        {formatCurrency(month.validation.actual_total_expenses || 0, currency)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider font-medium">Net</p>
                                      <p className={`text-lg font-bold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {formatCurrency(net, currency)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider font-medium">Extras</p>
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-emerald-400 tabular-nums">+{formatCurrency(month.validation.unplanned_income || 0, currency)}</span>
                                        <span className="text-slate-600">/</span>
                                        <span className="text-rose-400 tabular-nums">-{formatCurrency(month.validation.unplanned_expenses || 0, currency)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-primary transition-colors">
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Edit this month</span>
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          {/* No data state */}
                          <AnimatePresence>
                            {isSelected && !month.validation && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 p-5 rounded-xl neu-inset text-center"
                              >
                                <p className="text-sm text-slate-500">No data recorded for this month</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}