import { useCallback } from "react";
import "@/socle/ds/cyberpunk.css";
import "@/domaines/objectifs/goals.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { brigadeDe, refusDeRecrutement, PLAFOND_BRIGADE } from "@/domaines/objectifs/logique/brigade";
import { useAuth } from "@/socle/contextes/AuthContext";
import { supabase } from "@/socle/supabase/client";
import { Plus } from "lucide-react";
import { DSPageShell } from "@/socle/ds";
import { SpaceBackdrop } from "@/components/home/SpaceBackdrop";
import { useParticleEffect } from "@/socle/hooks/useParticleEffect";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/socle/outils/utils";
import { usePact } from "@/domaines/objectifs/hooks/usePact";
import { useGoals, type Goal } from "@/domaines/objectifs/hooks/useGoals";
import { useProfile } from "@/domaines/profil";
import { useGoalFilters } from "@/domaines/objectifs/hooks/useGoalFilters";
import { GoalsHeader } from "@/domaines/objectifs/composants/GoalsHeader";
import { GoalsToolbar } from "@/domaines/objectifs/composants/GoalsToolbar";
import { GoalsList } from "@/domaines/objectifs/composants/GoalsList";
import { useRepriseDefilement } from "@/domaines/objectifs/hooks/useRepriseDefilement";
import { GoalsSkeleton } from "@/domaines/objectifs/composants/GoalsSkeleton";
import { motion } from "framer-motion";
import { useQueryClient, useMutation } from "@tanstack/react-query";

/* JAMAIS D OPACITE DANS L ETAT INITIAL.
   Une animation d entree qui part de zero laisse la page vide si
   elle ne demarre pas — et elle ne demarre pas dans un onglet
   d arriere-plan, ou le navigateur suspend les images par seconde.
   Mesure sur cette page : huit cartes a opacite zero, quatorze
   animations en pause. La wishlist, dans le meme onglet et au meme
   moment, s affichait entierement : elle n a plus d animation
   d entree.
   L etat initial ne porte donc plus que le deplacement. Si
   l animation ne joue pas, le contenu est simplement la, en place. */
const itemVariants = {
  hidden: { y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function Goals() {
  const { t } = useTranslation();
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

  /* La page se rouvre ou on l avait laissee : l onglet, la page et la
     recherche viennent de useGoalFilters, le defilement d ici. On
     n annonce « pret » qu une fois les objectifs charges — restaurer
     plus tot viserait une page qui na pas encore sa hauteur. */
  useRepriseDefilement(!loading && goals.length > 0, "/goals");

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
      if (!goal) return;

      /* La brigade tient trois places. Le refus se dit — une etoile qui
         ne s allume pas sans un mot passe pour une panne. */
      const refus = refusDeRecrutement(goals, goal);
      if (refus) {
        toast.error(t(refus === "brigade.refusPlein" ? "brigade.refusPlein" : "brigade.refusType", {
          defaultValue: refus === "brigade.refusPlein"
            ? "La brigade est au complet — relâche un objectif d'abord."
            : "Seuls les objectifs ordinaires rejoignent la brigade.",
          n: PLAFOND_BRIGADE,
        }));
        return;
      }

      triggerParticles(e.clientX, e.clientY, getUnifiedDifficultyColor(goal.difficulty, customDifficultyColor));
      toggleFocusMutation.mutate({ goalId, nextFocus: !currentFocus });
    },
    [goals, customDifficultyColor, triggerParticles, toggleFocusMutation, t],
  );

  const brigade = brigadeDe(goals);

  /* Les trois nombres que l en-tete affiche. Le decoupage suit celui des
     onglets (useGoalFilters) : un objectif non commence reste actif. */
  const franchis = goals.filter(
    (g) => g.status === "fully_completed" || g.status === "validated",
  ).length;
  const actifs = goals.length - franchis;

  /* Date du dernier objectif franchi, pour le releve du bandeau. On prend
     le maximum des completion_date plutot que le premier trouve : la liste
     n est pas triee par date. */
  const dernierFranchi = goals
    .map((g) => g.completion_date)
    .filter(Boolean)
    .sort()
    .pop() ?? null;

  if (loading) {
    return (
      <DSPageShell width="xl" background={<SpaceBackdrop />}>
        <div className="space-y-6">
          <GoalsHeader
                        total={goals.length}
                        actifs={actifs}
                        franchis={franchis}
                        brigade={brigade.length}
                        plafondBrigade={PLAFOND_BRIGADE}
                        debutPacte={pact?.project_start_date}
                        finPacte={pact?.project_end_date}
                        dernierFranchi={dernierFranchi}
                      />
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
        variants={{ hidden: {}, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <GoalsHeader
                        total={goals.length}
                        actifs={actifs}
                        franchis={franchis}
                        brigade={brigade.length}
                        plafondBrigade={PLAFOND_BRIGADE}
                        debutPacte={pact?.project_start_date}
                        finPacte={pact?.project_end_date}
                        dernierFranchi={dernierFranchi}
                      />
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
            sortBy={filters.sortBy}
            sortDirection={filters.sortDirection}
            customDifficultyName={customDifficultyName}
            customDifficultyColor={customDifficultyColor}
            searchQuery={filters.searchQuery}
            setSearchQuery={filters.setSearchQuery}
            toggleFocus={toggleFocus}
            unlockCode={unlockCode}
          />
        )}
      </motion.div>
    </DSPageShell>
  );
}
