// Handler functions for GoalDetail - extracted for better code organization
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { trackGoalCompleted } from "@/domaines/succes";
import { messageDErreur } from "@/lib/erreurs";

export async function handleFullyComplete(
  goalId: string,
  totalSteps: number,
  userId: string,
  difficulty: string,
  createdAt: string,
  onSuccess: () => void,
  onError: (message: string) => void
) {
  try {
    // Get all steps for this goal
    const { data: stepsData } = await supabase
      .from("steps")
      .select("id")
      .eq("goal_id", goalId);

    if (!stepsData) {
      onError("Failed to load steps");
      return;
    }

    // Mark all steps as completed
    const updates = stepsData.map(step => 
      supabase
        .from("steps")
        .update({ 
          status: "completed", 
          validated_at: new Date().toISOString(),
          completion_date: new Date().toISOString()
        })
        .eq("id", step.id)
    );

    await Promise.all(updates);

    // Update goal to fully completed
    const { error: goalError } = await supabase
      .from("goals")
      .update({
        validated_steps: totalSteps,
        status: "fully_completed",
        completion_date: new Date().toISOString()
      })
      .eq("id", goalId);

    if (goalError) {
      onError(goalError.message);
      return;
    }

    // Track achievement
    setTimeout(() => {
      trackGoalCompleted(userId, difficulty, createdAt, new Date().toISOString());
    }, 0);

    onSuccess();
  } catch (error: unknown) {
    onError(messageDErreur(error, "Failed to complete goal"));
  }
}

export async function handleUpdateGoal(
  goalId: string,
  /** Conserve pour la compatibilite de l appel ; plus lu depuis que
   *  la reconciliation des etapes a ete retiree. */
  _currentTotalSteps: number,
  /* Le type de la table, pas une liste de cinq champs. L appelant en
      assigne seize — deadline, difficulty, type, super_goal_rule et le
      reste — et transtypait en « any » pour les faire passer. */
  updates: TablesUpdate<"goals">,
  onSuccess: () => void,
  onError: (message: string) => void
) {
  try {
    const { error: goalError } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", goalId);

    if (goalError) {
      onError(goalError.message);
      return;
    }

    /* CE QUI ECRIT total_steps N ECRIT PAS LES ETAPES.
     *
     * Cette fonction reconciliait la table des etapes avec le compteur :
     * en ajouter si le total montait, supprimer les dernieres s il
     * baissait. Elle partait du principe que total_steps EST le nombre
     * de lignes, ce qui n est plus vrai — et ne l etait deja plus pour
     * une habitude.
     *
     * Deux degats, dont un mesure. L etape ultime ne compte pas dans
     * l avancement : la designer faisait donc baisser le total d une
     * unite, et la reconciliation supprimait la derniere etape — c est
     * a dire l ultime elle-meme. Releve en essai : cinq etapes avant,
     * quatre apres, aucune ultime, l etape perdue. Et dans l autre
     * sens, allonger une habitude de cinquante a cent quatre-vingts
     * jours aurait insere cent trente fausses etapes dans un objectif
     * qui n en a pas.
     *
     * La page de detail, seule appelante, gere deja ses etapes une par
     * une — insertion, mise a jour, suppression, depuis la liste
     * editee. La reconciliation faisait donc doublon avec elle en plus
     * de se tromper. Une seule main sur la table des etapes.
     */
    onSuccess();
  } catch (error: unknown) {
    onError(messageDErreur(error, "Failed to update goal"));
  }
}
