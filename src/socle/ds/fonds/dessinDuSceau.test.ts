import { describe, expect, it } from "vitest";
import { aretesAllumees, aretesDuSceau, rgba, sommetsDuSceau } from "./dessinDuSceau";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Le sceau du ciel doit être le MÊME polygone que celui du pacte, et
   s'allumer trait par trait. Deux pièges :

   - UN POLYGONE ÉTOILÉ PEUT ÊTRE COMPOSÉ. {6/2} n'est pas une étoile
     tracée d'un trait : ce sont deux triangles. Parcourir les sommets de
     deux en deux depuis 0 n'en visite que trois, et l'autre triangle
     disparaît du ciel sans erreur.
   - L'ALLUMAGE SUIT LE TRACÉ. À mi-parcours, on doit voir une figure
     à moitié dessinée, pas des traits épars.
   ═══════════════════════════════════════════════════════════════ */

describe("les arêtes du sceau", () => {
  it("trace {5/2} d'un seul trait", () => {
    expect(aretesDuSceau(5, 2)).toEqual([[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]]);
  });

  it("trace {6/2} en deux triangles, l'un après l'autre", () => {
    expect(aretesDuSceau(6, 2)).toEqual([[0, 2], [2, 4], [4, 0], [1, 3], [3, 5], [5, 1]]);
  });

  it("trace {7/3} en une boucle qui passe deux fois par chaque sommet", () => {
    const aretes = aretesDuSceau(7, 3);
    expect(aretes).toHaveLength(7);
    const passages = new Map<number, number>();
    for (const [a, b] of aretes) {
      passages.set(a, (passages.get(a) ?? 0) + 1);
      passages.set(b, (passages.get(b) ?? 0) + 1);
    }
    expect([...passages.values()]).toEqual(Array(7).fill(2));
  });

  it("enchaîne chaque arête sur la précédente, dans une même boucle", () => {
    const aretes = aretesDuSceau(7, 3);
    aretes.slice(1).forEach(([a], i) => expect(a).toBe(aretes[i][1]));
  });

  it("donne autant d'arêtes que de sommets, quel que soit le pas", () => {
    for (const [ordre, pas] of [[3, 1], [5, 2], [6, 2], [7, 2], [7, 3], [8, 3], [9, 3]]) {
      expect(aretesDuSceau(ordre, pas)).toHaveLength(ordre);
    }
  });
});

describe("l'allumage", () => {
  it("allume la part des arêtes qui correspond à la progression", () => {
    expect(aretesAllumees(6, 0)).toBe(0);
    expect(aretesAllumees(6, 0.5)).toBe(3);
    expect(aretesAllumees(6, 0.57)).toBe(3);
    expect(aretesAllumees(6, 1)).toBe(6);
  });

  it("ne sort jamais de la figure", () => {
    expect(aretesAllumees(5, -0.2)).toBe(0);
    expect(aretesAllumees(5, 1.4)).toBe(5);
  });
});

describe("la géométrie", () => {
  it("pose le premier sommet en haut", () => {
    const [haut] = sommetsDuSceau(5, { x: 100, y: 100 }, 40, 0);
    expect(haut.x).toBeCloseTo(100);
    expect(haut.y).toBeCloseTo(60);
  });

  it("lit une teinte hexadécimale, et retombe sur le violet sinon", () => {
    expect(rgba("#8B5CF6", 0.5)).toBe("rgba(139,92,246,0.5)");
    expect(rgba("pas une couleur", 1)).toBe("rgba(139,92,246,1)");
    expect(rgba("#10B981", 3)).toBe("rgba(16,185,129,1)");
  });
});
