/* LES NOMS QU ON DONNE AUX CHOSES DANS LES GRAPHIQUES.
 *
 * Ils vivaient dans les traductions des taches ; ici on nomme en clair,
 * parce qu un graphique n a pas d autre contexte pour desambiguiser une
 * etiquette de deux mots.
 *
 * Sortis de `pages/Analytics.tsx` en extrayant ses trois sections : une
 * table de libelles n a pas a vivre dans la fonction qui dessine.
 */
/* Les libellés des catégories de tâches et des priorités. Ils vivaient
   dans les traductions de Todo ; ici on nomme en clair, parce que la page
   n'a pas d'autre contexte pour les désambiguïser. */
export const NOM_CATEGORIE: Record<string, string> = {
  general: "Général",
  admin: "Administratif",
  health: "Santé",
  study: "Études",
  work: "Travail",
  personal: "Personnel",
  home: "Maison",
  finance: "Finance",
};

export const NOM_DIFFICULTE: Record<string, string> = {
  low: "Facile",
  medium: "Moyenne",
  high: "Difficile",
};

export const MOIS_COURTS = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];