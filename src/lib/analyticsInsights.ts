import type { AnalyticsData } from "@/hooks/useAnalytics";
import type { AnalyticsPeriod } from "@/components/analytics/PeriodSelector";

export type InsightTone = "exceptional" | "positive" | "stable" | "negative" | "neutral";

export interface HeadlineInsight {
  title: string;
  metric: string;
  delta: number;
  tone: InsightTone;
}

const METRIC_LABELS: Record<string, string> = {
  goalsCompleted: "Goals completed",
  stepsCompleted: "Steps validated",
  healthScore: "Health score",
  focusMinutes: "Focus time",
};

export function generateHeadlineInsight(
  data: AnalyticsData,
  period: AnalyticsPeriod,
): HeadlineInsight {
  if (period === "all") {
    const signals = [
      data.summary.totalGoals > 0,
      data.summary.totalSteps > 0,
      data.healthTrend.length > 0,
      data.financeTrend.length > 0,
      data.pomodoroTrend.length > 0,
      data.todoStats.length > 0,
    ].filter(Boolean).length;
    return {
      title: `Tracking ${signals} active signal${signals !== 1 ? "s" : ""} across 6 modules`,
      metric: "all_time",
      delta: 0,
      tone: "neutral",
    };
  }

  const trends = data.trends;
  const candidates = (Object.keys(trends) as (keyof typeof trends)[]).map((k) => ({
    key: k,
    delta: trends[k].percentChange,
    abs: Math.abs(trends[k].percentChange),
    current: trends[k].current,
  }));

  // Pick highest absolute delta with non-zero current OR previous
  candidates.sort((a, b) => b.abs - a.abs);
  const top = candidates[0];

  if (!top || (top.abs === 0 && top.current === 0)) {
    return {
      title: "All systems steady — no significant variation detected",
      metric: "stable",
      delta: 0,
      tone: "neutral",
    };
  }

  const label = METRIC_LABELS[top.key] || top.key;
  const sign = top.delta >= 0 ? "+" : "";
  const arrow = top.delta >= 0 ? "↑" : "↓";

  let title: string;
  let tone: InsightTone;

  if (top.delta >= 100) {
    title = `${arrow} ${sign}${top.delta}% ${label} — exceptional momentum`;
    tone = "exceptional";
  } else if (top.delta >= 20) {
    title = `${arrow} ${sign}${top.delta}% ${label} vs last period — strong gain`;
    tone = "positive";
  } else if (top.delta > -20) {
    title = `${label} stable at ${top.current}`;
    tone = "stable";
  } else {
    title = `${arrow} ${top.delta}% ${label} vs last period — needs attention`;
    tone = "negative";
  }

  return { title, metric: top.key, delta: top.delta, tone };
}

export function getDataDensity(data: AnalyticsData): number {
  // Returns 0..1 score reflecting data richness
  const checks = [
    data.summary.totalGoals > 0,
    data.summary.totalSteps > 0,
    data.healthTrend.length > 5,
    data.financeTrend.length > 0,
    data.pomodoroTrend.length > 5,
    data.todoStats.length > 0,
    data.goalsByTag.length > 0,
    data.goalsByDifficulty.length > 0,
  ];
  return checks.filter(Boolean).length / checks.length;
}
