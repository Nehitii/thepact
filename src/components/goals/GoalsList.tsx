import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, List, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { BarViewGoalCard } from "@/components/goals/BarViewGoalCard";
import { GridViewGoalCard } from "@/components/goals/GridViewGoalCard";
import { UIVerseGoalCard } from "@/components/goals/UIVerseGoalCard";
import {
  SuperGoalCard,
  computeSuperGoalProgress,
  filterGoalsByRule,
  type SuperGoalRule,
} from "@/components/goals/super";
import { GoalsPagination } from "@/components/goals/GoalsPagination";
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
  toggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
};

const tabs: { id: GoalTab; label: string; icon: typeof List }[] = [
  { id: "all", label: "All", icon: List },
  { id: "active", label: "Active", icon: Zap },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

function getGridClass(displayMode: DisplayMode) {
  if (displayMode === "grid" || displayMode === "bookmark") return "flex flex-wrap justify-center gap-6";
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
  toggleFocus,
}: GoalsListProps) {
  const navigate = useNavigate();

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
            onClick={(id) => navigate(`/goals/${id}`)}
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
      onNavigate: (id: string) => navigate(`/goals/${id}`),
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

  const renderEmptyState = () => {
    const isCompletedTab = activeTab === "completed";
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl bg-card/60 backdrop-blur-sm border border-border">
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
            isCompletedTab ? "bg-green-500/10" : "bg-primary/10"
          }`}
        >
          {isCompletedTab ? (
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          ) : (
            <Plus className="h-8 w-8 text-primary" />
          )}
        </div>
        <h3 className="text-lg font-bold font-orbitron tracking-wider text-primary mb-2">
          {isCompletedTab ? "NO COMPLETED GOALS YET" : "NO ACTIVE GOALS"}
        </h3>
        <p className="text-muted-foreground font-rajdhani mb-4">
          {isCompletedTab ? "Complete your first goal to see it here" : "Start your journey by adding a goal"}
        </p>
        {!isCompletedTab && (
          <Button onClick={() => navigate("/goals/new")} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex justify-center mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-card/30 border border-primary/20 backdrop-blur-xl">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const count = buckets[tab.id].length;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-rajdhani text-sm font-medium transition-all duration-300 ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="goalsActiveTab"
                    className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
                <span className="relative z-10 text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </motion.div>

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
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className={getGridClass(displayMode)}
              >
                {paginated.map((goal) => renderGoalCard(goal))}
              </motion.div>
              <GoalsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(activeTab, page)}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
