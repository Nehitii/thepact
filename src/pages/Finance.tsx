import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LayoutDashboard, FileText, TrendingUp } from "lucide-react";
import { usePact } from "@/hooks/usePact";
import { useFinanceSettings } from "@/hooks/useFinance";
import { FinanceOverview } from "@/components/finance/FinanceOverview";
import { FinanceSlider } from "@/components/finance/FinanceSlider";
import { RecurringManager } from "@/components/finance/RecurringManager";
import { ProjectionsChart } from "@/components/finance/ProjectionsChart";
import { MonthlyValidationForm } from "@/components/finance/MonthlyValidationForm";
import { FinanceSettingsModal } from "@/components/finance/FinanceSettingsModal";
import { format, parseISO } from "date-fns";

export default function Finance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: pact } = usePact(user?.id);
  const { data: financeSettings } = useFinanceSettings(user?.id);

  const projectEndDate = pact?.project_end_date ? parseISO(pact.project_end_date) : null;
  const currentMonth = format(new Date(), 'yyyy-MM-01');

  const settings = {
    salary_payment_day: financeSettings?.salary_payment_day ?? 1,
    project_funding_target: financeSettings?.project_funding_target ?? 0,
    project_monthly_allocation: financeSettings?.project_monthly_allocation ?? 0,
  };

  return (
    <div className="min-h-screen pb-20 bg-[#00050B] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6 relative z-10">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 pt-8">
          <Button 
            variant="hud" 
            onClick={() => navigate("/")}
            className="px-4 py-2 font-rajdhani text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary drop-shadow-[0_0_20px_rgba(91,180,255,0.6)]">
              TRACK FINANCE
            </h1>
            <p className="text-primary/70 tracking-wide font-rajdhani">Project financing awareness</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/30 backdrop-blur-xl border border-primary/20 p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_rgba(91,180,255,0.3)] font-rajdhani tracking-wide text-xs"
            >
              <LayoutDashboard className="h-3 w-3 mr-1.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_rgba(91,180,255,0.3)] font-rajdhani tracking-wide text-xs"
            >
              <FileText className="h-3 w-3 mr-1.5" />
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="projections"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_rgba(91,180,255,0.3)] font-rajdhani tracking-wide text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1.5" />
              Projections
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <FinanceOverview
              projectFundingTarget={settings.project_funding_target}
              projectMonthlyAllocation={settings.project_monthly_allocation}
              onEditSettings={() => setSettingsOpen(true)}
            />
            <FinanceSlider
              totalRemaining={settings.project_funding_target}
              projectEndDate={projectEndDate}
              currentMonthlyAllocation={settings.project_monthly_allocation}
              onAllocationChange={() => {}}
            />
          </TabsContent>

          {/* Monthly Inputs Tab */}
          <TabsContent value="monthly" className="space-y-6 mt-6">
            <RecurringManager />
            <MonthlyValidationForm
              month={currentMonth}
              salaryPaymentDay={settings.salary_payment_day}
            />
          </TabsContent>

          {/* Projections Tab */}
          <TabsContent value="projections" className="space-y-6 mt-6">
            <ProjectionsChart
              projectEndDate={projectEndDate}
              monthlyAllocation={settings.project_monthly_allocation}
              totalRemaining={settings.project_funding_target}
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
