import type { CreateTaskInput, TodoTask } from "@/domaines/taches/types";
import type { TablesInsert } from "@/socle/supabase/types";

/* LE RANGEMENT DES TACHES, ET CE QU ON ECRIT D UNE TACHE.
 *
 * Trois formes de ligne et deux calculs de rang vivaient au milieu de
 * cinq mutations Supabase. L un des deux calculs etait ecrit DEUX
 * FOIS — une fois pour ce qu on montre, une fois pour ce qu on garde.
 */

/* UNE TACHE NOUVELLE SE POSE EN TETE DU RANGEMENT MANUEL, pas au fond
 * d une liste ou personne ne la verra.
 *
 * L amorce du minimum est ZERO et non l infini : une liste vide, ou
 * une liste dont toutes les taches sont deja au-dessus de zero, donne
 * -1. Sans cette amorce, la premiere tache d une liste vide
 * recevrait -Infinity, que la colonne ne peut pas porter. */
export function rangDeTete(taches: { position?: number | null }[]): number {
  return taches.reduce((min, t) => Math.min(min, t.position ?? 0), 0) - 1;
}

/* CE QU ON ECRIT D UNE TACHE NEUVE.
 *
 * Les deux defauts — « general » et « flexible » — ne sont pas
 * decoratifs : l historique les relit pour classer, et une categorie
 * vide y deviendrait une categorie a part entiere. */
export const CATEGORIE_PAR_DEFAUT = "general";
export const GENRE_PAR_DEFAUT = "flexible";

export function ligneDeTacheNeuve(
  input: CreateTaskInput,
  userId: string,
  position: number,
): TablesInsert<"todo_tasks"> {
  return {
    user_id: userId,
    name: input.name,
    /* La chaine vide n est pas une echeance : elle devient « aucune ». */
    deadline: input.deadline || null,
    priority: input.priority,
    is_urgent: input.is_urgent,
    category: input.category || CATEGORIE_PAR_DEFAUT,
    task_type: input.task_type || GENRE_PAR_DEFAUT,
    reminder_enabled: input.reminder_enabled || false,
    reminder_frequency: input.reminder_frequency || null,
    location: input.location || null,
    appointment_time: input.appointment_time || null,
    position,
  };
}

/* CE QU ON GARDE D UNE TACHE ACHEVEE.
 *
 * L historique ne recopie pas la tache : il en garde ce qui se relit
 * ensuite — le nom, ce qu elle valait, et combien de fois elle a ete
 * repoussee. Ni son echeance, ni sa position : elles ne veulent plus
 * rien dire une fois la tache faite. */
export function ligneDHistorique(
  tache: TodoTask,
  userId: string,
): TablesInsert<"todo_history"> {
  return {
    user_id: userId,
    task_name: tache.name,
    priority: tache.priority,
    was_urgent: tache.is_urgent,
    postpone_count: tache.postpone_count,
    category: tache.category || CATEGORIE_PAR_DEFAUT,
    task_type: tache.task_type || GENRE_PAR_DEFAUT,
    reminder_frequency: tache.reminder_frequency,
    location: tache.location,
  };
}

/* LE NOUVEAU RANGEMENT, POUR L ECRAN COMME POUR LA BASE.
 *
 * Il etait calcule DEUX FOIS : une fois pour les lignes ecrites, une
 * fois pour le cache repeint sans attendre. Un identifiant inconnu
 * est ecarte des deux cotes — c est ce qui evite d ecrire une ligne
 * qui n existe pas, et d effacer de l ecran une tache qu on n a pas
 * demande a deplacer. */
export function reordonner<T extends { id: string }>(
  taches: T[],
  idsDansLOrdre: string[],
): (T & { position: number })[] {
  const parId = new Map(taches.map((t) => [t.id, t]));
  const rangees: (T & { position: number })[] = [];
  for (const id of idsDansLOrdre) {
    const t = parId.get(id);
    if (t) rangees.push({ ...t, position: rangees.length });
  }
  return rangees;
}

/* Les quatre colonnes que l ecriture du rangement touche. Le nom en
   fait partie parce que la colonne ne l accepte pas nul : un upsert
   qui l omettrait creerait une ligne sans nom si l identifiant
   n existait pas. */
export function lignesDeRangement(
  taches: TodoTask[],
  idsDansLOrdre: string[],
  userId: string,
): { id: string; user_id: string; name: string; position: number }[] {
  return reordonner(taches, idsDansLOrdre).map((t) => ({
    id: t.id,
    user_id: userId,
    name: t.name,
    position: t.position,
  }));
}
