/* LES FORMES DU DOMAINE SANTE. */

/* Venues de « Respiration.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export type Etat = "repos" | "cours" | "pause" | "fini";

/* Venues de « Respiration.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface RespirationProps {
  /** Le stress du dernier releve, pour suggerer un rythme. */
  stress?: number | null;
  chargeMentale?: number | null;
}
