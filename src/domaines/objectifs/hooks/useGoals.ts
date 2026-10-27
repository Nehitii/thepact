import type { Goal } from "@/domaines/objectifs/types";
export type { Goal };
/**
 * Goals data hook.
 *
 * Fetches goals with relational tags via a single Supabase query.
 * Step counts use a single batch query (not N+1).
 * Uses React Query for caching and automatic refetching.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import type { Tables } from "@/socle/supabase/types";



interface UseGoalsOptions {
  includeStepCounts?: boolean;
  includeTags?: boolean;
}

// Reusable fetcher — used by useGoals and by background prefetch.
export async function fetchGoals(
  pactId: string | undefined,
  options?: UseGoalsOptions,
): Promise<Goal[]> {
  const { includeStepCounts = false, includeTags = true } = options ?? {};
      if (!pactId) return [];

      // Build select string — embed tags relationally when requested
      const selectParts = ["*"];
      if (includeTags) selectParts.push("goal_tags(tag)");

      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select(selectParts.join(", "))
        .eq("pact_id", pactId)
        .order("created_at", { ascending: false })
        /* LE SELECT SE COMPOSE A L'EXECUTION : supabase-js ne peut rien
           deduire d'une chaine construite, et rend « GenericStringError ».
           On declare donc la forme la plus large que cette composition
           produit — les colonnes de la table, plus les etiquettes quand
           on les a demandees. */
        .returns<Array<Tables<"goals"> & { goal_tags?: { tag: string }[] }>>();

      if (goalsError) throw goalsError;
      if (!goalsData || goalsData.length === 0) return [];

      // Single batch query for step counts (not N+1)
      let stepCountsByGoal: Map<string, { total: number; completed: number; zenith: boolean }> | null = null;

      if (includeStepCounts) {
        const goalIds = goalsData.map((g) => g.id);
        const { data: stepsData, error: stepsError } = await supabase
          .from("steps")
          .select("goal_id, status, is_ultimate")
          .in("goal_id", goalIds);

        if (stepsError) throw stepsError;

        /* Une seule lecture pour deux questions. L etape ultime est un
           bonus : elle ne compte ni au numerateur ni au denominateur de
           l avancement. Mais c est elle, et elle seule, qui dit si
           l objectif est au zenith — la filtrer dans la requete aurait
           oblige a une seconde lecture pour la retrouver. */
        stepCountsByGoal = new Map();
        if (stepsData) {
          for (const step of stepsData) {
            const existing = stepCountsByGoal.get(step.goal_id)
              || { total: 0, completed: 0, zenith: false };
            if (step.is_ultimate) {
              if (step.status === "completed") existing.zenith = true;
            } else {
              existing.total++;
              if (step.status === "completed") existing.completed++;
            }
            stepCountsByGoal.set(step.goal_id, existing);
          }
        }
      }

      // Map results — tags come from the relational join, no manual merge
      return goalsData.map((goal) => {
        const counts = stepCountsByGoal?.get(goal.id);
        const relationalTags: string[] | undefined =
          includeTags && Array.isArray(goal.goal_tags)
            ? goal.goal_tags.map((t: { tag: string }) => t.tag)
            : undefined;

        // Destructure goal_tags out so it doesn't leak into the Goal type
        const { goal_tags: _removed, ...goalFields } = goal;

        return {
          ...goalFields,
          totalStepsCount: counts?.total,
          completedStepsCount: counts?.completed,
          /* Le zenith n est pas une colonne : c est le fait que l etape
             ultime soit franchie. Le deduire plutot que l enregistrer
             evite deux verites a tenir d accord. */
          auZenith: counts?.zenith ?? false,
          tags: relationalTags && relationalTags.length > 0 ? relationalTags : undefined,
        } as Goal;
      });
}

export function useGoals(pactId: string | undefined, options?: UseGoalsOptions) {
  const { includeStepCounts = false, includeTags = true } = options ?? {};

  return useQuery({
    queryKey: ["goals", pactId, includeStepCounts, includeTags],
    queryFn: () => fetchGoals(pactId, { includeStepCounts, includeTags }),
    enabled: !!pactId,
    staleTime: 30_000,
  });
}
