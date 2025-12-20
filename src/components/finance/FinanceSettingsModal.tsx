import { useState } from 'react';
import { Settings, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencySymbol } from '@/lib/currency';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUpdateFinanceSettings } from '@/hooks/useFinance';
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
  const { currency } = useCurrency();
  const updateSettings = useUpdateFinanceSettings();

  const [salaryDay, setSalaryDay] = useState(currentSettings.salary_payment_day.toString());
  const [fundingTarget, setFundingTarget] = useState(currentSettings.project_funding_target.toString());
  const [monthlyAllocation, setMonthlyAllocation] = useState(currentSettings.project_monthly_allocation.toString());

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        salary_payment_day: parseInt(salaryDay) || 1,
        project_funding_target: parseFloat(fundingTarget) || 0,
        project_monthly_allocation: parseFloat(monthlyAllocation) || 0,
      });
      toast.success('Settings saved');
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-primary tracking-wider flex items-center gap-2">
            <Settings className="h-5 w-5" />
            FINANCE SETTINGS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Salary Payment Day */}
          <div className="space-y-2">
            <Label className="text-sm font-rajdhani text-primary/90 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Salary Payment Day
            </Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={salaryDay}
              onChange={(e) => setSalaryDay(e.target.value)}
              className="bg-card/50 border-primary/20"
              placeholder="1"
            />
            <p className="text-xs text-muted-foreground font-rajdhani">
              Day of the month when you receive your salary
            </p>
          </div>

          {/* Project Funding Target */}
          <div className="space-y-2">
            <Label className="text-sm font-rajdhani text-primary/90 uppercase tracking-wider">
              Project Funding Target
            </Label>
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
                className="pl-7 bg-card/50 border-primary/20"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground font-rajdhani">
              Total amount needed to fund your project
            </p>
          </div>

          {/* Monthly Allocation */}
          <div className="space-y-2">
            <Label className="text-sm font-rajdhani text-primary/90 uppercase tracking-wider">
              Monthly Allocation
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
                className="pl-7 bg-card/50 border-primary/20"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground font-rajdhani">
              How much you allocate monthly toward your project
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-primary/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="flex-1"
            >
              {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
