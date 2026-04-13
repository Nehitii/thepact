import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { BarChart3, Target, Heart, Wallet, CheckSquare, Timer, TrendingUp, Flame, ListChecks, DollarSign, CreditCard, Receipt, Activity } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { formatCurrency } from "@/lib/currency";
import { getDifficultyLabel, getTagLabel } from "@/lib/goalConstants";
import { format, parseISO } from "date-fns";
import {
  PeriodSelector,
  AnalyticsPeriod,
  AnalyticsHero,
  TrendStatCard,
  ChartCard,
} from "@/components/analytics";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function Analytics() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("pact");
  const [period, setPeriod] = useState<AnalyticsPeriod>("all");
  const { data, isLoading } = useAnalytics(period);
  const { currency } = useCurrency();
  const locale = useDateFnsLocale();

  // Format month for display
  const formatMonth = (monthStr: string) => {
    try {
      const date = parseISO(`${monthStr}-01`);
      return format(date, "MMM yy", { locale });
    } catch {
      return monthStr;
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMM", { locale });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, goalsOverTime, healthTrend, financeTrend, todoStats, goalsByDifficulty, goalsByTag, pomodoroTrend, goalVelocity, trends } = data;

  // Prepare pie chart data with labels
  const difficultyPieData = goalsByDifficulty.map(d => ({
    name: getDifficultyLabel(d.difficulty, t),
    value: d.count,
    color: d.color,
  }));

  const tagPieData = goalsByTag.map(d => ({
    name: getTagLabel(d.tag, t),
    value: d.count,
    color: d.color,
  })).sort((a, b) => b.value - a.value).slice(0, 8); // Top 8 tags

  // Sparkline data for trend cards
  const healthSparkline = healthTrend.slice(-14).map(h => h.score);
  const pomodoroSparkline = pomodoroTrend.slice(-14).map(p => p.minutes);
  const goalsSparkline = goalsOverTime.slice(-6).map(g => g.completed);

  // Completion rate
  const completionRate = summary.totalGoals > 0 
    ? Math.round((summary.completedGoals / summary.totalGoals) * 100) 
    : 0;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 pb-16">
      {/* Module Header */}
      <ModuleHeader
        title="ANALY"
        titleAccent="TICS"
        systemLabel="PERFORMANCE // INSIGHTS"
        badges={[]}
      />

      {/* Period Selector */}
      <div className="flex justify-end mb-6">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-6 bg-card/60 backdrop-blur border border-border/50 p-1.5 rounded-xl">
          <TabsTrigger
            value="pact"
            className="flex items-center gap-2 data-[state=active]:bg-primary/30 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10 rounded-lg transition-all font-mono text-xs uppercase tracking-wider"
          >
            <Flame className="h-4 w-4" />
            Pact & Goals
          </TabsTrigger>
          <TabsTrigger
            value="modules"
            className="flex items-center gap-2 data-[state=active]:bg-accent/30 data-[state=active]:text-accent-foreground data-[state=active]:border data-[state=active]:border-accent/30 data-[state=active]:shadow-lg rounded-lg transition-all font-mono text-xs uppercase tracking-wider"
          >
            <BarChart3 className="h-4 w-4" />
            Modules
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: PACT & GOALS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="pact" className="space-y-6 mt-0">
          {/* Hero KPIs */}
          <AnalyticsHero
            completionRate={completionRate}
            totalXP={summary.totalXP}
            activeGoals={summary.activeGoals}
            burnRate={summary.monthlyBurnRate}
            currency={currency}
          />

          {/* Progress Card - Goals & Steps Combined */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <TrendStatCard
              icon={Target}
              label="Goals Completed"
              value={summary.completedGoals}
              trend={period !== "all" ? trends.goalsCompleted.percentChange : undefined}
              sparklineData={goalsSparkline}
              color="text-emerald-400"
            />
            <TrendStatCard
              icon={ListChecks}
              label="Steps Done"
              value={summary.completedSteps}
              trend={period !== "all" ? trends.stepsCompleted.percentChange : undefined}
              color="text-cyan-400"
            />
            <TrendStatCard
              icon={DollarSign}
              label="Total Cost"
              value={formatCurrency(summary.totalCost, currency)}
              color="text-blue-400"
            />
            <TrendStatCard
              icon={Receipt}
              label="Remaining"
              value={formatCurrency(summary.remainingCost, currency)}
              color="text-amber-400"
            />
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Difficulty Distribution */}
            <ChartCard 
              title="Distribution by Difficulty" 
              isEmpty={difficultyPieData.length === 0}
              emptyMessage="No goals yet"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {difficultyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, name: string) => [`${value} goals`, name]}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: 10 }}
                    formatter={(value) => <span className="text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Tag Distribution */}
            <ChartCard 
              title="Distribution by Tag" 
              isEmpty={tagPieData.length === 0}
              emptyMessage="No tags yet"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tagPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tagPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, name: string) => [`${value} goals`, name]}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: 10 }}
                    formatter={(value) => <span className="text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Goals Over Time Chart */}
          <ChartCard 
            title="Goals Created vs Completed" 
            height="lg"
            isEmpty={goalsOverTime.length === 0}
            emptyMessage="No goal history"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalsOverTime}>
                <defs>
                  <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10 }} 
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={formatMonth}
                />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={formatMonth}
                />
                <Bar dataKey="created" fill="url(#createdGradient)" radius={[4, 4, 0, 0]} name="Created" />
                <Bar dataKey="completed" fill="url(#completedGradient)" radius={[4, 4, 0, 0]} name="Completed" />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Goal Velocity Chart */}
          {goalVelocity.length > 0 && (
            <ChartCard title="Goal Velocity (Avg Days to Complete)" isEmpty={goalVelocity.length === 0}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={goalVelocity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }} 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={formatMonth}
                  />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelFormatter={formatMonth}
                    formatter={(value: number) => [`${value} days`, "Avg completion"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgDays" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: MODULES PERFORMANCE */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="modules" className="space-y-6 mt-0">
          {/* Module Stats with Trends */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <TrendStatCard
              icon={Heart}
              label="Health Avg"
              value={`${summary.avgHealthScore}%`}
              trend={period !== "all" ? trends.healthScore.percentChange : undefined}
              sparklineData={healthSparkline}
              color="text-emerald-400"
            />
            <TrendStatCard
              icon={Wallet}
              label="Total Saved"
              value={formatCurrency(summary.totalSaved, currency)}
              color="text-blue-400"
            />
            <TrendStatCard
              icon={CheckSquare}
              label="Todos Done"
              value={todoStats.reduce((a, t) => a + t.completed, 0)}
              color="text-amber-400"
            />
            <TrendStatCard
              icon={Timer}
              label="Focus Time"
              value={`${Math.round(summary.pomodoroMinutes / 60)}h`}
              trend={period !== "all" ? trends.focusMinutes.percentChange : undefined}
              sparklineData={pomodoroSparkline}
              color="text-violet-400"
            />
          </div>

          {/* Health Trend - Full Width */}
          <ChartCard 
            title="Health Score Trend" 
            height="lg"
            isEmpty={healthTrend.length === 0}
            emptyMessage="No health data yet"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthTrend.slice(-60)}>
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 80%, 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(160, 80%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={formatDate}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={formatDate}
                  formatter={(value: number) => [`${value}%`, "Health Score"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(160, 80%, 50%)" 
                  fill="url(#healthGradient)" 
                  strokeWidth={2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Finance Trend */}
            <ChartCard 
              title="Income vs Expenses" 
              isEmpty={financeTrend.length === 0}
              emptyMessage="No finance data"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }} 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={formatMonth}
                  />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelFormatter={formatMonth}
                    formatter={(value: number) => [formatCurrency(value, currency), ""]}
                  />
                  <Line type="monotone" dataKey="income" stroke="hsl(142, 70%, 50%)" strokeWidth={2} dot={false} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="hsl(0, 80%, 60%)" strokeWidth={2} dot={false} name="Expenses" />
                  <Line type="monotone" dataKey="savings" stroke="hsl(212, 90%, 50%)" strokeWidth={2} dot={false} name="Savings" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Todos Completed */}
            <ChartCard 
              title="Tasks Completed by Month" 
              isEmpty={todoStats.length === 0}
              emptyMessage="No completed tasks"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={todoStats}>
                  <defs>
                    <linearGradient id="todoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(43, 100%, 50%)" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(43, 100%, 50%)" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }} 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={formatMonth}
                  />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelFormatter={formatMonth}
                  />
                  <Bar dataKey="completed" fill="url(#todoGradient)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Focus Time Trend */}
          {pomodoroTrend.length > 0 && (
            <ChartCard 
              title="Focus Time (minutes/day)" 
              isEmpty={pomodoroTrend.length === 0}
              emptyMessage="No focus sessions"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pomodoroTrend.slice(-30)}>
                  <defs>
                    <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(280, 75%, 55%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(280, 75%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={formatDate}
                  />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelFormatter={formatDate}
                    formatter={(value: number) => [`${value} min`, "Focus Time"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="minutes" 
                    stroke="hsl(280, 75%, 55%)" 
                    fill="url(#focusGradient)" 
                    strokeWidth={2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
