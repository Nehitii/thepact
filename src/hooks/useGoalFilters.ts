/**
 * Goal filtering, sorting, searching, and pagination hook.
 *
 * Extracts all derived-state logic from Goals.tsx into a
 * composable, testable custom hook.
 */
import { useState, useMemo, useCallback } from "react";
import type { Goal } from "@/hooks/useGoals";

export type SortOption = "difficulty" | "type" | "points" | "created" | "name" | "status" | "start" | "progression";
export type SortDirection = "asc" | "desc";
export type DisplayMode = "bar" | "grid" | "bookmark";
export type GoalTab = "all" | "active" | "completed";

// ── Utilities ──────────────────────────────────────────────

const normalizeString = (str: string): string =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getProgression = (goal: Goal): number => {
  if (goal.goal_type === "habit" && goal.habit_checks && goal.habit_duration_days) {
    return (goal.habit_checks.filter(Boolean).length / goal.habit_duration_days) * 100;
  }
  const total = goal.totalStepsCount ?? goal.total_steps ?? 0;
  const completed = goal.completedStepsCount ?? goal.validated_steps ?? 0;
  return total === 0 ? 0 : (completed / total) * 100;
};

function sortGoals(goals: Goal[], sortBy: SortOption, dir: SortDirection): Goal[] {
  const sorted = [...goals];
  const d = dir === "asc" ? 1 : -1;

  switch (sortBy) {
    case "difficulty": {
      const order = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
      return sorted.sort((a, b) => (order.indexOf(a.difficulty) - order.indexOf(b.difficulty)) * d);
    }
    case "type":
      return sorted.sort((a, b) => a.type.localeCompare(b.type) * d);
    case "points":
      return sorted.sort((a, b) => ((a.potential_score || 0) - (b.potential_score || 0)) * d);
    case "created":
      return sorted.sort((a, b) => (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * d);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name) * d);
    case "status": {
      const order = ["not_started", "in_progress", "fully_completed", "paused"];
      return sorted.sort((a, b) => (order.indexOf(a.status) - order.indexOf(b.status)) * d);
    }
    case "start":
      return sorted.sort((a, b) => {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return (new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) * d;
      });
    case "progression":
      return sorted.sort((a, b) => (getProgression(a) - getProgression(b)) * d);
    default:
      return sorted;
  }
}

function filterBySearch(goals: Goal[], query: string): Goal[] {
  if (!query.trim()) return goals;
  const q = normalizeString(query);
  return goals.filter((g) => {
    if (normalizeString(g.name).includes(q)) return true;
    if (normalizeString(g.type || "").includes(q)) return true;
    if (g.tags?.some((tag) => normalizeString(tag).includes(q))) return true;
    return false;
  });
}

// ── Hook ───────────────────────────────────────────────────

export function useGoalFilters(goals: Goal[]) {
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [activeTab, setActiveTab] = useState<GoalTab>("active");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideSuperGoals, setHideSuperGoals] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("bar");

  // Per-tab pagination
  const [pages, setPages] = useState({ all: 1, active: 1, completed: 1 });

  const setCurrentPage = useCallback(
    (tab: GoalTab, page: number) => setPages((p) => ({ ...p, [tab]: page })),
    [],
  );

  const resetAllPages = useCallback(() => setPages({ all: 1, active: 1, completed: 1 }), []);

  const handleTabChange = useCallback(
    (tab: GoalTab) => {
      setActiveTab(tab);
      resetAllPages();
    },
    [resetAllPages],
  );

  const handleItemsPerPageChange = useCallback(
    (value: string) => {
      setItemsPerPage(Number(value));
      resetAllPages();
    },
    [resetAllPages],
  );

  const toggleSortDirection = useCallback(
    () => setSortDirection((d) => (d === "asc" ? "desc" : "asc")),
    [],
  );

  // ── Derived data ──

  const hasSuperGoals = useMemo(() => goals.some((g) => g.goal_type === "super"), [goals]);

  const filtered = useMemo(() => {
    let result = filterBySearch(goals, searchQuery);
    if (hideSuperGoals) result = result.filter((g) => g.goal_type !== "super");
    return result;
  }, [goals, searchQuery, hideSuperGoals]);

  const buckets = useMemo(() => {
    const active = filtered.filter((g) => g.status === "not_started" || g.status === "in_progress");
    const completed = filtered.filter((g) => g.status === "fully_completed" || g.status === "validated");
    return { all: filtered, active, completed };
  }, [filtered]);

  const currentBucket = buckets[activeTab];
  const sorted = useMemo(() => sortGoals(currentBucket, sortBy, sortDirection), [currentBucket, sortBy, sortDirection]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const currentPage = Math.min(pages[activeTab], totalPages);

  const paginated = useMemo(
    () => sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [sorted, currentPage, itemsPerPage],
  );

  return {
    // State
    sortBy,
    setSortBy,
    sortDirection,
    toggleSortDirection,
    activeTab,
    handleTabChange,
    itemsPerPage,
    handleItemsPerPageChange,
    searchQuery,
    setSearchQuery,
    hideSuperGoals,
    setHideSuperGoals,
    displayMode,
    setDisplayMode,
    // Derived
    hasSuperGoals,
    buckets,
    paginated,
    currentPage,
    totalPages,
    setCurrentPage,
  };
}
