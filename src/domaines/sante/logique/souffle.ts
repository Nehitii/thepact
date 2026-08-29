/* ═══════════════════════════════════════════════════════════════
   LE SOUFFLE

   L exercice existait et ne laissait aucune trace : le compteur de
   cycles vivait dans un useState et mourait au demontage. On pouvait
   respirer tous les jours pendant six mois, l application n en savait
   rien le lendemain.

   Ce module tient ce que la respiration a de calculable — les rythmes,
   la cible d une seance, la serie, le total — pour que le composant
   n ait plus qu a afficher.

   IL N Y A NI SCORE NI PALIER, ET C EST UNE DECISION. Respirer est le
   seul geste de l application dont le but est de faire BAISSER la
   pression. Un palier cree une dette : on n est plus a quatre seances,
   on est a quatre-vingt-seize du prochain titre. On compte donc ce qui
   s est passe, et rien de plus.
   ═══════════════════════════════════════════════════════════════ */

export type Temps = "inspire" | "retiens" | "expire" | "pause";

export interface Schema {
  id: string;
  /** Les quatre temps, en secondes. Zero saute le temps. */
  temps: [number, number, number, number];
}

/* Des classiques, pas des inventions : coherence cardiaque (5-5),
   boite (4-4-4-4), 4-7-8 pour l endormissement, et un apaisement
   rapide ou l expiration domine. */
export const SCHEMAS: readonly Schema[] = [
  { id: "coherence", temps: [5, 0, 5, 0] },
  { id: "boite", temps: [4, 4, 4, 4] },
  { id: "apaiser", temps: [4, 0, 6, 0] },
  { id: "dormir", temps: [4, 7, 8, 0] },
];

export const ORDRE_DES_TEMPS: readonly Temps[] = ["inspire", "retiens", "expire", "pause"];

export const schemaDe = (id: string): Schema =>
  SCHEMAS.find((s) => s.id === id) ?? SCHEMAS[0];

/** Les temps a zero sont sautes : afficher « retiens — 0 s » serait absurde. */
export const sequenceDe = (s: Schema): { nom: Temps; duree: number }[] =>
  ORDRE_DES_TEMPS.map((nom, i) => ({ nom, duree: s.temps[i] })).filter((x) => x.duree > 0);

export const tempsDunCycle = (s: Schema): number => s.temps.reduce((a, b) => a + b, 0);

/* ── LA CIBLE ──────────────────────────────────────────────────
   Le compteur de cycles etait un nombre mort : ni terme, ni but. On
   s arretait quand on s ennuyait, ce qui est le contraire de l effet
   recherche. Une seance a maintenant une forme — on choisit ou l on
   va, et l anneau se remplit vers la. */
export const CIBLES: readonly number[] = [3, 6, 10];
export const CIBLE_PAR_DEFAUT = 6;

/* ── LE RYTHME SUGGERE ─────────────────────────────────────────
   Quatre pastilles identiques, alors que la base sait deja le stress
   de la veille, la charge mentale et l heure qu il est. La suggestion
   ne force jamais la selection : elle se propose, en pointille. */
export type MotifSuggestion = "soir" | "tension" | "defaut";

export interface Suggestion {
  rythme: string;
  motif: MotifSuggestion;
}

/** Le seuil au-dela duquel on propose d apaiser plutot que d equilibrer. */
export const SEUIL_TENSION = 7;

export function rythmeSuggere(
  stress: number | null | undefined,
  chargeMentale: number | null | undefined,
  maintenant = new Date(),
): Suggestion {
  const heure = maintenant.getHours();
  /* Le soir passe avant la tension : a vingt-trois heures, meme tendu,
     ce qu on cherche est de s endormir. */
  if (heure >= 21 || heure < 5) return { rythme: "dormir", motif: "soir" };

  const tension = Math.max(stress ?? 0, chargeMentale ?? 0);
  if (tension >= SEUIL_TENSION) return { rythme: "apaiser", motif: "tension" };

  return { rythme: "coherence", motif: "defaut" };
}

/* ── LE TOTAL RESPIRE ──────────────────────────────────────────
   En secondes reelles, pas en cycles : un cycle de 4-7-8 dure dix-neuf
   secondes quand un cycle de coherence en dure dix. */
export const totalSecondes = (seances: { duree_secondes: number }[]): number =>
  seances.reduce((somme, s) => somme + (s.duree_secondes || 0), 0);

/**
 * Les parties d une duree, pour que le composant les habille dans sa
 * langue. Rendre « 1 h 12 » ici figerait le francais dans le domaine.
 */
export function partiesDeDuree(secondes: number): { heures: number; minutes: number } {
  const total = Math.max(0, Math.round(secondes / 60));
  return { heures: Math.floor(total / 60), minutes: total % 60 };
}


/* LES REGLAGES DU DESSIN DU SOUFFLE, VENUS DE « Respiration.tsx ».
   Deux courbes, deux rayons, une gamme : rien que l ecran ne calcule,
   tout ce qu il applique. Ils vivent aupres des schemas de rythme —
   c est le meme sujet vu du cote du trait. */
export const COURBE_INSPIRE = "cubic-bezier(0.16, 0.85, 0.4, 1)";

export const COURBE_EXPIRE = "cubic-bezier(0.45, 0, 0.7, 0.35)";

/* Rayons des deux anneaux, sur une boite de 100. */
export const R_PHASE = 48;

export const R_SEANCE = 43;

export const CIRC = (r: number) => 2 * Math.PI * r;

/* Le repere sonore : grave et bref, jamais une alarme. */
export const HAUTEURS: Record<Temps, number> = {
  inspire: 528, retiens: 440, expire: 396, pause: 396,
};
