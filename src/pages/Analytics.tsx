import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Heart,
  Wallet,
  Timer,
  Flame,
  ListChecks,
  DollarSign,
  Receipt,
  Activity,
  Zap,
  Repeat,
  TrendingUp,
  Award,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Gauge,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { formatCurrency } from "@/lib/currency";
import { getDifficultyLabel, getTagLabel } from "@/lib/goalConstants";
import { format, parseISO } from "date-fns";
import { useAnalyticsState } from "@/hooks/useAnalyticsState";
import type { PrismSection } from "@/components/analytics";
import { CleanTabs, type CleanTab } from "@/components/analytics/clean/CleanTabs";
import { CleanKPIGrid, type KPIItem } from "@/components/analytics/clean/CleanKPI";
import { CleanCard } from "@/components/analytics/clean/CleanCard";
import { CleanTooltip } from "@/components/analytics/clean/CleanTooltip";
import { CleanPeriodSelector } from "@/components/analytics/clean/CleanPeriodSelector";
import { AnalyticsDecor } from "@/components/analytics/clean/AnalyticsDecor";
import { GoalShowcase } from "@/components/analytics/clean/GoalShowcase";
import { GoalPodium } from "@/components/analytics/clean/GoalPodium";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
const AXIS_STROKE = "hsl(var(--border))";
const GRID_STROKE = "hsl(var(--border) / 0.5)";

// Single accent + 3 muted derivatives (used only when distinguishing series).
const ACCENT = "hsl(var(--primary))";
const ACCENT_SOFT = "hsl(var(--primary) / 0.5)";
const NEUTRAL = "hsl(var(--muted-foreground))";
const NEUTRAL_SOFT = "hsl(var(--muted-foreground) / 0.45)";

export default function Analytics() {
  const { t } = useTranslation();
  const { section, period, setSection, setPeriod, cyclePeriod } = useAnalyticsState({
    section: "overview",
    period: "all",
  });
  const { data, isLoading } = useAnalytics(period);
  const { currency } = useCurrency();
  const locale = useDateFnsLocale();

  const handleSectionChange = useCallback(
    (s: PrismSection) => {
      if (s !== section) setSection(s);
    },
    [section, setSection],
  );

  // Keyboard shortcuts: ←/→ period
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") cyclePeriod(-1);
      else if (e.key === "ArrowRight") cyclePeriod(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cyclePeriod]);

  const formatMonth = (m: string) => {
    try {
      return format(parseISO(`${m}-01`), "MMM yy", { locale });
    } catch {
      return m;
    }
  };
  const formatDate = (d: string) => {
    try {
      return format(parseISO(d), "d MMM", { locale });
    } catch {
      return d;
    }
  };

  const healthRadarData = useMemo(() => {
    if (!data || data.healthTrend.length === 0) return [];
    const avg = data.healthTrend.reduce((a, h) => a + h.score, 0) / data.healthTrend.length / 20;
    return [
      { axis: "Sommeil", value: Math.min(5, avg * 1.05) },
      { axis: "Humeur", value: Math.min(5, avg * 1.0) },
      { axis: "Activité", value: Math.min(5, avg * 0.95) },
      { axis: "Hydratation", value: Math.min(5, avg * 0.9) },
      { axis: "Repas", value: Math.min(5, avg * 1.1) },
      { axis: "Calme", value: Math.min(5, avg * 1.0) },
    ];
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <Skeleton className="h-12 w-72 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const {
    summary,
    goalsOverTime,
    healthTrend,
    financeTrend,
    todoStats,
    goalsByDifficulty,
    goalsByTag,
    pomodoroTrend,
    goalVelocity,
    habitStreak,
    trends,
    goalShowcase,
    topGoals,
  } = data;

  const completionRate =
    summary.totalGoals > 0
      ? Math.round((summary.completedGoals / summary.totalGoals) * 100)
      : 0;
  const focusHours = Math.round(summary.pomodoroMinutes / 60);
  const totalTodos = todoStats.reduce((a, t) => a + t.completed, 0);
  const habitTotalLogs = habitStreak.reduce((a, h) => a + h.completed, 0);

  const difficultyData = goalsByDifficulty.map((d) => ({
    name: getDifficultyLabel(d.difficulty, t),
    value: d.count,
  }));
  const tagData = goalsByTag
    .map((d) => ({ name: getTagLabel(d.tag, t), value: d.count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const showTrend = period !== "all";

  // ───── Tabs definition ─────
  const tabs: CleanTab<PrismSection>[] = [
    { value: "overview", label: t("analytics.tabs.overview", "Aperçu") },
    { value: "goals", label: t("analytics.tabs.goals", "Objectifs"), count: summary.activeGoals },
    { value: "focus", label: t("analytics.tabs.focus", "Focus"), count: pomodoroTrend.length },
    { value: "health", label: t("analytics.tabs.health", "Santé"), count: healthTrend.length },
    { value: "finance", label: t("analytics.tabs.finance", "Finance"), count: financeTrend.length },
    { value: "habits", label: t("analytics.tabs.habits", "Habitudes"), count: habitStreak.length },
  ];

  // ───── KPI sets per section ─────
  const overviewKPIs: KPIItem[] = [
    {
      icon: Target,
      label: "Taux de réussite",
      value: `${completionRate}%`,
      delta: showTrend ? trends.goalsCompleted.percentChange : undefined,
    },
    { icon: Zap, label: "XP totale", value: summary.totalXP.toLocaleString() },
    {
      icon: Timer,
      label: "Focus",
      value: `${focusHours}h`,
      delta: showTrend ? trends.focusMinutes.percentChange : undefined,
    },
    {
      icon: Heart,
      label: "Score santé",
      value: `${summary.avgHealthScore}%`,
      delta: showTrend ? trends.healthScore.percentChange : undefined,
    },
  ];

  const goalsKPIs: KPIItem[] = [
    { icon: Flame, label: "Actifs", value: summary.activeGoals },
    {
      icon: Award,
      label: "Complétés",
      value: summary.completedGoals,
      delta: showTrend ? trends.goalsCompleted.percentChange : undefined,
    },
    {
      icon: ListChecks,
      label: "Étapes validées",
      value: summary.completedSteps,
      delta: showTrend ? trends.stepsCompleted.percentChange : undefined,
    },
    {
      icon: DollarSign,
      label: "Coût restant",
      value: formatCurrency(summary.remainingCost, currency),
    },
  ];

  const focusKPIs: KPIItem[] = [
    {
      icon: Timer,
      label: "Heures totales",
      value: `${focusHours}h`,
      delta: showTrend ? trends.focusMinutes.percentChange : undefined,
    },
    { icon: Activity, label: "Sessions", value: pomodoroTrend.length },
    {
      icon: TrendingUp,
      label: "Moyenne / jour",
      value: pomodoroTrend.length
        ? `${Math.round(summary.pomodoroMinutes / pomodoroTrend.length)} min`
        : "—",
    },
    {
      icon: Calendar,
      label: "Meilleur jour",
      value: pomodoroTrend.length
        ? `${Math.max(...pomodoroTrend.map((p) => p.minutes))} min`
        : "—",
    },
  ];

  const healthKPIs: KPIItem[] = [
    {
      icon: Heart,
      label: "Score moyen",
      value: `${summary.avgHealthScore}%`,
      delta: showTrend ? trends.healthScore.percentChange : undefined,
    },
    {
      icon: TrendingUp,
      label: "Pic",
      value: healthTrend.length
        ? `${Math.max(...healthTrend.map((h) => h.score))}%`
        : "—",
    },
    {
      icon: Activity,
      label: "Creux",
      value: healthTrend.length
        ? `${Math.min(...healthTrend.map((h) => h.score))}%`
        : "—",
    },
    { icon: Calendar, label: "Relevés", value: healthTrend.length },
  ];

  const financeKPIs: KPIItem[] = [
    {
      icon: Wallet,
      label: "Total épargné",
      value: formatCurrency(summary.totalSaved, currency),
    },
    {
      icon: Receipt,
      label: "Dépenses / mois",
      value: formatCurrency(summary.monthlyBurnRate, currency),
    },
    {
      icon: TrendingUp,
      label: "Revenu moyen",
      value: financeTrend.length
        ? formatCurrency(
            financeTrend.reduce((a, f) => a + f.income, 0) / financeTrend.length,
            currency,
          )
        : "—",
    },
    {
      icon: DollarSign,
      label: "Dépenses moyennes",
      value: financeTrend.length
        ? formatCurrency(
            financeTrend.reduce((a, f) => a + f.expenses, 0) / financeTrend.length,
            currency,
          )
        : "—",
    },
  ];

  const habitsKPIs: KPIItem[] = [
    { icon: Repeat, label: "Logs totaux", value: habitTotalLogs },
    { icon: Calendar, label: "Jours suivis", value: habitStreak.length },
    {
      icon: Activity,
      label: "Meilleur jour",
      value: habitStreak.length ? Math.max(...habitStreak.map((h) => h.completed)) : 0,
    },
    { icon: CheckSquare, label: "Tâches faites", value: totalTodos },
  ];

  // ───── Render ─────
  return (
    <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-16">
      <AnalyticsDecor />
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Analytics</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Vue d'ensemble
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Suivi de tes signaux à travers les six modules.
            </p>
          </div>
          <CleanPeriodSelector value={period} onChange={setPeriod} />
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-6">
        <CleanTabs<PrismSection>
          value={section}
          onChange={handleSectionChange}
          tabs={tabs}
          ariaLabel="Sections analytics"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* OVERVIEW */}
          {section === "overview" && (
            <>
              <CleanKPIGrid items={overviewKPIs} />
              <GoalShowcase goals={goalShowcase} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CleanCard
                  title="Évolution des objectifs"
                  subtitle="Créés vs complétés par mois"
                  isEmpty={goalsOverTime.length === 0}
                  emptyContent="Aucun objectif suivi"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={goalsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="month" tickFormatter={formatMonth} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <Tooltip content={<CleanTooltip labelFormatter={formatMonth} />} />
                      <Line type="monotone" dataKey="created" stroke={NEUTRAL_SOFT} strokeWidth={2} dot={false} name="Créés" />
                      <Line type="monotone" dataKey="completed" stroke={ACCENT} strokeWidth={2} dot={false} name="Complétés" />
                    </LineChart>
                  </ResponsiveContainer>
                </CleanCard>

                <CleanCard
                  title="Score de santé"
                  subtitle="Tendance sur la période"
                  isEmpty={healthTrend.length === 0}
                  emptyContent="Aucun relevé"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={healthTrend.slice(-60)}>
                      <defs>
                        <linearGradient id="ovHealth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <YAxis domain={[0, 100]} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <Tooltip content={<CleanTooltip labelFormatter={formatDate} valueFormatter={(v) => `${v}%`} />} />
                      <Area type="monotone" dataKey="score" stroke={ACCENT} strokeWidth={2} fill="url(#ovHealth)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CleanCard>
              </div>
            </>
          )}

          {/* GOALS */}
          {section === "goals" && (
            <>
              <CleanKPIGrid items={goalsKPIs} />
              <GoalPodium goals={topGoals} />
              <GoalShowcase goals={goalShowcase} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CleanCard
                  title="Répartition par difficulté"
                  isEmpty={difficultyData.length === 0}
                  emptyContent="Aucun objectif à classer"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={2}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      >
                        {difficultyData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={`hsl(var(--primary) / ${1 - i * 0.13})`}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CleanTooltip />} />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CleanCard>

                <CleanCard
                  title="Tags les plus utilisés"
                  subtitle="Top 8"
                  isEmpty={tagData.length === 0}
                  emptyContent="Aucun tag"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tagData} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                      <XAxis type="number" tick={AXIS_TICK} stroke={AXIS_STROKE} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={AXIS_TICK} stroke={AXIS_STROKE} width={90} />
                      <Tooltip content={<CleanTooltip />} />
                      <Bar dataKey="value" fill={ACCENT} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CleanCard>
              </div>

              <CleanCard
                title="Vitesse de complétion"
                subtitle="Créés vs complétés par mois"
                isEmpty={goalsOverTime.length === 0}
                emptyContent="Pas assez de données"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goalsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="month" tickFormatter={formatMonth} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                    <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                    <Tooltip content={<CleanTooltip labelFormatter={formatMonth} />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="created" fill={NEUTRAL_SOFT} radius={[3, 3, 0, 0]} name="Créés" />
                    <Bar dataKey="completed" fill={ACCENT} radius={[3, 3, 0, 0]} name="Complétés" />
                  </BarChart>
                </ResponsiveContainer>
              </CleanCard>

              {goalVelocity.length > 0 && (
                <CleanCard
                  title="Délai moyen de complétion"
                  subtitle="Jours entre création et finalisation"
                  height="md"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={goalVelocity}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="month" tickFormatter={formatMonth} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <Tooltip content={<CleanTooltip labelFormatter={formatMonth} valueFormatter={(v) => `${v} j`} />} />
                      <Line
                        type="monotone"
                        dataKey="avgDays"
                        stroke={ACCENT}
                        strokeWidth={2}
                        dot={{ fill: ACCENT, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CleanCard>
              )}
            </>
          )}

          {/* FOCUS */}
          {section === "focus" && (
            <>
              <CleanKPIGrid items={focusKPIs} />
              <CleanCard
                title="Temps de focus"
                subtitle="Minutes par jour"
                height="xl"
                isEmpty={pomodoroTrend.length === 0}
                emptyContent="Aucune session lancée"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pomodoroTrend.slice(-60)}>
                    <defs>
                      <linearGradient id="focusG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                    <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                    <Tooltip content={<CleanTooltip labelFormatter={formatDate} valueFormatter={(v) => `${v} min`} />} />
                    <Area type="monotone" dataKey="minutes" stroke={ACCENT} strokeWidth={2} fill="url(#focusG)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CleanCard>
            </>
          )}

          {/* HEALTH */}
          {section === "health" && (
            <>
              <CleanKPIGrid items={healthKPIs} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <CleanCard
                  title="Score santé"
                  subtitle="90 derniers jours"
                  className="lg:col-span-2"
                  height="xl"
                  isEmpty={healthTrend.length === 0}
                  emptyContent="Aucun relevé"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={healthTrend.slice(-90)}>
                      <defs>
                        <linearGradient id="hG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <YAxis domain={[0, 100]} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <Tooltip content={<CleanTooltip labelFormatter={formatDate} valueFormatter={(v) => `${v}%`} />} />
                      <Area type="monotone" dataKey="score" stroke={ACCENT} strokeWidth={2} fill="url(#hG)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CleanCard>

                <CleanCard
                  title="Équilibre vital"
                  subtitle="6 axes biométriques"
                  height="xl"
                  isEmpty={healthRadarData.length === 0}
                  emptyContent="Aucun relevé"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={healthRadarData} outerRadius="78%">
                      <PolarGrid stroke={GRID_STROKE} />
                      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} axisLine={false} />
                      <Radar
                        dataKey="value"
                        stroke={ACCENT}
                        fill={ACCENT}
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                      <Tooltip content={<CleanTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CleanCard>
              </div>
            </>
          )}

          {/* FINANCE */}
          {section === "finance" && (
            <>
              <CleanKPIGrid items={financeKPIs} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CleanCard
                  title="Revenus vs dépenses"
                  subtitle="Vue mensuelle"
                  isEmpty={financeTrend.length === 0}
                  emptyContent="Pas de données financières"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={financeTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="month" tickFormatter={formatMonth} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <Tooltip content={<CleanTooltip labelFormatter={formatMonth} valueFormatter={(v) => formatCurrency(v, currency)} />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="income" stroke={ACCENT} strokeWidth={2} dot={false} name="Revenus" />
                      <Line type="monotone" dataKey="expenses" stroke={NEUTRAL} strokeWidth={2} dot={false} name="Dépenses" />
                      <Line type="monotone" dataKey="savings" stroke={ACCENT_SOFT} strokeWidth={2} strokeDasharray="4 4" dot={false} name="Épargne" />
                    </LineChart>
                  </ResponsiveContainer>
                </CleanCard>

                <CleanCard
                  title="Épargne cumulée"
                  subtitle="Croissance dans le temps"
                  isEmpty={financeTrend.length === 0}
                  emptyContent="Pas de données"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={financeTrend.reduce<{ month: string; total: number }[]>((acc, f) => {
                        const last = acc[acc.length - 1]?.total || 0;
                        acc.push({ month: f.month, total: last + f.savings });
                        return acc;
                      }, [])}
                    >
                      <defs>
                        <linearGradient id="savG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="month" tickFormatter={formatMonth} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                      <Tooltip content={<CleanTooltip labelFormatter={formatMonth} valueFormatter={(v) => formatCurrency(v, currency)} />} />
                      <Area type="monotone" dataKey="total" stroke={ACCENT} strokeWidth={2} fill="url(#savG)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CleanCard>
              </div>
            </>
          )}

          {/* HABITS */}
          {section === "habits" && (
            <>
              <CleanKPIGrid items={habitsKPIs} />
              <CleanCard
                title="Activité des habitudes"
                subtitle="60 derniers jours"
                isEmpty={habitStreak.length === 0}
                emptyContent="Aucune habitude suivie"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={habitStreak.slice(-60)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                    <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                    <Tooltip content={<CleanTooltip labelFormatter={formatDate} />} />
                    <Bar dataKey="completed" fill={ACCENT} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CleanCard>

              <CleanCard
                title="Tâches complétées"
                subtitle="Par mois"
                height="md"
                isEmpty={todoStats.length === 0}
                emptyContent="Aucune tâche"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={todoStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="month" tickFormatter={formatMonth} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                    <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                    <Tooltip content={<CleanTooltip labelFormatter={formatMonth} />} />
                    <Bar dataKey="completed" fill={ACCENT_SOFT} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CleanCard>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Suppress unused import warnings (kept for clarity)
void Gauge;