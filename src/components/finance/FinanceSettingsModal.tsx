import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Calendar, Target, Wallet, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencySymbol } from '@/lib/currency';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUpdateFinanceSettings, useAddRecurringExpense, useRecurringExpenses } from '@/hooks/useFinance';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FinanceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: {
    salary_payment_day: number;
    project_funding_target: number;
    project_monthly_allocation: number;
    already_funded: number;
  };
}

export function FinanceSettingsModal({ open, onOpenChange, currentSettings }: FinanceSettingsModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const updateSettings = useUpdateFinanceSettings();
  const addExpense = useAddRecurringExpense();
  const { data: expenses = [] } = useRecurringExpenses(user?.id);

  const [salaryDay, setSalaryDay] = useState(currentSettings.salary_payment_day.toString());
  const [useCustomTarget, setUseCustomTarget] = useState(currentSettings.project_funding_target > 0);
  const [fundingTarget, setFundingTarget] = useState(currentSettings.project_funding_target.toString());
  const [monthlyAllocation, setMonthlyAllocation] = useState(currentSettings.project_monthly_allocation.toString());
  const [alreadyFunded, setAlreadyFunded] = useState(currentSettings.already_funded.toString());
  const [addToRecurring, setAddToRecurring] = useState(false);

  useEffect(() => {
    if (open) {
      setSalaryDay(currentSettings.salary_payment_day.toString());
      setUseCustomTarget(currentSettings.project_funding_target > 0);
      setFundingTarget(currentSettings.project_funding_target.toString());
      setMonthlyAllocation(currentSettings.project_monthly_allocation.toString());
      setAlreadyFunded(currentSettings.already_funded.toString());
    }
  }, [open, currentSettings]);

  const handleSave = async () => {
    try {
      const allocationAmount = parseFloat(monthlyAllocation) || 0;
      const existingProjectAllocation = expenses.find(e => e.name === 'Project Allocation');
      
      if (addToRecurring && allocationAmount > 0 && !existingProjectAllocation) {
        await addExpense.mutateAsync({ name: 'Project Allocation', amount: allocationAmount });
      }

      await updateSettings.mutateAsync({
        salary_payment_day: parseInt(salaryDay) || 1,
        project_funding_target: useCustomTarget ? (parseFloat(fundingTarget) || 0) : 0,
        project_monthly_allocation: allocationAmount,
        already_funded: useCustomTarget ? 0 : (parseFloat(alreadyFunded) || 0),
      });
      
      toast.success(t('finance.settings.saved'));
      onOpenChange(false);
    } catch (e) {
      toast.error(t('finance.settings.saveFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-[#0d1220] to-[#080c14] border-white/[0.08] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            {t('finance.settings.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label className="text-sm text-slate-300 font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />{t('finance.settings.paymentDay')}
            </Label>
            <Input type="text" inputMode="numeric" value={salaryDay} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const num = parseInt(val); if (val === '' || (num >= 1 && num <= 31)) setSalaryDay(val); }} className="finance-input h-12" placeholder="1" />
            <p className="text-xs text-slate-500">{t('finance.settings.paymentDayHint')}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-300 font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-slate-400" />{t('finance.settings.fundingTarget')}
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox id="customTarget" checked={useCustomTarget} onCheckedChange={(checked) => setUseCustomTarget(checked === true)} className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <label htmlFor="customTarget" className="text-sm text-slate-400 cursor-pointer">{t('finance.overview.custom')}</label>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{getCurrencySymbol(currency)}</span>
              <Input type="text" inputMode="decimal" value={fundingTarget} onChange={(e) => setFundingTarget(e.target.value.replace(/[^0-9.]/g, ''))} disabled={!useCustomTarget} className={`pl-7 finance-input h-12 ${!useCustomTarget ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="0" />
            </div>
            <p className="text-xs text-slate-500">{useCustomTarget ? t('finance.settings.fundingTargetHint') : t('finance.settings.fundingTargetDefault')}</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-slate-300 font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-slate-400" />{t('finance.settings.monthlyAllocation')}
              <span className="text-xs text-slate-500">({t('common.optional')})</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{getCurrencySymbol(currency)}</span>
              <Input type="text" inputMode="decimal" value={monthlyAllocation} onChange={(e) => setMonthlyAllocation(e.target.value.replace(/[^0-9.]/g, ''))} className="pl-7 finance-input h-12" placeholder="0" />
            </div>
            {parseFloat(monthlyAllocation) > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox id="addToRecurring" checked={addToRecurring} onCheckedChange={(checked) => setAddToRecurring(checked === true)} className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <label htmlFor="addToRecurring" className="text-sm text-slate-400 cursor-pointer">{t('finance.settings.addToRecurring')}</label>
              </div>
            )}
          </div>

          {!useCustomTarget && (
            <div className="space-y-3">
              <Label className="text-sm text-slate-300 font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-400" />{t('finance.settings.alreadyFunded')}
                <span className="text-xs text-slate-500">({t('common.optional')})</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{getCurrencySymbol(currency)}</span>
                <Input type="text" inputMode="decimal" value={alreadyFunded} onChange={(e) => setAlreadyFunded(e.target.value.replace(/[^0-9.]/g, ''))} className="pl-7 finance-input h-12" placeholder="0" />
              </div>
              <p className="text-xs text-slate-500">{t('finance.settings.alreadyFundedHint')}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 border-white/[0.1] text-slate-300 hover:bg-white/[0.04] hover:text-white text-base">{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={updateSettings.isPending} className="flex-1 h-12 text-base">
              {updateSettings.isPending ? t('common.saving') : t('finance.settings.saveSettings')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
