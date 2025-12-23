import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
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

  // Calculate totals from goals
  const { totalEstimatedCost, totalPaid, alreadyFunded } = useMemo(() => {
    const goalsCost = goals.reduce((sum, g) => sum + (g.estimated_cost || 0), 0);
    const customTarget = financeSettings?.project_funding_target ?? 0;
    const total = customTarget > 0 ? customTarget : goalsCost;
    // For now, paid is 0 - could track actual spending later
    return {
      totalEstimatedCost: total,
      totalPaid: 0,
      alreadyFunded: 0, // Will add field to settings
    };
  }, [goals, financeSettings]);

  const totalRemaining = totalEstimatedCost - totalPaid - alreadyFunded;

  const settings = {
    salary_payment_day: financeSettings?.salary_payment_day ?? 1,
    project_funding_target: financeSettings?.project_funding_target ?? 0,
    project_monthly_allocation: financeSettings?.project_monthly_allocation ?? 0,
  };

  // Calculate recurring totals
  const totalRecurringExpenses = recurringExpenses
    .filter(e => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalRecurringIncome = recurringIncome
    .filter(i => i.is_active)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-[#0a0f1a] via-[#0d1220] to-[#080c14] relative overflow-x-hidden">
      {/* Banking-grade subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Subtle gradient orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/[0.03] to-transparent rounded-full blur-[100px]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between pt-6 pb-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span className="text-sm font-medium">Back</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-300"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Finance Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Project financing & budget awareness
          </p>
        </div>

        {/* Tabs - Banking style */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-xl p-1 mb-6">
            <TabsTrigger
              value="overview"
              className="flex-1 data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground font-medium text-sm rounded-lg transition-all duration-300"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="flex-1 data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground font-medium text-sm rounded-lg transition-all duration-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="projections"
              className="flex-1 data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground font-medium text-sm rounded-lg transition-all duration-300"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Projections
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-5 mt-0 animate-fade-in">
            <FinanceOverviewCard
              totalEstimated={totalEstimatedCost}
              totalPaid={totalPaid}
              totalRemaining={totalRemaining}
            />
            <SmartFinancingPanel
              totalRemaining={totalRemaining}
              projectEndDate={projectEndDate}
              currentMonthlyAllocation={settings.project_monthly_allocation}
            />
          </TabsContent>

          {/* Monthly Tab */}
          <TabsContent value="monthly" className="space-y-5 mt-0 animate-fade-in">
            <RecurringManagerPro />
            <MonthlySection
              salaryPaymentDay={settings.salary_payment_day}
            />
          </TabsContent>

          {/* Projections Tab */}
          <TabsContent value="projections" className="space-y-5 mt-0 animate-fade-in">
            <ProjectionsPanel
              projectEndDate={projectEndDate}
              monthlyAllocation={settings.project_monthly_allocation}
              totalRemaining={totalRemaining}
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

      <Navigation />
    </div>
  );
}