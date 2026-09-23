import { describe, expect, it } from "vitest";
import { composantes, PROPOSITIONS, TEINTES_DU_PACTE, voisine } from "./propositionsDeFond";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Le banc des fonds se parcourt au clavier, en boucle, et chaque fond
   reçoit la teinte du pacte en composantes de 0 à 1. Une boucle qui
   s'arrête au bout, une teinte mal lue : le banc ment sur ce qu'il
   compare.
   ═══════════════════════════════════════════════════════════════ */

describe("le catalogue", () => {
  it("n'a qu'une proposition par identifiant", () => {
    const ids = PROPOSITIONS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("garde le fond actuel en tête, comme référence", () => {
    expect(PROPOSITIONS[0].id).toBe("actuel");
  });

  it("dit pour chaque fond ce qu'on voit, pourquoi, et comment", () => {
    for (const p of PROPOSITIONS) {
      expect(p.idee.length, p.id).toBeGreaterThan(20);
      expect(p.pourquoi.length, p.id).toBeGreaterThan(20);
      expect(p.technique.length, p.id).toBeGreaterThan(10);
    }
  });

  it("plafonne la cadence de chaque fond calculé", () => {
    for (const p of PROPOSITIONS.filter((x) => x.id !== "actuel")) {
      expect(p.cadence, p.id).toBeGreaterThan(0);
      expect(p.cadence, p.id).toBeLessThanOrEqual(60);
    }
  });
});

describe("le parcours au clavier", () => {
  it("avance et recule d'un cran", () => {
    expect(voisine("nebuleuse", 1)).toBe("horizon");
    expect(voisine("horizon", -1)).toBe("nebuleuse");
  });

  it("boucle aux deux bouts", () => {
    expect(voisine("atlas", 1)).toBe("actuel");
    expect(voisine("actuel", -1)).toBe("atlas");
  });

  it("revient au départ après un tour complet", () => {
    let id = PROPOSITIONS[3].id;
    for (let i = 0; i < PROPOSITIONS.length; i++) id = voisine(id, 1);
    expect(id).toBe(PROPOSITIONS[3].id);
  });
});

describe("les teintes", () => {
  it("propose les six teintes du rite", () => {
    expect(Object.keys(TEINTES_DU_PACTE).sort()).toEqual(["amber", "cyan", "emerald", "rose", "sky", "violet"]);
  });

  it("lit une teinte en composantes de 0 à 1", () => {
    expect(composantes("#FF0000")).toEqual([1, 0, 0]);
    const [r, v, b] = composantes(TEINTES_DU_PACTE.violet);
    expect(r).toBeCloseTo(139 / 255);
    expect(v).toBeCloseTo(92 / 255);
    expect(b).toBeCloseTo(246 / 255);
  });

  it("retombe sur le violet devant une teinte illisible", () => {
    expect(composantes("violet")).toEqual([0.55, 0.36, 0.96]);
  });
});
