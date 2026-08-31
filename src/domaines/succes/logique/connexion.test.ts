import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DANS_LE_QUART, FENETRE_DE_MINUIT, jourEnregistre, jourVecu, miseAJourDeConnexion,
} from "./connexion";
import type { SuiviDeConnexion } from "./connexion";

/* ═══ LE FUSEAU EST FIXE, SINON LE TEST NE DIT RIEN ═══
   Tout ce qui suit porte sur l ecart entre une horloge UTC et une
   horloge locale : mesurer cet ecart dans le fuseau de la machine qui
   passe le test reviendrait a le mesurer dans un fuseau inconnu. On
   se place a Paris — le fuseau de la personne qui emploie
   l application — et on le repose en sortant. */
const FUSEAU_AVANT = process.env.TZ;
beforeAll(() => { process.env.TZ = "Europe/Paris"; });
afterAll(() => {
  if (FUSEAU_AVANT === undefined) delete process.env.TZ;
  else process.env.TZ = FUSEAU_AVANT;
});

/** Un instant donne en heure LOCALE de Paris, sans ambiguite. */
const aParis = (iso: string) => new Date(iso);

const suivi = (p: SuiviDeConnexion = {}): SuiviDeConnexion => p;

describe("les deux facons de nommer un jour", () => {
  /* LA COLONNE STOCKE LE JOUR UTC ; la personne, elle, vit le jour
     local. Les deux se separent chaque nuit, entre minuit et l heure du
     decalage — deux heures l ete, une l hiver. */
  it("se separent la nuit, et se rejoignent le jour", () => {
    const nuitDEte = aParis("2026-08-31T00:02:00");
    expect(jourVecu(nuitDEte)).toBe("2026-08-31");
    expect(jourEnregistre(nuitDEte)).toBe("2026-08-30");

    const nuitDHiver = aParis("2026-01-15T00:02:00");
    expect(jourVecu(nuitDHiver)).toBe("2026-01-15");
    expect(jourEnregistre(nuitDHiver)).toBe("2026-01-14");

    const enPleinJour = aParis("2026-08-31T12:00:00");
    expect(jourVecu(enPleinJour)).toBe(jourEnregistre(enPleinJour));
  });

  it("ecrit toujours quatre chiffres puis deux et deux", () => {
    expect(jourVecu(aParis("2026-01-05T12:00:00"))).toBe("2026-01-05");
    expect(jourVecu(aParis("2026-12-31T12:00:00"))).toBe("2026-12-31");
  });
});

describe("une seule fois par jour", () => {
  /* C EST CE QUI EMPECHE UNE OUVERTURE D ONGLET DE GONFLER LES SERIES.
     Rien a ecrire veut dire : ce jour-la est deja compte. */
  it("ne rend rien quand le jour est deja compte", () => {
    const quand = aParis("2026-08-31T12:00:00");
    expect(miseAJourDeConnexion(quand, suivi({ last_login_date: "2026-08-31" }))).toBeNull();
  });

  /* ET C EST LE JOUR UTC QUI COMPTE. A minuit deux, le jour deja
     enregistre est celui de la veille civile : la fonction sort, et
     tout ce qui suit — y compris le succes de minuit — ne se produit
     pas. */
  it("sort a minuit si la journee de la veille a deja ete ouverte", () => {
    const minuit = aParis("2026-08-31T00:02:00");
    expect(miseAJourDeConnexion(minuit, suivi({ last_login_date: "2026-08-30" }))).toBeNull();
  });
});

describe("la serie de jours consecutifs", () => {
  it("monte quand la veille etait comptee", () => {
    const maj = miseAJourDeConnexion(aParis("2026-08-31T12:00:00"),
      suivi({ last_login_date: "2026-08-30", consecutive_login_days: 14 }));
    expect(maj!.consecutive_login_days).toBe(15);
    expect(maj!.last_login_date).toBe("2026-08-31");
  });

  it("repart a un des qu un jour manque", () => {
    for (const dernier of ["2026-08-29", "2026-07-01", null, undefined]) {
      const maj = miseAJourDeConnexion(aParis("2026-08-31T12:00:00"),
        suivi({ last_login_date: dernier, consecutive_login_days: 14 }));
      expect(maj!.consecutive_login_days, String(dernier)).toBe(1);
    }
  });

  it("compte un a la premiere connexion, sans compteur prealable", () => {
    const maj = miseAJourDeConnexion(aParis("2026-08-31T12:00:00"), suivi({}));
    expect(maj!.consecutive_login_days).toBe(1);
  });

  /* ═══ LE JOUR BASCULE A DEUX HEURES DU MATIN, PAS A MINUIT ═══
     Se connecter a 1 h puis a 23 h le meme jour CIVIL tombe sur deux
     jours UTC differents, et compte donc pour deux jours de serie —
     alors que la personne n en a vecu qu un. */
  it("compte deux jours pour une seule nuit blanche", () => {
    const uneHeure = aParis("2026-08-31T01:00:00");
    const vingtTroisHeures = aParis("2026-08-31T23:00:00");
    expect(jourEnregistre(uneHeure)).toBe("2026-08-30");
    expect(jourEnregistre(vingtTroisHeures)).toBe("2026-08-31");

    const premier = miseAJourDeConnexion(uneHeure, suivi({ last_login_date: "2026-08-29" }));
    expect(premier!.consecutive_login_days).toBe(1);
    const second = miseAJourDeConnexion(vingtTroisHeures,
      suivi({ last_login_date: premier!.last_login_date, consecutive_login_days: 1 }));
    expect(second!.consecutive_login_days).toBe(2);
    expect(jourVecu(uneHeure)).toBe(jourVecu(vingtTroisHeures));
  });

  /* AU PASSAGE A L HEURE D ETE, la veille se calcule en jour civil puis
     s ecrit en UTC : l instant recule de 23 heures et non de 24, et le
     jour UTC obtenu reste le bon. La serie tient. */
  it("tient au passage a l heure d ete", () => {
    /* Le 29 mars 2026, la France passe de 2 h a 3 h. */
    const apres = aParis("2026-03-29T12:00:00");
    const maj = miseAJourDeConnexion(apres, suivi({ last_login_date: "2026-03-28", consecutive_login_days: 3 }));
    expect(maj!.consecutive_login_days).toBe(4);
  });

  it("tient au passage a l heure d hiver", () => {
    /* Le 25 octobre 2026, la France repasse de 3 h a 2 h. */
    const apres = aParis("2026-10-25T12:00:00");
    const maj = miseAJourDeConnexion(apres, suivi({ last_login_date: "2026-10-24", consecutive_login_days: 3 }));
    expect(maj!.consecutive_login_days).toBe(4);
  });
});

/* ═══════════════════════════════════════════════════════════════
   « LA MEME HEURE » EST PLUS ETROIT QUE SON NOM.

   L ecart d heures est pris en valeur absolue puis compare a ZERO :
   c est une egalite, pas une tolerance. Et le quart d heure se compte
   depuis l heure RONDE, pas depuis l heure habituelle. Se connecter
   fidelement a 14 h 20 chaque jour ne construit donc AUCUNE serie — le
   succes demande quinze jours d affilee entre le debut d une heure et
   son quart.
   ═══════════════════════════════════════════════════════════════ */
describe("la serie de la meme heure", () => {
  const a = (h: number, m: number) =>
    aParis(`2026-08-3${1}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);

  it("monte quand on revient a la meme heure ronde, dans son premier quart", () => {
    const maj = miseAJourDeConnexion(a(14, 10),
      suivi({ last_login_date: "2026-08-30", usual_login_hour: 14, logins_at_same_hour_streak: 4 }));
    expect(maj!.logins_at_same_hour_streak).toBe(5);
    /* L heure habituelle ne bouge pas tant que la serie tient. */
    expect(maj!.usual_login_hour).toBeUndefined();
  });

  it("repart a un et retient la nouvelle heure des qu on sort du quart", () => {
    const maj = miseAJourDeConnexion(a(14, 20),
      suivi({ last_login_date: "2026-08-30", usual_login_hour: 14, logins_at_same_hour_streak: 9 }));
    expect(maj!.logins_at_same_hour_streak).toBe(1);
    expect(maj!.usual_login_hour).toBe(14);
  });

  /* DES QUE L HEURE RONDE CHANGE, DANS UN SENS COMME DANS L AUTRE.
     L ecart est pris en VALEUR ABSOLUE : sans elle, revenir plus TOT
     que d habitude — neuf heures quand on attend quatorze — donnerait
     un ecart negatif, donc « inferieur ou egal a zero », donc une serie
     qui continue alors qu on a change d heure. */
  it("repart a un des que l heure ronde change, plus tard comme plus tot", () => {
    /* Un dernier jour assez ancien pour qu aucune des heures essayees ne
       retombe dessus — a minuit, le jour enregistre est celui de la
       veille civile. */
    for (const h of [15, 9, 0, 23]) {
      const maj = miseAJourDeConnexion(a(h, 0),
        suivi({ last_login_date: "2026-08-20", usual_login_hour: 14, logins_at_same_hour_streak: 9 }));
      expect(maj!.logins_at_same_hour_streak, String(h)).toBe(1);
      expect(maj!.usual_login_hour, String(h)).toBe(h);
    }
  });

  it("garde le quart d heure a quinze minutes", () => {
    expect(DANS_LE_QUART).toBe(15);
    const dedans = miseAJourDeConnexion(a(14, 15),
      suivi({ last_login_date: "2026-08-30", usual_login_hour: 14, logins_at_same_hour_streak: 2 }));
    expect(dedans!.logins_at_same_hour_streak).toBe(3);
    const dehors = miseAJourDeConnexion(a(14, 16),
      suivi({ last_login_date: "2026-08-30", usual_login_hour: 14, logins_at_same_hour_streak: 2 }));
    expect(dehors!.logins_at_same_hour_streak).toBe(1);
  });

  it("retient l heure a la premiere connexion, sans heure habituelle", () => {
    for (const h of [null, undefined]) {
      const maj = miseAJourDeConnexion(a(9, 3), suivi({ last_login_date: "2026-08-30", usual_login_hour: h }));
      expect(maj!.logins_at_same_hour_streak, String(h)).toBe(1);
      expect(maj!.usual_login_hour).toBe(9);
    }
  });

  /* MINUIT EST UNE HEURE HABITUELLE COMME UNE AUTRE — zero n est pas
     « pas d heure ». Le test l epingle parce que la garde compare a
     `null` et `undefined`, pas a une valeur fausse. */
  it("traite minuit comme une heure habituelle, pas comme une absence", () => {
    const maj = miseAJourDeConnexion(a(0, 3),
      suivi({ last_login_date: "2026-08-29", usual_login_hour: 0, logins_at_same_hour_streak: 6 }));
    expect(maj!.logins_at_same_hour_streak).toBe(7);
  });

  /* L HEURE HABITUELLE NE SOUFFRE PAS DU DECALAGE DES JOURS : elle ne
     compare que des heures locales entre elles. */
  it("compare des heures locales, pas des heures UTC", () => {
    const maj = miseAJourDeConnexion(a(14, 5),
      suivi({ last_login_date: "2026-08-30", usual_login_hour: 14, logins_at_same_hour_streak: 1 }));
    expect(maj!.logins_at_same_hour_streak).toBe(2);
    /* En UTC il serait midi, et la serie serait cassee. */
    expect(a(14, 5).getUTCHours()).toBe(12);
  });
});

/* ═══════════════════════════════════════════════════════════════
   CONSTATE, NON CORRIGE : LE SUCCES DE MINUIT EST PRESQUE INGAGNABLE.

   Il demande sept connexions entre 0 h 00 et 0 h 05 LOCALES. Mais la
   fonction sort avant tout si le JOUR UTC a deja ete vu — et a minuit,
   le jour UTC est celui de la veille civile.

   Il faut donc, sept fois, n avoir pas ouvert l application de toute la
   journee precedente et l ouvrir dans les cinq minutes qui suivent
   minuit. Mesure du 30/08/2026 sur le compte : `midnight_logins_count`
   vaut zero.

   Corriger demande de choisir quelle horloge fait foi pour le jour, et
   cela deplace la frontiere des series de deux heures pour tout le
   monde. Ce n est pas un rangement.
   ═══════════════════════════════════════════════════════════════ */
describe("le compteur de minuit", () => {
  it("monte quand la journee de la veille n avait pas ete ouverte", () => {
    const minuit = aParis("2026-08-31T00:02:00");
    const maj = miseAJourDeConnexion(minuit, suivi({ last_login_date: "2026-08-29", midnight_logins_count: 3 }));
    expect(maj!.midnight_logins_count).toBe(4);
  });

  it("ne monte pas si la journee de la veille avait ete ouverte", () => {
    const minuit = aParis("2026-08-31T00:02:00");
    expect(miseAJourDeConnexion(minuit, suivi({ last_login_date: "2026-08-30", midnight_logins_count: 3 })))
      .toBeNull();
  });

  it("garde sa fenetre a cinq minutes", () => {
    expect(FENETRE_DE_MINUIT).toBe(5);
    const dedans = miseAJourDeConnexion(aParis("2026-08-31T00:05:00"),
      suivi({ last_login_date: "2026-08-29" }));
    expect(dedans!.midnight_logins_count).toBe(1);
    const dehors = miseAJourDeConnexion(aParis("2026-08-31T00:06:00"),
      suivi({ last_login_date: "2026-08-29" }));
    expect(dehors!.midnight_logins_count).toBeUndefined();
  });

  /* HORS DE LA FENETRE, LE CHAMP N EST PAS ECRIT — il n est pas remis a
     zero. Une serie de minuits ne se perd pas parce qu on s est
     connecte a midi. */
  it("laisse le compteur intact hors de sa fenetre", () => {
    const maj = miseAJourDeConnexion(aParis("2026-08-31T12:00:00"),
      suivi({ last_login_date: "2026-08-30", midnight_logins_count: 6 }));
    expect(maj!.midnight_logins_count).toBeUndefined();
  });
});
