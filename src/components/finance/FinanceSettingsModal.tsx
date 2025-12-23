import { useState, useEffect } from 'react';
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
  };
}

export function FinanceSettingsModal({
  open,
  onOpenChange,
  currentSettings,
}: FinanceSettingsModalProps) {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const updateSettings = useUpdateFinanceSettings();
  const addExpense = useAddRecurringExpense();
  const { data: expenses = [] } = useRecurringExpenses(user?.id);

  const [salaryDay, setSalaryDay] = useState(currentSettings.salary_payment_day.toString());
  const [useCustomTarget, setUseCustomTarget] = useState(currentSettings.project_funding_target > 0);
  const [fundingTarget, setFundingTarget] = useState(currentSettings.project_funding_target.toString());
  const [monthlyAllocation, setMonthlyAllocation] = useState(currentSettings.project_monthly_allocation.toString());
  const [alreadyFunded, setAlreadyFunded] = useState('0');
  const [addToRecurring, setAddToRecurring] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (open) {
      setSalaryDay(currentSettings.salary_payment_day.toString());
      setUseCustomTarget(currentSettings.project_funding_target > 0);
      setFundingTarget(currentSettings.project_funding_target.toString());
      setMonthlyAllocation(currentSettings.project_monthly_allocation.toString());
    }
  }, [open, currentSettings]);

  const handleSave = async () => {
    try {
      // Check if monthly allocation should be added to recurring expenses
      const allocationAmount = parseFloat(monthlyAllocation) || 0;
      const existingProjectAllocation = expenses.find(e => e.name === 'Project Allocation');
      
      if (addToRecurring && allocationAmount > 0 && !existingProjectAllocation) {
        await addExpense.mutateAsync({
          name: 'Project Allocation',
          amount: allocationAmount,
        });
      }

      await updateSettings.mutateAsync({
        salary_payment_day: parseInt(salaryDay) || 1,
        project_funding_target: useCustomTarget ? (parseFloat(fundingTarget) || 0) : 0,
        project_monthly_allocation: allocationAmount,
      });
      
      toast.success('Settings saved');
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-[#0d1220] to-[#080c14] border-white/[0.08] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Finance Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Salary Payment Day */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Salary Payment Day
            </Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={salaryDay}
              onChange={(e) => setSalaryDay(e.target.value)}
              className="bg-white/[0.02] border-white/[0.08] focus:border-primary/30 h-11"
              placeholder="1"
            />
            <p className="text-xs text-muted-foreground">
              Day of the month when you receive your salary
            </p>
          </div>

          {/* Project Funding Target */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Project Funding Target
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="customTarget"
                  checked={useCustomTarget}
                  onCheckedChange={(checked) => setUseCustomTarget(checked === true)}
                  className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="customTarget" className="text-xs text-muted-foreground cursor-pointer">
                  Custom
                </label>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                type="number"
                min="0"
                step="100"
                value={fundingTarget}
                onChange={(e) => setFundingTarget(e.target.value)}
                disabled={!useCustomTarget}
                className={`pl-7 bg-white/[0.02] border-white/[0.08] focus:border-primary/30 h-11 ${
                  !useCustomTarget ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                placeholder="0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {useCustomTarget 
                ? 'Enter a custom funding target for your project'
                : 'Uses total from goal estimated costs'
              }
            </p>
          </div>

          {/* Monthly Allocation */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Monthly Allocation
              <span className="text-xs text-muted-foreground/60">(optional)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                type="number"
                min="0"
                step="10"
                value={monthlyAllocation}
                onChange={(e) => setMonthlyAllocation(e.target.value)}
                className="pl-7 bg-white/[0.02] border-white/[0.08] focus:border-primary/30 h-11"
                placeholder="0"
              />
            </div>
            {parseFloat(monthlyAllocation) > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="addToRecurring"
                  checked={addToRecurring}
                  onCheckedChange={(checked) => setAddToRecurring(checked === true)}
                  className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="addToRecurring" className="text-xs text-muted-foreground cursor-pointer">
                  Add to recurring expenses automatically
                </label>
              </div>
            )}
          </div>

          {/* Already Funded */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Already Funded
              <span className="text-xs text-muted-foreground/60">(optional)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                type="number"
                min="0"
                step="100"
                value={alreadyFunded}
                onChange={(e) => setAlreadyFunded(e.target.value)}
                className="pl-7 bg-white/[0.02] border-white/[0.08] focus:border-primary/30 h-11"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Amount you've already set aside for this project
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 border-white/[0.08] hover:bg-white/[0.02]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="flex-1 h-11"
            >
              {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
