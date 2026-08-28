/** Ce sur quoi porte la seance : un objectif, une tache, ou rien.
 *
 * Ce type vivait dans `pages/Focus.tsx`, et `FocusToolbar` l y allait
 * chercher — un composant qui importe une page, la derniere inversion
 * `composants → pages` du depot. Il descend ici, ou il n a jamais cesse
 * d appartenir : un type ne rend rien. */
export type ObjetClause = { type: "goal" | "todo"; id: string } | null;
