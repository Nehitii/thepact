/* LES DEUX REGLAGES QUE L ATELIER RETIENT.
 *
 * Le correcteur d orthographe et le rail lateral survivent d une
 * ouverture a l autre. Ce sont deux booleens, ranges en « 1 » ou « 0 »,
 * et leurs defauts ne se decident pas de la meme facon : l un est un
 * choix, l autre depend de la largeur de l ecran.
 */

/* CE QUI N EST PAS « 1 » EST FAUX, ET SEULE L ABSENCE VAUT LE DEFAUT.
 *
 * La distinction compte : un reglage jamais touche prend le defaut,
 * un reglage volontairement ferme reste ferme. Confondre les deux —
 * en traitant toute valeur illisible comme une absence — ferait
 * reapparaitre un rail qu on avait ferme, apres un stockage abime. */
export function drapeauLu(brut: string | null, defaut: boolean): boolean {
  return brut === null ? defaut : brut === "1";
}

export function drapeauEcrit(valeur: boolean): string {
  return valeur ? "1" : "0";
}

/* ═══════════════════════════════════════════════════════════════
   ONZE CENTS PIXELS, ET LE MEME NOMBRE VIT DANS LA FEUILLE DE STYLE.

   `journal.css` porte `@media (max-width: 1100px)` : sous cette
   largeur, le rail cesse d etre une colonne et devient un tiroir pose
   par-dessus le texte. Le defaut d ouverture, lui, etait ecrit ici en
   JavaScript. Deux fois le meme nombre, dans deux langages, et rien
   qui les tienne ensemble.

   ILS SE CHEVAUCHENT D UN PIXEL. La requete media prend 1100 INCLUS —
   `max-width: 1100px` est vraie a 1100 — quand la condition
   d ouverture prend 1100 inclus elle aussi. A cette largeur exacte, le
   rail s ouvre donc PAR DEFAUT et s affiche EN TIROIR, par-dessus le
   texte, au lieu de la colonne qu il serait un pixel plus loin.

   CONSTATE, NON CORRIGE : accorder les deux — en lisant la requete
   media plutot qu en comparant un nombre — changerait ce que voit
   quelqu un dont la fenetre fait exactement 1100 pixels.
   ═══════════════════════════════════════════════════════════════ */
export const RUPTURE_DU_RAIL = 1100;

export function railParDefaut(largeur: number): boolean {
  return largeur >= RUPTURE_DU_RAIL;
}

/** La requete media que la feuille de style applique a la meme largeur. */
export const REQUETE_DU_TIROIR = `(max-width: ${RUPTURE_DU_RAIL}px)`;
