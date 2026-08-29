/* LA PERIODE OBSERVEE.
 *
 * Ce type etait declare dans `composants/PeriodSelector.tsx`, et deux
 * hooks importaient donc un composant React pour connaitre une fenetre
 * de temps.
 *
 * NEUVIEME FOIS LE MOTIF, apres ExpressionMia, ObjetClause,
 * FinanceCategory, les neuf des taches, les quatre de l agenda,
 * ShopFilterState, les neuf du social et les deux des objectifs. Neuf
 * domaines sur seize l ont presente. Ce n est plus un accident, c est la
 * pente naturelle d un fichier : on declare le type ou on l utilise
 * d abord, et le premier usage est presque toujours un composant.
 */
export type AnalyticsPeriod = "30d" | "90d" | "6m" | "all";
