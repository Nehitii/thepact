/**
 * LA PORTE DU DOMAINE FOCUS.
 *
 * Une seule chose sort : `fetchFocusSessions`, que `app/prefetchData`
 * appelle au demarrage pour amorcer le cache. Les onze composants, le
 * minuteur, les distractions, les variantes de fond : rien de tout cela
 * n a jamais ete appele d ailleurs que du domaine.
 *
 * `composants/index.ts` reste, mais ce n est PAS une porte : c est un
 * confort interne, et son seul lecteur est `pages/Focus` qui importe
 * douze composants d un coup. Deux fichiers d index dans un domaine ne
 * se contredisent pas tant que l un regarde dedans et l autre dehors.
 *
 * `FocusOverlay` n est pas ici, malgre son nom. Il vit dans
 * `components/todo/`, prend une `TodoTask`, n est rendu que par la
 * liste de taches, et n importe RIEN du focus. Il partira avec le
 * domaine agenda.
 */
export { fetchFocusSessions } from "./hooks/useFocusSessions";
export type { ObjetClause } from "./types";
