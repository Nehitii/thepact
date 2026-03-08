import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LayoutDashboard, FileText, TrendingUp, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useFinanceSettings, useRecurringExpenses, useRecurringIncome } from "@/hooks/useFinance";
import { FinanceDashboard } from "@/components/finance/FinanceDashboard";
import { MonthlyDashboard } from "@/components/finance/monthly/MonthlyDashboard";
import { ProjectionsPanel } from "@/components/finance/ProjectionsPanel";
import { FinanceSettingsModal } from "@/components/finance/FinanceSettingsModal";
import { parseISO } from "date-fns";

export default function Finance() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const { data: financeSettings } = useFinanceSettings(user?.id);
  const { data: recurringExpenses = [] } = useRecurringExpenses(user?.id);
  const { data: recurringIncome = [] } = useRecurringIncome(user?.id);

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
  };

  const totalRecurringExpenses = recurringExpenses
    .filter(e => e.is_active)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalRecurringIncome = recurringIncome
    .filter(i => i.is_active)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium Neumorphic Background */}
      <div className="fixed inset-0 bg-background dark:bg-gradient-to-b dark:from-[#070a10] dark:via-[#0c1018] dark:to-[#080c14]" />
      <div className="fixed inset-0 mesh-gradient-bg opacity-60 dark:opacity-60 opacity-20" />
      <div className="noise-overlay" />
      <motion.div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[800px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, hsla(200,100%,60%,0.04) 0%, transparent 60%)' }}
        animate={{ opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between py-8 border-b border-border"
        >
          <div className="flex items-center gap-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost" size="sm"
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 -ml-2 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{t('common.back')}</span>
              </Button>
            </motion.div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.025em' }}>
                {t('finance.dashboard')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 hidden sm:block">{t('finance.dashboardSubtitle')}</p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 rounded-xl neu-button"
            >
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline text-sm font-medium">{t('common.settings')}</span>
            </Button>
          </motion.div>
        </motion.header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <TabsList className="w-full max-w-xl neu-card p-2 mb-10 border-0">
              <TabsTrigger value="dashboard" className="flex-1 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsla(200,100%,60%,0.15)] text-muted-foreground font-semibold text-sm rounded-xl transition-all duration-300 py-3">
                <LayoutDashboard className="h-4 w-4 mr-2" />{t('finance.tabs.dashboard')}
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex-1 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsla(200,100%,60%,0.15)] text-muted-foreground font-semibold text-sm rounded-xl transition-all duration-300 py-3">
                <FileText className="h-4 w-4 mr-2" />{t('finance.tabs.budget')}
              </TabsTrigger>
              <TabsTrigger value="planner" className="flex-1 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsla(200,100%,60%,0.15)] text-muted-foreground font-semibold text-sm rounded-xl transition-all duration-300 py-3">
                <TrendingUp className="h-4 w-4 mr-2" />{t('finance.tabs.planner')}
              </TabsTrigger>
            </TabsList>
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