/* LE NOM DE CHAQUE VISAGE.
 *
 * Il vivait dans le composant, et six fichiers de logique importaient
 * donc un composant React pour un type. La garde des couches l a
 * signale six fois ; le type descend ici, ou il n a jamais cesse
 * d appartenir. `VisageMia` le reexporte, pour ne casser personne. */
export type ExpressionMia =
  /* ── l'anneau reste d'or ── */
  | "calme"
  | "neutre"
  | "joie"
  | "reflexion"
  | "surprise"
  | "contente"
  | "complice"
  | "lasse"
  | "genee"
  | "contrariee"
  | "severe"
  | "peine"
  | "soupir"
  /* ── l'anneau vire au rouge : c'est la phase du pacte, pas l'humeur ── */
  | "colere"
  | "triste-sourire"
  | "menacante"
  /* ── l'anneau s'éteint ── */
  | "abattue"
  | "eteinte";


/**
 * Le préchargement des visages.
 *
 * Séparé du composant : un fichier qui exporte à la fois un composant et
 * des constantes casse le rafraîchissement à chaud de Vite.
 */

/** Ceux qu'on verra de toute façon dans les trente premières secondes. */
export const VISAGES_FREQUENTS: ExpressionMia[] = [
  "calme",
  "neutre",
  "reflexion",
  "contente",
  "genee",
  "surprise",
];

export function prechargerVisages(): void {
  if (typeof window === "undefined") return;
  for (const e of VISAGES_FREQUENTS) {
    const img = new Image();
    img.src = `/mia/mia-${e}.png`;
  }
}
