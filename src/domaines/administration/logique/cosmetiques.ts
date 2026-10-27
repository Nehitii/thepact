/* CE QUE LA CONSOLE DES COSMETIQUES DECIDE.
 *
 * Trois prix par defaut, une rarete par defaut, un pas de reglage et
 * une recherche. Chacun etait ecrit plusieurs fois — le prix d un
 * cadre, par exemple, apparaissait dans le champ ET dans ce qui part
 * en base, sans que l un sache que l autre existe.
 */

/* LES TROIS PRIX PAR DEFAUT.
 *
 * Ils etaient poses en clair DEUX FOIS chacun : une fois comme valeur
 * affichee dans le champ, une fois comme repli de ce qui est
 * enregistre. Les deux pouvaient donc diverger — le champ montrant
 * 450 pendant qu on enregistre autre chose. */
export const PRIX_PAR_DEFAUT = {
  cadre: 450,
  banniere: 650,
  titre: 450,
} as const;

/** La rarete d un cosmetique qui n en declare pas. */
export const RARETE_PAR_DEFAUT = "common";

/* ═══════════════════════════════════════════════════════════════
   VIDER LE CHAMP DE PRIX ECRIT « NaN ».

   Les trois champs de prix lisent `parseInt(e.target.value)` SANS
   aucun repli. Effacer le champ donne donc NaN, qui part tel quel
   dans l etat — et de la en base, ou la colonne est un entier.

   Le piege est que l ECRAN N EN MONTRE RIEN : la valeur affichee est
   `prix || 450`, et NaN est faux. Le champ affiche donc 450 pendant
   que l etat vaut NaN. On croit enregistrer 450 ; on enregistre
   autre chose.

   Cette fonction reproduit le comportement actuel sans le corriger :
   lui donner un repli changerait ce qui est enregistre. Elle existe
   pour que le trou ait un nom et des tests.
   ═══════════════════════════════════════════════════════════════ */
export function prixSaisi(valeur: string): number {
  return parseInt(valeur, 10);
}

/** Ce que le champ AFFICHE — qui n est pas ce que l etat porte. */
export function prixAffiche(prix: number | null | undefined, defaut: number): number {
  return prix || defaut;
}

/* ═══════════════════════════════════════════════════════════════
   LE PAS DE REGLAGE D UN DECALAGE.

   `Math.round(((v ?? 0) + pas) * 10) / 10` etait ecrit QUATRE FOIS —
   moins un et plus un, en abscisse et en ordonnee.

   L ARRONDI AU DIXIEME N EST PAS DECORATIF : le decalage se regle
   aussi a la main, au clavier, ou il peut valoir 3,7. Ajouter un
   sans arrondir donnerait 4,699999999999999 apres quelques pas —
   la virgule flottante s accumule — et le champ afficherait cela.
   ═══════════════════════════════════════════════════════════════ */
export const DECIMALES = 10;

export function decalageAjuste(valeur: number | null | undefined, pas: number): number {
  return Math.round(((valeur ?? 0) + pas) * DECIMALES) / DECIMALES;
}

/* LA RECHERCHE PORTE SUR DEUX COLONNES, parce que les trois sortes de
   cosmetiques ne nomment pas leur nom pareil : un cadre et une
   banniere ont un `name`, un titre a un `title_text`. Chercher dans
   une seule colonne rendrait la recherche muette sur un tiers du
   catalogue. */
export function filtrerLesArticles<T extends { name?: string; title_text?: string }>(
  articles: T[],
  requete: string,
): T[] {
  if (!requete) return articles;
  const q = requete.toLowerCase();
  return articles.filter(
    (a) => a.name?.toLowerCase().includes(q) || a.title_text?.toLowerCase().includes(q),
  );
}
