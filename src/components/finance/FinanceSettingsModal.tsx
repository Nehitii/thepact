import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Calendar, Target, Wallet, DollarSign, Landmark, AlertTriangle, FileText, SeparatorHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencySymbol } from '@/lib/currency';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUpdateFinanceSettings, useAddRecurringExpense, useRecurringExpenses } from '@/hooks/useFinance';
import { useAccounts } from '@/hooks/useAccounts';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { FinanceSettings } from '@/types/finance';

interface FinanceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: FinanceSettings;
}

export function FinanceSettingsModal({ open, onOpenChange, currentSettings }: FinanceSettingsModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const updateSettings = useUpdateFinanceSettings();
  const addExpense = useAddRecurringExpense();
  const { data: expenses = [] } = useRecurringExpenses(user?.id);
  const { data: accounts = [] } = useAccounts(user?.id);

  const [salaryDay, setSalaryDay] = useState(currentSettings.salary_payment_day.toString());
  const [useCustomTarget, setUseCustomTarget] = useState(currentSettings.project_funding_target > 0);
  const [fundingTarget, setFundingTarget] = useState(currentSettings.project_funding_target.toString());
  const [monthlyAllocation, setMonthlyAllocation] = useState(currentSettings.project_monthly_allocation.toString());
  const [alreadyFunded, setAlreadyFunded] = useState(currentSettings.already_funded.toString());
  const [addToRecurring, setAddToRecurring] = useState(false);

  // New settings
  const [defaultAccountId, setDefaultAccountId] = useState(currentSettings.finance_default_account_id ?? 'none');
  const [csvDateFormat, setCsvDateFormat] = useState(currentSettings.finance_csv_date_format ?? 'YYYY-MM-DD');
  const [csvDelimiter, setCsvDelimiter] = useState(currentSettings.finance_csv_delimiter ?? ',');
  const [budgetAlertPct, setBudgetAlertPct] = useState((currentSettings.finance_budget_alert_pct ?? 80).toString());

  useEffect(() => {
    if (open) {
      setSalaryDay(currentSettings.salary_payment_day.toString());
      setUseCustomTarget(currentSettings.project_funding_target > 0);
      setFundingTarget(currentSettings.project_funding_target.toString());
      setMonthlyAllocation(currentSettings.project_monthly_allocation.toString());
      setAlreadyFunded(currentSettings.already_funded.toString());
      setDefaultAccountId(currentSettings.finance_default_account_id ?? '');
      setCsvDateFormat(currentSettings.finance_csv_date_format ?? 'YYYY-MM-DD');
      setCsvDelimiter(currentSettings.finance_csv_delimiter ?? ',');
      setBudgetAlertPct((currentSettings.finance_budget_alert_pct ?? 80).toString());
    }
  }, [open, currentSettings]);

  const handleSave = async () => {
    try {
      const allocationAmount = parseFloat(monthlyAllocation) || 0;
      const existingProjectAllocation = expenses.find(e => e.name === 'Project Allocation');
      
      if (addToRecurring && allocationAmount > 0 && !existingProjectAllocation) {
        await addExpense.mutateAsync({ name: 'Project Allocation', amount: allocationAmount });
      }

      const parsedDay = Math.max(1, Math.min(31, parseInt(salaryDay) || 1));
      const parsedTarget = Math.max(0, parseFloat(fundingTarget) || 0);
      const parsedFunded = Math.max(0, parseFloat(alreadyFunded) || 0);
      const parsedAlertPct = Math.max(1, Math.min(100, parseInt(budgetAlertPct) || 80));

      await updateSettings.mutateAsync({
        salary_payment_day: parsedDay,
        project_funding_target: useCustomTarget ? parsedTarget : 0,
        project_monthly_allocation: Math.max(0, allocationAmount),
        already_funded: useCustomTarget ? 0 : parsedFunded,
        finance_default_account_id: defaultAccountId || null,
        finance_csv_date_format: csvDateFormat,
        finance_csv_delimiter: csvDelimiter,
        finance_budget_alert_pct: parsedAlertPct,
      });
      
      toast.success(t('finance.settings.saved'));
      onOpenChange(false);
    } catch (e) {
      toast.error(t('finance.settings.saveFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card dark:bg-gradient-to-br dark:from-[#0d1220] dark:to-[#080c14] border-border sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            {t('finance.settings.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Salary Day */}
          <div className="space-y-3">
            <Label className="text-sm text-foreground/80 font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />{t('finance.settings.paymentDay')}
            </Label>
            <Input type="text" inputMode="numeric" value={salaryDay} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const num = parseInt(val); if (val === '' || (num >= 1 && num <= 31)) setSalaryDay(val); }} className="finance-input h-12" placeholder="1" />
            <p className="text-xs text-muted-foreground">{t('finance.settings.paymentDayHint')}</p>
          </div>

          {/* Default Account */}
          {accounts.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm text-foreground/80 font-medium flex items-center gap-2">
                <Landmark className="h-4 w-4 text-muted-foreground" />{t('finance.settings.defaultAccount')}
              </Label>
              <Select value={defaultAccountId} onValueChange={setDefaultAccountId}>
                <SelectTrigger className="h-12 bg-muted dark:bg-slate-800/60 border-border rounded-lg">
                  <SelectValue placeholder={t('finance.settings.defaultAccountPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  <SelectItem value="none">{t('finance.settings.noDefault')}</SelectItem>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.icon_emoji} {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('finance.settings.defaultAccountHint')}</p>
            </div>
          )}

          {/* CSV Settings */}
          <div className="space-y-3">
            <Label className="text-sm text-foreground/80 font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />{t('finance.settings.csvSettings')}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t('finance.settings.csvDateFormat')}</label>
                <Select value={csvDateFormat} onValueChange={setCsvDateFormat}>
                  <SelectTrigger className="h-10 bg-muted dark:bg-slate-800/60 border-border rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-xl">
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t('finance.settings.csvDelimiter')}</label>
                <Select value={csvDelimiter} onValueChange={setCsvDelimiter}>
                  <SelectTrigger className="h-10 bg-muted dark:bg-slate-800/60 border-border rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-xl">
                    <SelectItem value=",">{t('finance.settings.delimiterComma')}</SelectItem>
                    <SelectItem value=";">{t('finance.settings.delimiterSemicolon')}</SelectItem>
                    <SelectItem value="tab">{t('finance.settings.delimiterTab')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Budget Alert */}
          <div className="space-y-3">
            <Label className="text-sm text-foreground/80 font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />{t('finance.settings.budgetAlertThreshold')}
            </Label>
            <div className="relative">
              <Input type="text" inputMode="numeric" value={budgetAlertPct} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); const num = parseInt(val); if (val === '' || (num >= 1 && num <= 100)) setBudgetAlertPct(val); }} className="finance-input h-12 pr-8" placeholder="80" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('finance.settings.budgetAlertHint')}</p>
          </div>

          {/* Funding Target */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground/80 font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />{t('finance.settings.fundingTarget')}
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox id="customTarget" checked={useCustomTarget} onCheckedChange={(checked) => setUseCustomTarget(checked === true)} className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <label htmlFor="customTarget" className="text-sm text-muted-foreground cursor-pointer">{t('finance.overview.custom')}</label>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{getCurrencySymbol(currency)}</span>
              <Input type="text" inputMode="decimal" value={fundingTarget} onChange={(e) => setFundingTarget(e.target.value.replace(/[^0-9.]/g, ''))} disabled={!useCustomTarget} className={`pl-7 finance-input h-12 ${!useCustomTarget ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="0" />
            </div>
            <p className="text-xs text-muted-foreground">{useCustomTarget ? t('finance.settings.fundingTargetHint') : t('finance.settings.fundingTargetDefault')}</p>
          </div>

          {/* Monthly Allocation */}
          <div className="space-y-3">
            <Label className="text-sm text-foreground/80 font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />{t('finance.settings.monthlyAllocation')}
              <span className="text-xs text-muted-foreground">({t('common.optional')})</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{getCurrencySymbol(currency)}</span>
              <Input type="text" inputMode="decimal" value={monthlyAllocation} onChange={(e) => setMonthlyAllocation(e.target.value.replace(/[^0-9.]/g, ''))} className="pl-7 finance-input h-12" placeholder="0" />
            </div>
            {parseFloat(monthlyAllocation) > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox id="addToRecurring" checked={addToRecurring} onCheckedChange={(checked) => setAddToRecurring(checked === true)} className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <label htmlFor="addToRecurring" className="text-sm text-muted-foreground cursor-pointer">{t('finance.settings.addToRecurring')}</label>
              </div>
            )}
          </div>

          {!useCustomTarget && (
            <div className="space-y-3">
              <Label className="text-sm text-foreground/80 font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />{t('finance.settings.alreadyFunded')}
                <span className="text-xs text-muted-foreground">({t('common.optional')})</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{getCurrencySymbol(currency)}</span>
                <Input type="text" inputMode="decimal" value={alreadyFunded} onChange={(e) => setAlreadyFunded(e.target.value.replace(/[^0-9.]/g, ''))} className="pl-7 finance-input h-12" placeholder="0" />
              </div>
              <p className="text-xs text-muted-foreground">{t('finance.settings.alreadyFundedHint')}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground text-base">{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={updateSettings.isPending} className="flex-1 h-12 text-base">
              {updateSettings.isPending ? t('common.saving') : t('finance.settings.saveSettings')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
