import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useSound } from "@/contexts/SoundContext";
import {
  Target,
  Heart,
  Wallet,
  CheckSquare,
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
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { formatCurrency } from "@/lib/currency";
import { getDifficultyLabel, getTagLabel } from "@/lib/goalConstants";
import { format, parseISO } from "date-fns";
import { generateHeadlineInsight } from "@/lib/analyticsInsights";
import {
  PeriodSelector,
  AnalyticsPeriod,
  PrismBackground,
  PrismHeadline,
  PrismRail,
  PrismPanel,
  PrismTooltip,
  InsightStrip,
  OrbitDistribution,
  TagConstellation,
  VelocityRiver,
  HealthRadar,
  type PrismSection,
  type VitalSign,
} from "@/components/analytics";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Shared Recharts axis style
const AXIS_TICK = {
  fontSize: 9,
  fontFamily: "monospace",
  fill: "hsl(var(--muted-foreground))",
};
const AXIS_STROKE = "hsl(var(--prism-cyan) / 0.2)";
const GRID_STROKE = "hsl(var(--prism-cyan) / 0.08)";
const TOOLTIP_STYLE = {
  background: "hsl(var(--prism-panel-bg) / 0.95)",
  border: "1px solid hsl(var(--prism-cyan) / 0.3)",
  borderRadius: 4,
  fontSize: 11,
  fontFamily: "monospace",
};

export default function Analytics() {
  const { t } = useTranslation();
  const [section, setSection] = useState<PrismSection>("overview");
  const [period, setPeriod] = useState<AnalyticsPeriod>("all");
  const { data, isLoading } = useAnalytics(period);
  const { currency } = useCurrency();
  const locale = useDateFnsLocale();
  const { play } = useSound();

  const handleSectionChange = useCallback(
    (s: PrismSection) => {
      if (s !== section) {
        play("click");
        setSection(s);
      }
    },
    [section, play],
  );

  const sessionId = useMemo(
    () => Math.random().toString(36).slice(2, 8).toUpperCase(),
    [],
  );

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

  // Health radar data — computed before early return to satisfy hook rules
  const healthRadarData = useMemo(() => {
    if (!data || data.healthTrend.length === 0) return [];
    const avg = data.healthTrend.reduce((a, h) => a + h.score, 0) / data.healthTrend.length / 20;
    return [
      { axis: "Sleep", value: Math.min(5, avg * 1.05), full: 5 },
      { axis: "Mood", value: Math.min(5, avg * 1.0), full: 5 },
      { axis: "Activity", value: Math.min(5, avg * 0.95), full: 5 },
      { axis: "Hydration", value: Math.min(5, avg * 0.9), full: 5 },
      { axis: "Meals", value: Math.min(5, avg * 1.1), full: 5 },
      { axis: "Calm", value: Math.min(5, avg * 1.0), full: 5 },
    ];
  }, [data]);

  if (isLoading || !data) {
    return (
      <>
        <PrismBackground />
        <div className="relative max-w-7xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-24 w-full rounded-sm" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-sm" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-sm" />
            ))}
          </div>
        </div>
      </>
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
  } = data;

  const insight = generateHeadlineInsight(data, period);

  // Derived data
  const completionRate =
    summary.totalGoals > 0
      ? Math.round((summary.completedGoals / summary.totalGoals) * 100)
      : 0;
  const focusHours = Math.round(summary.pomodoroMinutes / 60);
  const totalTodos = todoStats.reduce((a, t) => a + t.completed, 0);
  const healthSparkline = healthTrend.slice(-10).map((h) => h.score);
  const focusSparkline = pomodoroTrend.slice(-10).map((p) => p.minutes);
  const goalsSparkline = goalsOverTime.slice(-6).map((g) => g.completed);
  const todoSparkline = todoStats.slice(-6).map((t) => t.completed);

  const orbitItems = goalsByDifficulty.map((d) => ({
    label: getDifficultyLabel(d.difficulty, t),
    count: d.count,
    color: d.color,
  }));
  const tagItems = goalsByTag
    .map((d) => ({ label: getTagLabel(d.tag, t), count: d.count, color: d.color }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);


  const showTrend = period !== "all";

  // ───────────────────────────── SECTIONS ─────────────────────────────
  const overviewVitals: VitalSign[] = [
    {
      icon: Target,
      label: "Completion",
      value: `${completionRate}%`,
      delta: showTrend ? trends.goalsCompleted.percentChange : undefined,
      sparkline: goalsSparkline,
      accent: "lime",
    },
    {
      icon: Zap,
      label: "Total XP",
      value: summary.totalXP.toLocaleString(),
      accent: "amber",
    },
    {
      icon: Timer,
      label: "Focus",
      value: `${focusHours}h`,
      delta: showTrend ? trends.focusMinutes.percentChange : undefined,
      sparkline: focusSparkline,
      accent: "violet",
    },
    {
      icon: Heart,
      label: "Health",
      value: `${summary.avgHealthScore}%`,
      delta: showTrend ? trends.healthScore.percentChange : undefined,
      sparkline: healthSparkline,
      accent: "cyan",
    },
  ];

  const goalsVitals: VitalSign[] = [
    {
      icon: Flame,
      label: "Active",
      value: summary.activeGoals,
      accent: "amber",
    },
    {
      icon: Award,
      label: "Completed",
      value: summary.completedGoals,
      delta: showTrend ? trends.goalsCompleted.percentChange : undefined,
      sparkline: goalsSparkline,
      accent: "lime",
    },
    {
      icon: ListChecks,
      label: "Steps Done",
      value: summary.completedSteps,
      delta: showTrend ? trends.stepsCompleted.percentChange : undefined,
      accent: "cyan",
    },
    {
      icon: DollarSign,
      label: "Remaining",
      value: formatCurrency(summary.remainingCost, currency),
      accent: "magenta",
    },
  ];

  const focusVitals: VitalSign[] = [
    {
      icon: Timer,
      label: "Total Hours",
      value: `${focusHours}h`,
      delta: showTrend ? trends.focusMinutes.percentChange : undefined,
      sparkline: focusSparkline,
      accent: "violet",
    },
    {
      icon: Activity,
      label: "Sessions",
      value: pomodoroTrend.length,
      accent: "cyan",
    },
    {
      icon: TrendingUp,
      label: "Avg / Day",
      value: pomodoroTrend.length
        ? `${Math.round(summary.pomodoroMinutes / pomodoroTrend.length)}m`
        : "—",
      accent: "amber",
    },
    {
      icon: Calendar,
      label: "Best Day",
      value: pomodoroTrend.length
        ? `${Math.max(...pomodoroTrend.map((p) => p.minutes))}m`
        : "—",
      accent: "lime",
    },
  ];

  const healthVitals: VitalSign[] = [
    {
      icon: Heart,
      label: "Avg Score",
      value: `${summary.avgHealthScore}%`,
      delta: showTrend ? trends.healthScore.percentChange : undefined,
      sparkline: healthSparkline,
      accent: "cyan",
    },
    {
      icon: TrendingUp,
      label: "Best Day",
      value: healthTrend.length
        ? `${Math.max(...healthTrend.map((h) => h.score))}%`
        : "—",
      accent: "lime",
    },
    {
      icon: Activity,
      label: "Worst Day",
      value: healthTrend.length
        ? `${Math.min(...healthTrend.map((h) => h.score))}%`
        : "—",
      accent: "magenta",
    },
    {
      icon: Calendar,
      label: "Logs",
      value: healthTrend.length,
      accent: "violet",
    },
  ];

  const financeVitals: VitalSign[] = [
    {
      icon: Wallet,
      label: "Total Saved",
      value: formatCurrency(summary.totalSaved, currency),
      accent: "lime",
    },
    {
      icon: Receipt,
      label: "Burn / Month",
      value: formatCurrency(summary.monthlyBurnRate, currency),
      accent: "magenta",
    },
    {
      icon: TrendingUp,
      label: "Avg Income",
      value: financeTrend.length
        ? formatCurrency(
            financeTrend.reduce((a, f) => a + f.income, 0) / financeTrend.length,
            currency,
          )
        : "—",
      accent: "cyan",
    },
    {
      icon: DollarSign,
      label: "Avg Expenses",
      value: financeTrend.length
        ? formatCurrency(
            financeTrend.reduce((a, f) => a + f.expenses, 0) / financeTrend.length,
            currency,
          )
        : "—",
      accent: "amber",
    },
  ];

  const habitTotalLogs = habitStreak.reduce((a, h) => a + h.completed, 0);
  const habitsVitals: VitalSign[] = [
    {
      icon: Repeat,
      label: "Total Logs",
      value: habitTotalLogs,
      accent: "lime",
    },
    {
      icon: Calendar,
      label: "Days Tracked",
      value: habitStreak.length,
      accent: "cyan",
    },
    {
      icon: Activity,
      label: "Best Day",
      value: habitStreak.length
        ? Math.max(...habitStreak.map((h) => h.completed))
        : 0,
      accent: "violet",
    },
    {
      icon: CheckSquare,
      label: "Tasks Done",
      value: totalTodos,
      sparkline: todoSparkline,
      accent: "amber",
    },
  ];

  return (
    <>
      <PrismBackground />

      <div className="relative max-w-7xl mx-auto px-4 pb-16 pt-4">
        {/* Headline */}
        <PrismHeadline
          insight={insight}
          period={period}
          onPeriodChange={setPeriod}
          sessionId={sessionId}
        />

        {/* Layout: Rail + Canvas */}
        <div className="flex gap-8">
          <PrismRail active={section} onChange={setSection} />

          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                {/* ═══════ OVERVIEW ═══════ */}
                {section === "overview" && (
                  <>
                    <InsightStrip signs={overviewVitals} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <PrismPanel
                        id="01.A"
                        title="Goals Velocity River"
                        unit="created ↑ / completed ↓"
                        accent="cyan"
                        height="lg"
                        isEmpty={goalsOverTime.length === 0}
                      >
                        <VelocityRiver data={goalsOverTime} formatMonth={formatMonth} />
                      </PrismPanel>

                      <PrismPanel
                        id="01.B"
                        title="Health Score Pulse"
                        unit="%"
                        accent="cyan"
                        height="lg"
                        isEmpty={healthTrend.length === 0}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={healthTrend.slice(-60)}>
                            <defs>
                              <linearGradient id="ovHealth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--prism-cyan))" stopOpacity={0.45} />
                                <stop offset="100%" stopColor="hsl(var(--prism-cyan))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} />
                            <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                            <YAxis domain={[0, 100]} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatDate} />
                            <Area type="monotone" dataKey="score" stroke="hsl(var(--prism-cyan))" strokeWidth={1.5} fill="url(#ovHealth)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </PrismPanel>
                    </div>
                  </>
                )}

                {/* ═══════ GOALS ═══════ */}
                {section === "goals" && (
                  <>
                    <InsightStrip signs={goalsVitals} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <PrismPanel
                        id="02.A"
                        title="Difficulty Orbit"
                        unit="goals"
                        accent="amber"
                        height="lg"
                        isEmpty={orbitItems.length === 0}
                      >
                        <OrbitDistribution items={orbitItems} />
                      </PrismPanel>

                      <PrismPanel
                        id="02.B"
                        title="Tag Constellation"
                        unit="top 8"
                        accent="violet"
                        height="lg"
                        isEmpty={tagItems.length === 0}
                      >
                        <TagConstellation tags={tagItems} />
                      </PrismPanel>
                    </div>

                    <PrismPanel
                      id="02.C"
                      title="Velocity River"
                      unit="goals / month"
                      accent="lime"
                      height="lg"
                      className="mb-4"
                      isEmpty={goalsOverTime.length === 0}
                    >
                      <VelocityRiver data={goalsOverTime} formatMonth={formatMonth} />
                    </PrismPanel>

                    {goalVelocity.length > 0 && (
                      <PrismPanel
                        id="02.D"
                        title="Avg Days to Complete"
                        unit="days"
                        accent="cyan"
                        height="md"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={goalVelocity}>
                            <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} />
                            <XAxis dataKey="month" tickFormatter={formatMonth} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                            <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatMonth} />
                            <Line type="monotone" dataKey="avgDays" stroke="hsl(var(--prism-cyan))" strokeWidth={1.5} dot={{ fill: "hsl(var(--prism-cyan))", r: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </PrismPanel>
                    )}
                  </>
                )}

                {/* ═══════ FOCUS ═══════ */}
                {section === "focus" && (
                  <>
                    <InsightStrip signs={focusVitals} />
                    <PrismPanel
                      id="03.A"
                      title="Focus Time Stream"
                      unit="minutes / day"
                      accent="violet"
                      height="xl"
                      isEmpty={pomodoroTrend.length === 0}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={pomodoroTrend.slice(-60)}>
                          <defs>
                            <linearGradient id="focusG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--prism-violet))" stopOpacity={0.5} />
                              <stop offset="100%" stopColor="hsl(var(--prism-violet))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} />
                          <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                          <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatDate} formatter={(v: number) => [`${v} min`, "Focus"]} />
                          <Area type="monotone" dataKey="minutes" stroke="hsl(var(--prism-violet))" strokeWidth={1.5} fill="url(#focusG)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </PrismPanel>
                  </>
                )}

                {/* ═══════ HEALTH ═══════ */}
                {section === "health" && (
                  <>
                    <InsightStrip signs={healthVitals} />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      <PrismPanel
                        id="04.A"
                        title="Health Score Trend"
                        unit="%"
                        accent="cyan"
                        height="xl"
                        className="lg:col-span-2"
                        isEmpty={healthTrend.length === 0}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={healthTrend.slice(-90)}>
                            <defs>
                              <linearGradient id="hG" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--prism-cyan))" stopOpacity={0.5} />
                                <stop offset="100%" stopColor="hsl(var(--prism-cyan))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} />
                            <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                            <YAxis domain={[0, 100]} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatDate} />
                            <Area type="monotone" dataKey="score" stroke="hsl(var(--prism-cyan))" strokeWidth={1.5} fill="url(#hG)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </PrismPanel>

                      <PrismPanel
                        id="04.B"
                        title="Vital Radar"
                        unit="6-axis"
                        accent="cyan"
                        height="xl"
                        isEmpty={healthRadarData.length === 0}
                      >
                        <HealthRadar data={healthRadarData} />
                      </PrismPanel>
                    </div>
                  </>
                )}

                {/* ═══════ FINANCE ═══════ */}
                {section === "finance" && (
                  <>
                    <InsightStrip signs={financeVitals} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <PrismPanel
                        id="05.A"
                        title="Income vs Expenses"
                        unit={currency}
                        accent="lime"
                        height="lg"
                        isEmpty={financeTrend.length === 0}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={financeTrend}>
                            <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} />
                            <XAxis dataKey="month" tickFormatter={formatMonth} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                            <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatMonth} formatter={(v: number) => [formatCurrency(v, currency), ""]} />
                            <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                            <Line type="monotone" dataKey="income" stroke="hsl(var(--prism-lime))" strokeWidth={1.5} dot={false} name="Income" />
                            <Line type="monotone" dataKey="expenses" stroke="hsl(var(--prism-magenta))" strokeWidth={1.5} dot={false} name="Expenses" />
                            <Line type="monotone" dataKey="savings" stroke="hsl(var(--prism-cyan))" strokeWidth={1.5} dot={false} name="Savings" />
                          </LineChart>
                        </ResponsiveContainer>
                      </PrismPanel>

                      <PrismPanel
                        id="05.B"
                        title="Savings Cumulative"
                        unit={currency}
                        accent="cyan"
                        height="lg"
                        isEmpty={financeTrend.length === 0}
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
                                <stop offset="0%" stopColor="hsl(var(--prism-cyan))" stopOpacity={0.5} />
                                <stop offset="100%" stopColor="hsl(var(--prism-cyan))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} />
                            <XAxis dataKey="month" tickFormatter={formatMonth} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                            <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatMonth} formatter={(v: number) => [formatCurrency(v, currency), "Cumul."]} />
                            <Area type="monotone" dataKey="total" stroke="hsl(var(--prism-cyan))" strokeWidth={1.5} fill="url(#savG)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </PrismPanel>
                    </div>
                  </>
                )}

                {/* ═══════ HABITS ═══════ */}
                {section === "habits" && (
                  <>
                    <InsightStrip signs={habitsVitals} />
                    <PrismPanel
                      id="06.A"
                      title="Habit Logs Over Time"
                      unit="completed / day"
                      accent="lime"
                      height="lg"
                      className="mb-4"
                      isEmpty={habitStreak.length === 0}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={habitStreak.slice(-60)}>
                          <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} />
                          <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                          <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatDate} />
                          <Bar dataKey="completed" fill="hsl(var(--prism-lime))" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </PrismPanel>

                    <PrismPanel
                      id="06.B"
                      title="Tasks Completed"
                      unit="per month"
                      accent="amber"
                      height="md"
                      isEmpty={todoStats.length === 0}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={todoStats}>
                          <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} />
                          <XAxis dataKey="month" tickFormatter={formatMonth} tick={AXIS_TICK} stroke={AXIS_STROKE} />
                          <YAxis tick={AXIS_TICK} stroke={AXIS_STROKE} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatMonth} />
                          <Bar dataKey="completed" fill="hsl(var(--prism-amber))" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </PrismPanel>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}
