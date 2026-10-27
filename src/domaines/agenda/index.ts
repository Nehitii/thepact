/**
 * LA PORTE DU DOMAINE AGENDA — vide, comme celle du journal.
 *
 * Rien, dans le reste de l application, n appelle le calendrier. Le
 * dehors ne demande que la PAGE, et les pages ne passent pas par la
 * porte : `app/prefetchRoutes.ts` les charge en differe.
 *
 * EN REVANCHE, L AGENDA APPELLE LES TACHES — et c est la premiere
 * fleche entre deux domaines du depot. `useCalendarEvents` interroge
 * `todo_tasks` et importe `natureDe` et `estRendezVous` de
 * `@/domaines/taches` ; `logique/sources.ts` en fait autant. La fleche
 * ne va que dans ce sens : du cote des taches, le seul « Calendar »
 * qu on trouve est une icone.
 *
 * `components/ui/calendar.tsx` N EST PAS ICI, malgre son nom : c est le
 * calendrier de shadcn, un enrobage de react-day-picker que le profil
 * et le formulaire de tache utilisent pour choisir une date. Une
 * primitive, pas un domaine.
 */
export {};
