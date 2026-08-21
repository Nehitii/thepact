/**
 * L IDENTITE VISUELLE D UN CREANCIER, SANS LOGO.
 *
 * Amazon Prime a une image. Copropriete Citya, Pichet et les impots
 * fonciers n en auront jamais — il n existe pas de logo a telecharger
 * pour un syndic. Ce qui remplit la case vide n est donc pas un
 * detail : c est ce qui decide si le panneau tient debout.
 *
 * A defaut d image on dessine une plaque : les initiales sur la
 * couleur de la categorie. Deux fonctions suffisent a la produire, et
 * elles vivent ici plutot que dans le composant — pour qu on puisse
 * les eprouver sans monter de React.
 */
import { getExpenseCategory } from '@/lib/financeCategories';

/**
 * Les mots-outils, ecartes des initiales.
 *
 * Sans eux, « Assurance de la maison » donnerait ADM la ou l oeil
 * attend AM.
 */
const OUTILS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'a', 'au', 'aux', 'of', 'the', '&', '-']);

/**
 * Les initiales : une par mot, deux au plus.
 *
 * Un nom d un seul mot rend ses deux premieres lettres — « Amazon »
 * donne AM et non un A solitaire, qui ferait plus vide que dense.
 */
export function initialesDe(nom: string): string {
  const mots = nom
    .normalize('NFD')
    /* Les diacritiques combinants, U+0300 a U+036F : « Électricité »
       doit donner EL et non un E accentue mal centre. */
    .replace(/[̀-ͯ]/g, '')
    .split(/[\s'’_/-]+/)
    .map((m) => m.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((m) => m.length > 0 && !OUTILS.has(m.toLowerCase()));

  if (mots.length === 0) return '??';
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

/** La couleur de la plaque : celle de la categorie de la charge. */
export function couleurDe(categorie?: string | null): string {
  return getExpenseCategory(categorie).hexColor;
}
