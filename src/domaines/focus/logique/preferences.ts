/* CE QUE LE STOCKAGE LOCAL REND, ET CE QU ON EN CROIT.
 *
 * Deux reglages survivent au demontage : les trois durees du minuteur,
 * et l objet de la clause. Les deux sont relus au meme endroit, a deux
 * lignes d intervalle — et les deux ne se defient PAS de la meme
 * maniere. C est cet ecart que ce module rend visible.
 */
import type { ObjetClause } from "@/domaines/focus/types";

export interface ReglagesDuFocus {
  work: number;
  pause: number;
  longue: number;
}

/** Vingt-cinq, cinq, quinze : le pomodoro d origine. */
export const REGLAGES_PAR_DEFAUT: ReglagesDuFocus = { work: 25, pause: 5, longue: 15 };

/* ═══════════════════════════════════════════════════════════════
   LA FUSION NE VERIFIE RIEN, ET C EST UN FAIT, PAS UN OUBLI SUPPOSE.

   `{ ...defaut, ...JSON.parse(brut) }` remplace chaque champ present
   dans le stockage, quel que soit son contenu. Ce qui y est ecrit
   arrive donc tel quel dans `workMinutes * 60` :

     stocke            ce que le minuteur recoit
     {"work":"abc"}    "abc" * 60 = NaN — le compte a rebours n affiche
                       plus rien de lisible
     {"work":0}        une phase de travail de zero seconde
     {"work":-5}       une phase de duree negative

   Aucune de ces valeurs ne peut venir de l ecran : les trois durees
   sont posees par des reglages bornes. Elles viennent d une console,
   d une extension, ou d un stockage abime — et rien ici ne les arrete.
   CONSTATE, NON CORRIGE : borner ces trois nombres changerait ce que
   l ecran affiche pour qui aurait deja une valeur hors bornes.

   Deux lignes plus bas, `objetDeLaClause` fait exactement l inverse :
   elle refuse tout ce qu elle ne reconnait pas. Les deux lectures du
   meme stockage, dans le meme fichier, n avaient pas la meme
   defiance.
   ═══════════════════════════════════════════════════════════════ */
export function reglagesLus(brut: string | null): ReglagesDuFocus {
  try {
    if (!brut) return REGLAGES_PAR_DEFAUT;
    return { ...REGLAGES_PAR_DEFAUT, ...(JSON.parse(brut) as object) };
  } catch {
    return REGLAGES_PAR_DEFAUT;
  }
}

/* ── L OBJET DE LA CLAUSE ────────────────────────────────────── */

/* UNE CLAUSE PORTE UN OBJET : un objectif, ou une tache, jamais les
 * deux. C etait deja le comportement a l ecran, mais il reposait sur
 * une convention — deux etats separes, et chaque gestionnaire qui
 * pense a vider l autre. Une troisieme voie d ecriture, ou un
 * enregistrement bricole dans le stockage, suffisait a poser les
 * deux : rien ne refusait `{ goal, todo }` tous deux remplis.
 *
 * Un seul emplacement rend la chose impossible par construction, au
 * lieu de la rendre seulement improbable.
 *
 * L ANCIEN FORMAT EST ENCORE LU, ET L ORDRE DECIDE. Un stockage
 * d avant la bascule porte `{ goal, todo }` ; on le replie sur un seul
 * emplacement, et c est l objectif qui gagne quand les deux sont la —
 * exactement le cas que le format neuf rend impossible. */
export function objetDeLaClause(brut: string | null): ObjetClause {
  try {
    if (!brut) return null;
    const o = JSON.parse(brut);
    if (o && (o.type === "goal" || o.type === "todo") && typeof o.id === "string") return o;
    if (o && typeof o.goal === "string") return { type: "goal", id: o.goal };
    if (o && typeof o.todo === "string") return { type: "todo", id: o.todo };
    return null;
  } catch {
    return null;
  }
}

/* LES DEUX COLONNES SONT DERIVEES AU MOMENT DE L ECRITURE, la ou elles
   existent vraiment. Au plus une des deux est remplie — c est la
   traduction du « un seul emplacement » vers un schema qui, lui, en a
   deux. */
export function colonnesDeLObjet(objet: ObjetClause): {
  linked_goal_id: string | null;
  linked_todo_id: string | null;
} {
  return {
    linked_goal_id: objet?.type === "goal" ? objet.id : null,
    linked_todo_id: objet?.type === "todo" ? objet.id : null,
  };
}
