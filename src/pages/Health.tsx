import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Moon, Activity, Brain, Droplets, Apple, Settings, Calendar,
  Sparkles, Wind, Download, BarChart3, Crosshair, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  useHealthSettings, useHealthScore, calculateBMI, getBMICategory,
} from "@/hooks/useHealth";
import { useTodayHealth } from "@/hooks/useHealth";
import { HealthScoreCard } from "@/components/health/HealthScoreCard";
import { HealthMetricCard } from "@/components/health/HealthMetricCard";
import { HealthDailyCheckin } from "@/components/health/HealthDailyCheckin";
import { HealthSettingsModal } from "@/components/health/HealthSettingsModal";
import { HealthWeeklyChart } from "@/components/health/HealthWeeklyChart";
import { HealthBMIIndicator } from "@/components/health/HealthBMIIndicator";
import { HealthStreakBadge } from "@/components/health/HealthStreakBadge";
import { HealthHistoryChart } from "@/components/health/HealthHistoryChart";
import { HealthChallengesPanel } from "@/components/health/HealthChallengesPanel";
import { HealthInsightsPanel } from "@/components/health/HealthInsightsPanel";
import { HealthBreathingExercise } from "@/components/health/HealthBreathingExercise";
import { HealthEnergyCurve } from "@/components/health/HealthEnergyCurve";
import { HealthDataExport } from "@/components/health/HealthDataExport";
import { HUDFrame } from "@/components/health/HUDFrame";
import { useHealthReminders } from "@/hooks/useHealthReminders";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* Small crosshair SVG for corner decorations */
function CrosshairMark({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
      <line x1="10" y1="0" x2="10" y2="20" stroke="hsl(var(--hud-phosphor))" strokeWidth="1" opacity="0.3" />
      <line x1="0" y1="10" x2="20" y2="10" stroke="hsl(var(--hud-phosphor))" strokeWidth="1" opacity="0.3" />
      <circle cx="10" cy="10" r="3" stroke="hsl(var(--hud-phosphor))" strokeWidth="1" fill="none" opacity="0.2" />
    </svg>
  );
}

/* Score-reactive background glow color */
function getAmbientColor(score: number): string {
  if (score >= 80) return "hsl(var(--hud-phosphor) / 0.06)";
  if (score >= 50) return "hsl(212, 90%, 60% / 0.05)";
  return "hsl(var(--hud-amber) / 0.05)";
}

export default function Health() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: settings, isLoading: settingsLoading } = useHealthSettings(user?.id);
  const healthScore = useHealthScore(user?.id);
  const { data: todayData } = useTodayHealth(user?.id);
  
  const bmi = calculateBMI(settings?.height_cm ?? null, settings?.weight_kg ?? null);
  const bmiCategory = getBMICategory(bmi);

  useHealthReminders();

  if (settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-hud-phosphor border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground font-mono uppercase tracking-wider text-xs">{t("health.loading")}</p>
        </div>
      </div>
    );
  }

  const ambientColor = getAmbientColor(healthScore.score);
  const lastSync = todayData?.created_at
    ? format(new Date(todayData.created_at), "HH:mm")
    : "—";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Score-reactive ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[120px]"
          animate={{ background: `radial-gradient(circle, ${ambientColor} 0%, transparent 70%)` }}
          transition={{ duration: 2 }}
        />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, hsl(var(--hud-amber) / 0.03) 0%, transparent 70%)" }}
        />
      </div>
      
      {/* HUD hexagonal grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(30deg, hsl(var(--hud-phosphor) / 0.4) 1px, transparent 1px),
            linear-gradient(150deg, hsl(var(--hud-phosphor) / 0.4) 1px, transparent 1px),
            linear-gradient(270deg, hsl(var(--hud-phosphor) / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 69px, 40px 69px, 40px 69px',
          backgroundPosition: '0 0, 20px 34.5px, 0 0'
        }} />
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6 relative z-10">
        {/* Crosshair corner decorations */}
        <div className="pointer-events-none absolute top-2 left-2"><CrosshairMark /></div>
        <div className="pointer-events-none absolute top-2 right-2"><CrosshairMark /></div>
        <div className="pointer-events-none absolute bottom-2 left-2"><CrosshairMark /></div>
        <div className="pointer-events-none absolute bottom-2 right-2"><CrosshairMark /></div>

        {/* Centered Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4"
        >
          <HUDFrame className="p-4" scanLine>
            <Heart className="w-8 h-8 text-hud-phosphor" />
          </HUDFrame>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-hud-phosphor to-cyan-300 font-orbitron">
              {t("health.title")}
            </h1>
            <p className="text-muted-foreground/70 text-sm font-mono uppercase tracking-wider mt-1">
              {t("health.subtitle")}
            </p>
          </div>
        </motion.div>

        {/* Command Bar with labels */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <HUDFrame className="px-4 py-3">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <HealthStreakBadge size="md" />
              <div className="w-[1px] h-8 bg-hud-phosphor/20 hidden sm:block" />
              <TooltipProvider delayDuration={200}>
                {/* Export */}
                <div className="flex flex-col items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span><HealthDataExport /></span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><span className="font-mono text-xs">CSV EXPORT</span></TooltipContent>
                  </Tooltip>
                  <span className="text-[8px] font-mono text-muted-foreground/60 uppercase tracking-widest">Export</span>
                </div>
                {/* Breathe */}
                <div className="flex flex-col items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setShowBreathing(true)}
                        className="text-hud-phosphor hover:bg-hud-phosphor/10 border-b-2 border-transparent hover:border-hud-phosphor/40 transition-all">
                        <Wind className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><span className="font-mono text-xs">{t("health.breathing.title").toUpperCase()}</span></TooltipContent>
                  </Tooltip>
                  <span className="text-[8px] font-mono text-muted-foreground/60 uppercase tracking-widest">Breathe</span>
                </div>
                {/* Check-in */}
                <div className="flex flex-col items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setShowCheckin(true)}
                        className="text-hud-phosphor hover:bg-hud-phosphor/10 border-b-2 border-transparent hover:border-hud-phosphor/40 transition-all">
                        <Calendar className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><span className="font-mono text-xs">{t("health.dailyCheckin").toUpperCase()}</span></TooltipContent>
                  </Tooltip>
                  <span className="text-[8px] font-mono text-muted-foreground/60 uppercase tracking-widest">Check-in</span>
                </div>
                {/* Config */}
                <div className="flex flex-col items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}
                        className="text-muted-foreground hover:text-hud-phosphor border-b-2 border-transparent hover:border-hud-phosphor/40 transition-all">
                        <Settings className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><span className="font-mono text-xs">{t("health.settings.title").toUpperCase()}</span></TooltipContent>
                  </Tooltip>
                  <span className="text-[8px] font-mono text-muted-foreground/60 uppercase tracking-widest">Config</span>
                </div>
              </TooltipProvider>
              <div className="w-[1px] h-8 bg-hud-phosphor/20 hidden sm:block" />
              <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">
                Last sync: {lastSync}
              </span>
            </div>
          </HUDFrame>
        </motion.div>

        {/* Tabbed Content with sliding indicator */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-hud-surface/60 border border-hud-phosphor/20 p-1 font-mono relative">
            {[
              { value: "overview", icon: Crosshair, label: "OVERVIEW" },
              { value: "analytics", icon: BarChart3, label: "ANALYTICS" },
              { value: "intel", icon: Cpu, label: "INTEL" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-hud-phosphor uppercase tracking-wider text-xs font-mono relative z-10"
              >
                <tab.icon className="w-3.5 h-3.5 mr-1.5" />
                {tab.label}
                {activeTab === tab.value && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-hud-phosphor"
                    style={{ boxShadow: "0 0 8px hsl(var(--hud-phosphor))" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <motion.div
              key="overview"
              initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
              transition={{ duration: 0.5 }}
            >
              {/* Vitals Summary Strip */}
              <VitalsSummaryStrip userId={user?.id} />

              {/* Health Score Hero */}
              <div className="mt-4">
                <HealthScoreCard 
                  score={healthScore.score} 
                  trend={healthScore.trend}
                  factors={healthScore.factors}
                />
              </div>

              {/* BMI Indicator (if enabled) */}
              {settings?.show_bmi && (
                <div className="mt-4">
                  <HealthBMIIndicator bmi={bmi} category={bmiCategory} />
                </div>
              )}

              {/* Metric Cards Grid - compact */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
              >
                {settings?.show_sleep !== false && (
                  <motion.div variants={staggerItem}>
                    <HealthMetricCard icon={Moon} title={t("health.metrics.sleep")} color="blue" metricKey="sleep" />
                  </motion.div>
                )}
                {settings?.show_activity !== false && (
                  <motion.div variants={staggerItem}>
                    <HealthMetricCard icon={Activity} title={t("health.metrics.activity")} color="cyan" metricKey="activity" />
                  </motion.div>
                )}
                {settings?.show_stress !== false && (
                  <motion.div variants={staggerItem}>
                    <HealthMetricCard icon={Brain} title={t("health.metrics.stress")} color="amber" metricKey="stress" />
                  </motion.div>
                )}
                {settings?.show_hydration !== false && (
                  <motion.div variants={staggerItem}>
                    <HealthMetricCard icon={Droplets} title={t("health.metrics.hydration")} color="cyan" metricKey="hydration" />
                  </motion.div>
                )}
                {settings?.show_nutrition && (
                  <motion.div variants={staggerItem}>
                    <HealthMetricCard icon={Apple} title={t("health.metrics.nutrition")} color="orange" metricKey="nutrition" />
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="mt-6 space-y-6">
            <motion.div
              key="analytics"
              initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <HealthWeeklyChart />
              <HealthEnergyCurve />
              <HealthHistoryChart />
            </motion.div>
          </TabsContent>

          {/* INTEL TAB */}
          <TabsContent value="intel" className="mt-6 space-y-6">
            <motion.div
              key="intel"
              initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <HealthInsightsPanel />
              <HealthChallengesPanel />
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground/50 py-4 font-mono uppercase tracking-wider"
        >
          <Sparkles className="w-3 h-3 inline mr-1" />
          {t("health.disclaimer")}
        </motion.div>
      </div>

      {/* Modals */}
      <HealthSettingsModal open={showSettings} onOpenChange={setShowSettings} />
      <HealthDailyCheckin open={showCheckin} onOpenChange={setShowCheckin} />
      <HealthBreathingExercise open={showBreathing} onOpenChange={setShowBreathing} />
    </div>
  );
}

/* ── Vitals Summary Strip ── */
function VitalsSummaryStrip({ userId }: { userId?: string }) {
  const { t } = useTranslation();
  const { data: todayData } = useTodayHealth(userId);

  const metrics = [
    { key: "Sleep", value: todayData?.sleep_quality, max: 5 },
    { key: "Activity", value: todayData?.activity_level, max: 5 },
    { key: "Stress", value: todayData?.stress_level, max: 5, invert: true },
    { key: "Hydration", value: todayData?.hydration_glasses, max: 8 },
  ];

  const getLedClass = (val: number | null | undefined, invert?: boolean) => {
    if (val == null) return "bg-muted-foreground/30";
    const v = invert ? 6 - val : val;
    if (v >= 4) return "bg-emerald-400 shadow-[0_0_4px_hsl(142,70%,50%)]";
    if (v >= 3) return "bg-hud-amber shadow-[0_0_4px_hsl(43,100%,50%)]";
    return "bg-destructive shadow-[0_0_4px_hsl(0,85%,60%)]";
  };

  return (
    <HUDFrame className="px-4 py-2">
      <div className="flex gap-4 overflow-x-auto font-mono text-[10px] uppercase tracking-wider">
        {metrics.map(({ key, value, max, invert }) => (
          <span key={key} className="flex items-center gap-1.5 text-muted-foreground/80 whitespace-nowrap">
            <span className={cn("w-1.5 h-1.5 rounded-full", getLedClass(value, invert))} />
            {key}: {value != null ? `${value}/${max}` : "—"}
          </span>
        ))}
      </div>
    </HUDFrame>
  );
}
