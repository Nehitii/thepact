/* CE FICHIER N EN PORTE PLUS QU UN.
 *
 * Il en portait deux, et le second — `handleFullyComplete` — n avait
 * AUCUN appelant : la page passe par le crochet `useGoalDetailActions`,
 * qui a sa propre version. Les deux ne faisaient d ailleurs pas la meme
 * chose. Celle d ici marquait TOUTES les etapes, ultime comprise, la ou
 * la vivante exclut `is_ultimate` ; et elle lisait l horloge quatre
 * fois la ou la vivante la lit une. Du code mort qui contredit le code
 * vivant est pire que pas de code : le prochain lecteur peut le croire.
 * Retire le 30/08/2026.
 */
import { supabase } from "@/socle/supabase/client";
import type { TablesUpdate } from "@/socle/supabase/types";
import { messageDErreur } from "@/socle/outils/erreurs";

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
