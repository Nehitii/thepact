import { useCallback } from "react";
import "@/styles/cyberpunk.css";
import "@/styles/goals.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { DSPageShell } from "@/components/ds";
import { SpaceBackdrop } from "@/components/home/SpaceBackdrop";
import { useParticleEffect } from "@/components/ParticleEffect";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";
import { usePact } from "@/hooks/usePact";
import { useGoals, type Goal } from "@/hooks/useGoals";
import { useProfile } from "@/hooks/useProfile";
import { useGoalFilters } from "@/hooks/useGoalFilters";
import { GoalsHeader } from "@/components/goals/GoalsHeader";
import { GoalsToolbar } from "@/components/goals/GoalsToolbar";
import { GoalsList } from "@/components/goals/GoalsList";
import { GoalsSkeleton } from "@/components/goals/GoalsSkeleton";
import { motion } from "framer-motion";
import { useQueryClient, useMutation } from "@tanstack/react-query";

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
  const unlockCode = profile?.goal_unlock_code ?? "";
  const loading = !user || goalsLoading;

  const filters = useGoalFilters(goals);

  // Optimistic focus toggle — React Query mutation with prefix-scoped invalidation
  const focusKey = ["goals", pact?.id] as const;
  const toggleFocusMutation = useMutation({
    mutationFn: async ({ goalId, nextFocus }: { goalId: string; nextFocus: boolean }) => {
      const { error } = await supabase.from("goals").update({ is_focus: nextFocus }).eq("id", goalId);
      if (error) throw error;
    },
    onMutate: async ({ goalId, nextFocus }) => {
      await queryClient.cancelQueries({ queryKey: focusKey });
      const snapshots = queryClient.getQueriesData<Goal[]>({ queryKey: focusKey });
      queryClient.setQueriesData<Goal[]>({ queryKey: focusKey }, (old) =>
        old?.map((g) => (g.id === goalId ? { ...g, is_focus: nextFocus } : g)),
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: focusKey });
    },
  });

  const toggleFocus = useCallback(
    (goalId: string, currentFocus: boolean, e: React.MouseEvent) => {
      e.stopPropagation();
      const goal = goals.find((g) => g.id === goalId);
      if (goal) {
        triggerParticles(e.clientX, e.clientY, getUnifiedDifficultyColor(goal.difficulty, customDifficultyColor));
      }
      toggleFocusMutation.mutate({ goalId, nextFocus: !currentFocus });
    },
    [goals, customDifficultyColor, triggerParticles, toggleFocusMutation],
  );

  /* Les trois nombres que l en-tete affiche. Le decoupage suit celui des
     onglets (useGoalFilters) : un objectif non commence reste actif. */
  const franchis = goals.filter(
    (g) => g.status === "fully_completed" || g.status === "validated",
  ).length;
  const actifs = goals.length - franchis;

  if (loading) {
    return (
      <DSPageShell width="xl" background={<SpaceBackdrop />}>
        <div className="space-y-6">
          <GoalsHeader total={goals.length} actifs={actifs} franchis={franchis} />
          <GoalsSkeleton mode={filters.displayMode} count={4} />
        </div>
      </DSPageShell>
    );
  }

  return (
    <DSPageShell width="xl" background={<SpaceBackdrop />}>
      <ParticleEffects />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <GoalsHeader total={goals.length} actifs={actifs} franchis={franchis} />
        </motion.div>

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
            unlockCode={unlockCode}
          />
        )}
      </motion.div>
    </DSPageShell>
  );
}
