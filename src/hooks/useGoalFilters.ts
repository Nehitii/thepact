/**
 * Goal filtering, sorting, searching, and pagination hook.
 *
 * Extracts all derived-state logic from Goals.tsx into a
 * composable, testable custom hook.
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import type { Goal } from "@/hooks/useGoals";
import { estFranchi } from "@/lib/superGoals";
import { brigadeDe } from "@/lib/brigade";

export type SortOption = "difficulty" | "points" | "created" | "name" | "status" | "start" | "progression" | "super";

/* Deux tris ont disparu du menu, et un troisieme a fusionne.
 *
 * « Super en premier » et « Super en dernier » etaient le meme tri :
 * tous deux multipliaient deja par la direction, si bien que
 * « premier » en ordre decroissant donnait exactement « dernier ». La
 * fleche du menu faisait donc le travail deux fois, et le menu
 * proposait un choix qui n en etait pas un. Il reste « Super », et la
 * fleche decide du cote.
 *
 * « Etiquette » triait sur la seule etiquette principale, alors qu un
 * objectif en porte plusieurs depuis qu elles vivent dans goal_tags :
 * il classait sur une donnee qui ne resume plus l objectif.
 *
 * Un reglage garde en memoire peut encore nommer l un des trois. On le
 * ramene vers ce qui le remplace, plutot que de laisser le menu vide
 * et le tri sans effet. */
const TRIS_RETIRES: Record<string, SortOption> = {
  super_first: "super",
  super_last: "super",
  type: "created",
};
export const triValide = (v: unknown): SortOption =>
  typeof v === "string" && v in TRIS_RETIRES
    ? TRIS_RETIRES[v]
    : ((v as SortOption) || "created");
export type SortDirection = "asc" | "desc";
export type DisplayMode = "bar" | "grid" | "bookmark" | "front";
export type GoalTab = "all" | "active" | "completed";

const STORAGE_KEY = "goals-page-settings";

/* OU ON EN ETAIT, PAR OPPOSITION A CE QU ON PREFERE.
 *
 * Le tri, le mode d affichage et la densite sont des preferences : on
 * les veut demain comme aujourd hui, elles vivent donc dans
 * localStorage. L onglet ouvert, la page et la recherche en cours ne
 * sont pas des preferences mais une position — celle qu on occupait
 * avant d entrer dans un objectif. Les garder pour toujours ferait
 * rouvrir l application sur « Termines, page 3 » le lendemain matin.
 *
 * Elles vivent donc dans sessionStorage : le temps de l onglet du
 * navigateur, pas au-dela. Entrer dans un objectif et en ressortir
 * ramene exactement ou l on etait ; rouvrir l application demain
 * repart du debut.
 */
const PLACE_KEY = "goals-page-place";

interface PositionGardee {
  activeTab: GoalTab;
  pages: Record<GoalTab, number>;
  searchQuery: string;
}

function chargerPosition(): Partial<PositionGardee> {
  try {
    const brut = sessionStorage.getItem(PLACE_KEY);
    if (brut) return JSON.parse(brut);
  } catch { /* un stockage refuse ne doit pas casser la page */ }
  return {};
}

function garderPosition(p: PositionGardee) {
  try {
    sessionStorage.setItem(PLACE_KEY, JSON.stringify(p));
  } catch { /* idem */ }
}

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
    /* Les groupes d un cote, le reste de l autre ; la fleche dit
       lequel passe devant. A egalite, le plus recent d abord. */
    case "super":
      return sorted.sort((a, b) => {
        const aGroupe = a.goal_type === "super" ? 0 : 1;
        const bGroupe = b.goal_type === "super" ? 0 : 1;
        if (aGroupe !== bGroupe) return (aGroupe - bGroupe) * d;
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
  const place = useMemo(() => chargerPosition(), []);

  const [sortBy, setSortBy] = useState<SortOption>(triValide(saved.sortBy));
  const [sortDirection, setSortDirection] = useState<SortDirection>(saved.sortDirection || "desc");
  const [activeTab, setActiveTab] = useState<GoalTab>(place.activeTab || "active");
  const [itemsPerPage, setItemsPerPage] = useState(saved.itemsPerPage || 10);
  const [searchQuery, setSearchQuery] = useState(place.searchQuery || "");
  const [hideSuperGoals, setHideSuperGoals] = useState(saved.hideSuperGoals ?? false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(saved.displayMode || "bar");

  // Persist settings on change
  useEffect(() => {
    saveSettings({ sortBy, sortDirection, displayMode, itemsPerPage, hideSuperGoals });
  }, [sortBy, sortDirection, displayMode, itemsPerPage, hideSuperGoals]);

  // Per-tab pagination
  const [pages, setPages] = useState(place.pages || { all: 1, active: 1, completed: 1 });

  /* La position se garde a chaque changement, et non au depart : on ne
     sait pas comment on quitte la page — un clic sur une carte, la
     palette de commandes, le bouton « precedent » du navigateur. */
  useEffect(() => {
    garderPosition({ activeTab, pages, searchQuery });
  }, [activeTab, pages, searchQuery]);

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
    /* Un groupe est franchi quand on l'a honore, pas quand ses membres
     * le sont.
     *
     * Ce filtre deduisait l'achevement d'un groupe de celui de ses
     * enfants, parce que son status restait alors bloque a
     * "not_started" et ne disait rien. Ce n'est plus le cas : un groupe
     * suit desormais ses compteurs, et ne passe a "fully_completed" que
     * par le geste de l'utilisateur. Son status dit donc la verite, et
     * la deduction est devenue un mensonge — elle rangeait dans
     * "Termines" un groupe que personne n'avait honore. C'est ainsi
     * qu'un onglet annoncait 14 acheves pour 13 objectifs franchis.
     *
     * Un groupe se lit maintenant comme n'importe quel objectif.
     */
    const completed = filtered.filter(estFranchi);
    const idsTermines = new Set(completed.map((g) => g.id));
    const active = filtered.filter((g) => !idsTermines.has(g.id) && g.status !== "cancelled");

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
