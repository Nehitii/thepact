/* NE PAS VOLER LES TOUCHES DE QUELQU UN QUI ECRIT.
 *
 * Tout raccourci global pose la meme question avant d agir : est-ce que
 * la personne est en train de taper quelque part ? QUATRE ENDROITS Y
 * REPONDAIENT, ET AUCUN NE REPONDAIT PAREIL :
 *
 *   AppLayout — INPUT, TEXTAREA, `isContentEditable`. Pas SELECT :
 *     « ? » ouvre donc l aide des raccourcis alors qu une liste
 *     deroulante native a le focus, ou les lettres servent a chercher
 *     une option.
 *
 *   Focus — INPUT, TEXTAREA, SELECT. Pas `isContentEditable`.
 *
 *   VictoryReelsFeed — INPUT, TEXTAREA, SELECT. Pas `isContentEditable`
 *     non plus.
 *
 *   useVoisinsDObjectif — les quatre. C est la seule reponse complete,
 *     et c est elle qui est reprise ici.
 *
 * `isContentEditable` N EST PAS THEORIQUE : l editeur du journal est un
 * TipTap, donc un `div` editable. Un raccourci qui l ignore vole les
 * touches a quelqu un qui redige une entree.
 *
 * ET CE N EST PAS `getAttribute` : `isContentEditable` est vrai aussi
 * pour un enfant d un bloc editable — le curseur est rarement sur le
 * `div` porteur de l attribut, il est dans le paragraphe qui est
 * dedans.
 */

const BALISES_DE_SAISIE = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** Vrai si la cible d un evenement clavier est un endroit ou l on ecrit. */
export function saisieEnCours(cible: EventTarget | null): boolean {
  const el = cible as HTMLElement | null;
  /* Le seul cas qui LEVE est l absence : `null.tagName`. Une cible
     qui n est pas un element — le document, la fenetre — n a pas de
     `tagName`, et un ensemble ne contient pas `undefined` : la garde
     qui verifiait le type ne changeait aucune reponse, un balayage de
     mutations l a montre. */
  if (!el) return false;
  return BALISES_DE_SAISIE.has(el.tagName) || el.isContentEditable === true;
}
