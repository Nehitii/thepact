/* L ECHELLE, ET CE QU ELLE REMPLACE.
 *
 * Le panneau montrait TROIS representations du meme fait — une carte du
 * palier courant, une ligne d XP en segments, une liste de lignes a
 * pastille. Ce module en calcule UNE, et il le fait sans React : c est
 * ce qui permet de le tester, et de montrer un palier glisser a sa
 * place PENDANT la frappe sans reecrire la regle dans l editeur.
 */
import { describe, expect, it } from "vitest";
import { construireLEchelle, fauteDuSeuil } from "./echelleDesPaliers";
import type { Rank } from "@/domaines/succes/types";

const p = (id: string, min: number, name = id.toUpperCase()): Rank =>
  ({ id, name, min_points: min });

const PALIERS = [p("a", 0), p("b", 500), p("c", 1500), p("d", 3000)];

describe("construireLEchelle : l ordre et le sens", () => {
  it("rend les barreaux du plus haut seuil au plus bas — une echelle se lit en montant", () => {
    const e = construireLEchelle(PALIERS, 0, 5000);
    expect(e.barreaux.map((b) => b.palier.id)).toEqual(["d", "c", "b", "a"]);
  });

  it("retrie ce qu on lui donne, quel que soit l ordre recu", () => {
    /* L ordre est la SEULE chose qui donne son sens a l echelle. Le
       supposer serait le perdre le jour ou un appelant l oublie — et
       pendant la frappe d un seuil, la liste passee n est deja plus
       celle de la base. */
    const melange = [p("c", 1500), p("a", 0), p("d", 3000), p("b", 500)];
    expect(construireLEchelle(melange, 0, 5000).barreaux.map((b) => b.palier.id))
      .toEqual(["d", "c", "b", "a"]);
  });

  it("rend une echelle vide sans se plaindre", () => {
    const e = construireLEchelle([], 0, 5000);
    expect(e.barreaux).toEqual([]);
    expect(e.courant).toBeNull();
    expect(e.horsDePortee).toBe(0);
  });
});

describe("l ecart au palier precedent", () => {
  it("se lit entre deux barreaux", () => {
    const e = construireLEchelle(PALIERS, 0, 5000);
    const ecarts = Object.fromEntries(e.barreaux.map((b) => [b.palier.id, b.ecart]));
    expect(ecarts).toEqual({ a: null, b: 500, c: 1000, d: 1500 });
  });

  it("est nul pour le premier barreau — il n a rien avant lui", () => {
    expect(construireLEchelle([p("seul", 250)], 0, 5000).barreaux[0].ecart).toBeNull();
  });
});

describe("ou l on se tient", () => {
  it("marque le dernier palier dont le seuil est franchi", () => {
    const marque = (xp: number) => construireLEchelle(PALIERS, xp, 5000).courant?.id ?? null;
    expect(marque(0)).toBe("a");
    expect(marque(499)).toBe("a");
    expect(marque(500)).toBe("b");
    expect(marque(2999)).toBe("c");
    expect(marque(999999)).toBe("d");
  });

  it("ne marque rien tant que le premier seuil n est pas atteint", () => {
    expect(construireLEchelle([p("b", 500)], 100, 5000).courant).toBeNull();
  });

  it("un seul barreau porte la marque", () => {
    const e = construireLEchelle(PALIERS, 1600, 5000);
    expect(e.barreaux.filter((b) => b.courant).map((b) => b.palier.id)).toEqual(["c"]);
  });

  it("dit lesquels sont atteints, et lesquels ne le sont pas", () => {
    const e = construireLEchelle(PALIERS, 1500, 5000);
    expect(e.barreaux.filter((b) => b.atteint).map((b) => b.palier.id)).toEqual(["c", "b", "a"]);
  });
});

describe("le plafond est le haut de l echelle", () => {
  it("signale un palier pose au-dessus de ce que les objectifs rapportent", () => {
    /* C EST CE QUI REMPLACE LA NOTIFICATION APRES COUP : le barreau se
       VOIT inatteignable, au lieu d etre refuse une fois la validation
       faite. */
    const e = construireLEchelle([...PALIERS, p("trop", 9000)], 0, 5000);
    expect(e.horsDePortee).toBe(1);
    expect(e.barreaux[0].palier.id).toBe("trop");
    expect(e.barreaux[0].horsDePortee).toBe(true);
    expect(e.barreaux[1].horsDePortee).toBe(false);
  });

  it("le seuil egal au plafond reste atteignable", () => {
    expect(construireLEchelle([p("pile", 5000)], 0, 5000).barreaux[0].horsDePortee).toBe(false);
  });

  it("ne declare rien hors de portee quand aucun objectif n est pose", () => {
    /* Un plafond a zero ne dit rien : il n y a pas encore d objectif,
       et tout reste possible. */
    const e = construireLEchelle(PALIERS, 0, 0);
    expect(e.horsDePortee).toBe(0);
  });
});

describe("l avancement dans un barreau", () => {
  it("va d un seuil au suivant", () => {
    const e = construireLEchelle(PALIERS, 1000, 5000);
    const b = e.barreaux.find((x) => x.palier.id === "b")!;
    expect(b.avancement).toBe(50);          /* 1000 entre 500 et 1500 */
  });

  it("vaut cent sur un barreau depasse, zero sur un barreau non entame", () => {
    const e = construireLEchelle(PALIERS, 1600, 5000);
    expect(e.barreaux.find((x) => x.palier.id === "a")!.avancement).toBe(100);
    expect(e.barreaux.find((x) => x.palier.id === "d")!.avancement).toBe(0);
  });

  it("le dernier barreau monte jusqu au plafond", () => {
    const e = construireLEchelle(PALIERS, 4000, 5000);
    /* 4000 entre 3000 et 5000 : la moitie du dernier barreau. */
    expect(e.barreaux[0].avancement).toBe(50);
  });

  it("un dernier barreau sans plafond est plein des qu on y entre", () => {
    const e = construireLEchelle([p("seul", 100)], 100, 0);
    expect(e.barreaux[0].avancement).toBe(100);
  });
});

describe("fauteDuSeuil : ce qui se dit SOUS le champ, pendant la frappe", () => {
  it("ne dit rien quand le seuil est libre", () => {
    expect(fauteDuSeuil(2000, "c", PALIERS, 5000)).toBeNull();
  });

  it("nomme le palier qui occupe deja le seuil", () => {
    expect(fauteDuSeuil(500, "c", PALIERS, 5000)).toEqual({ quoi: "occupe", parQui: "B" });
  });

  it("ne se reproche pas son propre seuil", () => {
    /* Sans cette garde, un palier serait en faute des l ouverture de
       l editeur, avant toute frappe. */
    expect(fauteDuSeuil(1500, "c", PALIERS, 5000)).toBeNull();
  });

  it("signale le depassement du plafond", () => {
    expect(fauteDuSeuil(9000, "c", PALIERS, 5000))
      .toEqual({ quoi: "au-dessus-du-plafond", plafond: 5000 });
  });

  it("laisse passer le seuil pile au plafond", () => {
    expect(fauteDuSeuil(5000, "c", PALIERS, 5000)).toBeNull();
  });

  it("ne parle pas de plafond quand il n y en a pas", () => {
    expect(fauteDuSeuil(999999, "c", PALIERS, 0)).toBeNull();
  });

  it("le seuil deja pris l emporte sur le plafond", () => {
    /* Les deux peuvent etre vraies ; on nomme la plus precise, celle
       qui designe un autre palier. */
    const e = fauteDuSeuil(6000, "c", [...PALIERS, p("haut", 6000)], 5000);
    expect(e).toEqual({ quoi: "occupe", parQui: "HAUT" });
  });
});
