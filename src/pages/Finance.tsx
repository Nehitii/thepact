import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, FileText, TrendingUp, Settings, Landmark, ArrowLeftRight, Download } from "lucide-react";
import { motion } from "framer-motion";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useFinanceSettings, useRecurringExpenses, useRecurringIncome, useMonthlyValidations } from "@/hooks/useFinance";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategoryBudgets, useUpsertCategoryBudget, useDeleteCategoryBudget, useSavingsGoals, useAddSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal } from "@/hooks/useBudgets";
import { FinanceDashboard } from "@/components/finance/FinanceDashboard";
import { MonthlyDashboard } from "@/components/finance/monthly/MonthlyDashboard";
import { ProjectionsPanel } from "@/components/finance/ProjectionsPanel";
import { FinanceSettingsModal } from "@/components/finance/FinanceSettingsModal";
import { AccountsOverview } from "@/components/finance/accounts";
import { VaultMeshBackground } from "@/components/finance/VaultMeshBackground";
import { BudgetProgressPanel, SavingsGoalTracker } from "@/components/finance/budgets";
import { TransactionsTab } from "@/components/finance/transactions";
import { EXPENSE_CATEGORIES } from "@/lib/financeCategories";
import { exportFullReport } from "@/lib/financeExport";
import { roundMoney } from "@/lib/financeCategories";
import { parseISO, format, startOfMonth } from "date-fns";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Finance() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const { data: financeSettings } = useFinanceSettings(user?.id);
  const { data: recurringExpenses = [] } = useRecurringExpenses(user?.id);
  const { data: recurringIncome = [] } = useRecurringIncome(user?.id);
  const { data: validations = [] } = useMonthlyValidations(user?.id);
  const { data: accounts = [] } = useAccounts(user?.id);
  const { data: budgets = [] } = useCategoryBudgets(user?.id);
  const { data: savingsGoals = [] } = useSavingsGoals(user?.id);

  // Fetch current month transactions for budget tracking
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

  // Filter current month transactions for budget panel
  const currentMonthTransactions = useMemo(() => {
    return allTransactions.filter(tx => tx.transaction_date >= currentMonthStart);
  }, [allTransactions, currentMonthStart]);

  const handleExportAll = () => {
    exportFullReport(recurringExpenses, recurringIncome, validations, accounts, currency);
    toast.success(t('finance.export.success'));
  };

  const tabTriggerClass = "flex-1 min-w-0 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsla(200,100%,60%,0.15)] text-muted-foreground font-semibold text-xs sm:text-sm rounded-xl transition-all duration-300 py-3 px-2 sm:px-4 group";

  const TabNum = ({ n }: { n: string }) => (
    <span className="hidden md:inline font-mono text-[10px] text-muted-foreground/40 group-data-[state=active]:text-primary/70 mr-1.5 tracking-wider">{n}</span>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      <VaultMeshBackground />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ModuleHeader
          systemLabel="VAULT_OS // SECURE_LINK ●"
          title="FUND "
          titleAccent="FLOW"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex justify-center mb-10">
            <div className="w-full max-w-3xl flex items-center gap-2">
              <TabsList className="flex-1 neu-card p-2 border-0 overflow-x-auto scrollbar-hide">
                <TabsTrigger value="dashboard" className={tabTriggerClass}>
                  <LayoutDashboard className="h-4 w-4 sm:mr-2 shrink-0" /><TabNum n="01" /><span className="hidden sm:inline">{t('finance.tabs.dashboard')}</span>
                </TabsTrigger>
                <TabsTrigger value="budget" className={tabTriggerClass}>
                  <FileText className="h-4 w-4 sm:mr-2 shrink-0" /><TabNum n="02" /><span className="hidden sm:inline">{t('finance.tabs.budget')}</span>
                </TabsTrigger>
                <TabsTrigger value="transactions" className={tabTriggerClass}>
                  <ArrowLeftRight className="h-4 w-4 sm:mr-2 shrink-0" /><TabNum n="03" /><span className="hidden sm:inline">{t('finance.tabs.transactions')}</span>
                </TabsTrigger>
                <TabsTrigger value="accounts" className={tabTriggerClass}>
                  <Landmark className="h-4 w-4 sm:mr-2 shrink-0" /><TabNum n="04" /><span className="hidden sm:inline">{t('finance.tabs.accounts')}</span>
                </TabsTrigger>
                <TabsTrigger value="planner" className={tabTriggerClass}>
                  <TrendingUp className="h-4 w-4 sm:mr-2 shrink-0" /><TabNum n="05" /><span className="hidden sm:inline">{t('finance.tabs.planner')}</span>
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-1 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2.5 rounded-xl text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all duration-200" title={t('finance.export.title')}>
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
                  className="p-2.5 rounded-xl text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all duration-200"
                  title={t('common.settings')}
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>

          <TabsContent value="dashboard" className="mt-0 pb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <FinanceDashboard
                totalEstimated={totalEstimated}
                totalPaid={financed}
                totalRemaining={remaining}
                isCustomMode={isCustomMode}
                monthlyAllocation={settings.project_monthly_allocation}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="budget" className="mt-0 pb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <MonthlyDashboard salaryPaymentDay={settings.salary_payment_day} />
            </motion.div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-0 pb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <TransactionsTab accountFilter={accountFilter} onClearAccountFilter={() => setAccountFilter(null)} financeSettings={settings} />
            </motion.div>
          </TabsContent>

          <TabsContent value="accounts" className="mt-0 pb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="space-y-8">
                <AccountsOverview onSelectAccount={(account) => {
                  setAccountFilter(account.id);
                  setActiveTab('transactions');
                }} />
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
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="planner" className="mt-0 pb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <ProjectionsPanel
                projectEndDate={projectEndDate}
                monthlyAllocation={settings.project_monthly_allocation}
                totalRemaining={remaining}
                totalRecurringExpenses={totalRecurringExpenses}
                totalRecurringIncome={totalRecurringIncome}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <FinanceSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} currentSettings={settings} />
    </div>
  );
}
