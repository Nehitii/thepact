/* L INSCRIPTION D UN APPAREIL : LE SECRET, ET CE QU ON EN ANNONCE.
 *
 * Poser un second facteur, c est tirer un secret et le remettre a une
 * application d authentification sous la forme d une adresse
 * `otpauth://`. Cette adresse ANNONCE quatre parametres — algorithme,
 * nombre de chiffres, periode, emetteur — et le serveur, lui, en
 * IMPLEMENTE quatre. Rien ne les tenait ensemble : ils etaient ecrits
 * en clair d un cote, et nommes de l autre.
 *
 * UN DESACCORD NE SE VOIT PAS. L application generera des codes que le
 * serveur refusera, pour les inscriptions NEUVES seulement — celles
 * deja posees continueront de marcher. Le defaut n apparaitrait donc
 * qu a la personne suivante, longtemps apres le changement.
 */
import { CHIFFRES_DU_CODE, PAS_TOTP } from "./totp.ts";

/* VINGT OCTETS, SOIT CENT SOIXANTE BITS. C est la longueur de cle que
   la RFC 4226 recommande pour HMAC-SHA1 — la taille du bloc de sortie
   de la fonction de hachage. Plus court affaiblit, plus long est
   replie par HMAC et n ajoute rien. */
export const OCTETS_DU_SECRET = 20;

/* L ALGORITHME ANNONCE DOIT ETRE CELUI QUE `hotp` CALCULE : la cle y
   est importee avec `{ name: "HMAC", hash: "SHA-1" }`. Si cette
   ligne-la changeait, celle-ci devrait suivre — le test les compare. */
export const ALGORITHME = "SHA1";

/** Le nom qui s affiche dans l application d authentification. */
export const EMETTEUR = "Pacte";

/* LE COMPTE EST L ADRESSE, SINON L IDENTIFIANT. Une personne sans
   adresse verifiee verra donc un UUID dans son application : c est
   laid, mais c est unique, et une etiquette vide rendrait les comptes
   indistinguables. */
export function libelleDuCompte(courriel: string | null | undefined, identifiant: string): string {
  return courriel ?? identifiant;
}

/* ═══════════════════════════════════════════════════════════════
   L ETIQUETTE ENCODE LE DEUX-POINTS, ET C EST VOULU.

   `encodeURIComponent("Pacte:qui@exemple.fr")` rend
   « Pacte%3Aqui%40exemple.fr ». La convention d origine de Google
   Authenticator laisse le deux-points nu et n encode que le reste ;
   les deux formes sont lues par les applications courantes, parce que
   le separateur est cherche APRES decodage.

   L emetteur est en outre repete en parametre `issuer`, ce que la
   convention demande justement pour ne pas dependre de la lecture de
   l etiquette. C est cette repetition qui rend l encodage du
   deux-points sans consequence — et c est pour cela qu on la garde.
   ═══════════════════════════════════════════════════════════════ */
export function uriDInscription(secret: string, compte: string): string {
  const etiquette = encodeURIComponent(`${EMETTEUR}:${compte}`);
  return `otpauth://totp/${etiquette}?secret=${secret}` +
    `&issuer=${encodeURIComponent(EMETTEUR)}` +
    `&algorithm=${ALGORITHME}` +
    `&digits=${CHIFFRES_DU_CODE}` +
    `&period=${PAS_TOTP}`;
}
