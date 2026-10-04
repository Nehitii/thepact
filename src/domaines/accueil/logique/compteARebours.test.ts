import { describe, expect, it } from "vitest";
import {
  cadenceDuCompte, etatDuCompte, grosChiffre, instantDeLaFin, instantDuDebut, lireLeCompte,
} from "@/domaines/accueil/logique/compteARebours";

const JOUR = 86_400_000;
const minuit = (a: number, m: number, j: number) => new Date(a, m - 1, j).getTime();

describe("les bornes", () => {
  it("font commencer le pacte à minuit, chez le lecteur, le premier jour", () => {
    expect(instantDuDebut("2026-06-24")).toBe(minuit(2026, 6, 24));
  });

  it("le font finir à la fin du dernier jour, pas à son matin", () => {
    expect(instantDeLaFin("2027-06-30")).toBe(minuit(2027, 7, 1));
  });

  it("laissent tel quel un instant qui porte déjà une heure", () => {
    expect(instantDuDebut("2026-06-24T15:30:00Z")).toBe(Date.parse("2026-06-24T15:30:00Z"));
    expect(instantDeLaFin("2027-06-30T08:00:00Z")).toBe(Date.parse("2027-06-30T08:00:00Z"));
  });

  it("refusent une date illisible", () => {
    expect(instantDeLaFin("demain")).toBeNull();
    expect(lireLeCompte("2026-06-24", "pas une date", Date.now())).toBeNull();
  });
});

describe("le gros chiffre", () => {
  it("compte en jours, arrondis au-dessus, tant qu’il en reste deux", () => {
    expect(grosChiffre(214 * JOUR - 1000)).toEqual({ valeur: 214, unite: "jours", mot: "jours restants" });
  });

  it("passe aux heures, puis aux minutes, accordées", () => {
    expect(grosChiffre(36 * 3_600_000).unite).toBe("heures");
    expect(grosChiffre(36 * 3_600_000).valeur).toBe(36);
    expect(grosChiffre(90 * 60_000)).toEqual({ valeur: 90, unite: "minutes", mot: "minutes restantes" });
    expect(grosChiffre(70_000).mot).toBe("minute restante");
  });
});

describe("l’état", () => {
  it("suit la part qui reste, aux seuils de l’ancien panneau", () => {
    expect(etatDuCompte(0.2, JOUR, 0)).toBe("nominal");
    expect(etatDuCompte(0.5, JOUR, 0)).toBe("attention");
    expect(etatDuCompte(0.8, JOUR, 0)).toBe("critique");
  });

  it("dit « à venir » avant le premier jour et « terminé » au terme", () => {
    expect(etatDuCompte(0, JOUR, 5 * JOUR)).toBe("a-venir");
    expect(etatDuCompte(1, 0, 0)).toBe("termine");
  });
});

describe("la lecture", () => {
  it("rend la part écoulée, les jours restants et l’état d’un pacte en cours", () => {
    const maintenant = minuit(2026, 9, 23) + 12 * 3_600_000;
    const l = lireLeCompte("2026-06-24", "2027-06-30", maintenant)!;
    expect(l.joursTotal).toBe(372);
    expect(l.joursEcoules).toBe(91);
    expect(l.gros.valeur).toBe(281);
    expect(l.part).toBeCloseTo((maintenant - minuit(2026, 6, 24)) / (minuit(2027, 7, 1) - minuit(2026, 6, 24)), 10);
    /* 91 jours sur 372 : il en reste 75,5 %, au-dessus du seuil. */
    expect(l.etat).toBe("nominal");
  });

  it("ne se montre pas sans date de fin", () => {
    expect(lireLeCompte("2026-06-24", null, Date.now())).toBeNull();
  });

  it("part d’aujourd’hui sans date de début, sans rien d’écoulé", () => {
    const l = lireLeCompte(null, "2027-06-30", minuit(2026, 9, 23))!;
    expect(l.part).toBe(0);
    expect(l.etat).toBe("nominal");
  });

  it("se dit terminé après le dernier jour, à part pleine", () => {
    const l = lireLeCompte("2026-06-24", "2027-06-30", minuit(2027, 7, 2))!;
    expect(l.etat).toBe("termine");
    expect(l.part).toBe(1);
    expect(l.resteMs).toBe(0);
  });

  it("se dit à venir avant le premier jour", () => {
    const l = lireLeCompte("2026-10-01", "2027-06-30", minuit(2026, 9, 23))!;
    expect(l.etat).toBe("a-venir");
    expect(l.avantLeDebutMs).toBe(minuit(2026, 10, 1) - minuit(2026, 9, 23));
    expect(l.part).toBe(0);
  });
});

describe("la cadence", () => {
  it("rafraîchit à la minute en jours, à la seconde à la fin", () => {
    expect(cadenceDuCompte(30 * JOUR)).toBe(60_000);
    expect(cadenceDuCompte(JOUR)).toBe(1_000);
  });
});
