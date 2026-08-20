/**
 * Goal filtering, sorting, searching, and pagination hook.
 *
 * Extracts all derived-state logic from Goals.tsx into a
 * composable, testable custom hook.
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import type { Goal } from "@/hooks/useGoals";
import { filterGoalsByRule, type SuperGoalRule } from "@/components/goals/super/types";
import { brigadeDe } from "@/lib/brigade";

export type SortOption = "difficulty" | "type" | "points" | "created" | "name" | "status" | "start" | "progression" | "super_first" | "super_last";
export type SortDirection = "asc" | "desc";
export type DisplayMode = "bar" | "grid" | "bookmark" | "front";
export type GoalTab = "all" | "active" | "completed";

const STORAGE_KEY = "goals-page-settings";

interface PersistedSettings {
  sortBy: SortOption;
  sortDirection: SortDirection;
  displayMode: DisplayMode;
  itemsPerPage: number;
  hideSuperGoals: boolean;
}

function loadSettings(): Partial<PersistedSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveSettings(s: PersistedSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

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

/**
 * La brigade passe devant, quel que soit le tri choisi.
 *
 * C est ce qui fait qu une etoile se voit sans la chercher : trois
 * objectifs designes, trois lignes en tete de liste. Le tri demande
 * s applique a l interieur de chaque camp — celui de JavaScript est
 * stable, l ordre voulu est donc conserve.
 */
function brigadeDevant(goals: Goal[]): Goal[] {
  const dedans = new Set(brigadeDe(goals).map((g) => g.id));
  if (dedans.size === 0) return goals;
  return [...goals].sort((a, b) => Number(dedans.has(b.id)) - Number(dedans.has(a.id)));
}

function sortGoals(goals: Goal[], sortBy: SortOption, dir: SortDirection): Goal[] {
  return brigadeDevant(trierParCritere(goals, sortBy, dir));
}

function trierParCritere(goals: Goal[], sortBy: SortOption, dir: SortDirection): Goal[] {
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
      const order = ["not_started", "in_progress", "fully_completed", "validated", "paused"];
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
    case "super_first":
      return sorted.sort((a, b) => {
        const aSuper = a.goal_type === "super" ? 0 : 1;
        const bSuper = b.goal_type === "super" ? 0 : 1;
        if (aSuper !== bSuper) return (aSuper - bSuper) * d;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    case "super_last":
      return sorted.sort((a, b) => {
        const aSuper = a.goal_type === "super" ? 1 : 0;
        const bSuper = b.goal_type === "super" ? 1 : 0;
        if (aSuper !== bSuper) return (aSuper - bSuper) * d;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
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
  const saved = useMemo(() => loadSettings(), []);

  const [sortBy, setSortBy] = useState<SortOption>(saved.sortBy || "created");
  const [sortDirection, setSortDirection] = useState<SortDirection>(saved.sortDirection || "desc");
  const [activeTab, setActiveTab] = useState<GoalTab>("active");
  const [itemsPerPage, setItemsPerPage] = useState(saved.itemsPerPage || 10);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideSuperGoals, setHideSuperGoals] = useState(saved.hideSuperGoals ?? false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(saved.displayMode || "bar");

  // Persist settings on change
  useEffect(() => {
    saveSettings({ sortBy, sortDirection, displayMode, itemsPerPage, hideSuperGoals });
  }, [sortBy, sortDirection, displayMode, itemsPerPage, hideSuperGoals]);

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
    /* Un super-objectif ne porte pas son propre achevement.
     *
     * Son champ status reste a "not_started" quoi qu'il arrive : ce qui le
     * termine, c'est que TOUS les objectifs qu'il contient le soient. Les
     * cartes le savent deja — elles affichent la bande HONORÉ des que le
     * compte atteint son total — mais le filtre, lui, lisait le status
     * brut. Un groupe entierement honore se retrouvait donc dans
     * "Actifs", en contradiction avec sa propre carte.
     *
     * On calcule ici le meme achevement que les cartes, a partir des
     * enfants, pour que la liste et la carte disent la meme chose.
     */
    const parId = new Map(goals.map((g) => [g.id, g]));
    const estTermine = (g: Goal) => g.status === "fully_completed" || g.status === "validated";

    const acheve = (g: Goal): boolean => {
      if (g.goal_type !== "super") return estTermine(g);

      // Un groupe dynamique n'a pas de liste d'enfants : ses membres sont
      // calcules par sa regle. On applique la meme regle que les cartes,
      // sinon un groupe automatique entierement honore resterait actif.
      const sg = g as any;
      const enfants: Goal[] = sg.is_dynamic_super && sg.super_goal_rule
        ? filterGoalsByRule(
            goals.filter((x) => x.id !== g.id && x.goal_type !== "super"),
            sg.super_goal_rule as SuperGoalRule,
          )
        : (((sg.child_goal_ids || []) as string[])
            .map((id) => parId.get(id))
            .filter(Boolean) as Goal[]);

      // Un groupe sans enfant n'est pas "termine" : il est vide. Le ranger
      // dans les acheves le ferait disparaitre de la vue ou on peut
      // encore le remplir.
      if (enfants.length === 0) return false;
      return enfants.every(estTermine);
    };

    const completed = filtered.filter(acheve);
    const idsTermines = new Set(completed.map((g) => g.id));
    const active = filtered.filter((g) => !idsTermines.has(g.id) && g.status !== "cancelled");

    return { all: filtered, active, completed };
  }, [filtered, goals]);

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
