import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { 
  Heart, 
  Moon, 
  Activity, 
  Brain, 
  Droplets,
  Apple,
  Settings,
  Calendar,
  Sparkles,
  Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  useHealthSettings, 
  useHealthScore,
  calculateBMI,
  getBMICategory,
} from "@/hooks/useHealth";
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

export default function Health() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  
  const { data: settings, isLoading: settingsLoading } = useHealthSettings(user?.id);
  const healthScore = useHealthScore(user?.id);
  
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* HUD ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, hsl(var(--hud-phosphor) / 0.06) 0%, transparent 70%)" }}
        />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, hsl(var(--hud-amber) / 0.04) 0%, transparent 70%)" }}
        />
      </div>
      
      {/* HUD grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.08]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--hud-phosphor) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--hud-phosphor) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div className="flex items-center gap-4">
            <HUDFrame className="p-4" scanLine>
              <Heart className="w-8 h-8 text-hud-phosphor" />
            </HUDFrame>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-hud-phosphor to-cyan-300 font-orbitron">
                {t("health.title")}
              </h1>
              <p className="text-muted-foreground/70 text-sm font-mono uppercase tracking-wider">
                {t("health.subtitle")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <HealthStreakBadge size="md" />
            <HealthDataExport />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBreathing(true)}
              className="border-hud-phosphor/30 text-hud-phosphor hover:bg-hud-phosphor/10"
            >
              <Wind className="w-4 h-4 mr-2" />
              {t("health.breathing.title")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCheckin(true)}
              className="border-hud-phosphor/30 text-hud-phosphor hover:bg-hud-phosphor/10"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t("health.dailyCheckin")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="text-muted-foreground hover:text-hud-phosphor"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Health Score Hero */}
        <HealthScoreCard 
          score={healthScore.score} 
          trend={healthScore.trend}
          factors={healthScore.factors}
        />

        {/* BMI Indicator (if enabled) */}
        {settings?.show_bmi && (
          <HealthBMIIndicator bmi={bmi} category={bmiCategory} />
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settings?.show_sleep !== false && (
            <HealthMetricCard icon={Moon} title={t("health.metrics.sleep")} description={t("health.metrics.sleepDesc")} color="blue" metricKey="sleep" />
          )}
          {settings?.show_activity !== false && (
            <HealthMetricCard icon={Activity} title={t("health.metrics.activity")} description={t("health.metrics.activityDesc")} color="cyan" metricKey="activity" />
          )}
          {settings?.show_stress !== false && (
            <HealthMetricCard icon={Brain} title={t("health.metrics.stress")} description={t("health.metrics.stressDesc")} color="amber" metricKey="stress" />
          )}
          {settings?.show_hydration !== false && (
            <HealthMetricCard icon={Droplets} title={t("health.metrics.hydration")} description={t("health.metrics.hydrationDesc")} color="cyan" metricKey="hydration" />
          )}
          {settings?.show_nutrition && (
            <HealthMetricCard icon={Apple} title={t("health.metrics.nutrition")} description={t("health.metrics.nutritionDesc")} color="orange" metricKey="nutrition" />
          )}
        </div>

        {/* Weekly Overview Chart */}
        <HealthWeeklyChart />

        {/* Energy Curve */}
        <HealthEnergyCurve />

        {/* AI Insights */}
        <HealthInsightsPanel />

        {/* Extended History and Challenges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HealthHistoryChart />
          <HealthChallengesPanel />
        </div>

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
