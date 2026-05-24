import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Moon, Activity, Brain, Droplets, Apple,
  Sparkles, BarChart3, Crosshair, Cpu,
  Wind, ClipboardCheck, Settings as SettingsIcon,
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
import { DSPageShell, DSBackground, DSPageLoader, DSPageHeader, DSPanel } from "@/components/ds";

import { useHealthReminders } from "@/hooks/useHealthReminders";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

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
    return <DSPageLoader variant="verbose" message={t("health.loading")} />;
  }

  const lastSync = todayData?.created_at
    ? format(new Date(todayData.created_at), "HH:mm")
    : "—";

  const headerBtn = "p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/60 transition-colors";

  const headerActions = (
    <>
      <button onClick={() => setShowBreathing(true)} className={headerBtn} title={t("health.actions.breathing", "Breathing")} aria-label="Breathing">
        <Wind className="h-4 w-4" />
      </button>
      <button onClick={() => setShowCheckin(true)} className={headerBtn} title={t("health.actions.checkin", "Check-in")} aria-label="Check-in">
        <ClipboardCheck className="h-4 w-4" />
      </button>
      <button onClick={() => setShowSettings(true)} className={headerBtn} title={t("common.settings")} aria-label="Settings">
        <SettingsIcon className="h-4 w-4" />
      </button>
    </>
  );

  return (
    <DSPageShell width="xl" background={<DSBackground variant="cyber" />}>
      <DSPageHeader
        variant="hud"
        systemLabel="HLT.SYS // BIOMETRICS"
        title="HE"
        titleAccent="ALTH"
        actions={headerActions}
      />

      <div className="space-y-6">
        {/* KPI summary */}
        <DSPanel tier="primary" accent="primary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="ds-text-label">Health Score</p>
              <p className="ds-text-metric tabular-nums">{healthScore.score}%</p>
            </div>
            <div>
              <p className="ds-text-label">Trend</p>
              <p className={`ds-text-metric tabular-nums ${healthScore.trend > 0 ? 'text-[hsl(var(--ds-accent-success))]' : healthScore.trend < 0 ? 'text-[hsl(var(--ds-accent-critical))]' : ''}`}>
                {healthScore.trend > 0 ? '+' : ''}{healthScore.trend}
              </p>
            </div>
            <div>
              <p className="ds-text-label">BMI</p>
              <p className="ds-text-metric tabular-nums">{bmi ?? '—'}</p>
              {bmiCategory && <p className="text-xs text-muted-foreground mt-0.5">{bmiCategory}</p>}
            </div>
            <div>
              <p className="ds-text-label">Last Sync</p>
              <p className="ds-text-metric tabular-nums">{lastSync}</p>
            </div>
          </div>
        </DSPanel>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="gap-1.5 py-2">
              <Crosshair className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 py-2">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="intel" className="gap-1.5 py-2">
              <Cpu className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Intel</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-4">
            <DSPanel title="VITAL SIGNS">
              <HealthScoreCard
                score={healthScore.score}
                trend={healthScore.trend}
                factors={healthScore.factors}
              />
            </DSPanel>

            {settings?.show_bmi && (
              <DSPanel title="BMI" tier="secondary">
                <HealthBMIIndicator bmi={bmi} category={bmiCategory} />
              </DSPanel>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {settings?.show_sleep !== false && (
                <DSPanel title="SLEEP" tier="secondary">
                  <HealthMetricCard icon={Moon} title={t("health.metrics.sleep")} color="blue" metricKey="sleep" />
                </DSPanel>
              )}
              {settings?.show_activity !== false && (
                <DSPanel title="ACTIVITY" tier="secondary">
                  <HealthMetricCard icon={Activity} title={t("health.metrics.activity")} color="cyan" metricKey="activity" />
                </DSPanel>
              )}
              {settings?.show_stress !== false && (
                <DSPanel title="STRESS" tier="secondary">
                  <HealthMetricCard icon={Brain} title={t("health.metrics.stress")} color="amber" metricKey="stress" />
                </DSPanel>
              )}
              {settings?.show_hydration !== false && (
                <DSPanel title="HYDRATION" tier="secondary">
                  <HealthMetricCard icon={Droplets} title={t("health.metrics.hydration")} color="cyan" metricKey="hydration" />
                </DSPanel>
              )}
              {settings?.show_nutrition && (
                <DSPanel title="NUTRITION" tier="secondary">
                  <HealthMetricCard icon={Apple} title={t("health.metrics.nutrition")} color="orange" metricKey="nutrition" />
                </DSPanel>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 space-y-4">
            <DSPanel title="WEEKLY">
              <HealthWeeklyChart />
            </DSPanel>
            <DSPanel title="ENERGY CURVE" tier="secondary">
              <HealthEnergyCurve />
            </DSPanel>
            <DSPanel title="HISTORY" tier="secondary">
              <HealthHistoryChart />
            </DSPanel>
          </TabsContent>

          <TabsContent value="intel" className="mt-6 space-y-4">
            <DSPanel title="INSIGHTS">
              <HealthInsightsPanel />
            </DSPanel>
            <DSPanel title="CHALLENGES" tier="secondary">
              <HealthChallengesPanel />
            </DSPanel>
          </TabsContent>
        </Tabs>

        <p className="ds-text-label text-center text-muted-foreground/50 py-4">
          <Sparkles className="w-3 h-3 inline mr-1" />
          {t("health.disclaimer")}
        </p>
      </div>

      {/* Modals */}
      <HealthSettingsModal open={showSettings} onOpenChange={setShowSettings} />
      <HealthDailyCheckin open={showCheckin} onOpenChange={setShowCheckin} />
      <HealthBreathingExercise open={showBreathing} onOpenChange={setShowBreathing} />
    </DSPageShell>
  );
}
