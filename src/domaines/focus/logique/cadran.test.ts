import { describe, expect, it } from "vitest";
import {
  annonceDuCadran, assezEspacee, avancementParPas, clefDeNotification,
  CYCLE, DELAI_ENTRE_NOTIFS, PAS, referenceDuRegistre, seuilDAnnonce,
} from "./cadran";

describe("seuilDAnnonce — deux seuils, pas un par minute", () => {
  /* LES MINUTES SONT ARRONDIES AU-DESSUS : a 61 secondes il reste
     « deux minutes ». L arrondi au plus proche declencherait le seuil
     d une minute trente secondes trop tot, et l annonce mentirait. */
  it("n annonce « une minute » que dans la derniere minute", () => {
    expect(seuilDAnnonce(61)).toBe(5);
    expect(seuilDAnnonce(60)).toBe(1);
    expect(seuilDAnnonce(30)).toBe(1);
    expect(seuilDAnnonce(1)).toBe(1);
  });

  it("annonce « cinq minutes » dans les cinq dernieres, pas avant", () => {
    expect(seuilDAnnonce(5 * 60)).toBe(5);
    expect(seuilDAnnonce(5 * 60 + 1)).toBeNull();
  });

  it("se tait au-dela de cinq minutes", () => {
    expect(seuilDAnnonce(25 * 60)).toBeNull();
    expect(seuilDAnnonce(6 * 60)).toBeNull();
  });

  /* ZERO ET AU-DELA RESTENT DANS LA DERNIERE MINUTE : une phase qui
     deborde ne doit pas se remettre a annoncer cinq minutes. */
  it("tient a « une minute » a zero et en dessous", () => {
    expect(seuilDAnnonce(0)).toBe(1);
    expect(seuilDAnnonce(-30)).toBe(1);
  });
});

describe("annonceDuCadran", () => {
  /* AU REPOS, LA REGION SE TAIT. Annoncer « zero minute » a une page
     que personne n a lancee n apprend rien. */
  it("se tait au repos", () => {
    expect(annonceDuCadran("idle", false, 0)).toBeNull();
    expect(annonceDuCadran("idle", true, 900)).toBeNull();
  });

  /* SUSPENDU PASSE AVANT TOUT LE RESTE : le temps ne s ecoule plus,
     annoncer « une minute » serait faux. */
  it("dit la suspension avant tout autre seuil", () => {
    expect(annonceDuCadran("work", true, 30)).toEqual({ cle: "focus.announce.paused" });
    expect(annonceDuCadran("break", true, 30)).toEqual({ cle: "focus.announce.paused" });
  });

  it("annonce l entree dans la phase quand aucun seuil n est atteint", () => {
    expect(annonceDuCadran("work", false, 25 * 60)).toEqual({ cle: "focus.announce.workStarted" });
    expect(annonceDuCadran("break", false, 5 * 60 + 30)).toEqual({ cle: "focus.announce.breakStarted" });
  });

  it("porte le seuil dans le compte", () => {
    expect(annonceDuCadran("work", false, 4 * 60)).toEqual({
      cle: "focus.announce.work", valeurs: { count: 5 },
    });
    expect(annonceDuCadran("break", false, 20)).toEqual({
      cle: "focus.announce.break", valeurs: { count: 1 },
    });
  });

  it("ne confond pas travail et pause", () => {
    expect(annonceDuCadran("work", false, 20)?.cle).toBe("focus.announce.work");
    expect(annonceDuCadran("break", false, 20)?.cle).toBe("focus.announce.break");
  });
});

describe("referenceDuRegistre", () => {
  const LE_5_MARS = new Date(2026, 2, 5, 14, 30);

  it("porte le mois et le jour sur deux chiffres", () => {
    expect(referenceDuRegistre(0, LE_5_MARS)).toBe("VW·0305·01");
  });

  /* LE RANG REPART A UN TOUS LES QUATRE POMODOROS — le cycle au bout
     duquel tombe la longue pause. */
  it("compte de un a quatre puis recommence", () => {
    expect(CYCLE).toBe(4);
    const rangs = [0, 1, 2, 3, 4, 5].map((n) => referenceDuRegistre(n, LE_5_MARS).slice(-2));
    expect(rangs).toEqual(["01", "02", "03", "04", "01", "02"]);
  });

  it("ne rend jamais un rang a zero", () => {
    for (let n = 0; n < 12; n++) {
      expect(referenceDuRegistre(n, LE_5_MARS).slice(-2)).not.toBe("00");
    }
  });

  it("passe a deux chiffres pour les mois et jours a un chiffre", () => {
    expect(referenceDuRegistre(0, new Date(2026, 0, 1))).toBe("VW·0101·01");
    expect(referenceDuRegistre(0, new Date(2026, 11, 31))).toBe("VW·1231·01");
  });
});

describe("avancementParPas", () => {
  /* VINGT PAS SUFFISENT A CE QUE L OEIL VOIE L ANNEAU TOURNER, et la
     page cesse de se repeindre a chaque seconde. */
  it("arrondit au vingtieme", () => {
    expect(PAS).toBe(20);
    expect(avancementParPas(0.123)).toBe(0.1);
    expect(avancementParPas(0.126)).toBe(0.15);
  });

  it("laisse les bornes intactes", () => {
    expect(avancementParPas(0)).toBe(0);
    expect(avancementParPas(1)).toBe(1);
  });

  /* UN PAS FAIT CINQ POUR CENT : deux avancements distants de moins
     que cela tombent au meme endroit, et c est le but. */
  it("range deux avancements voisins au meme pas", () => {
    expect(avancementParPas(0.201)).toBe(avancementParPas(0.209));
  });
});

describe("assezEspacee et clefDeNotification", () => {
  /* DEUX NOTIFICATIONS A MOINS DE DIX SECONDES S EMPILENT : la
     seconde recouvre la premiere avant qu on ait pu la lire. */
  it("refuse deux notifications a moins de dix secondes", () => {
    expect(DELAI_ENTRE_NOTIFS).toBe(10_000);
    expect(assezEspacee(10_000, 0)).toBe(false);
    expect(assezEspacee(10_001, 0)).toBe(true);
  });

  it("laisse passer la premiere, dont la derniere date de zero", () => {
    expect(assezEspacee(Date.parse("2026-08-30T12:00:00Z"), 0)).toBe(true);
  });

  it("dit la pause pour une pause, la reprise sinon", () => {
    expect(clefDeNotification("break")).toBe("focus.notification.breakStart");
    expect(clefDeNotification("work")).toBe("focus.notification.workResume");
    expect(clefDeNotification("idle")).toBe("focus.notification.workResume");
  });
});
