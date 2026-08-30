import type { Tables, TablesInsert } from "@/socle/supabase/types";

/* CE QU EST LA COPIE D UN OBJECTIF.
 *
 * Dupliquer n est pas recopier : c est decider, champ par champ, ce
 * qui appartient a l objectif et ce qui appartient au parcours qu on
 * en a fait. Le nom, le palier, les etapes, les pieces chiffrees
 * suivent ; les dates tenues, les cases cochees et le statut ne
 * suivent pas — sinon la copie naitrait deja a moitie franchie.
 *
 * Ces quinze decisions vivaient au milieu de six ecritures Supabase,
 * ou rien ne pouvait les relire.
 */

/* CES TROIS COLONNES SONT DES ENUMS POSTGRES, PAS DES CHAINES. Les
   declarer « string » compile ici et casse a l insertion — la lecon
   etait deja ecrite dans le crochet qui appelle ce module. */
type Objectif = Tables<"goals">;

export interface ObjectifACopier {
  name: string;
  type?: Objectif["type"];
  difficulty?: Objectif["difficulty"];
  estimated_cost?: number | null;
  notes?: string | null;
  total_steps?: number | null;
  potential_score?: number | null;
  goal_type?: Objectif["goal_type"];
  habit_duration_days?: number | null;
  image_url?: string | null;
}

export interface EtapeACopier {
  title: string;
  notes?: string | null;
  is_ultimate?: boolean;
}

export interface PieceACopier {
  name: string;
  price: number;
  category: string | null;
}

/** Une habitude sans duree declaree se copie sur une semaine. */
export const SEMAINE = 7;

export function objectifCopie(
  goal: ObjectifACopier,
  pactId: string,
  suffixe: string,
): TablesInsert<"goals"> {
  return {
    pact_id: pactId,
    name: `${goal.name}${suffixe}`,
    type: goal.type,
    difficulty: goal.difficulty,
    estimated_cost: goal.estimated_cost,
    notes: goal.notes,
    total_steps: goal.total_steps,
    potential_score: goal.potential_score,
    /* ═══ UNE COPIE NE PORTE AUCUNE DATE ═══

       Le statut et l echeance ne suivaient deja pas : les recopier
       ferait naitre un objectif deja en retard sur un parcours qui
       n est pas le sien.

       LE DEPART NON PLUS, DESORMAIS. Il valait « maintenant » — la
       copie naissait donc commencee le jour ou on la faisait, ce que
       personne n avait declare. C etait le dernier endroit ou
       l application posait une date de depart a la place de
       quelqu un ; la case « je sais quand j ai commence » a retire
       les autres.

       Une copie sans depart ne compte aucune duree, et ne peut donc
       gagner aucune des quatre distinctions de temps — voir
       succes/logique/honneurDuTemps.ts. C est ce qu on veut : la
       copie n a rien vecu. */
    start_date: null,
    status: "not_started" as const,
    deadline: null,
    goal_type: goal.goal_type || "normal",
    habit_duration_days: goal.habit_duration_days,
    /* Les jours coches ne suivent pas : un tableau neuf, de la meme
       longueur. */
    habit_checks:
      goal.goal_type === "habit"
        ? (Array(goal.habit_duration_days || SEMAINE).fill(false) as boolean[])
        : null,
    image_url: goal.image_url,
  };
}

/* UN GROUPE N A PAS D ETAPES A LUI, une habitude non plus : ses jours
   en tiennent lieu. Copier les etapes de l un ou l autre creerait des
   etapes fantomes que rien n afficherait. */
export function etapesCopiees(
  goal: { goal_type?: string | null },
  etapes: EtapeACopier[],
  nouvelObjectifId: string,
) {
  if (goal.goal_type === "habit" || goal.goal_type === "super") return [];
  return etapes.map((e, i) => ({
    goal_id: nouvelObjectifId,
    title: e.title,
    /* LE RANG D ETAPE ULTIME SUIT LA COPIE. Il ne suivait pas, alors
       que total_steps — qui exclut l etape ultime — etait recopie tel
       quel : la copie recevait une etape ordinaire de plus que son
       total, et son compte ne pouvait plus l atteindre. */
    is_ultimate: e.is_ultimate ?? false,
    /* Le rang est refait de un a n : les rangs d origine peuvent avoir
       des trous, une etape ayant pu etre supprimee. */
    order: i + 1,
    status: "pending" as const,
    description: "",
    notes: e.notes || "",
  }));
}

/* LES PIECES CHIFFREES PERDENT LEUR ETAPE. Les identifiants d etapes
   de la copie sont neufs : garder l ancien pointerait sur l objectif
   d origine. */
export function piecesCopiees(pieces: PieceACopier[], nouvelObjectifId: string) {
  return pieces.map((p) => ({
    goal_id: nouvelObjectifId,
    name: p.name,
    price: p.price,
    category: p.category,
    step_id: null,
  }));
}
