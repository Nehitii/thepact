/**
 * L ORDRE DES VALEURS, QU ON PEUT ENFIN CHANGER.
 *
 * Le rang des valeurs est ecrit en base — « user_values.rank » — et il
 * DESSINE LA CORDE DU SCEAU : deux porteurs qui ont choisi les memes
 * valeurs dans un ordre different n ont pas le meme sceau, et ce sceau
 * les suit a vie.
 *
 * Or ce rang valait simplement l ordre des clics. Le porteur ne le
 * voyait nulle part et ne pouvait pas le changer : une donnee
 * permanente produite par un effet de bord.
 *
 * Ces deux fonctions sont PURES et vivent dans « logique » parce que
 * c est du sens, pas du rendu : « monter la troisieme valeur » doit se
 * relire et se tester sans monter d ecran.
 */

/**
 * Deplace la valeur au rang `depuis` vers le rang `vers`.
 *
 * Rend le MEME tableau — pas une copie — quand rien ne bouge : un
 * deplacement hors des bornes ou sur place n est pas un changement, et
 * React ne doit pas rendre a nouveau pour rien.
 */
export function deplacerValeur(valeurs: readonly string[], depuis: number, vers: number): string[] | readonly string[] {
  if (depuis === vers) return valeurs;
  if (depuis < 0 || depuis >= valeurs.length) return valeurs;
  if (vers < 0 || vers >= valeurs.length) return valeurs;
  const suite = [...valeurs];
  const [prise] = suite.splice(depuis, 1);
  suite.splice(vers, 0, prise);
  return suite;
}

/** Peut-on encore la monter ? La premiere est deja en tete. */
export const peutMonter = (rang: number): boolean => rang > 0;

/** Peut-on encore la descendre ? La derniere est deja au bout. */
export const peutDescendre = (rang: number, total: number): boolean => rang < total - 1;
