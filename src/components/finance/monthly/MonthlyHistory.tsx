import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Check, History, Edit2, Calendar } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO, subMonths, startOfMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyValidations } from '@/hooks/useFinance';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function MonthlyHistory() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: allValidations = [] } = useMonthlyValidations(user?.id);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

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
    
    // If no validations, show last 3 months as a starting point
    const maxMonthsBack = earliestValidation 
      ? Math.ceil((now.getTime() - parseISO(earliestValidation.month).getTime()) / (30 * 24 * 60 * 60 * 1000)) + 1
      : 3;
    
    const limitedMonths = Math.min(maxMonthsBack, 24); // Cap at 24 months
    
    for (let i = 1; i <= limitedMonths; i++) {
      const monthDate = subMonths(startOfMonth(now), i);
      const monthKey = format(monthDate, 'yyyy-MM-01');
      const validation = allValidations.find(v => v.month === monthKey);
      
      // Only include if there's validation data or it's within a reasonable recent window
      if (validation || i <= 3) {
        months.push({
          key: monthKey,
          label: format(monthDate, 'MMMM yyyy'),
          validation,
        });
      }
    }
    return months;
  }, [allValidations, earliestValidation]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(m => m !== monthKey)
        : [...prev, monthKey]
    );
  };

  const validatedCount = pastMonths.filter(m => m.validation?.validated_at).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/30 border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden"
    >
      {/* Header - Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-700/50 border border-slate-600/50 flex items-center justify-center">
            <History className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">Monthly History</h3>
            <p className="text-xs text-slate-500">{validatedCount} validated months</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center"
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 pb-5">
              {pastMonths.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No history yet</p>
                  <p className="text-xs text-slate-600 mt-1">Start tracking to build your history</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pastMonths.map((month, index) => (
                    <motion.div
                      key={month.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Collapsible
                        open={expandedMonths.includes(month.key)}
                        onOpenChange={() => toggleMonth(month.key)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200">
                            <div className="flex items-center gap-3">
                              <motion.div
                                animate={{ rotate: expandedMonths.includes(month.key) ? 90 : 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <ChevronRight className="h-4 w-4 text-slate-500" />
                              </motion.div>
                              <span className="text-sm font-medium text-white">{month.label}</span>
                            </div>
                            {month.validation?.validated_at ? (
                              <div className="flex items-center gap-2">
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-xs text-emerald-400">Validated</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600">Not validated</span>
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2 p-5 rounded-xl bg-white/[0.01] border border-white/[0.04]"
                          >
                            {month.validation ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Income</p>
                                    <p className="text-lg font-semibold text-emerald-400 tabular-nums">
                                      {formatCurrency(month.validation.actual_total_income || 0, currency)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Expenses</p>
                                    <p className="text-lg font-semibold text-rose-400 tabular-nums">
                                      {formatCurrency(month.validation.actual_total_expenses || 0, currency)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Net</p>
                                    <p className={`text-lg font-semibold tabular-nums ${
                                      (month.validation.actual_total_income || 0) - (month.validation.actual_total_expenses || 0) >= 0
                                        ? 'text-emerald-400'
                                        : 'text-rose-400'
                                    }`}>
                                      {formatCurrency(
                                        (month.validation.actual_total_income || 0) - (month.validation.actual_total_expenses || 0),
                                        currency
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Extras</p>
                                    <p className="text-sm text-white tabular-nums">
                                      <span className="text-emerald-400">+{formatCurrency(month.validation.unplanned_income || 0, currency)}</span>
                                      {' / '}
                                      <span className="text-rose-400">-{formatCurrency(month.validation.unplanned_expenses || 0, currency)}</span>
                                    </p>
                                  </div>
                                </div>
                                {/* Edit button for re-opening */}
                                <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors">
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit this month</span>
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 text-center py-4">
                                No data recorded for this month
                              </p>
                            )}
                          </motion.div>
                        </CollapsibleContent>
                      </Collapsible>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
