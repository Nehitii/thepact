/* QUELLE VUE, ET CE QUE LA LISTE MONTRE ENCORE.
 */
import { PREF } from "@/socle/outils/preferencesAffichage";
/* LA VUE « STATS » EST PARTIE DANS ANALYTICS.
   Elle portait quatre compteurs et huit blocs — série, activité sur
   trente jours, complétions par mois, jours productifs, difficulté,
   catégorie, productivité par heure. C'était une page d'analyse cachée
   dans un outil de saisie, et son voisinage la rendait introuvable.

   Tout y est repris, éclaté par question au lieu d'être empilé par
   source : les catégories et les difficultés en Répartition, les heures,
   les jours de semaine et les ruptures de série en Rythme, les reports
   en Trajectoire. Les compteurs de série restent ici, sur le cartouche —
   ce sont des jauges de jeu, pas des statistiques. */

export type Vue = 'liste' | 'detaillee' | 'calendrier' | 'historique';

export const VUES: Vue[] = ['liste', 'detaillee', 'calendrier', 'historique'];

export function vueInitiale(): Vue {
  try {
    const v = localStorage.getItem(PREF.TODO_VUE) as Vue | null;
    if (v && VUES.includes(v)) return v;
  } catch { /* stockage indisponible */ }
  return 'liste';
}
