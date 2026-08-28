/**
 * LA PORTE DU DOMAINE FINANCE.
 *
 * Deux fonctions sortent, sur les quinze qu exporte `useFinance.ts` :
 *
 *   fetchFinanceSettings  — le prechargement, app/prefetchData
 *   useFinanceSettings    — l accueil, pour le jour de paie
 *
 * Les depenses recurrentes, les revenus, les validations mensuelles,
 * les creanciers, la cadence des echeances : rien de tout cela n a
 * jamais ete appele d ailleurs que du domaine.
 *
 * DEUX CHOSES ONT ETE LAISSEES DEHORS, ET C EST LE POINT DE CE DOMAINE.
 *
 * `lib/currency.ts` et `contexts/CurrencyContext.tsx` portent l odeur de
 * la finance, mais ils servent DIX fichiers ailleurs : les objectifs,
 * les souhaits, l analytique, le profil, et AppProviders qui monte le
 * contexte pour toute l application. Une devise n appartient pas au
 * module qui compte l argent — elle appartient a tout ce qui affiche un
 * prix. Ils iront au socle.
 *
 * `AuraBackground` non plus : il s appelait « AURA Neo-Banking » et
 * vivait sous `finance/aura/`, mais son unique lecteur etait
 * `DSBackground`. Il a rejoint `components/ds/`, avec `CyberBackground`
 * qui etait dans le meme cas — et la tolerance `ds → composants` a
 * disparu avec eux.
 */
export { fetchFinanceSettings, useFinanceSettings } from "./hooks/useFinance";

/* LE POINTAGE DU MOIS. Il vivait dans `hooks/`, et un releve par mot
   l avait d abord classe avec les taches — « pointage » evoque une
   liste a cocher. C est une ligne par prelevement constate, avec son
   montant reel : ses deux appelants sont le parcours du mois et la
   page souhaits, qui parlent d argent tous les deux. */
export { useEcrirePointage, useEffacerPointage } from "./hooks/usePointages";
