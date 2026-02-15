import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Plus } from "lucide-react";
import { useParticleEffect } from "@/components/ParticleEffect";
import { CyberBackground } from "@/components/CyberBackground";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useProfile } from "@/hooks/useProfile";
import { useGoalFilters } from "@/hooks/useGoalFilters";
import { GoalsToolbar } from "@/components/goals/GoalsToolbar";
import { GoalsList } from "@/components/goals/GoalsList";
import { GoalsSkeleton } from "@/components/goals/GoalsSkeleton";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pact } = usePact(user?.id);
  const { data: goals = [], isLoading: goalsLoading } = useGoals(pact?.id, { includeStepCounts: true });
  const { data: profile } = useProfile(user?.id);
  const { trigger: triggerParticles, ParticleEffects } = useParticleEffect();

  const customDifficultyName = profile?.custom_difficulty_name || "";
  const customDifficultyColor = profile?.custom_difficulty_color || "#a855f7";
  const loading = !user || goalsLoading;

  const filters = useGoalFilters(goals);

  // Optimistic focus toggle — mutate cache directly
  const toggleFocus = useCallback(
    async (goalId: string, currentFocus: boolean, e: React.MouseEvent) => {
      e.stopPropagation();

      const goal = goals.find((g) => g.id === goalId);
      if (goal) {
        triggerParticles(e, getUnifiedDifficultyColor(goal.difficulty, customDifficultyColor));
      }

      // Optimistic update
      queryClient.setQueryData(["goals", pact?.id, true, true], (old: any) =>
        old?.map((g: any) => (g.id === goalId ? { ...g, is_focus: !currentFocus } : g)),
      );

      const { error } = await supabase.from("goals").update({ is_focus: !currentFocus }).eq("id", goalId);

      if (error) {
        // Revert on failure
        queryClient.setQueryData(["goals", pact?.id, true, true], (old: any) =>
          old?.map((g: any) => (g.id === goalId ? { ...g, is_focus: currentFocus } : g)),
        );
      }
    },
    [goals, pact?.id, customDifficultyColor, queryClient, triggerParticles],
  );

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <CyberBackground />
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-8 pb-24 space-y-6">
          <div className="flex flex-col items-center text-center gap-4">
            <h1 className="text-3xl font-bold font-orbitron tracking-wider">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(91,180,255,0.4)]">
                GOALS
              </span>
            </h1>
          </div>
          <GoalsSkeleton mode={filters.displayMode} count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      <ParticleEffects />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
        className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 pt-8 pb-24 space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col items-center text-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-orbitron tracking-wider">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(91,180,255,0.4)]">
                GOALS
              </span>
            </h1>
            <p className="text-muted-foreground font-rajdhani tracking-wide mt-1">Evolutions of your Pact</p>
          </div>
          <button
            onClick={() => navigate("/goals/new")}
            className="relative overflow-hidden group px-5 py-2.5 rounded-xl bg-card/80 backdrop-blur-sm border border-primary/30 text-primary font-rajdhani font-medium tracking-wider transition-all duration-300 hover:border-primary/60 hover:bg-primary/10 hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Goal</span>
          </button>
        </motion.div>

        {/* Toolbar */}
        {goals.length > 0 && (
          <motion.div variants={itemVariants}>
            <GoalsToolbar
              displayMode={filters.displayMode}
              setDisplayMode={filters.setDisplayMode}
              sortBy={filters.sortBy}
              setSortBy={filters.setSortBy}
              sortDirection={filters.sortDirection}
              toggleSortDirection={filters.toggleSortDirection}
              searchQuery={filters.searchQuery}
              setSearchQuery={filters.setSearchQuery}
              hideSuperGoals={filters.hideSuperGoals}
              setHideSuperGoals={filters.setHideSuperGoals}
              hasSuperGoals={filters.hasSuperGoals}
              itemsPerPage={filters.itemsPerPage}
              handleItemsPerPageChange={filters.handleItemsPerPageChange}
            />
          </motion.div>
        )}

        {/* Content */}
        {goals.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-card/60 backdrop-blur-sm border border-border"
          >
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(91,180,255,0.2)]">
              <Plus className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-orbitron tracking-wider text-primary mb-2">NO GOALS YET</h3>
            <p className="text-muted-foreground font-rajdhani mb-6 max-w-sm">
              Start your journey by adding your first Pact evolution
            </p>
            <button
              onClick={() => navigate("/goals/new")}
              className="relative overflow-hidden group px-4 py-2 rounded-lg bg-primary text-primary-foreground font-rajdhani font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create First Goal
            </button>
          </motion.div>
        ) : (
          <GoalsList
            allGoals={goals}
            activeTab={filters.activeTab}
            handleTabChange={filters.handleTabChange}
            buckets={filters.buckets}
            paginated={filters.paginated}
            currentPage={filters.currentPage}
            totalPages={filters.totalPages}
            setCurrentPage={filters.setCurrentPage}
            displayMode={filters.displayMode}
            customDifficultyName={customDifficultyName}
            customDifficultyColor={customDifficultyColor}
            toggleFocus={toggleFocus}
          />
        )}
      </motion.div>
    </div>
  );
}
