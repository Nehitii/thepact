import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Moon, Activity, Brain, Droplets, Apple,
  Sparkles, BarChart3, Crosshair, Cpu,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { HealthHistoryChart } from "@/components/health/HealthHistoryChart";
import { HealthChallengesPanel } from "@/components/health/HealthChallengesPanel";
import { HealthInsightsPanel } from "@/components/health/HealthInsightsPanel";
import { HealthBreathingExercise } from "@/components/health/HealthBreathingExercise";
import { HealthEnergyCurve } from "@/components/health/HealthEnergyCurve";
import { HealthVitalCoreHero } from "@/components/health/HealthVitalCoreHero";
import { HealthTacticalReadout } from "@/components/health/HealthTacticalReadout";
import { HealthBioMesh } from "@/components/health/HealthBioMesh";

import { useHealthReminders } from "@/hooks/useHealthReminders";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

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
          <p className="text-muted-foreground font-mono uppercase tracking-wider text-xs">
            {t("health.loading")}
          </p>
        </div>
      </div>
    );
  }

  const lastSync = todayData?.created_at
    ? format(new Date(todayData.created_at), "HH:mm")
    : "—";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Score-reactive bio-mesh background */}
      <HealthBioMesh score={healthScore.score} />

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5 relative z-10">
        {/* === SIGNATURE HERO === */}
        <HealthVitalCoreHero score={healthScore.score} />

        {/* === TACTICAL READOUT (replaces command bar) === */}
        <HealthTacticalReadout
          onBreathing={() => setShowBreathing(true)}
          onCheckin={() => setShowCheckin(true)}
          onSettings={() => setShowSettings(true)}
          lastSync={lastSync}
          score={healthScore.score}
        />

        {/* === TABBED CONTENT === */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-hud-surface/60 border border-hud-phosphor/15 p-1 font-mono rounded-xl relative">
            {[
              { value: "overview", icon: Crosshair, label: "OVERVIEW" },
              { value: "analytics", icon: BarChart3, label: "ANALYTICS" },
              { value: "intel", icon: Cpu, label: "INTEL" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-hud-phosphor uppercase tracking-wider text-xs font-mono relative z-10 rounded-lg"
              >
                <tab.icon className="w-3.5 h-3.5 mr-1.5" />
                {tab.label}
                {activeTab === tab.value && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-hud-phosphor rounded-full"
                    style={{ boxShadow: "0 0 8px hsl(var(--hud-phosphor))" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-5 space-y-5">
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              {/* Health Score Hero (radar disk) */}
              <HealthScoreCard
                score={healthScore.score}
                trend={healthScore.trend}
                factors={healthScore.factors}
              />

              {/* BMI Indicator */}
              {settings?.show_bmi && (
                <HealthBMIIndicator bmi={bmi} category={bmiCategory} />
              )}

              {/* Bio-Sensor Modules — horizontal cards */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-2 gap-3"
              >
                {settings?.show_sleep !== false && (
                  <motion.div variants={staggerItem}>
                    <HealthMetricCard
                      icon={Moon}
                      title={t("health.metrics.sleep")}
                      color="blue"
                      metricKey="sleep"
                    />
                  </motion.div>
                )}
                {settings?.show_activity !== false && (
                  <motion.div variants={staggerItem}>
                    <HealthMetricCard
                      icon={Activity}
                      title={t("health.metrics.activity")}
                      color="cyan"
                      metricKey="activity"
                    />
                  </motion.div>
                )}
                {settings?.show_stress !== false && (
                  <motion.div variants={staggerItem}>
                    <HealthMetricCard
                      icon={Brain}
                      title={t("health.metrics.stress")}
                      color="amber"
                      metricKey="stress"
                    />
                  </motion.div>
                )}
                {settings?.show_hydration !== false && (
                  <motion.div variants={staggerItem}>
                    <HealthMetricCard
                      icon={Droplets}
                      title={t("health.metrics.hydration")}
                      color="cyan"
                      metricKey="hydration"
                    />
                  </motion.div>
                )}
                {settings?.show_nutrition && (
                  <motion.div variants={staggerItem}>
                    <HealthMetricCard
                      icon={Apple}
                      title={t("health.metrics.nutrition")}
                      color="orange"
                      metricKey="nutrition"
                    />
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="mt-5 space-y-5">
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              <HealthWeeklyChart />
              <HealthEnergyCurve />
              <HealthHistoryChart />
            </motion.div>
          </TabsContent>

          {/* INTEL TAB */}
          <TabsContent value="intel" className="mt-5 space-y-5">
            <motion.div
              key="intel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
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
