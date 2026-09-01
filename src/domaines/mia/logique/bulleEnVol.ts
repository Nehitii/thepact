import type { MessageMia } from "@/domaines/mia/types";

/* LA QUESTION QUI VOLE, ENTRE LA FRAPPE ET LA LIGNE.
 *
 * ═══ CE QUI MANQUAIT ═══
 *
 * On tapait, on validait, le champ se vidait — et il ne se passait plus
 * rien a l ecran jusqu a ce que M.I.A. commence a repondre.
 *
 * Sur le chemin du modele, la question de l utilisateur est ecrite COTE
 * SERVEUR par la fonction distante ; le client n invalide son cache
 * qu apres la reponse. Entre les deux, le message n existe NULLE PART :
 * ni en base, ni dans le cache, ni a l ecran.
 *
 * Le cas sans fil etait pire encore. Le texte partait dans une
 * reference pendant qu on creait la conversation, et n en ressortait
 * qu au tour suivant.
 *
 * Les couches gratuites, elles, faisaient deja la bonne chose : elles
 * posent une ligne provisoire dans le cache AVANT d ecrire en base.
 * C est ce comportement qu on generalise — mais dans l etat du
 * composant, pas dans le cache, parce que le cache est indexe par le
 * fil et que le fil n existe pas encore au premier message.
 *
 * ═══ CE QUE CE MODULE DECIDE ═══
 *
 * Une seule chose, et c est la seule qui soit delicate : QUAND la bulle
 * doit s effacer. Trop tot, la question disparait avant de revenir ;
 * trop tard, elle s affiche en double a cote de la vraie.
 */

/** Ce qu on retient d une question en vol. */
export interface BulleEnVol {
  texte: string;
  /**
   * Combien d exemplaires de ce texte etaient DEJA au fil au moment de
   * l envoi.
   *
   * Sans ce compte, renvoyer deux fois la meme phrase effacerait la
   * seconde bulle sur la vue de la premiere : le test « une question de
   * ce texte existe » serait vrai avant meme que la seconde parte.
   */
  dejaLa: number;
}

/** Combien de questions de ce texte le fil porte deja. */
export function combienDeFois(messages: MessageMia[] | undefined, texte: string): number {
  return (messages ?? []).filter((m) => m.role === "user" && m.content === texte).length;
}

/** Ce qu on retient au moment ou la question part. */
export function prendreLeVol(messages: MessageMia[] | undefined, texte: string): BulleEnVol {
  return { texte, dejaLa: combienDeFois(messages, texte) };
}

/**
 * La bulle a-t-elle atterri ?
 *
 * LES QUATRE CHEMINS FINISSENT TOUS PAR POSER UNE QUESTION AU FIL, et
 * c est ce qui permet un test unique :
 *
 *   le REFLEXE et le GESTE l ecrivent dans le cache avant la base ;
 *   le MODELE la fait paraitre par l invalidation qui suit sa reponse ;
 *   l ECHEC la rattrape par l excuse, qui la pose si le serveur ne
 *     l avait pas deja ecrite ;
 *   le PREMIER MESSAGE SANS FIL passe par l un des trois, une fois la
 *     conversation creee — et la liste des messages est alors celle du
 *     fil neuf, ou le compte de depart valait zero.
 */
export function aAtterri(messages: MessageMia[] | undefined, enVol: BulleEnVol | null): boolean {
  if (!enVol) return false;
  return combienDeFois(messages, enVol.texte) > enVol.dejaLa;
}
