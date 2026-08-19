import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, List, Zap, CheckCircle2, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { BarViewGoalCard } from "@/components/goals/BarViewGoalCard";
import { GridViewGoalCard } from "@/components/goals/GridViewGoalCard";
import { UIVerseGoalCard } from "@/components/goals/UIVerseGoalCard";
import { UnlockGoalModal } from "@/components/goals/UnlockGoalModal";
import {
  SuperGoalCard,
  computeSuperGoalProgress,
  filterGoalsByRule,
  type SuperGoalRule,
} from "@/components/goals/super";
import { GoalsPagination } from "@/components/goals/GoalsPagination";
import { GoalsRegistre } from "@/components/goals/GoalsRegistre";
import type { Goal } from "@/hooks/useGoals";
import type { DisplayMode, GoalTab } from "@/hooks/useGoalFilters";

interface GoalsListProps {
  allGoals: Goal[];
  activeTab: GoalTab;
  handleTabChange: (tab: GoalTab) => void;
  buckets: { all: Goal[]; active: Goal[]; completed: Goal[] };
  paginated: Goal[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (tab: GoalTab, page: number) => void;
  displayMode: DisplayMode;
  customDifficultyName: string;
  customDifficultyColor: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
  unlockCode?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
};

const tabs: { id: GoalTab; cle: string; icon: typeof List }[] = [
  { id: "all", cle: "goals.filters.all", icon: List },
  { id: "active", cle: "goals.filters.active", icon: Zap },
  { id: "completed", cle: "goals.filters.completed", icon: CheckCircle2 },
];

function getGridClass(displayMode: DisplayMode) {
  if (displayMode === "grid") {
    // True responsive CSS grid: 2 cols on phones (avoids stretched giant cards),
    // 2 / 3 / 4 above. Tighter gaps on small screens.
    return "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 md:gap-6 w-full";
  }
  if (displayMode === "bookmark") return "flex flex-wrap justify-center gap-6";
  return "grid grid-cols-1 gap-4 w-full max-w-4xl mx-auto";
}

export function GoalsList({
  allGoals,
  activeTab,
  handleTabChange,
  buckets,
  paginated,
  currentPage,
  totalPages,
  setCurrentPage,
  displayMode,
  customDifficultyName,
  customDifficultyColor,
  searchQuery,
  setSearchQuery,
  toggleFocus,
  unlockCode,
}: GoalsListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null);

  const handleNavigate = (id: string) => {
    const goal = allGoals.find((g) => g.id === id);
    if (goal?.is_locked && unlockCode) {
      setPendingGoalId(id);
      setUnlockModalOpen(true);
    } else {
      navigate(`/goals/${id}`);
    }
  };

  const renderGoalCard = (goal: Goal) => {
    const isCompleted = goal.status === "fully_completed" || goal.status === "validated";

    // Super Goal
    if (goal.goal_type === "super") {
      const childIds = goal.child_goal_ids || [];
      let childGoals = allGoals.filter((g) => childIds.includes(g.id));
      if (goal.is_dynamic_super && goal.super_goal_rule) {
        const eligible = allGoals.filter((g) => g.id !== goal.id && g.goal_type !== "super");
        childGoals = filterGoalsByRule(eligible, goal.super_goal_rule as SuperGoalRule);
      }
      const completedChildCount = childGoals.filter((g) => g.status === "fully_completed").length;

      return (
        <motion.div key={goal.id} variants={itemVariants}>
          <SuperGoalCard
            id={goal.id}
            name={goal.name}
            childCount={childGoals.length}
            completedCount={completedChildCount}
            isDynamic={goal.is_dynamic_super || false}
            rule={goal.super_goal_rule as SuperGoalRule | undefined}
            difficulty={goal.difficulty}
            onClick={(id) => handleNavigate(id)}
            customDifficultyName={customDifficultyName}
            customDifficultyColor={customDifficultyColor}
            displayMode={displayMode}
            imageUrl={goal.image_url}
          />
        </motion.div>
      );
    }

    const cardProps = {
      goal,
      isCompleted,
      customDifficultyName,
      customDifficultyColor,
      onNavigate: handleNavigate,
      onToggleFocus: toggleFocus,
    };

    const CardComponent =
      displayMode === "grid"
        ? GridViewGoalCard
        : displayMode === "bookmark"
          ? UIVerseGoalCard
          : BarViewGoalCard;

    return (
      <motion.div key={goal.id} variants={itemVariants}>
        <CardComponent {...cardProps} />
      </motion.div>
    );
  };

  /* Etat vide — trois situations, et non deux.
   *
   * Une recherche sans correspondance affichait "Aucun objectif actif" :
   * le message accusait la collection alors que seule la requete etait en
   * cause, et il proposait de creer un objectif — la mauvaise action,
   * puisqu'il y en a peut-etre trente-huit dont aucun ne porte ce mot.
   * On dit ce qui est vrai, et on offre le geste utile : effacer la
   * recherche.
   *
   * Les textes des deux autres cas existaient deja traduits sous
   * goals.emptyStates.* et n'etaient pas lus. */
  const renderEmptyState = () => {
    const recherche = (searchQuery || "").trim();
    const estRecherche = recherche.length > 0;
    const estTermines = activeTab === "completed";
    const teinte = estRecherche
      ? "#ffab00"
      : estTermines
        ? "#00ff88"
        : "hsl(var(--primary))";

    return (
      <div className="cp-cadre">
        <div className="cp-fond gl-vide">
          <span className="cp-equerre cp-equerre-hg" />
          <span className="cp-equerre cp-equerre-bd" />
          <span className="gl-vide-marque" style={{ ["--t" as string]: teinte }}>
            {estRecherche
              ? <SearchX className="h-7 w-7" aria-hidden="true" />
              : estTermines
                ? <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                : <Plus className="h-7 w-7" aria-hidden="true" />}
          </span>

          <h3 className="gl-vide-titre font-orbitron">
            {estRecherche
              ? t("goals.emptyStates.noResults")
              : estTermines
                ? t("goals.emptyStates.noCompletedGoals")
                : t("goals.emptyStates.noActiveGoals")}
          </h3>

          <p className="gl-vide-texte ds-t-label">
            {estRecherche
              ? t("goals.emptyStates.noResultsDesc", { query: recherche })
              : estTermines
                ? t("goals.emptyStates.noCompletedGoalsDesc")
                : t("goals.emptyStates.noActiveGoalsDesc")}
          </p>

          {estRecherche ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="gl-btn gl-btn-primaire"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              {t("goals.emptyStates.clearSearch")}
            </button>
          ) : !estTermines ? (
            <button
              type="button"
              onClick={() => navigate("/goals/new")}
              className="gl-btn gl-btn-primaire"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("goals.createGoal")}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Onglets.
          Le layoutId de framer-motion a ete retire : sur le selecteur de
          periode des Statistiques, la meme animation partagee redemarrait
          de zero a chaque remontage et produisait un scintillement. L'etat
          actif est un fond CSS, il n'y a plus rien a animer. */}
      <nav className="gl-onglets" aria-label={t("goals.filters.all")}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const count = buckets[tab.id].length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              aria-pressed={isActive}
              className="gl-onglet cp-cadre"
              data-actif={isActive}
            >
              <span className="gl-onglet-in">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="gl-onglet-nom">{t(tab.cle)}</span>
                <span className="gl-onglet-nb">{count}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {paginated.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* La vue liste n'est plus une grille de cartes : c'est un
                  registre, une ligne par objectif. Le composant gere sa
                  propre disposition et sa bascule de regroupement. */}
              {displayMode === "bookmark" ? (
                <GoalsRegistre
                  goals={paginated}
                  allGoals={allGoals}
                  customDifficultyName={customDifficultyName}
                  customDifficultyColor={customDifficultyColor}
                  onNavigate={handleNavigate}
                  onToggleFocus={toggleFocus}
                />
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className={getGridClass(displayMode)}
                >
                  {paginated.map((goal) => renderGoalCard(goal))}
                </motion.div>
              )}
              <GoalsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(activeTab, page)}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {unlockCode && (
        <UnlockGoalModal
          open={unlockModalOpen}
          onClose={() => { setUnlockModalOpen(false); setPendingGoalId(null); }}
          onUnlock={() => {
            setUnlockModalOpen(false);
            if (pendingGoalId) navigate(`/goals/${pendingGoalId}`);
            setPendingGoalId(null);
          }}
          correctCode={unlockCode}
        />
      )}
    </div>
  );
}
