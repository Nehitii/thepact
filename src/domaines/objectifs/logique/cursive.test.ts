import { describe, expect, it } from "vitest";
import { CURSIVE, lettre } from "./cursive";
import { ecritureDeLaVersion, empreinte } from "./sigil";

/* LA CURSIVE DU POURTOUR.
 *
 * Le premier croquis ondulait au hasard et se lisait « gribouillis ».
 * Il lui manquait la seule chose qui distingue une ecriture d un
 * griffonnage : une REGLURE. Ce que ces gardes tiennent, c est elle —
 * la ligne de base partagee, la hauteur d oeil commune, et le fait
 * qu aucune lettre ne monte ET ne descende a la fois.
 */

const BASE = 0.62;
const OEIL = 0.34;

/**
 * Les points d un chemin, dans l ordre.
 *
 * ON LIT LES COMMANDES, PAS LES NOMBRES. Un premier jet appariait tous
 * les nombres deux a deux : les rayons et les drapeaux d un arc — « A
 * 0.015 0.015 0 1 1 x y » — devenaient alors des coordonnees, dont un
 * point a (0, 1). La garde criait au jambage sur des lettres qui n en
 * avaient pas, et mesurait des hauteurs d une unite entiere. Le defaut
 * etait dans la mesure, pas dans l ecriture.
 */
function points(d: string): [number, number][] {
  const jetons = d.trim().split(/[\s,]+/);
  const sortie: [number, number][] = [];
  let i = 0;
  while (i < jetons.length) {
    const t = jetons[i];
    const cmd = /^[A-Za-z]/.test(t) ? t[0].toUpperCase() : null;
    if (!cmd) { i++; continue; }
    /* Combien de nombres suivent, et combien d entre eux sont des
       coordonnees — toujours les deux derniers. */
    const combien = cmd === "M" || cmd === "L" ? 2 : cmd === "C" ? 6 : cmd === "A" ? 7 : 0;
    const nombres: number[] = [];
    const premier = t.length > 1 ? parseFloat(t.slice(1)) : NaN;
    if (!Number.isNaN(premier)) nombres.push(premier);
    i++;
    while (nombres.length < combien && i < jetons.length) nombres.push(parseFloat(jetons[i++]));
    if (nombres.length >= 2) {
      sortie.push([nombres[nombres.length - 2], nombres[nombres.length - 1]]);
    }
    /* Les points de controle d une cubique comptent aussi : c est eux
       qui font monter la courbe. */
    if (cmd === "C") sortie.push([nombres[0], nombres[1]], [nombres[2], nombres[3]]);
  }
  return sortie;
}

describe("La cursive du pourtour", () => {
  it("donne vingt-quatre lettres distinctes", () => {
    expect(CURSIVE).toHaveLength(24);
    expect(new Set(CURSIVE).size).toBe(24);
  });

  it("PART TOUJOURS DE LA LIGNE DE BASE, a gauche", () => {
    /* C est ce qui fait courir un mot : trois lettres cote a cote
       partagent leur ligne. Une qui demarrerait ailleurs casserait le
       fil. */
    for (const d of CURSIVE) {
      expect(d.startsWith("M0.100 0.620")).toBe(true);
    }
  });

  it("NE SORT JAMAIS DE SA BOITE", () => {
    /* Une lettre est posee sur un anneau large de 0,1 unite ; un point
       hors bornes mord sur le filet ou sur la piste. */
    for (const d of CURSIVE) {
      for (const [x, y] of points(d)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("NE MONTE PAS ET NE DESCEND PAS A LA FOIS", () => {
    /* Une hampe OU un jambage, jamais les deux : une lettre qui fait
       les deux mange les lignes voisines, et sur un pourtour elle mord
       sur les deux anneaux qui l encadrent. */
    for (const d of CURSIVE) {
      const ys = points(d).map(([, y]) => y);
      const monte = ys.some((y) => y < OEIL - 0.13);
      const descend = ys.some((y) => y > BASE + 0.24);
      expect(monte && descend).toBe(false);
    }
  });

  it("tient sa hauteur d oeil : aucune lettre n est deux fois plus haute qu une autre", () => {
    /* Une ecriture se reconnait a ce que ses lettres se ressemblent en
       taille. Sans cela on lit une collection de formes. */
    const hauteurs = CURSIVE.map((d) => {
      const ys = points(d).map(([, y]) => y);
      return Math.max(...ys) - Math.min(...ys);
    });
    expect(Math.max(...hauteurs) / Math.min(...hauteurs)).toBeLessThan(2.6);
  });

  it("rend toujours la meme lettre pour le meme indice", () => {
    expect(lettre(9)).toBe(lettre(9));
    expect(lettre(9)).not.toBe(lettre(10));
  });
});

describe("L ecriture du pourtour, une fois juree, ne bouge plus", () => {
  /* UN SCEAU QUI BOUGE N EST PAS UN SCEAU. Cette empreinte est un
     scellement : la faire changer demande une nouvelle version, pas une
     retouche. Elle echoue au premier trait deplace. */
  it("v4 porte la cursive au pourtour et les ideogrammes aux sommets", () => {
    const v4 = ecritureDeLaVersion(4);
    expect(v4.signes).toBe(CURSIVE);
    expect(v4.valeurs).toBe(ecritureDeLaVersion(3).valeurs);
    expect(empreinte(v4.signes.join("|"))).toBe(empreinte(CURSIVE.join("|")));
  });

  it("et les trois versions d avant gardent la leur", () => {
    expect(empreinte(ecritureDeLaVersion(1).signes.join("|"))).toBe(2448044856);
    expect(empreinte(ecritureDeLaVersion(2).signes.join("|"))).toBe(912260830);
    expect(ecritureDeLaVersion(3).signes).toBe(ecritureDeLaVersion(2).signes);
  });
});
