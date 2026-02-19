/**
 * Pact Nexus — Analysis Engine
 *
 * Generates categorized insights (success / warning / info / critical)
 * from raw pact + goals data. Designed so a real LLM call can replace
 * the deterministic rules later.
 */
import { useMemo } from "react";
import { Goal } from "@/hooks/useGoals";
import { Pact } from "@/hooks/usePact";
import { differenceInDays, differenceInCalendarDays, parseISO } from "date-fns";

// ─── types ──────────────────────────────────────────────────────────────────

export type InsightLevel = "success" | "warning" | "info" | "critical";

export interface PactInsight {
  id: string;
  level: InsightLevel;
  title: string;
  body: string;
  goalId?: string;
  goalName?: string;
  /** CTA label for the quick-action button (optional) */
  actionLabel?: string;
  /** Route to navigate to on CTA click */
  actionRoute?: string;
}

interface AnalysisInput {
  pact: Pact | null | undefined;
  goals: Goal[];
  isLoading: boolean;
}

// ─── constants ──────────────────────────────────────────────────────────────

const STAGNANT_DAYS = 10;
const HABIT_DANGER_RATIO = 0.4; // less than 40 % checks → danger

// ─── helpers ────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  try {
    return Math.max(0, differenceInCalendarDays(new Date(), parseISO(dateStr)));
  } catch {
    return 0;
  }
}

function pctElapsed(start: string | null | undefined, end: string | null | undefined): number {
  if (!start || !end) return -1;
  try {
    const s = parseISO(start);
    const e = parseISO(end);
    const total = differenceInDays(e, s);
    if (total <= 0) return 100;
    const elapsed = differenceInDays(new Date(), s);
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  } catch {
    return -1;
  }
}

// ─── scan phases for the boot animation ─────────────────────────────────────

export const SCAN_PHASES = [
  "Initializing Nexus core…",
  "Scanning Pact parameters…",
  "Evaluating focus targets…",
  "Analyzing goal trajectories…",
  "Cross-referencing habit data…",
  "Compiling strategic insights…",
  "Analysis complete.",
] as const;

export const SCAN_PHASE_DURATION_MS = 420; // per phase

// ─── insight generator ──────────────────────────────────────────────────────

function generateInsights(pact: Pact, goals: Goal[]): PactInsight[] {
  const insights: PactInsight[] = [];
  const now = new Date();

  const nonHabit = goals.filter((g) => g.goal_type !== "habit");
  const habits = goals.filter((g) => g.goal_type === "habit");
  const focusGoals = nonHabit.filter((g) => g.is_focus);
  const inProgress = nonHabit.filter((g) => g.status === "in_progress");
  const notStarted = nonHabit.filter((g) => g.status === "not_started");
  const completed = nonHabit.filter(
    (g) => g.status === "fully_completed" || g.status === "validated"
  );

  // ── 1. Pact deadline proximity ──
  const elapsed = pctElapsed(pact.project_start_date, pact.project_end_date);
  if (elapsed >= 0) {
    const remainingFocus = focusGoals.filter(
      (g) => g.status !== "fully_completed" && g.status !== "validated"
    );

    if (elapsed >= 85 && remainingFocus.length > 0) {
      insights.push({
        id: "pact-deadline-critical",
        level: "critical",
        title: "Pact deadline imminent",
        body: `${elapsed}% of timeline elapsed. ${remainingFocus.length} critical Focus Goal${remainingFocus.length > 1 ? "s" : ""} remain${remainingFocus.length > 1 ? "" : "s"}.`,
        actionLabel: "View goals",
        actionRoute: "/goals",
      });
    } else if (elapsed >= 50 && remainingFocus.length > 0) {
      insights.push({
        id: "pact-deadline-warning",
        level: "warning",
        title: "Pact timeline advancing",
        body: `${elapsed}% elapsed — ${remainingFocus.length} Focus Goal${remainingFocus.length > 1 ? "s" : ""} still open. Consider reprioritizing.`,
      });
    }
  }

  // ── 2. Stagnant goals ──
  const stagnant = nonHabit.filter((g) => {
    if (g.status === "fully_completed" || g.status === "validated") return false;
    const age = daysSince(g.created_at);
    const untouched = (g.validated_steps || 0) === 0 && g.status === "not_started";
    const noProgress =
      g.status === "in_progress" &&
      (g.validated_steps || 0) < (g.total_steps || 1) * 0.1;
    return age >= STAGNANT_DAYS && (untouched || noProgress);
  });

  if (stagnant.length > 0) {
    const worst = stagnant.reduce((a, b) =>
      daysSince(a.created_at) >= daysSince(b.created_at) ? a : b
    );
    const days = daysSince(worst.created_at);
    insights.push({
      id: `stagnant-${worst.id}`,
      level: "warning",
      title: "Stagnation detected",
      body: `"${worst.name}" inactive for ${days} day${days > 1 ? "s" : ""}. ${stagnant.length > 1 ? `(+${stagnant.length - 1} more)` : "Action required."}`,
      goalId: worst.id,
      goalName: worst.name,
      actionLabel: "Tackle now",
      actionRoute: `/goals/${worst.id}`,
    });
  }

  // ── 3. Habit streak danger ──
  for (const habit of habits) {
    if (!habit.habit_checks || habit.habit_checks.length === 0) continue;
    const total = habit.habit_checks.length;
    const done = habit.habit_checks.filter(Boolean).length;
    const ratio = done / total;
    if (ratio < HABIT_DANGER_RATIO && total >= 3) {
      insights.push({
        id: `habit-danger-${habit.id}`,
        level: "warning",
        title: "Habit streak in danger",
        body: `"${habit.name}" — only ${Math.round(ratio * 100)}% completion (${done}/${total}). Rebuild momentum now.`,
        goalId: habit.id,
        goalName: habit.name,
        actionLabel: "Check in",
        actionRoute: `/goals/${habit.id}`,
      });
    }
  }

  // ── 4. Momentum / success messages ──
  if (completed.length >= 3) {
    insights.push({
      id: "momentum-high",
      level: "success",
      title: "Strong momentum",
      body: `${completed.length} goal${completed.length > 1 ? "s" : ""} completed. Operational efficiency is high. Keep pushing.`,
    });
  } else if (completed.length > 0 && inProgress.length > 0) {
    insights.push({
      id: "momentum-building",
      level: "info",
      title: "Progress tracked",
      body: `${completed.length} completed, ${inProgress.length} in progress. Systems nominal.`,
    });
  }

  // ── 5. Focus goal progress ──
  if (focusGoals.length > 0) {
    const activeFocus = focusGoals.filter(
      (g) => g.status !== "fully_completed" && g.status !== "validated"
    );
    if (activeFocus.length > 0) {
      const totalSteps = activeFocus.reduce((s, g) => s + (g.total_steps || 0), 0);
      const doneSteps = activeFocus.reduce((s, g) => s + (g.validated_steps || 0), 0);
      const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
      insights.push({
        id: "focus-progress",
        level: pct >= 70 ? "success" : "info",
        title: "Focus targets",
        body: `${activeFocus.length} active focus goal${activeFocus.length > 1 ? "s" : ""} — ${doneSteps}/${totalSteps} steps (${pct}%).`,
        actionLabel: "View focus",
        actionRoute: "/goals",
      });
    }
  }

  // ── 6. Empty state ──
  if (goals.length === 0) {
    insights.push({
      id: "empty-state",
      level: "info",
      title: "Awaiting directives",
      body: "No goals detected. Initialize your first objective to activate the Nexus.",
      actionLabel: "Create goal",
      actionRoute: "/goals/new",
    });
  }

  // Sort: critical → warning → info → success, max 3
  const order: Record<InsightLevel, number> = { critical: 0, warning: 1, info: 2, success: 3 };
  insights.sort((a, b) => order[a.level] - order[b.level]);
  return insights.slice(0, 3);
}

// ─── hook ───────────────────────────────────────────────────────────────────

export function usePactAnalysis({ pact, goals, isLoading }: AnalysisInput) {
  const insights = useMemo(() => {
    if (isLoading || !pact) return [];
    return generateInsights(pact, goals);
  }, [pact, goals, isLoading]);

  const systemStatus: "optimal" | "attention" | "critical" = useMemo(() => {
    if (insights.some((i) => i.level === "critical")) return "critical";
    if (insights.some((i) => i.level === "warning")) return "attention";
    return "optimal";
  }, [insights]);

  return { insights, systemStatus, isAnalyzing: isLoading };
}
