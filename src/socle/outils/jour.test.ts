/* LE JOUR CIVIL, ET LES DEUX FUSEAUX QUI LE DEPARTAGENT.
 *
 * Ce module remplace HUIT formatages du jour et QUATRE du mois, ecrits
 * a la main dans six domaines. C est ce qui explique qu une meme faute
 * de fuseau ait pu etre corrigee quatre fois dans ce depot sans jamais
 * disparaitre : chaque correction ne touchait qu une copie.
 *
 * Les tests s executent a Paris (UTC+1/+2). Un fuseau a l EST ne
 * revele rien : minuit UTC y tombe le meme jour civil. Toute assertion
 * qui compte est donc doublee a New York (UTC-4/-5), ou minuit UTC
 * appartient a la VEILLE. C est la seule facon de montrer ce que le
 * module empeche.
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  aujourdHuiCivil, dateCivileDepuisTexte, duJourNu, jourDecale, jourLocal,
  joursEntre, memeJour, moisLocal, texteDepuisDateCivile,
} from "./jour";

const FUSEAU = process.env.TZ;
const sous = (tz: string, f: () => void) => { process.env.TZ = tz; f(); process.env.TZ = FUSEAU; };
afterEach(() => { process.env.TZ = FUSEAU; });

describe("jourLocal : le jour qu on vit", () => {
  it("rend le jour du LECTEUR, et non celui d UTC", () => {
    const nuit = new Date("2026-08-31T01:30:00.000Z");
    sous("Europe/Paris", () => expect(jourLocal(nuit)).toBe("2026-08-31"));
    sous("America/New_York", () => expect(jourLocal(nuit)).toBe("2026-08-30"));
  });

  it("passe l annee au bon moment, de chaque cote de Greenwich", () => {
    const reveillon = new Date("2026-01-01T04:00:00.000Z");
    sous("Europe/Paris", () => expect(jourLocal(reveillon)).toBe("2026-01-01"));
    sous("America/New_York", () => expect(jourLocal(reveillon)).toBe("2025-12-31"));
  });

  it("complete les mois et les jours a deux chiffres", () => {
    expect(jourLocal(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(jourLocal(new Date(2026, 11, 31))).toBe("2026-12-31");
    expect(jourLocal(new Date(2026, 8, 8))).toBe("2026-09-08");
  });

  it("prend l instant courant quand on ne lui donne rien", () => {
    expect(jourLocal()).toBe(jourLocal(new Date()));
    expect(jourLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("moisLocal : le mois qu on vit", () => {
  it("rend l annee et le mois, sur deux chiffres", () => {
    expect(moisLocal(new Date(2026, 0, 5))).toBe("2026-01");
    expect(moisLocal(new Date(2026, 11, 31))).toBe("2026-12");
  });

  it("bascule de mois avec le lecteur, pas avec UTC", () => {
    const premier = new Date("2026-09-01T02:00:00.000Z");
    sous("Europe/Paris", () => expect(moisLocal(premier)).toBe("2026-09"));
    sous("America/New_York", () => expect(moisLocal(premier)).toBe("2026-08"));
  });

  it("est le prefixe du jour", () => {
    const d = new Date(2026, 5, 17);
    expect(jourLocal(d).startsWith(moisLocal(d))).toBe(true);
  });
});

describe("duJourNu : un jour nu devient un instant", () => {
  it("tombe le bon jour dans les deux hemispheres horaires", () => {
    /* C EST TOUT LE SUJET. `new Date("2026-09-08")` vaut minuit UTC :
       a New York, ses composantes locales disent le 7. */
    for (const tz of ["Europe/Paris", "America/New_York", "Pacific/Kiritimati", "UTC"])
      sous(tz, () => {
        const d = duJourNu("2026-09-08");
        expect(d.getDate(), tz).toBe(8);
        expect(d.getMonth(), tz).toBe(8);
        expect(jourLocal(d), tz).toBe("2026-09-08");
      });
  });

  it("montre ce que la lecture naive donnait a l ouest", () => {
    sous("America/New_York", () => {
      expect(new Date("2026-09-08").getDate()).toBe(7);   /* la faute */
      expect(duJourNu("2026-09-08").getDate()).toBe(8);   /* le remede */
    });
  });

  it("se pose a midi, la seule heure qu aucun changement d heure n emporte", () => {
    expect(duJourNu("2026-09-08").getHours()).toBe(12);
  });

  it("ne touche pas a ce qui porte deja une heure", () => {
    /* Sans cette garde, l appliquer a une colonne « timestamptz »
       fabriquerait « ...+00T12:00:00 » — une date invalide. */
    const instant = "2026-08-26T22:00:00+00:00";
    expect(duJourNu(instant).getTime()).toBe(new Date(instant).getTime());
    expect(Number.isNaN(duJourNu(instant).getTime())).toBe(false);
  });

  it("tolere les espaces autour du jour", () => {
    /* BALAYAGE : retirer la coupe des espaces survivait a Paris.
       Sans elle, la chaine ne ressemble plus a un jour nu, retombe
       sur la lecture naive — donc sur minuit UTC — et le fuseau de
       l ouest revele la difference. */
    for (const tz of ["Europe/Paris", "America/New_York"])
      sous(tz, () => expect(jourLocal(duJourNu("  2026-09-08  ")), tz).toBe("2026-09-08"));
    /* Le jour, seul, ne suffit pas a departager : une chaine entouree
       d espaces sort de la grammaire ISO, et l analyseur de secours
       de la plateforme la lit alors en heure LOCALE — donc au bon
       jour, par accident. C est l HEURE qui separe les deux : minuit
       local est justement ce que ce module refuse, parce qu un
       changement d heure peut le supprimer. */
    expect(duJourNu("  2026-09-08  ").getHours()).toBe(12);
    expect(new Date("  2026-09-08  ").getHours()).toBe(0);
  });
});

describe("joursEntre : on compte des jours, pas des millisecondes", () => {
  it("rend zero le jour meme, quelle que soit l heure", () => {
    expect(joursEntre("2026-09-08", "2026-09-08")).toBe(0);
  });

  it("compte les jours civils, dans les deux sens", () => {
    expect(joursEntre("2026-09-08", "2026-09-15")).toBe(7);
    expect(joursEntre("2026-09-15", "2026-09-08")).toBe(-7);
    expect(joursEntre("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("traverse un changement d heure sans perdre ni gagner un jour", () => {
    /* L heure d ete francaise avance dans la nuit du 28 au 29 mars :
       une de ces journees ne dure que vingt-trois heures. En comptant
       des millisecondes, la division tombe a 6,96 pour sept jours. */
    sous("Europe/Paris", () => {
      expect(joursEntre("2026-03-25", "2026-04-01")).toBe(7);
      expect(joursEntre("2026-10-22", "2026-10-29")).toBe(7);
    });
  });

  it("compte pareil des deux cotes de Greenwich", () => {
    for (const tz of ["Europe/Paris", "America/New_York", "Pacific/Kiritimati"])
      sous(tz, () => expect(joursEntre("2026-09-08", "2026-09-11"), tz).toBe(3));
  });

  it("passer par la lecture naive donnerait le meme compte — et ce n est pas un hasard", () => {
    /* BALAYAGE : remplacer `duJourNu` par `new Date` ici SURVIT, et
       c est juste. Deux minuits UTC sont toujours ecartes d un
       multiple exact de vingt-quatre heures, donc la division tombe
       juste ; deux midis locaux traversant un changement d heure
       donnent 6,96 que l arrondi ramene a sept. Les deux chemins
       aboutissent. On garde `duJourNu` pour la coupe des espaces et
       la garde de l instant, pas pour le compte. */
    const naif = (a: string, b: string) =>
      Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
    sous("Europe/Paris", () => {
      for (const [a, b] of [["2026-03-25", "2026-04-01"], ["2026-10-22", "2026-10-29"],
        ["2026-09-08", "2026-09-08"], ["2026-12-31", "2027-01-01"]])
        expect(joursEntre(a, b), a + " → " + b).toBe(naif(a, b));
    });
  });
});

describe("memeJour et jourDecale", () => {
  it("reconnait deux instants du meme jour vecu", () => {
    sous("Europe/Paris", () => {
      expect(memeJour(new Date("2026-08-31T01:00:00.000Z"), new Date("2026-08-31T21:00:00.000Z"))).toBe(true);
      expect(memeJour(new Date("2026-08-30T21:00:00.000Z"), new Date("2026-08-31T21:00:00.000Z"))).toBe(false);
    });
  });

  it("avance et recule d un jour civil, jamais de vingt-quatre heures", () => {
    /* BALAYAGE : passer par « + 86 400 000 ms » survivait a quinze
       heures. Il faut se placer a moins d une heure de minuit, la
       veille du passage a l heure d ete : cette journee-la ne dure
       que vingt-trois heures, et vingt-quatre heures d horloge y
       sautent DEUX jours civils. */
    sous("Europe/Paris", () => {
      const jour = new Date(2026, 2, 28, 15, 0);
      expect(jourDecale(1, jour)).toBe("2026-03-29");
      expect(jourDecale(-1, jour)).toBe("2026-03-27");
      expect(jourDecale(0, jour)).toBe("2026-03-28");
      const veille = new Date(2026, 2, 28, 23, 30);
      expect(jourDecale(1, veille)).toBe("2026-03-29");
    });
  });

  it("franchit les mois et les annees", () => {
    expect(jourDecale(1, new Date(2026, 11, 31, 10))).toBe("2027-01-01");
    expect(jourDecale(-1, new Date(2026, 0, 1, 10))).toBe("2025-12-31");
    expect(jourDecale(2, new Date(2026, 1, 27, 10))).toBe("2026-03-01");
  });
});

describe("la date civile d un selecteur", () => {
  it("lit et reecrit la meme composante, sous tous les fuseaux", () => {
    /* LE DEFAUT QUE CES TROIS FONCTIONS EXISTENT POUR EMPECHER : la
       valeur reculait d un jour A CHAQUE ENREGISTREMENT, parce que la
       composante lue n etait pas celle qui serait reecrite. */
    for (const tz of ["Europe/Paris", "America/New_York", "Pacific/Kiritimati"])
      sous(tz, () => {
        let texte = "1996-02-02";
        for (let i = 0; i < 5; i++) texte = texteDepuisDateCivile(dateCivileDepuisTexte(texte))!;
        expect(texte, tz).toBe("1996-02-02");
      });
  });

  it("rend undefined plutot que de deviner", () => {
    for (const mauvais of [null, undefined, "", "hier", "02/02/1996"])
      expect(dateCivileDepuisTexte(mauvais), String(mauvais)).toBeUndefined();
  });

  it("accepte une chaine aussi bien qu un Date", () => {
    expect(texteDepuisDateCivile("1996-02-02T00:00:00+02:00")).toBe("1996-02-02");
    expect(texteDepuisDateCivile(new Date(1996, 1, 2))).toBe("1996-02-02");
  });

  it("rend null pour ce qui n est pas une date", () => {
    for (const mauvais of [null, undefined, "", "hier", new Date("x")])
      expect(texteDepuisDateCivile(mauvais), String(mauvais)).toBeNull();
  });

  it("pose aujourd hui a minuit local, borne haute d une naissance", () => {
    const a = aujourdHuiCivil();
    expect(a.getHours()).toBe(0);
    expect(a.getMinutes()).toBe(0);
    expect(jourLocal(a)).toBe(jourLocal());
  });
});
