/* LES DEUX TYPES QUE SIX DOMAINES CITENT.
 *
 * `Goal` etait declare dans `hooks/useGoals.ts`, `Pact` dans
 * `hooks/usePact.ts` — et sept fichiers de cinq autres domaines les
 * importaient de la : la finance pour compter les pieces, les souhaits
 * pour la synchronisation, les succes pour l experience, le social pour
 * choisir un objectif a partager, le profil pour la carte d identite.
 *
 * HUITIEME FOIS LE MOTIF, et le plus couteux : ici ce n etait pas une
 * couche interne qui remontait, c etaient CINQ DOMAINES qui dependaient
 * d un hook React pour connaitre la forme d un objectif. Les hooks les
 * reexportent, la porte les expose.
 */

export interface Goal {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  status: string;
  validated_steps: number;
  total_steps: number;
  potential_score: number;
  estimated_cost: number;
  created_at: string;
  start_date?: string;
  completion_date?: string;
  image_url?: string;
  is_focus?: boolean;
  goal_type?: string;
  habit_duration_days?: number;
  habit_checks?: boolean[];
  // Super Goal fields
  child_goal_ids?: string[] | null;
  super_goal_rule?: SuperGoalRule | null;
  is_dynamic_super?: boolean;
  // Step counts from batch query
  completedStepsCount?: number;
  /** L etape ultime de cet objectif est franchie : il est au zenith. */
  auZenith?: boolean;
  totalStepsCount?: number;
  // Tags from relational select
  tags?: string[];
  // Deadline
  deadline?: string | null;
  // Lock
  is_locked?: boolean;
  // Shared goal flags
  isShared?: boolean;
  isReadOnly?: boolean;
  sharedByName?: string;
}

export interface Pact {
  id: string;
  name: string;
  mantra: string;
  symbol: string;
  color: string;
  points: number;
  tier: number;
  global_progress: number;
  project_start_date?: string | null;
  project_end_date?: string | null;
  created_at?: string | null;
  title_font?: string | null;
  title_effect?: string | null;
  /* SOUS QUEL ALPHABET CE PACTE A ETE JURE. La colonne existait et le
     type l ignorait : le sceau du tableau de bord la lit pour ne pas
     redessiner en v2 un pacte scelle sous la v1. Facultative, parce
     qu une ligne d avant la migration n en porte pas. */
  sigil_version?: number | null;
}

// Super Goal Types and Interfaces

export interface SuperGoalRule {
  difficulties?: string[];  // Filter by difficulty: ["easy", "hard", "custom"]
  tags?: string[];          // Filter by tags: ["personal", "health"]
  statuses?: string[];      // Filter by status: ["in_progress", "not_started"]
  focusOnly?: boolean;      // Only include focused goals
  excludeCompleted?: boolean; // Exclude already completed goals
}

export interface SuperGoalChildInfo {
  id: string;
  name: string;
  difficulty: string;
  status: string;
  progress: number;
  isCompleted: boolean;
  isMissing?: boolean;
}

export type SuperGoalBuildMode = "manual" | "auto";
export type SuperGoalType = "static" | "dynamic";

export interface SuperGoalFormData {
  buildMode: SuperGoalBuildMode;
  selectedGoalIds: string[];
  rule: SuperGoalRule;
  isDynamic: boolean;
}

// Compute progress from child goals
export function computeSuperGoalProgress(children: SuperGoalChildInfo[]): {
  completedCount: number;
  totalCount: number;
  percentage: number;
  isFullyCompleted: boolean;
} {
  const validChildren = children.filter(c => !c.isMissing);
  const completedCount = validChildren.filter(c => c.isCompleted).length;
  const totalCount = validChildren.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  return {
    completedCount,
    totalCount,
    percentage,
    isFullyCompleted: totalCount > 0 && completedCount === totalCount,
  };
}

// Apply rule to filter goals
export function filterGoalsByRule<T extends {
  id: string;
  difficulty?: string | null;
  status?: string | null;
  is_focus?: boolean | null;
  tags?: string[];
}>(goals: T[], rule: SuperGoalRule): T[] {
  return goals.filter(goal => {
    // Filter by difficulty
    if (rule.difficulties && rule.difficulties.length > 0) {
      if (!goal.difficulty || !rule.difficulties.includes(goal.difficulty)) {
        return false;
      }
    }
    
    // Filter by tags
    if (rule.tags && rule.tags.length > 0) {
      const goalTags = goal.tags || [];
      const hasMatchingTag = rule.tags.some(t => goalTags.includes(t));
      if (!hasMatchingTag) return false;
    }
    
    // Filter by status
    if (rule.statuses && rule.statuses.length > 0) {
      if (!goal.status || !rule.statuses.includes(goal.status)) {
        return false;
      }
    }
    
    // Focus only filter
    if (rule.focusOnly && !goal.is_focus) {
      return false;
    }
    
    // Exclude completed
    if (rule.excludeCompleted && goal.status === "fully_completed") {
      return false;
    }
    
    return true;
  });
}


/**
 * DIRE CE QU UNE REGLE SELECTIONNE.
 *
 * Un groupe automatique affichait « regle auto · 32 » : le nombre
 * qu elle capte, jamais son critere. Or c est le critere qui explique
 * le nombre — et, ici, qui revele que la regle ne sert a rien : elle
 * coche les six paliers sans autre condition, donc elle prend le
 * pacte entier. Une regle qui selectionne tout ne distingue rien.
 */
const NOM_PALIER_REGLE: Record<string, string> = {
  easy: "facile",
  medium: "moyen",
  hard: "difficile",
  extreme: "extrême",
  impossible: "impossible",
  custom: "personnalisé",
};

/** Nombre de paliers existants : au complet, le critere ne filtre plus. */
const PALIERS_EN_TOUT = 6;

export function decrireRegle(regle: SuperGoalRule | null | undefined): string {
  if (!regle) return "aucun critère";
  const morceaux: string[] = [];

  const d = regle.difficulties ?? [];
  if (d.length >= PALIERS_EN_TOUT) morceaux.push("tous les paliers");
  else if (d.length > 0) morceaux.push(d.map((x) => NOM_PALIER_REGLE[x] || x).join(", "));

  if (regle.tags?.length) morceaux.push(`étiquettes : ${regle.tags.join(", ")}`);
  if (regle.statuses?.length) morceaux.push(`états : ${regle.statuses.join(", ")}`);
  if (regle.focusOnly) morceaux.push("brigade uniquement");
  if (regle.excludeCompleted) morceaux.push("hors franchis");

  return morceaux.length ? morceaux.join(" · ") : "aucun critère";
}

/* Venues de « StepDetail.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface Step {
  id: string;
  goal_id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  order: number;
  status: string | null;
  due_date?: string | null;
  completion_date?: string | null;
  validated_at?: string | null;
  exclude_from_spin: boolean;
  is_ultimate?: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/* Venues de « GoalsList.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface GoalsListProps {
  allGoals: Goal[];
  activeTab: GoalTab;
  handleTabChange: (tab: GoalTab) => void;
  buckets: { all: Goal[]; active: Goal[]; completed: Goal[] };
  paginated: Goal[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (tab: GoalTab, page: number) => void;
  displayMode: DisplayMode;
  sortBy: SortOption;
  sortDirection: SortDirection;
  customDifficultyName: string;
  customDifficultyColor: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
  unlockCode?: string;
}

/* Venues de « GoalsGraph.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface ObjectifMesurable {
  goal_type?: string | null;
  habit_duration_days?: number | null;
  habit_checks?: boolean[] | null;
  total_steps?: number | null;
  validated_steps?: number | null;
  totalStepsCount?: number | null;
  completedStepsCount?: number | null;
}

/* Venues de « useGoalFilters.ts », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export type GoalTab = "all" | "active" | "completed";

export type SortOption = "difficulty" | "points" | "created" | "name" | "status" | "start" | "progression" | "super";

export type SortDirection = "asc" | "desc";

export type DisplayMode = "bar" | "grid" | "bookmark" | "front";

/* L etat d un noeud du graphe d objectifs.
 * SEIZIEME FOIS LE MOTIF : en sortant la palette du graphe dans
 * logique/, ce module s est mis a remonter vers une PAGE pour un type.
 * Renomme au passage — « Etat » tout court est deja pris deux fois
 * ailleurs, et un nom qui ne dit rien finit dans le mauvais fichier. */
export type EtatDuNoeud = "acquis" | "encours" | "verrouille";

/* Venues de « CostItemsEditor.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface CostItemData {
  id?: string;
  name: string;
  price: number;
  category?: string;
  stepId?: string | null;
}

/* Venues de « EditStepsList.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface EditStepItem {
  /** DB id if existing step, undefined if newly added */
  dbId?: string;
  name: string;
  /** Unique key for sortable */
  key: string;
  /** If true, this step is excluded from the mission spin/randomizer */
  excludeFromSpin?: boolean;
  /**
   * L etape ultime. Elle ne compte pas dans l avancement — c est ce qui
   * en fait un bonus et non une etape de plus — et la franchir porte
   * l objectif au zenith. Il n y en a qu une : la designer libere la
   * precedente.
   */
  estUltime?: boolean;
}
