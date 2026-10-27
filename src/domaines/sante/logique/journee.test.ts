import { describe, expect, it } from "vitest";
import {
  FENETRE_RATTRAPAGE, cleDuJour, imc, joursARelever, laVeille, nomDuJour,
  pagesDuJournal, placeSurEchelle, serieDeJours, trancheIMC, veilleRelevee,
} from "./journee";

/* LE JOURNAL DU CORPS.
 *
 * Deux regles portent tout le module, et les deux se cassent en
 * silence :
 *
 *   AUJOURD HUI N EST JAMAIS A RELEVER. La journee n est pas finie ; la
 *   proposer ramene le defaut qu on venait de corriger — on note un
 *   sommeil fini a cote d une activite qui n a pas eu lieu.
 *
 *   UNE SERIE NE SE CASSE PAS PARCE QU IL EST HUIT HEURES DU MATIN.
 *   Compter a partir d aujourd hui remettrait la serie a zero chaque
 *   nuit jusqu a la premiere seance.
 *
 * Les tests fixent la date : un test de calendrier qui depend du jour
 * ou on le lance ne prouve rien.
 */

/** Un mardi, pour que « la veille » ne traverse pas un changement de mois. */
const AUJOURDHUI = new Date(2026, 8, 15, 9, 30);
const j = (n: number) => cleDuJour(new Date(2026, 8, 15 - n, 12));

describe("Ce qu il reste a relever", () => {
  it("N Y MET JAMAIS AUJOURD HUI", () => {
    const rien = joursARelever([], AUJOURDHUI);
    expect(rien).not.toContain(cleDuJour(AUJOURDHUI));
    expect(rien[0]).toBe(j(1));
  });

  it("va de la plus recente a la plus ancienne", () => {
    const manques = joursARelever([], AUJOURDHUI);
    expect(manques).toEqual([...manques].sort().reverse());
  });

  it("s arrete a la fenetre de rattrapage", () => {
    /* Au-dela de quinze jours, ce ne serait plus un souvenir mais une
       reconstitution. */
    const manques = joursARelever([], AUJOURDHUI);
    expect(manques).toHaveLength(FENETRE_RATTRAPAGE);
    expect(manques).toContain(j(FENETRE_RATTRAPAGE));
    expect(manques).not.toContain(j(FENETRE_RATTRAPAGE + 1));
  });

  it("retire ce qui est deja releve, meme si la base rend un horodatage", () => {
    /* Les colonnes de date arrivent parfois en « 2026-09-14T00:00:00Z ».
       Comparer sans couper laisserait la journee en dette pour toujours. */
    const releves = [j(1) + "T00:00:00.000Z", j(3)];
    const manques = joursARelever(releves, AUJOURDHUI);
    expect(manques).not.toContain(j(1));
    expect(manques).not.toContain(j(3));
    expect(manques).toContain(j(2));
  });
});

describe("Le journal", () => {
  it("MONTRE TOUTE LA FENETRE, pas seulement la dette", () => {
    /* Sans les lignes relevees, on ne lit que ses manquements, jamais
       sa regularite. */
    const pages = pagesDuJournal([j(1), j(2)], AUJOURDHUI);
    expect(pages).toHaveLength(FENETRE_RATTRAPAGE);
    expect(pages.filter((p) => p.relevee).map((p) => p.cle)).toEqual([j(1), j(2)]);
    expect(pages[0].cle).toBe(j(1));
  });

  it("et n y met pas davantage aujourd hui", () => {
    expect(pagesDuJournal([], AUJOURDHUI).map((p) => p.cle))
      .not.toContain(cleDuJour(AUJOURDHUI));
  });

  it("ses lignes non relevees sont exactement la dette", () => {
    const releves = [j(2), j(5)];
    const pages = pagesDuJournal(releves, AUJOURDHUI);
    expect(pages.filter((p) => !p.relevee).map((p) => p.cle))
      .toEqual(joursARelever(releves, AUJOURDHUI));
  });
});

describe("La serie de jours", () => {
  it("compte aujourd hui quand il compte deja", () => {
    expect(serieDeJours([j(0), j(1), j(2)], AUJOURDHUI)).toBe(3);
  });

  it("NE SE CASSE PAS PARCE QU IL EST HUIT HEURES DU MATIN", () => {
    /* Rien aujourd hui, mais hier et avant-hier : la serie vaut deux, et
       non zero. C est le defaut que ce module existe pour eviter. */
    expect(serieDeJours([j(1), j(2)], AUJOURDHUI)).toBe(2);
  });

  it("s arrete au premier trou", () => {
    expect(serieDeJours([j(1), j(2), j(4), j(5)], AUJOURDHUI)).toBe(2);
  });

  it("vaut zero sans rien, et zero si le dernier jour est trop vieux", () => {
    expect(serieDeJours([], AUJOURDHUI)).toBe(0);
    /* Ni aujourd hui ni hier : la serie est rompue. */
    expect(serieDeJours([j(2), j(3)], AUJOURDHUI)).toBe(0);
  });

  it("ne compte pas deux fois le meme jour", () => {
    expect(serieDeJours([j(1), j(1), j(2)], AUJOURDHUI)).toBe(2);
  });
});

describe("Le releve de la veille", () => {
  it("dit oui quand la veille est faite, horodatage compris", () => {
    expect(veilleRelevee([j(1)], AUJOURDHUI)).toBe(true);
    expect(veilleRelevee([j(1) + "T22:14:00Z"], AUJOURDHUI)).toBe(true);
    expect(veilleRelevee([j(2)], AUJOURDHUI)).toBe(false);
    expect(veilleRelevee([cleDuJour(AUJOURDHUI)], AUJOURDHUI)).toBe(false);
  });

  it("et « la veille » est bien la veille", () => {
    expect(cleDuJour(laVeille(AUJOURDHUI))).toBe(j(1));
  });
});

describe("Nommer une journee sans dire sa date", () => {
  const mots = { hier: "Hier", avantHier: "Avant-hier" };
  const formater = () => "une date";

  it("« hier » et « avant-hier » se lisent d un coup", () => {
    expect(nomDuJour(j(1), formater, mots, AUJOURDHUI)).toBe("Hier");
    expect(nomDuJour(j(2), formater, mots, AUJOURDHUI)).toBe("Avant-hier");
  });

  it("au-dela, la date reprend ses droits", () => {
    expect(nomDuJour(j(3), formater, mots, AUJOURDHUI)).toBe("une date");
    expect(nomDuJour(cleDuJour(AUJOURDHUI), formater, mots, AUJOURDHUI)).toBe("une date");
  });
});

describe("L indice de masse corporelle", () => {
  it("S ARRETE AU DIXIEME", () => {
    /* Il s affichait brut : 23.148148148148149. Quinze decimales pour
       une mesure qui n en supporte pas une seconde. */
    expect(imc(180, 75)).toBe(23.1);
    expect(imc(170, 65)).toBe(22.5);
  });

  it("rend null plutot qu une division par zero", () => {
    expect(imc(0, 70)).toBeNull();
    expect(imc(180, 0)).toBeNull();
    expect(imc(null, 70)).toBeNull();
    expect(imc(180, undefined)).toBeNull();
    expect(imc(-180, 70)).toBeNull();
  });

  it("place les bornes de l OMS, bornes comprises du bon cote", () => {
    expect(trancheIMC(18.4)).toBe("maigreur");
    expect(trancheIMC(18.5)).toBe("normal");
    expect(trancheIMC(24.9)).toBe("normal");
    expect(trancheIMC(25)).toBe("surpoids");
    expect(trancheIMC(29.9)).toBe("surpoids");
    expect(trancheIMC(30)).toBe("obesite");
    expect(trancheIMC(null)).toBeNull();
  });

  it("l echelle reste entre zero et cent, quoi qu on lui donne", () => {
    /* Une valeur hors echelle ferait sortir le curseur de sa barre. */
    expect(placeSurEchelle(15)).toBe(0);
    expect(placeSurEchelle(25)).toBe(50);
    expect(placeSurEchelle(35)).toBe(100);
    expect(placeSurEchelle(9)).toBe(0);
    expect(placeSurEchelle(80)).toBe(100);
    expect(placeSurEchelle(null)).toBe(0);
  });
});
