/* CHOISIR UNE LISTE AU CLAVIER.
 *
 * Un glissement au clavier ne peut pas imiter la souris. « pointerWithin »
 * n a pas de pointeur a interroger et ne trouve donc JAMAIS de cible :
 * le premier cablage laissait saisir l article, appuyer sur les
 * fleches, et rien ne s allumait — un geste qui a l air de marcher et
 * ne mene nulle part.
 *
 * Deplacer un rectangle de vingt-cinq pixels par appui ne vaut pas
 * mieux : les onglets sont en haut de la page, il faudrait trente
 * appuis pour les atteindre, et davantage si la page a defile.
 *
 * ON NE DEPLACE DONC PAS UN POINT, ON CHANGE DE CIBLE. Une fleche
 * passe a la liste suivante, une autre a la precedente. C est le seul
 * geste au clavier qui corresponde a ce que le glissement fait
 * vraiment : choisir une destination parmi quelques-unes.
 */

/** Ce qu il faut savoir d une cible pour l atteindre. */
export interface CibleAtteignable {
  id: string;
  /** Son centre a l ecran. */
  x: number;
  y: number;
}

/** Les touches qui font changer de cible, et leur sens. */
const SENS: Record<string, number> = {
  ArrowRight: 1, ArrowDown: 1,
  ArrowLeft: -1, ArrowUp: -1,
};

export const changeDeCible = (touche: string): boolean => touche in SENS;

/**
 * L index de la cible la plus proche d un point.
 *
 * Sert au PREMIER appui : on ne sait pas encore ou l on pointe, et
 * partir de la cible la plus proche de l article saisi est ce qui
 * demande le moins d appuis pour arriver a celle qu on veut.
 */
export function laPlusProche(cibles: readonly CibleAtteignable[], x: number, y: number): number {
  let meilleur = -1;
  let distance = Infinity;
  cibles.forEach((c, i) => {
    const d = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (d < distance) { distance = d; meilleur = i; }
  });
  return meilleur;
}

/**
 * La cible suivante, dans le sens demande.
 *
 * ELLE NE BOUCLE PAS. Repartir du debut apres la derniere ferait
 * traverser toute la rangee sans qu on s en apercoive : on croit
 * avancer d un cran et l on se retrouve a l autre bout, sur une
 * destination qu on n a pas choisie. On s arrete au bord, comme une
 * liste de fichiers.
 */
export function prochaineCible(
  cibles: readonly CibleAtteignable[], depuis: number, touche: string,
): number {
  if (!cibles.length || !changeDeCible(touche)) return depuis;
  if (depuis < 0) return touche in SENS && SENS[touche] > 0 ? 0 : cibles.length - 1;
  const suivant = depuis + SENS[touche];
  if (suivant < 0 || suivant >= cibles.length) return depuis;
  return suivant;
}
