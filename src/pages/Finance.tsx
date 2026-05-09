import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { LayoutDashboard, FileText, Settings, Landmark, ArrowLeftRight, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useFinanceSettings, useRecurringExpenses, useRecurringIncome, useMonthlyValidations } from "@/hooks/useFinance";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useAccountBalances } from "@/hooks/useAccountBalances";
import { useCategoryBudgets, useUpsertCategoryBudget, useDeleteCategoryBudget, useSavingsGoals, useAddSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal } from "@/hooks/useBudgets";
import { FinanceDashboard } from "@/components/finance/FinanceDashboard";
import { MonthlyDashboard } from "@/components/finance/monthly/MonthlyDashboard";
import { ProjectionsPanel } from "@/components/finance/ProjectionsPanel";
import { FinanceSettingsModal } from "@/components/finance/FinanceSettingsModal";
import { AccountsOverview } from "@/components/finance/accounts";
import { NetWorthHistoryPanel } from "@/components/finance/NetWorthHistoryPanel";
import { BudgetProgressPanel, SavingsGoalTracker } from "@/components/finance/budgets";
import { TransactionsTab } from "@/components/finance/transactions";
import { AuraBackground, AuraBalanceHero, FloatingTabBar } from "@/components/finance/aura";
import { EXPENSE_CATEGORIES } from "@/lib/financeCategories";
import { exportFullReport } from "@/lib/financeExport";
import { roundMoney } from "@/lib/financeCategories";
import { parseISO, format, startOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Finance() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [activeTab, setActiveTab] = useState("overview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const { data: financeSettings } = useFinanceSettings(user?.id);
  const { data: recurringExpenses = [] } = useRecurringExpenses(user?.id);
  const { data: recurringIncome = [] } = useRecurringIncome(user?.id);
  const { data: validations = [] } = useMonthlyValidations(user?.id);
  const { data: accounts = [] } = useAccounts(user?.id);
  const { data: balancesMap } = useAccountBalances(accounts, user?.id);
  const { data: budgets = [] } = useCategoryBudgets(user?.id);
  const { data: savingsGoals = [] } = useSavingsGoals(user?.id);

  const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const { data: allTransactions = [] } = useTransactions(user?.id);

  const upsertBudget = useUpsertCategoryBudget();
  const deleteBudget = useDeleteCategoryBudget();
  const addSavingsGoal = useAddSavingsGoal();
  const updateSavingsGoal = useUpdateSavingsGoal();
  const deleteSavingsGoal = useDeleteSavingsGoal();

  const projectEndDate = pact?.project_end_date ? parseISO(pact.project_end_date) : null;
  const isCustomMode = (financeSettings?.project_funding_target ?? 0) > 0;

  const { totalEstimated, financed, remaining } = useMemo(() => {
    const totalGoalsCost = goals.reduce((sum, g) => sum + (g.estimated_cost || 0), 0);
    const customTarget = financeSettings?.project_funding_target ?? 0;
    const total = customTarget > 0 ? customTarget : totalGoalsCost;

    let financedTotal = 0;
    if (customTarget === 0) {
      const completedGoalsCost = goals
        .filter(g => g.status === 'completed' || g.status === 'fully_completed' || g.status === 'validated')
        .reduce((sum, g) => sum + (g.estimated_cost || 0), 0);
      const alreadyFunded = financeSettings?.already_funded ?? 0;
      financedTotal = Math.min(completedGoalsCost + alreadyFunded, total);
    }

    return {
      totalEstimated: total,
      financed: financedTotal,
      remaining: Math.max(total - financedTotal, 0),
    };
  }, [goals, financeSettings]);

  const settings = {
    salary_payment_day: financeSettings?.salary_payment_day ?? 1,
    project_funding_target: financeSettings?.project_funding_target ?? 0,
    project_monthly_allocation: financeSettings?.project_monthly_allocation ?? 0,
    already_funded: financeSettings?.already_funded ?? 0,
    finance_default_account_id: financeSettings?.finance_default_account_id ?? null,
    finance_csv_date_format: financeSettings?.finance_csv_date_format ?? 'YYYY-MM-DD',
    finance_csv_delimiter: financeSettings?.finance_csv_delimiter ?? ',',
    finance_budget_alert_pct: financeSettings?.finance_budget_alert_pct ?? 80,
  };

  const totalRecurringExpenses = roundMoney(recurringExpenses.filter(e => e.is_active).reduce((sum, e) => sum + e.amount, 0));
  const totalRecurringIncome = roundMoney(recurringIncome.filter(i => i.is_active).reduce((sum, i) => sum + i.amount, 0));
  const monthlyNet = roundMoney(totalRecurringIncome - totalRecurringExpenses);

  const currentMonthTransactions = useMemo(() => {
    return allTransactions.filter(tx => tx.transaction_date >= currentMonthStart);
  }, [allTransactions, currentMonthStart]);

  // Net worth from accounts (computed)
  const netWorth = useMemo(() => {
    const active = accounts.filter(a => a.is_active);
    if (!balancesMap || balancesMap.size === 0) {
      return roundMoney(active.reduce((s, a) => s + a.balance, 0));
    }
    return roundMoney(active.reduce((s, a) => {
      const c = balancesMap.get(a.id);
      return s + (c ? c.computedBalance : a.balance);
    }, 0));
  }, [accounts, balancesMap]);

  const prevMonthKey = format(subMonths(new Date(), 1), 'yyyy-MM-01');
  const prevValidation = validations.find(v => v.month === prevMonthKey);
  const prevMonthNet = prevValidation?.validated_at
    ? roundMoney((prevValidation.actual_total_income || 0) - (prevValidation.actual_total_expenses || 0))
    : null;

  const handleExportAll = () => {
    exportFullReport(recurringExpenses, recurringIncome, validations, accounts, currency);
    toast.success(t('finance.export.success'));
  };

  const tabs = [
    { value: 'overview', label: t('finance.tabs.overview', 'Overview'), icon: LayoutDashboard },
    { value: 'budget', label: t('finance.tabs.budget'), icon: FileText },
    { value: 'transactions', label: t('finance.tabs.transactions'), icon: ArrowLeftRight },
    { value: 'accounts', label: t('finance.tabs.accounts'), icon: Landmark },
  ];

  return (
    <div className="min-h-screen relative">
      <AuraBackground />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 relative z-10 space-y-6">
        {/* AURA Hero */}
        <AuraBalanceHero
          netWorth={netWorth}
          prevMonthNet={prevMonthNet}
          monthlyNet={monthlyNet}
          transactions={allTransactions as any}
          accountsCount={accounts.filter(a => a.is_active).length}
        />

        {/* Floating Tab Bar */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <FloatingTabBar
            items={tabs}
            active={activeTab}
            onChange={setActiveTab}
            rightSlot={
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-2 rounded-[12px] text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.04] transition-colors"
                      title={t('finance.export.title')}
                      aria-label={t('finance.export.title')}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border rounded-xl">
                    <DropdownMenuItem onClick={handleExportAll} className="text-foreground">
                      <Download className="w-3.5 h-3.5 mr-2" />{t('finance.export.fullReport')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="p-2 rounded-[12px] text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.04] transition-colors"
                  title={t('common.settings')}
                  aria-label={t('common.settings')}
                >
                  <Settings className="h-4 w-4" />
                </button>
              </>
            }
          />

          <TabsContent value="overview" className="mt-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-8">
              <FinanceDashboard
                totalEstimated={totalEstimated}
                totalPaid={financed}
                totalRemaining={remaining}
                isCustomMode={isCustomMode}
                monthlyAllocation={settings.project_monthly_allocation}
              />
              {/* Forecast (ex-Planner) integrated */}
              <div className="aura-glass p-6 sm:p-8">
                <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground/80 mb-1">
                  {t('finance.aura.forecast', 'Forecast')}
                </h2>
                <p className="text-xs text-muted-foreground/60 mb-6">
                  {t('finance.aura.forecastSubtitle', 'Long-term financial projections')}
                </p>
                <ProjectionsPanel
                  projectEndDate={projectEndDate}
                  monthlyAllocation={settings.project_monthly_allocation}
                  totalRemaining={remaining}
                  totalRecurringExpenses={totalRecurringExpenses}
                  totalRecurringIncome={totalRecurringIncome}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <MonthlyDashboard salaryPaymentDay={settings.salary_payment_day} />
            </motion.div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="aura-glass p-6">
              <TransactionsTab accountFilter={accountFilter} onClearAccountFilter={() => setAccountFilter(null)} financeSettings={settings} />
            </motion.div>
          </TabsContent>

          <TabsContent value="accounts" className="mt-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-8">
              <AccountsOverview onSelectAccount={(account) => {
                setAccountFilter(account.id);
                setActiveTab('transactions');
              }} />
              <NetWorthHistoryPanel />
              <BudgetProgressPanel
                budgets={budgets}
                expenseItems={recurringExpenses}
                categories={EXPENSE_CATEGORIES}
                currency={currency}
                monthTransactions={currentMonthTransactions as any}
                validations={validations as any}
                onUpsert={async (b) => { await upsertBudget.mutateAsync(b); }}
                onDelete={(id) => deleteBudget.mutate(id)}
                isPending={upsertBudget.isPending}
              />
              <SavingsGoalTracker
                goals={savingsGoals}
                accounts={accounts}
                currency={currency}
                onAdd={async (g) => { await addSavingsGoal.mutateAsync(g); }}
                onUpdate={async (g) => { await updateSavingsGoal.mutateAsync(g); }}
                onDelete={(id) => deleteSavingsGoal.mutate(id)}
                isPending={addSavingsGoal.isPending}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <FinanceSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} currentSettings={settings} />
    </div>
  );
}
