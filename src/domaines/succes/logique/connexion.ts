/* CE QU UNE CONNEXION AJOUTE AUX COMPTEURS.
 *
 * Trois series se tiennent ici : les jours consecutifs, les connexions
 * a la meme heure, et celles de minuit. Elles etaient au milieu d une
 * fonction qui lit une table et en ecrit une ; rien ne pouvait les
 * interroger, et ce sont des compteurs qui ne se remettent jamais a
 * zero tout seuls — une erreur s y accumule au lieu de se voir.
 *
 * ═══ DEUX HORLOGES, ET ELLES NE SONT PAS D ACCORD ═══
 *
 * LE JOUR EST COMPTE EN UTC — `toISOString()` — et L HEURE EN LOCAL —
 * `getHours()`. C est le code d origine, garde tel quel ici ; ce module
 * le rend seulement visible.
 *
 * En France, entre minuit et deux heures du matin, le jour UTC est donc
 * ENCORE CELUI DE LA VEILLE. Trois consequences, chacune epinglee par
 * un test :
 *
 *   LA SERIE DE JOURS bascule a 2 h du matin l ete (1 h l hiver), pas a
 *   minuit. Se connecter a 1 h puis a 23 h le meme jour civil compte
 *   pour DEUX jours ; ne se connecter qu a 1 h deux nuits de suite en
 *   compte pour deux aussi, ce qui est juste. Le decalage se voit au
 *   bord, pas au milieu.
 *
 *   LE SUCCES DE MINUIT est presque ingagnable. Il demande une
 *   connexion entre 0 h 00 et 0 h 05 LOCALES — donc 22 h 00 a 22 h 05
 *   UTC de la VEILLE. Or la fonction sort avant tout si le jour UTC a
 *   deja ete vu. Il faut donc n avoir pas ouvert l application de toute
 *   la journee precedente, sept fois, pour decrocher le succes.
 *
 *   L HEURE HABITUELLE ne souffre pas du decalage : elle ne compare que
 *   des heures locales entre elles.
 */

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

/** Le jour tel que la colonne le stocke : en UTC, pas en local. */
export const jourEnregistre = (quand: Date): string => quand.toISOString().split("T")[0];

/** Le jour tel que la personne le vit. Rien ne l emploie encore. */
export const jourVecu = (quand: Date): string =>
  [quand.getFullYear(), quand.getMonth() + 1, quand.getDate()]
    .map((n, i) => String(n).padStart(i === 0 ? 4 : 2, "0"))
    .join("-");

/** Le premier quart d heure d une heure ronde. */
export const DANS_LE_QUART = 15;
/** Les cinq premieres minutes du jour. */
export const FENETRE_DE_MINUIT = 5;

const compte = (v: number | null | undefined): number => v ?? 0;

/**
 * Ce qu une connexion ajoute — ou `null` s il n y a rien a ecrire.
 *
 * `null` veut dire « ce jour-la est deja compte » : la fonction ne
 * s execute qu une fois par jour UTC, et c est ce qui empeche une
 * ouverture d onglet de gonfler les series.
 */
export function miseAJourDeConnexion(
  maintenant: Date,
  suivi: SuiviDeConnexion,
): MiseAJourDeConnexion | null {
  const aujourdHui = jourEnregistre(maintenant);
  if (suivi.last_login_date === aujourdHui) return null;

  /* LA VEILLE SE CALCULE EN JOUR LOCAL PUIS S ECRIT EN UTC. Reculer
     d un jour civil deplace l instant de 24 heures — sauf au passage a
     l heure d ete, ou il n en deplace que 23. */
  const veille = new Date(maintenant);
  veille.setDate(veille.getDate() - 1);

  const heure = maintenant.getHours();
  const minute = maintenant.getMinutes();

  const maj: MiseAJourDeConnexion = {
    consecutive_login_days:
      suivi.last_login_date === jourEnregistre(veille)
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
