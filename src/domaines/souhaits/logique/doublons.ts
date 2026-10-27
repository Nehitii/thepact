/* RECONNAITRE UN DOUBLON DANS LA LISTE.
 *
 * Deux articles font doublon quand ils portent le MEME NOM, aux
 * espaces et a la casse pres, ET qu ils sont rattaches au meme
 * objectif. Le meme nom sous deux objectifs differents n en est pas
 * un : « casque » pour le bureau et « casque » pour le velo sont deux
 * choses.
 *
 * Ces deux fonctions vivaient en tete de `pages/Wishlist.tsx`. Elles
 * sont pures — ni React, ni requete, ni etat — et se testent donc
 * seules, ce qu une fonction enfermee dans une page de mille lignes ne
 * permettait pas.
 */

export function normaliserNom(valeur: string) {
  return valeur.trim().toLowerCase().replace(/\s+/g, " ");
}

export function trouverDoublon(opts: {
  items: Array<{ id: string; name: string; goal_id: string | null }>;
  name: string;
  goalId: string | null;
  excludeId?: string | null;
}) {
  const cible = normaliserNom(opts.name);
  const objectif = opts.goalId ?? null;
  return opts.items.find(
    (i) => i.id !== (opts.excludeId ?? null)
      && normaliserNom(i.name) === cible
      && (i.goal_id ?? null) === objectif,
  ) ?? null;
}
