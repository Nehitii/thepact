/* LIRE UN NOMBRE QUI N EN EST PEUT-ETRE PAS UN.
 *
 * Les mesures d un cadre d avatar — echelle, decalage horizontal,
 * decalage vertical — arrivent tantot en nombre, tantot en TEXTE
 * (« 1.15 »), selon la requete qui les a lues. Trois surfaces les
 * affichent, et chacune avait sa facon de les convertir :
 *
 *   la carte publique   nombre(v, defaut)
 *   les cadres sociaux  la MEME fonction, recopiee mot pour mot
 *   la barre laterale   Number(v) || defaut
 *
 * Les deux premieres s accordent. La troisieme diverge sur UNE valeur,
 * et c est celle qui compte : `Number(0) || 1` rend 1, quand les autres
 * rendent 0. Une echelle de zero — un cadre qu on veut invisible —
 * revenait donc a taille normale dans la barre laterale, et nulle part
 * ailleurs.
 *
 * Une seule fonction desormais, et elle vit dans le socle parce que
 * trois domaines la lisent.
 */

/* `parseFloat` PLUTOT QUE `Number`, ET LA DIFFERENCE EST VOULUE :
 * `Number("1.15px")` rend NaN, `parseFloat("1.15px")` rend 1.15. Ce qui
 * vient de la base peut porter une unite ; ce qu on veut, c est le
 * nombre qui commence la chaine.
 *
 * `Number.isFinite` PLUTOT QU UN TEST DE VERITE : il garde le zero et
 * refuse NaN comme les infinis. C est tout l ecart avec le `||` que
 * cette fonction remplace. */
export function nombre(v: number | string | null | undefined, defaut: number): number {
  const n = typeof v === "number" ? v : parseFloat(v ?? "");
  return Number.isFinite(n) ? n : defaut;
}
