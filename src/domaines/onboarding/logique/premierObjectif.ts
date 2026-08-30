import type { TablesInsert } from "@/socle/supabase/types";

/* LE PREMIER OBJECTIF D UN PACTE.
 *
 * Il se pose depuis un gabarit, ou depuis un nom tape a la main. Deux
 * insertions courtes, ecrites au milieu de cinq autres ecritures.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QU ELLES N ECRIVENT PAS, ET CE QUE LA BASE MET A LA PLACE.
 *
 * Ce chemin pose QUATRE colonnes. La creation ordinaire — NewGoal —
 * en pose DOUZE. Trois des huit manquantes ont un defaut en base qui
 * ne dit pas la meme chose que ce que l application ecrirait :
 *
 *   potential_score  DEFAULT 0     — la creation ordinaire y met le
 *     potentiel du palier : 25 pour « medium », 50 pour « hard ». Le
 *     premier objectif d un nouveau pacte vaut donc ZERO POINT, pour
 *     toujours, alors que le meme objectif cree ensuite en vaudrait
 *     vingt-cinq. La somme des potentiels d un pacte est calculee en
 *     base par une fonction qui additionne cette colonne : elle est
 *     courte de ce premier objectif, definitivement.
 *
 *   status           DEFAULT 'active' — la creation ordinaire y met
 *     « not_started ». « active » est une valeur de l enum d ORIGINE,
 *     que le vocabulaire de l application a abandonnee : le tri du
 *     registre ne la connait pas (son ordre liste not_started,
 *     in_progress, fully_completed, validated, paused), et l objectif
 *     se range donc a une place que personne n a choisie.
 *
 *   start_date       — non ecrite ici, posee a maintenant ailleurs.
 *
 * Ces trois ecarts sont CONSTATES et fixes par des tests. Les
 * combler changerait ce que l ecran affiche.
 * ═══════════════════════════════════════════════════════════════
 */

/** Ce que le gabarit apporte a l objectif. Sans son icone ni ses textes. */
export interface GabaritDObjectif {
  placeholder: string;
  difficulty: "easy" | "medium" | "hard" | "extreme" | "impossible";
  goal_type: "normal" | "habit";
  total_steps?: number;
  habit_duration_days?: number;
}

/* LE PALIER PAR DEFAUT DE L OBJECTIF SUR MESURE, et son nombre
   d etapes. Ils sont ecrits en clair dans l insertion, sans qu aucun
   gabarit ne les porte. */
export const PALIER_SUR_MESURE = "medium";
export const ETAPES_SUR_MESURE = 5;

export function objectifDuGabarit(tpl: GabaritDObjectif, pactId: string): TablesInsert<"goals"> {
  const charge: TablesInsert<"goals"> = {
    pact_id: pactId,
    name: tpl.placeholder,
    difficulty: tpl.difficulty,
    goal_type: tpl.goal_type,
    /* UNE HABITUDE COMPTE SES JOURS, un objectif ordinaire ses
       etapes. Le repli a zero ne sert a aucun gabarit existant : tous
       portent l un ou l autre. */
    total_steps: tpl.total_steps ?? tpl.habit_duration_days ?? 0,
  };
  /* LES JOURS NE SE POSENT QUE POUR UNE HABITUDE QUI EN DECLARE. Une
     habitude sans duree n aurait aucune case a cocher : mieux vaut ne
     rien ecrire que d ecrire un tableau vide. */
  if (tpl.goal_type === "habit" && tpl.habit_duration_days) {
    charge.habit_duration_days = tpl.habit_duration_days;
    charge.habit_checks = Array(tpl.habit_duration_days).fill(false);
  }
  return charge;
}

export function objectifSurMesure(nom: string, pactId: string): TablesInsert<"goals"> {
  return {
    pact_id: pactId,
    name: nom.trim(),
    difficulty: PALIER_SUR_MESURE,
    goal_type: "normal",
    total_steps: ETAPES_SUR_MESURE,
  };
}
