/* CHOISIR SANS SOURIS.
 *
 * Le premier cablage laissait saisir l article au clavier, appuyer sur
 * les fleches, et n allumait jamais aucune cible — « pointerWithin »
 * n a pas de pointeur a interroger. Le geste avait l air de marcher.
 * Ces tests fixent la seule chose qui rend le clavier utilisable :
 * une fleche change de DESTINATION, elle ne pousse pas un point.
 */
import { describe, expect, it } from "vitest";
import { changeDeCible, laPlusProche, prochaineCible, type CibleAtteignable } from "./cibleAuClavier";

const cibles: CibleAtteignable[] = [
  { id: "tout", x: 40, y: 100 },
  { id: "pacte", x: 140, y: 100 },
  { id: "envies", x: 260, y: 100 },
  { id: "maison", x: 380, y: 100 },
];

describe("changeDeCible", () => {
  it("les quatre fleches, et rien d autre", () => {
    for (const k of ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"]) {
      expect(changeDeCible(k)).toBe(true);
    }
    for (const k of [" ", "Escape", "Enter", "Tab", "a"]) {
      expect(changeDeCible(k)).toBe(false);
    }
  });
});

describe("laPlusProche : par ou commencer", () => {
  it("rend la cible la plus proche du point", () => {
    expect(laPlusProche(cibles, 45, 105)).toBe(0);
    expect(laPlusProche(cibles, 250, 90)).toBe(2);
    expect(laPlusProche(cibles, 9999, 9999)).toBe(3);
  });

  it("rend -1 quand il n y a rien a viser", () => {
    expect(laPlusProche([], 0, 0)).toBe(-1);
  });
});

describe("prochaineCible", () => {
  it("avance et recule d un cran", () => {
    expect(prochaineCible(cibles, 1, "ArrowRight")).toBe(2);
    expect(prochaineCible(cibles, 1, "ArrowDown")).toBe(2);
    expect(prochaineCible(cibles, 2, "ArrowLeft")).toBe(1);
    expect(prochaineCible(cibles, 2, "ArrowUp")).toBe(1);
  });

  it("NE BOUCLE PAS aux deux bords", () => {
    /* Repartir du debut apres la derniere ferait traverser toute la
       rangee sans qu on s en apercoive : on croit avancer d un cran et
       l on se retrouve a l autre bout, sur une destination qu on n a
       pas choisie. */
    expect(prochaineCible(cibles, 3, "ArrowRight")).toBe(3);
    expect(prochaineCible(cibles, 0, "ArrowLeft")).toBe(0);
  });

  it("le PREMIER appui entre par le bout qui correspond au sens", () => {
    expect(prochaineCible(cibles, -1, "ArrowRight")).toBe(0);
    expect(prochaineCible(cibles, -1, "ArrowLeft")).toBe(3);
  });

  it("une touche qui n est pas une fleche ne bouge rien", () => {
    expect(prochaineCible(cibles, 2, " ")).toBe(2);
    expect(prochaineCible(cibles, 2, "Escape")).toBe(2);
  });

  it("sans cible, on reste ou l on est", () => {
    expect(prochaineCible([], 0, "ArrowRight")).toBe(0);
    expect(prochaineCible([], -1, "ArrowRight")).toBe(-1);
  });

  it("une seule cible : on y reste dans les deux sens", () => {
    const une = [cibles[0]];
    expect(prochaineCible(une, 0, "ArrowRight")).toBe(0);
    expect(prochaineCible(une, 0, "ArrowLeft")).toBe(0);
    expect(prochaineCible(une, -1, "ArrowRight")).toBe(0);
  });
});
