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
import { useTranslation } from "react-i18next";

export default function Health() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  
  const { data: settings, isLoading: settingsLoading } = useHealthSettings(user?.id);
  const healthScore = useHealthScore(user?.id);
  
  const bmi = calculateBMI(settings?.height_cm ?? null, settings?.weight_kg ?? null);
  const bmiCategory = getBMICategory(bmi);

  if (settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">{t("health.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-500/3 dark:bg-teal-500/5 rounded-full blur-[100px]" />
      </div>
      
      {/* Soft grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-5 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.15) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-2xl blur-xl" />
              <div className="relative p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-2xl border border-emerald-500/30">
                <Heart className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 font-orbitron">
                {t("health.title")}
              </h1>
              <p className="text-muted-foreground/70 text-sm">
                {t("health.subtitle")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCheckin(true)}
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t("health.dailyCheckin")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="text-muted-foreground hover:text-emerald-400"
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
            <HealthMetricCard
              icon={Moon}
              title={t("health.metrics.sleep")}
              description={t("health.metrics.sleepDesc")}
              color="blue"
              metricKey="sleep"
            />
          )}
          
          {settings?.show_activity !== false && (
            <HealthMetricCard
              icon={Activity}
              title={t("health.metrics.activity")}
              description={t("health.metrics.activityDesc")}
              color="green"
              metricKey="activity"
            />
          )}
          
          {settings?.show_stress !== false && (
            <HealthMetricCard
              icon={Brain}
              title={t("health.metrics.stress")}
              description={t("health.metrics.stressDesc")}
              color="purple"
              metricKey="stress"
            />
          )}
          
          {settings?.show_hydration !== false && (
            <HealthMetricCard
              icon={Droplets}
              title={t("health.metrics.hydration")}
              description={t("health.metrics.hydrationDesc")}
              color="cyan"
              metricKey="hydration"
            />
          )}
          
          {settings?.show_nutrition && (
            <HealthMetricCard
              icon={Apple}
              title={t("health.metrics.nutrition")}
              description={t("health.metrics.nutritionDesc")}
              color="orange"
              metricKey="nutrition"
            />
          )}
        </div>

        {/* Weekly Overview Chart */}
        <HealthWeeklyChart />

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground/50 py-4"
        >
          <Sparkles className="w-3 h-3 inline mr-1" />
          {t("health.disclaimer")}
        </motion.div>
      </div>

      {/* Modals */}
      <HealthSettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
      
      <HealthDailyCheckin
        open={showCheckin}
        onOpenChange={setShowCheckin}
      />
    </div>
  );
}
