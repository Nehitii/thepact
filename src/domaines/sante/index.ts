/**
 * LA PORTE DU DOMAINE SANTE.
 *
 * Trois choses sortent d ici, parce que trois seulement etaient
 * appelees du dehors :
 *
 *   fetchTodayHealth  — le prechargement, app/prefetchData
 *   useHealthHistory  — l ecran Analytique
 *   usePoulsDuJour    — la barre neurale de l accueil
 *
 * Une premiere version exportait aussi `EnTeteDossier`, par analogie
 * avec un releve qui l avait classe « objectifs + sante ». Le
 * compilateur a rappele que son seul appelant est `pages/Health`, donc
 * l interieur. Une porte se remplit de ce que le dehors demande, pas de
 * ce qu on imagine qu il demandera.
 *
 * Tout le reste — la respiration, le journal du corps, l hydratation,
 * les rappels, les huit autres hooks de `useHealth` — n a jamais quitte
 * le domaine.
 *
 * LES DEUX PAGES NE SONT PAS ICI, ET C EST DELIBERE.
 * `app/prefetchRoutes.ts` les charge en differe, une par route. Les
 * faire passer par cet index les ramenerait dans le paquet de
 * demarrage — la meme erreur que la console de M.I.A., mais sur une
 * page entiere. Le routage est le seul module qui connaisse
 * legitimement les pages de tous les domaines : c est sa fonction, et
 * `npm run domaines:check` ne l autorise qu a lui, et qu en differe.
 */
export { fetchTodayHealth, useHealthHistory } from "./hooks/useHealth";
export { usePoulsDuJour } from "./hooks/usePoulsDuJour";
