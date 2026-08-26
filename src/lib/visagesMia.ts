import type { ExpressionMia } from "@/components/mia/VisageMia";

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
