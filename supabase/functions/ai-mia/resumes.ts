/* LES FENETRES DE TEMPS, ET CE QU ON COMPTE DEDANS.
 *
 * Cinq outils de lecture demandent « les N derniers jours » et rendent
 * au modele un resume qu il recopie tel quel. Les bornes de ces
 * fenetres etaient calculees de trois manieres differentes dans le meme
 * fichier, et l agregation du focus vivait au milieu d un appel
 * Supabase.
 *
 * Un nombre faux ici ne fait rien echouer : il fait dire au modele
 * « tu as travaille 240 minutes cette semaine » au lieu de 320, avec le
 * meme aplomb.
 */
import { MS_PAR_JOUR, jourDe } from "./bornes.ts";

/* ── LES FENETRES ────────────────────────────────────────────── */

/* UN INSTANT, PAS UN JOUR. `pomodoro_sessions.started_at` et
 * `calendar_events.start_time` sont des horodatages : la borne doit en
 * etre un aussi, sinon Postgres compare une date a un instant et
 * decale la fenetre d une fraction de journee.
 *
 * `health_data.entry_date` est une DATE, elle : sa borne se calcule
 * avec `ilYAJours`, qui rend « AAAA-MM-JJ ». Les deux formes coexistent
 * parce que les deux colonnes n ont pas le meme type — ce n est pas une
 * incoherence, c est la seule facon d etre juste des deux cotes. */
export function fenetreEnArriere(jours: number, maintenant: number): string {
  return new Date(maintenant - jours * MS_PAR_JOUR).toISOString();
}

export interface FenetreAutour {
  debut: string;
  fin: string;
}

export function fenetreAutour(avant: number, apres: number, maintenant: number): FenetreAutour {
  return {
    debut: fenetreEnArriere(avant, maintenant),
    fin: new Date(maintenant + apres * MS_PAR_JOUR).toISOString(),
  };
}

/* SOIXANTE EVENEMENTS, ET LE MODELE NE SAIT PAS QU IL Y EN AVAIT PLUS.
   La requete coupe a soixante sans rien dire : au-dela, l agenda rendu
   est incomplet et rien dans la reponse ne l indique. Constate, non
   corrige — le dire changerait ce que le modele lit. */
export const PLAFOND_EVENEMENTS = 60;

/* ── LE RESUME DU FOCUS ──────────────────────────────────────── */

export interface SeanceLue {
  duration_minutes?: number | null;
  started_at?: string | null;
}

export interface ResumeDuFocus {
  seances: number;
  minutes: number;
  par_jour: Record<string, number>;
}

/* ═══════════════════════════════════════════════════════════════
   LE DECOUPAGE PAR JOUR EST EN UTC, PAS DANS LE FUSEAU DE LA PERSONNE.

   `jourDe` coupe les dix premiers caracteres de l horodatage ISO : le
   jour obtenu est donc celui de Greenwich. L etat du jour, lui, date
   les choses dans le fuseau du navigateur — c est tout l objet de
   `etatDuJour.ts`.

   DEUX FRONTIERES DE JOURNEE COEXISTENT DONC POUR LA MEME PERSONNE. A
   Paris, une seance commencee a 01 h 30 tombe la veille pour ce
   resume-ci et le jour meme pour l etat du jour ; a Auckland, l ecart
   porte sur la moitie des soirees. Le total de minutes, lui, est juste
   dans tous les cas — seule la repartition par jour bouge.

   CONSTATE, NON CORRIGE : dater ce resume dans le fuseau demanderait
   de le lui passer, et changerait les nombres que le modele lit.
   ═══════════════════════════════════════════════════════════════ */
export function resumeDuFocus(seances: SeanceLue[]): ResumeDuFocus {
  const parJour: Record<string, number> = {};
  let minutes = 0;
  for (const s of seances) {
    /* LE `?? 0` EST LU DEUX FOIS, ET C EST VOULU : une seance sans
       duree ne compte pas de minutes, mais elle COMPTE dans le nombre
       de seances. Les deux nombres ne disent pas la meme chose. */
    minutes += s.duration_minutes ?? 0;
    const j = jourDe(String(s.started_at));
    parJour[j] = (parJour[j] ?? 0) + (s.duration_minutes ?? 0);
  }
  return { seances: seances.length, minutes, par_jour: parJour };
}
