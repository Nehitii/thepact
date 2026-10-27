/* CE QUI SE TIENT ENTRE UN CLIC ET L IRREVERSIBLE.
 *
 * Deux gestes de cette page ne se defont pas : remettre le pacte a zero,
 * et supprimer le compte. Ce qui les separe d un clic distrait est une
 * chaine a recopier — et une comparaison.
 *
 * UNE COMPARAISON QUI PASSE TOUJOURS NE SE VOIT PAS. Le bouton s active,
 * l ecran ne dit rien d anormal, et le garde-fou a disparu. C est le
 * seul endroit de l application ou le defaut silencieux coute tout.
 */

/** Le mot a recopier pour remettre le pacte a zero. */
export const MOT_REINIT = "REINITIALISER";

/** Le mot a recopier pour supprimer le compte. */
export const MOT_SUPPRESSION = "SUPPRIMER";

/* LA RECOPIE EST EXACTE, ET ELLE DOIT L ETRE.
 *
 * Ni espaces rognes, ni casse ignoree : le geste demande est de TAPER
 * le mot, pas de le reconnaitre. Accepter « reinitialiser » ou
 * « REINITIALISER  » rendrait le garde-fou franchissable par
 * inattention — ce qui revient a ne pas en avoir.
 */
export const recopieExacte = (saisie: string, attendu: string): boolean => saisie === attendu;

/** Le geste peut-il partir ? Jamais pendant qu il est deja en cours. */
export const peutProceder = (saisie: string, attendu: string, enCours: boolean): boolean =>
  recopieExacte(saisie, attendu) && !enCours;
