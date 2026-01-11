import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LayoutDashboard, FileText, TrendingUp, Settings } from "lucide-react";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useFinanceSettings, useRecurringExpenses, useRecurringIncome } from "@/hooks/useFinance";
import { FinanceOverviewCard } from "@/components/finance/FinanceOverviewCard";
import { SmartFinancingPanel } from "@/components/finance/SmartFinancingPanel";
import { RecurringManagerPro } from "@/components/finance/RecurringManagerPro";
import { MonthlySection } from "@/components/finance/MonthlySection";
import { ProjectionsPanel } from "@/components/finance/ProjectionsPanel";
import { FinanceSettingsModal } from "@/components/finance/FinanceSettingsModal";
import { parseISO } from "date-fns";

export default function Finance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const { data: financeSettings } = useFinanceSettings(user?.id);
  const { data: recurringExpenses = [] } = useRecurringExpenses(user?.id);
  const { data: recurringIncome = [] } = useRecurringIncome(user?.id);

  const projectEndDate = pact?.project_end_date ? parseISO(pact.project_end_date) : null;

  // Determine if custom target mode is active
  const isCustomMode = (financeSettings?.project_funding_target ?? 0) > 0;

  // Calculate totals from goals with CORRECT logic
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
    
    const remainingAmount = Math.max(total - financedTotal, 0);
    
    return {
      totalEstimated: total,
      financed: financedTotal,
      remaining: remainingAmount,
    };
  }, [goals, financeSettings]);

  const settings = {
    salary_payment_day: financeSettings?.salary_payment_day ?? 1,
    project_funding_target: financeSettings?.project_funding_target ?? 0,
    project_monthly_allocation: financeSettings?.project_monthly_allocation ?? 0,
    already_funded: financeSettings?.already_funded ?? 0,
  };

  const totalRecurringExpenses = recurringExpenses
    .filter(e => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalRecurringIncome = recurringIncome
    .filter(i => i.is_active)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1a] via-[#0d1220] to-[#080c14] relative">
      {/* Subtle background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-primary/[0.02] to-transparent rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }} />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/")}
              className="text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Back</span>
            </Button>
            <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                Finance Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">
                Track your project financing & monthly budget
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
          >
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline text-sm">Settings</span>
          </Button>
        </header>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
          <TabsList className="w-full max-w-lg bg-white/[0.02] border border-white/[0.06] rounded-xl p-1.5 mb-8">
            <TabsTrigger
              value="overview"
              className="flex-1 data-[state=active]:bg-white/[0.08] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-400 font-medium text-sm rounded-lg transition-all duration-200 py-2.5"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="flex-1 data-[state=active]:bg-white/[0.08] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-400 font-medium text-sm rounded-lg transition-all duration-200 py-2.5"
            >
              <FileText className="h-4 w-4 mr-2" />
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="projections"
              className="flex-1 data-[state=active]:bg-white/[0.08] data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-400 font-medium text-sm rounded-lg transition-all duration-200 py-2.5"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Projections
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinanceOverviewCard
                totalEstimated={totalEstimated}
                totalPaid={financed}
                totalRemaining={remaining}
                isCustomMode={isCustomMode}
              />
              <SmartFinancingPanel
                totalRemaining={remaining}
                projectEndDate={projectEndDate}
                currentMonthlyAllocation={settings.project_monthly_allocation}
              />
            </div>
          </TabsContent>

          {/* Monthly Tab */}
          <TabsContent value="monthly" className="mt-0 animate-fade-in">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <MonthlySection salaryPaymentDay={settings.salary_payment_day} />
              </div>
              <div className="xl:col-span-1">
                <RecurringManagerPro />
              </div>
            </div>
          </TabsContent>

          {/* Projections Tab */}
          <TabsContent value="projections" className="mt-0 animate-fade-in pb-8">
            <ProjectionsPanel
              projectEndDate={projectEndDate}
              monthlyAllocation={settings.project_monthly_allocation}
              totalRemaining={remaining}
              totalRecurringExpenses={totalRecurringExpenses}
              totalRecurringIncome={totalRecurringIncome}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Settings Modal */}
      <FinanceSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        currentSettings={settings}
      />
    </div>
  );
}
