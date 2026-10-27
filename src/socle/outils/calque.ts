/* LES TROIS DECISIONS D UN CALQUE MODAL.
 *
 * Ce qu on peut atteindre au clavier, ou la tabulation revient quand
 * elle sort, et ce qui compte comme « un clic sur le fond ». Trois
 * regles courtes, qui vivaient au milieu d un effet de cent lignes.
 */

/* CE QUI SE PREND AU CLAVIER. Un `tabindex="-1"` est atteignable par
   programme mais pas par tabulation : il n a rien a faire dans le
   piege, sans quoi la boucle s arreterait sur un element que la touche
   ne peut pas atteindre. */
export const PIEGEABLES =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/* OU LA TABULATION REVIENT QUAND ELLE SORT.
 *
 * Elle ne sort que par deux endroits : par la fin en avant, par le
 * debut en arriere. Partout ailleurs le navigateur fait deja ce qu il
 * faut, et l intercepter le ferait moins bien que lui.
 *
 * Rend l indice ou aller, ou `null` pour « laisse faire ». */
export function indiceDuPiege(
  nombre: number,
  indiceActif: number,
  versLArriere: boolean,
): number | null {
  /* Un calque sans rien a prendre ne piege rien : la tabulation doit
     pouvoir en sortir, sinon elle tourne dans le vide. */
  if (nombre <= 0) return null;
  if (versLArriere) return indiceActif === 0 ? nombre - 1 : null;
  return indiceActif === nombre - 1 ? 0 : null;
}

/* UN CLIC SUR LE FOND FERME — MAIS PAS UN GLISSE QUI FINIT DESSUS.
 *
 * Selectionner du texte dans le panneau et relacher la souris sur le
 * fond produit un `click` dont la cible EST le fond. Fermer la fenetre
 * a ce moment-la efface la saisie de quelqu un qui voulait juste
 * copier une ligne. Le geste doit donc PARTIR du fond et y FINIR. */
export function fermeAuFond(departSurLeFond: boolean, relacheSurLeFond: boolean): boolean {
  return departSurLeFond && relacheSurLeFond;
}
