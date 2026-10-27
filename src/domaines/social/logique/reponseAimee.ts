/* AIMER UN COMMENTAIRE.
 *
 * On pouvait reagir a une publication et a une video, pas a une
 * reponse. Le geste n est pas le meme pour autant : une publication
 * raconte quelque chose et recoit trois reactions — soutien, respect,
 * inspire ; un commentaire n appelle qu un acquiescement.
 *
 * UN SEUL GESTE, TENU EN BASE. La contrainte
 * « chk_reponse_aimee_seulement » refuse tout autre type sur une
 * reponse : une regle que seule l interface applique tombe des qu on
 * ecrit ailleurs.
 *
 * Ce module ne tient que la retouche du cache — ce qu on affiche
 * AVANT que le serveur reponde, et ce qu on restaure s il refuse. Un
 * compteur optimiste se trompe sans bruit : il descend sous zero, il
 * double au second clic, ou il corrige la liste partagee sur place et
 * il ne reste plus rien a remettre en cas d echec.
 */

/** Ce qu il faut d une reponse pour la compter. */
export interface ReponseAimable {
  id: string;
  likes_count?: number | null;
  /** L utilisateur courant l a-t-il aimee ? */
  aimee_par_moi?: boolean | null;
}

/**
 * La liste apres le geste.
 *
 * Rendre une NOUVELLE liste : le cache de React Query est partage, et
 * le corriger sur place ferait mentir toute vue qui le lit deja — et
 * le retour arriere n aurait plus rien a restaurer.
 *
 * LE COMPTE NE DESCEND PAS SOUS ZERO. Un cache un peu vieux, deux
 * onglets ouverts, et le retrait s applique a un compteur deja a
 * zero : « -1 j aime » est un chiffre que personne ne devrait voir.
 */
export function apresLeGeste<T extends ReponseAimable>(
  reponses: readonly T[], replyId: string, aimee: boolean,
): T[] {
  return reponses.map((r) => {
    if (r.id !== replyId) return r;
    const compte = r.likes_count ?? 0;
    return { ...r, aimee_par_moi: aimee, likes_count: Math.max(0, compte + (aimee ? 1 : -1)) };
  });
}

/**
 * Le geste que le clic demande : poser, ou retirer.
 *
 * Un seul bouton porte les deux, et c est l etat courant qui decide.
 * L ecrire ici evite que le composant et la mutation en aient chacun
 * leur idee.
 */
export const gesteAttendu = (r: ReponseAimable): boolean => !(r.aimee_par_moi ?? false);

/**
 * Le compte a montrer a cote du bouton, ou `null` quand il n y a rien
 * a dire.
 *
 * Un « 0 » a cote de chaque commentaire est du bruit : il occupe la
 * place, il se lit comme une note, et il ne rapporte rien. Le premier
 * qui aime fait paraitre le chiffre.
 */
export const compteAMontrer = (r: ReponseAimable): number | null => {
  const n = r.likes_count ?? 0;
  return n > 0 ? n : null;
};
