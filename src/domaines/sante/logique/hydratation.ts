/* ═══════════════════════════════════════════════════════════════
   VERRES OU LITRES — LA MEME QUANTITE, DEUX LANGUES

   Le relevé, l'objectif et le tableau de bord affichaient tous « 6 »
   suivi du mot « verres ». C'est une unité domestique : personne ne
   remplit huit fois le même verre, et une bouteille se lit en litres.

   Mais la base, elle, ne bouge pas. `hydration_glasses` est un entier,
   l'historique est déjà écrit avec, et Analytics comme la suggestion
   de rythme le lisent tel quel. Convertir le stockage réécrirait tout
   le passé pour un goût de présentation — et rendrait la bascule
   destructrice au lieu d'être réversible.

   On convertit donc à l'affichage seulement. Un verre vaut 25 cl :
   l'échelle en verres reste entière, celle en litres tombe sur des
   quarts, et aucune des deux ne perd de précision.
   ═══════════════════════════════════════════════════════════════ */

export type UniteHydratation = "glasses" | "liters";

/** Un verre standard. Le facteur vit ici et nulle part ailleurs. */
export const CL_PAR_VERRE = 25;
const LITRES_PAR_VERRE = CL_PAR_VERRE / 100;

/** L'unité stockée en base, ramenée à une valeur connue. */
export const uniteValide = (v?: string | null): UniteHydratation =>
  v === "liters" ? "liters" : "glasses";

/** Le nombre à montrer, pour un nombre de verres donné. */
export function quantiteAffichee(verres: number, unite: UniteHydratation): number {
  return unite === "liters" ? verres * LITRES_PAR_VERRE : verres;
}

/** Le chemin inverse : ce qu'on stocke quand l'utilisateur saisit dans son unité. */
export function verresDepuisAffichage(valeur: number, unite: UniteHydratation): number {
  return unite === "liters" ? Math.round(valeur / LITRES_PAR_VERRE) : Math.round(valeur);
}

/**
 * La quantité, écrite.
 *
 * En litres, deux décimales seraient du bruit — un quart de litre n'a
 * qu'une décimale utile, et la virgule française est de rigueur.
 */
export function formaterQuantite(verres: number, unite: UniteHydratation): string {
  if (unite !== "liters") return String(Math.round(verres));
  const litres = quantiteAffichee(verres, unite);
  /* 2 → « 0,5 » ; 4 → « 1 » ; 6 → « 1,5 ». Le zéro décimal inutile
     disparaît, sinon chaque litre rond s'écrirait « 1,0 ». */
  return litres.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

/** Le pas du curseur, dans l'unité affichée. */
export const pasAffiche = (unite: UniteHydratation): number =>
  unite === "liters" ? LITRES_PAR_VERRE : 1;

/**
 * Le mot qui suit le nombre.
 *
 * « L » ne s'accorde pas ; « verre » si. La clé de traduction porte le
 * pluriel, on ne fait ici que choisir entre les deux registres.
 */
export function uniteCourte(unite: UniteHydratation, motVerres: string): string {
  return unite === "liters" ? "L" : motVerres;
}
