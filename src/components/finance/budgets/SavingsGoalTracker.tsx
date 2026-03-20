import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { PiggyBank, Plus, Trash2, Edit2, Check, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { format, differenceInDays } from 'date-fns';
import type { SavingsGoal } from '@/hooks/useBudgets';
import type { UserAccount } from '@/types/finance';

interface SavingsGoalTrackerProps {
  goals: SavingsGoal[];
  accounts: UserAccount[];
  currency: string;
  onAdd: (goal: { name: string; target_amount: number; current_amount?: number; deadline?: string; icon_emoji?: string; color?: string }) => Promise<void>;
  onUpdate: (params: { id: string } & Partial<SavingsGoal>) => Promise<void>;
  onDelete: (id: string) => void;
  isPending?: boolean;
}

const GOAL_EMOJIS = ['🎯', '🏠', '✈️', '🚗', '💻', '📱', '🎓', '💍', '🏖️', '🎸', '🛡️', '💎'];
const GOAL_COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#22d3ee'];

export function SavingsGoalTracker({ goals, accounts, currency, onAdd, onUpdate, onDelete, isPending }: SavingsGoalTrackerProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', target: '', current: '', deadline: '', emoji: '🎯', color: '#60a5fa' });

  const handleAdd = async () => {
    if (!form.name.trim() || !form.target) return;
    await onAdd({
      name: form.name.trim(),
      target_amount: parseFloat(form.target),
      current_amount: parseFloat(form.current) || 0,
      deadline: form.deadline || undefined,
      icon_emoji: form.emoji,
      color: form.color,
    });
    setForm({ name: '', target: '', current: '', deadline: '', emoji: '🎯', color: '#60a5fa' });
    setShowForm(false);
  };

  const handleUpdateAmount = async (goal: SavingsGoal, amount: string) => {
    const val = parseFloat(amount);
    if (isNaN(val)) return;
    const isCompleted = val >= goal.target_amount;
    await onUpdate({
      id: goal.id,
      current_amount: val,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    });
    setEditingId(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neu-card overflow-hidden">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsla(160,80%,50%,0.15), hsla(160,80%,50%,0.05))', border: '1px solid hsla(160,80%,50%,0.25)' }}>
            <PiggyBank className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{t('finance.savings.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('finance.savings.subtitle')}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="rounded-xl border-border">
          <Plus className="w-4 h-4 mr-1" />{t('common.add')}
        </Button>
      </div>

      <div className="px-6 pb-6 space-y-4">
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="neu-inset rounded-xl p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {GOAL_EMOJIS.map(e => (
                  <button key={e} onClick={() => setForm({ ...form, emoji: e })}
                    className={`w-9 h-9 rounded-lg text-base flex items-center justify-center transition-all ${form.emoji === e ? 'neu-inset ring-2 ring-primary/50' : 'hover:bg-muted/50'}`}>
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {GOAL_COLORS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t('finance.savings.goalName')}</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 finance-input" maxLength={40} placeholder="e.g. Emergency Fund" />
                </div>
                <div>
                  <Label className="text-xs">{t('finance.savings.targetAmount')}</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                    <Input type="text" inputMode="decimal" value={form.target} onChange={e => setForm({ ...form, target: e.target.value.replace(/[^0-9.]/g, '') })} className="pl-7 finance-input" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">{t('finance.savings.currentAmount')}</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                    <Input type="text" inputMode="decimal" value={form.current} onChange={e => setForm({ ...form, current: e.target.value.replace(/[^0-9.]/g, '') })} className="pl-7 finance-input" placeholder="0" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">{t('finance.savings.deadline')}</Label>
                  <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="mt-1 finance-input" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
                <Button size="sm" onClick={handleAdd} disabled={!form.name.trim() || !form.target || isPending}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400">
                  <Plus className="w-4 h-4 mr-1" />{t('common.add')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {goals.length === 0 && !showForm ? (
          <div className="text-center py-8">
            <PiggyBank className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t('finance.savings.empty')}</p>
          </div>
        ) : (
          goals.map((goal, i) => {
            const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
            const ringSize = 56;
            const strokeWidth = 5;
            const radius = (ringSize - strokeWidth) / 2;
            const circumference = 2 * Math.PI * radius;
            const progress = (Math.min(pct, 100) / 100) * circumference;

            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`p-4 rounded-xl neu-inset ${goal.is_completed ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  {/* Progress Ring */}
                  <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
                    <svg width={ringSize} height={ringSize} className="transform -rotate-90">
                      <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} strokeOpacity={0.3} />
                      <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke={goal.color} strokeWidth={strokeWidth}
                        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - progress} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-lg">{goal.icon_emoji || '🎯'}</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-foreground truncate">{goal.name}</h4>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingId(editingId === goal.id ? null : goal.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(goal.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(goal.current_amount, currency)} / {formatCurrency(goal.target_amount, currency)}
                      <span className="ml-2 font-semibold" style={{ color: goal.color }}>{pct.toFixed(0)}%</span>
                    </p>
                    {daysLeft !== null && daysLeft >= 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{t('finance.savings.daysLeft', { count: daysLeft })}</span>
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {editingId === goal.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">{t('finance.savings.updateAmount')}:</span>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            defaultValue={goal.current_amount.toString()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateAmount(goal, (e.target as HTMLInputElement).value);
                            }}
                            className="h-9 pl-7 text-sm finance-input rounded-lg"
                          />
                        </div>
                        <button onClick={(e) => {
                          const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                          if (input) handleUpdateAmount(goal, input.value);
                        }} className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
