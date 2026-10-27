/* CE QU UNE CONNEXION AJOUTE AUX COMPTEURS.
 *
 * Trois series se tiennent ici : les jours consecutifs, les connexions
 * a la meme heure, et celles de minuit. Elles etaient au milieu d une
 * fonction qui lit une table et en ecrit une ; rien ne pouvait les
 * interroger, et ce sont des compteurs qui ne se remettent jamais a
 * zero tout seuls — une erreur s y accumule au lieu de se voir.
 *
 * ═══ UNE SEULE HORLOGE, ET C EST CELLE QU ON VIT ═══
 *
 * LE JOUR SE COMPTAIT EN UTC — `toISOString()` — quand l heure, elle,
 * se compte en LOCAL — `getHours()`. Deux horloges pour une meme
 * decision : en France, entre minuit et deux heures du matin l ete
 * (une l hiver), le jour UTC etait encore celui de la VEILLE.
 *
 * CE QUE CA COUTAIT :
 *
 *   LE SUCCES DE MINUIT ETAIT PRESQUE INGAGNABLE. Il demande une
 *   connexion entre 0 h 00 et 0 h 05 locales — soit 22 h 00 a 22 h 05
 *   UTC de la veille. Or la fonction sort avant tout si la journee a
 *   deja ete comptee : il fallait n avoir pas ouvert l application de
 *   toute la journee precedente, sept fois de suite. MESURE DU
 *   31/08/2026 : le compteur valait zero.
 *
 *   LA SERIE DE JOURS basculait a 2 h du matin, pas a minuit. Se
 *   connecter a 1 h puis a 23 h le meme jour CIVIL comptait pour deux
 *   jours de serie, alors qu on n en avait vecu qu un.
 *
 * Le jour est desormais le jour LOCAL, comme les heures. Le passage est
 * sans heurt : une journee enregistree en UTC vaut le jour local pour
 * toute connexion posterieure a l heure du decalage — c est-a-dire pour
 * la quasi-totalite d entre elles — et une connexion nocturne
 * enregistree la veille est justement lue comme la veille.
 */

import { jourLocal } from "@/socle/outils/jour";

/** La ligne de suivi, reduite a ce qu une connexion regarde. */
export interface SuiviDeConnexion {
  last_login_date?: string | null;
  consecutive_login_days?: number | null;
  logins_at_same_hour_streak?: number | null;
  usual_login_hour?: number | null;
  midnight_logins_count?: number | null;
}

/** Ce qu il faut ecrire. Les champs absents ne sont pas touches. */
export interface MiseAJourDeConnexion {
  consecutive_login_days: number;
  last_login_date: string;
  logins_at_same_hour_streak: number;
  usual_login_hour?: number;
  midnight_logins_count?: number;
}

/* Le jour tel que la personne le vit vient du socle : deux domaines
   en portaient chacun leur version, a l identique. Le nom local reste,
   les appelants ne bougent pas. */
export const jourVecu: (quand: Date) => string = jourLocal;

/** Le jour UTC, celui qu on comptait avant. Garde pour le mesurer. */
export const jourUTC = (quand: Date): string => quand.toISOString().split("T")[0];

/** Le premier quart d heure d une heure ronde. */
export const DANS_LE_QUART = 15;
/** Les cinq premieres minutes du jour. */
export const FENETRE_DE_MINUIT = 5;

const compte = (v: number | null | undefined): number => v ?? 0;

/**
 * Ce qu une connexion ajoute — ou `null` s il n y a rien a ecrire.
 *
 * `null` veut dire « ce jour-la est deja compte » : la fonction ne
 * s execute qu une fois par jour civil, et c est ce qui empeche une
 * ouverture d onglet de gonfler les series.
 */
export function miseAJourDeConnexion(
  maintenant: Date,
  suivi: SuiviDeConnexion,
): MiseAJourDeConnexion | null {
  const aujourdHui = jourVecu(maintenant);
  if (suivi.last_login_date === aujourdHui) return null;

  /* LA VEILLE EST LE JOUR CIVIL PRECEDENT. Reculer d un jour deplace
     l instant de 24 heures — 23 au passage a l heure d ete — mais la
     date locale, elle, recule bien d exactement un jour. */
  const veille = new Date(maintenant);
  veille.setDate(veille.getDate() - 1);

  const heure = maintenant.getHours();
  const minute = maintenant.getMinutes();

  const maj: MiseAJourDeConnexion = {
    consecutive_login_days:
      suivi.last_login_date === jourVecu(veille)
        ? compte(suivi.consecutive_login_days) + 1
        : 1,
    last_login_date: aujourdHui,
    logins_at_same_hour_streak: 1,
  };

  /* ═══ « LA MEME HEURE » VEUT DIRE LA MEME HEURE RONDE, ET SON PREMIER
     QUART ═══
     L ecart est pris en valeur absolue puis compare a zero : c est donc
     une EGALITE d heures, pas une tolerance. Et le quart d heure est
     compte depuis l heure ronde, pas depuis l heure habituelle — se
     connecter fidelement a 14 h 20 chaque jour ne construit aucune
     serie. */
  const memeHeure = suivi.usual_login_hour !== null
    && suivi.usual_login_hour !== undefined
    && Math.abs(heure - suivi.usual_login_hour) <= 0
    && minute <= DANS_LE_QUART;

  if (memeHeure) {
    maj.logins_at_same_hour_streak = compte(suivi.logins_at_same_hour_streak) + 1;
  } else {
    maj.usual_login_hour = heure;
  }

  if (heure === 0 && minute <= FENETRE_DE_MINUIT) {
    maj.midnight_logins_count = compte(suivi.midnight_logins_count) + 1;
  }

  return maj;
}
