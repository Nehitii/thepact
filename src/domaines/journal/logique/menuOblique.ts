/* LE MENU DE LA BARRE OBLIQUE.
 *
 * Taper « / » dans l editeur ouvre une liste de commandes. Trois
 * choses s y decident sans qu on les relise : ou le menu se pose pour
 * ne pas sortir de l ecran, quel element est surligne quand la liste
 * retrecit sous le curseur, et comment les fleches bouclent.
 */

/* ═══════════════════════════════════════════════════════════════
   CES DEUX NOMBRES SONT ECRITS DEUX FOIS — ICI ET DANS LE CSS.

   `journal.css` declare `.jr-slash { width: 260px; max-height:
   264px }`. Le placement ci-dessous les SUPPOSE pour savoir si le
   menu tient a droite et en bas. Elargir le menu dans la feuille de
   style sans toucher a ce fichier le ferait deborder de l ecran, et
   rien ne le dirait : la boite serait simplement rognee.

   Ils sont nommes ici pour que le lien cesse d etre invisible.
   ═══════════════════════════════════════════════════════════════ */
export const LARGEUR_MENU = 260;
export const HAUTEUR_MENU = 264;

/** Ce qu on laisse entre le menu et le bord de l ecran. */
export const MARGE_ECRAN = 8;
/** Ce qu on laisse entre le curseur et le menu. */
export const ECART_CURSEUR = 6;

/* LE MENU S OUVRE VERS LE HAUT QUAND IL NE TIENT PAS EN BAS. On
   compare le BAS du curseur, pas son haut : c est de la que le menu
   descendrait. */
export function versLeHaut(basDuCurseur: number, hauteurFenetre: number): boolean {
  return basDuCurseur + HAUTEUR_MENU > hauteurFenetre;
}

export interface Ancrage {
  x: number;
  y: number;
  versLeHaut: boolean;
}

export interface PlacementDuMenu {
  left: number;
  top: number | undefined;
  bottom: number | undefined;
}

/* LE PLACEMENT HORIZONTAL EST BORNE AUX DEUX BOUTS, et l ordre des
   deux bornes compte : `Math.max(MARGE, Math.min(x, largeur - 268))`
   ecrete d abord a droite puis a gauche. Sur un ecran plus etroit que
   le menu, la borne gauche l emporte — le menu depasse a droite
   plutot qu a gauche, ce qui laisse au moins son debut lisible. */
export function placementDuMenu(
  ancrage: Ancrage,
  fenetre: { largeur: number; hauteur: number },
): PlacementDuMenu {
  const left = Math.max(
    MARGE_ECRAN,
    Math.min(ancrage.x, fenetre.largeur - LARGEUR_MENU - MARGE_ECRAN),
  );
  return ancrage.versLeHaut
    ? { left, top: undefined, bottom: fenetre.hauteur - ancrage.y + ECART_CURSEUR }
    : { left, top: ancrage.y + ECART_CURSEUR, bottom: undefined };
}

/* ── QUEL ELEMENT EST SURLIGNE ───────────────────────────────── */

/* LA LISTE RETRECIT PENDANT QU ON TAPE. Le curseur peut donc pointer
   au-dela de la fin : on le ramene au dernier element. Une liste vide
   ramene a zero plutot qu a moins un, qui ne designerait rien. */
export function indexBorne(voulu: number, nombre: number): number {
  return nombre ? Math.min(voulu, nombre - 1) : 0;
}

/* LES FLECHES BOUCLENT AUX DEUX BOUTS.
 *
 * Le « + n » avant le modulo n est pas decoratif : en JavaScript,
 * (-1) % 5 vaut MOINS UN, pas quatre. Sans lui, remonter depuis le
 * premier element ne surlignerait plus rien du tout.
 *
 * Le `Math.min` d abord, parce que l index d ou l on part peut deja
 * etre perime : la liste a pu retrecir depuis le dernier deplacement.
 */
export function indexSuivant(depuis: number, pas: number, nombre: number): number {
  if (!nombre) return 0;
  return (Math.min(depuis, nombre - 1) + pas + nombre) % nombre;
}

/* ── CE QUE LA REQUETE FILTRE ────────────────────────────────── */

/* LA REQUETE NE PREND QUE DES LETTRES ET DES CHIFFRES, ce qui exclut
   l espace : taper « / puis un mot puis une espace » referme le menu
   au lieu de chercher une commande a deux mots. Le drapeau « u » et
   les classes \p{L} \p{N} le rendent vrai pour les accents comme pour
   les alphabets non latins. */
export const REQUETE_OBLIQUE = /^\/([\p{L}\p{N}]*)$/u;

export function requeteOblique(texteAvantLeCurseur: string): { requete: string; longueur: number } | null {
  const trouve = REQUETE_OBLIQUE.exec(texteAvantLeCurseur);
  if (!trouve) return null;
  return { requete: trouve[1], longueur: trouve[0].length };
}

/* ON CHERCHE DANS LE LIBELLE TRADUIT *ET* DANS LES MOTS-CLES : «
   titre » trouve la commande dont le libelle est « Titre », et « h1 »
   la trouve aussi par sa cle. Sans mots-cles, il faudrait connaitre
   la langue de l interface pour s en servir. */
export function commandesFiltrees<T extends { id: string; cles: string }>(
  commandes: T[],
  requete: string,
  libelleDe: (c: T) => string,
): T[] {
  const q = requete.toLowerCase();
  if (!q) return commandes;
  return commandes.filter((c) => `${libelleDe(c)} ${c.cles}`.toLowerCase().includes(q));
}
