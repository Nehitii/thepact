import { describe, expect, it } from "vitest";
import {
  genreDe, laCloture, lettresAllumees, lireLaJournee, lireLOrdre, paquetsDeBatons, perforation,
} from "@/domaines/accueil/logique/ordresDuJour";
import type { OrdreAffiche } from "@/domaines/accueil/types";

const ordre = (o: Partial<OrdreAffiche>): OrdreAffiche => ({
  id: "o", kind: "focus_minutes", title: "Focus profond", description: null,
  target: 25, progress: 0, reward_bonds: 18, status: "active", ...o,
});

describe("lireLOrdre", () => {
  it("ne touche 100 % qu’une fois la cible atteinte", () => {
    expect(lireLOrdre(ordre({ target: 200, progress: 199 })).pct).toBe(99);
    expect(lireLOrdre(ordre({ progress: 25 })).pct).toBe(100);
    expect(lireLOrdre(ordre({ progress: 12 })).pct).toBe(48);
  });

  it("distingue l’ordre atteint de l’ordre réclamé", () => {
    expect(lireLOrdre(ordre({ progress: 25 }))).toMatchObject({ prete: true, reclamee: false, restant: 0 });
    expect(lireLOrdre(ordre({ progress: 25, status: "claimed" }))).toMatchObject({ prete: false, reclamee: true });
    expect(lireLOrdre(ordre({ progress: 9 }))).toMatchObject({ prete: false, restant: 16 });
  });

  it("ne déborde pas quand la progression dépasse la cible", () => {
    expect(lireLOrdre(ordre({ progress: 40 })).fraction).toBe(1);
  });
});

describe("lireLaJournee", () => {
  it("dit « vide » sans ordre", () => {
    expect(lireLaJournee([]).etat).toBe("vide");
  });

  it("additionne la prime acquise, en attente et totale", () => {
    const j = lireLaJournee([
      ordre({ id: "a", reward_bonds: 15, target: 1, progress: 1, status: "claimed" }),
      ordre({ id: "b", reward_bonds: 12, target: 2, progress: 2 }),
      ordre({ id: "c", reward_bonds: 10, target: 1, progress: 0 }),
    ]);
    expect(j).toMatchObject({ primeTotale: 37, primeAcquise: 15, primeEnAttente: 12, pctPrime: 41, reclames: 1, pretes: 1 });
    expect(j.etat).toBe("a-reclamer");
  });

  it("passe « a-reclamer » même pour une prime nulle", () => {
    expect(lireLaJournee([ordre({ reward_bonds: 0, progress: 25 })]).etat).toBe("a-reclamer");
  });

  it("ferme la journée quand tout est réclamé", () => {
    const j = lireLaJournee([ordre({ progress: 25, status: "claimed" }), ordre({ id: "b", target: 1, progress: 1, status: "claimed" })]);
    expect(j.etat).toBe("close");
    expect(j.pctPrime).toBe(100);
  });
});

describe("laCloture", () => {
  it("compte jusqu’à minuit UTC", () => {
    const c = laCloture(Date.UTC(2026, 8, 23, 18, 48, 0));
    expect(c).toMatchObject({ heures: 5, minutes: 12, texte: "5 h 12", horloge: "05:12" });
  });

  it("passe aux minutes dans la dernière heure, puis à « < 1 min »", () => {
    expect(laCloture(Date.UTC(2026, 8, 23, 23, 40, 0)).texte).toBe("20 min");
    expect(laCloture(Date.UTC(2026, 8, 23, 23, 59, 30)).texte).toBe("< 1 min");
  });

  it("donne l’heure de la clôture à la montre du lecteur", () => {
    const fin = new Date(Date.UTC(2026, 8, 24));
    const attendu = fin.getMinutes()
      ? `${fin.getHours()} h ${String(fin.getMinutes()).padStart(2, "0")}`
      : `${fin.getHours()} h`;
    expect(laCloture(Date.UTC(2026, 8, 23, 12)).heureLocale).toBe(attendu);
  });
});

describe("lettresAllumees", () => {
  it("allume la part faite, arrondie en dessous, sans compter les espaces", () => {
    expect(lettresAllumees("Focus profond", 0.48)).toBe(5);
    expect(lettresAllumees("Focus profond", 0)).toBe(0);
  });

  it("garde la dernière lettre pour le geste qui finit", () => {
    expect(lettresAllumees("Focus profond", 0.99)).toBe(11);
    expect(lettresAllumees("Focus profond", 1)).toBe(12);
  });
});

describe("paquetsDeBatons", () => {
  it("compte par cinq, comme à la craie", () => {
    expect(paquetsDeBatons(12)).toEqual([5, 5, 2]);
    expect(paquetsDeBatons(5)).toEqual([5]);
    expect(paquetsDeBatons(0)).toEqual([]);
  });
});

describe("perforation", () => {
  it("perce un trou par unité jusqu’à vingt-cinq, en rangées de cinq", () => {
    expect(perforation(12, 25)).toEqual({ trous: 25, perces: 12, colonnes: 5, rangees: 5, unitesParTrou: 1 });
    expect(perforation(1, 2)).toMatchObject({ trous: 2, perces: 1, colonnes: 2, rangees: 1 });
  });

  it("fait valoir plusieurs unités à un trou au-delà, et ne perce qu’un trou entier", () => {
    expect(perforation(59, 60)).toMatchObject({ trous: 20, perces: 19, unitesParTrou: 3, rangees: 4 });
    expect(perforation(60, 60).perces).toBe(20);
  });
});

describe("genreDe", () => {
  it("rend un genre gris pour un genre inconnu", () => {
    expect(genreDe("complete_steps").court).toBe("Pas");
    expect(genreDe("nouveau_genre").court).toBe("Ordre");
  });
});
