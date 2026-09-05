/* CE QU UNE ROSACE DOIT TENIR.
 *
 * Une figure asymetrique ne leve aucune erreur : elle dessine. Deux
 * pactes qui portent le meme sceau non plus. Ces tests fixent les
 * proprietes que l oeil ne verifie pas — et qui, ratees, ne se voient
 * qu une fois le sceau grave chez quelqu un.
 */
import { describe, expect, it } from "vitest";
import { VERSION_ALPHABET, alphabetDeLaVersion } from "./sigil";
import { BRANCHES_POSSIBLES, rosaceDuPacte } from "./rosace";

const PI = Math.PI;
const DEUX_PI = PI * 2;
/** Ramene un angle dans [0, 2π) pour pouvoir le comparer. */
const tour = (a: number) => ((a % DEUX_PI) + DEUX_PI) % DEUX_PI;

describe("la forme de la rosace", () => {
  it("prend quatre, six ou huit branches, jamais autre chose", () => {
    for (const nom of ["Ananta", "Projet Phénix", "Kaïros", "Vœu", "z", "Le Serment gris"]) {
      expect(BRANCHES_POSSIBLES).toContain(rosaceDuPacte(nom).branches as 4 | 6 | 8);
    }
  });

  it("EST DETERMINISTE — le meme pacte, toujours la meme rosace", () => {
    const a = rosaceDuPacte("Ananta", ["Liberté", "Discipline"]);
    const b = rosaceDuPacte("Ananta", ["Liberté", "Discipline"]);
    expect(a).toEqual(b);
  });

  it("EST STABLE SUR LES ACCENTS ET LA CASSE", () => {
    expect(rosaceDuPacte("Kaïros")).toEqual(rosaceDuPacte("kairos"));
  });

  it("un pacte sans nom n a ni bande ni coeur, et c est juste", () => {
    /* Pendant la frappe : mieux vaut un cadre qui attend qu un sceau
       qu on n a pas encore. */
    const vide = rosaceDuPacte("   ");
    expect(vide.branches).toBe(0);
    expect(vide.bandes).toEqual([]);
    expect(vide.coeur).toBeNull();
  });

  it("MAIS SES VALEURS ONT DEJA LEURS MEDAILLONS", () => {
    /* Le nom est la DERNIERE declaration de la forge. Un retour anticipe
       sur « nom vide » rendait donc la rosace entiere vide pendant tout
       le rite, et le sceau se construisait d un seul coup a la fin :
       trois valeurs jurees, zero medaillon a l ecran jusqu au nom.
       Chaque medaillon descend de SA valeur, pas du nom — il doit
       exister des qu on choisit celle-ci. */
    const sansNom = rosaceDuPacte("", ["Liberté", "Discipline", "Clarté"]);
    expect(sansNom.medaillons).toHaveLength(3);
    expect(sansNom.medaillons.map((m) => m.valeur))
      .toEqual(["Liberté", "Discipline", "Clarté"]);
    expect(sansNom.medaillons.every((m) => m.d.length > 0)).toBe(true);

    /* Et le nom ne les change pas : il ajoute la bande et le coeur. */
    const avecNom = rosaceDuPacte("Ananta", ["Liberté", "Discipline", "Clarté"]);
    expect(avecNom.medaillons).toEqual(sansNom.medaillons);
  });

  it("pose une branche par secteur, la premiere en haut", () => {
    const r = rosaceDuPacte("Ananta");
    expect(r.bandes).toHaveLength(r.branches);
    expect(r.bandes[0].angle).toBeCloseTo(-PI / 2, 6);
    for (let b = 1; b < r.branches; b++) {
      const ecart = r.bandes[b].angle - r.bandes[b - 1].angle;
      expect(ecart).toBeCloseTo(DEUX_PI / r.branches, 6);
    }
  });
});

describe("LA SYMETRIE EST CONSTRUITE, PAS ESPEREE", () => {
  it("les branches se repondent en miroir gauche-droite", () => {
    /* La branche b et la branche (branches - b) lisent la meme tranche
       du nom : c est ce qui donne l axe vertical. Sans cela, aucun
       element ne tombe jamais sur un axe. */
    for (const nom of ["Ananta", "Projet Phénix", "L’Aube de fer", "Vœu"]) {
      const r = rosaceDuPacte(nom);
      for (let b = 1; b < r.branches; b++) {
        const reflet = r.branches - b;
        if (reflet === b) continue;             /* la branche du bas */
        expect(r.bandes[b].signes).toEqual(r.bandes[reflet].signes);
      }
    }
  });

  it("les angles des branches sont symetriques autour de l axe vertical", () => {
    const r = rosaceDuPacte("Ananta");
    for (let b = 1; b < r.branches; b++) {
      const reflet = r.branches - b;
      if (reflet === b) continue;
      /* Le reflet d un angle par rapport a la verticale : -π - a. */
      expect(tour(r.bandes[b].angle + r.bandes[reflet].angle)).toBeCloseTo(tour(-PI), 5);
    }
  });

  it("LES MEDAILLONS SE REPARTISSENT SUR LE TOUR, pas sur les axes", () => {
    /* Poses sur les axes des branches, trois valeurs dans une figure a
       quatre branches laissaient un axe nu : la figure perdait son
       miroir. Repartis, n valeurs gardent toujours un axe vertical. */
    for (let n = 1; n <= 5; n++) {
      const vals = Array.from({ length: n }, (_, i) => `valeur${i}`);
      const r = rosaceDuPacte("Ananta", vals);
      expect(r.medaillons).toHaveLength(n);
      expect(r.medaillons[0].angle).toBeCloseTo(-PI / 2, 6);
      for (let i = 1; i < n; i++) {
        expect(r.medaillons[i].angle - r.medaillons[i - 1].angle).toBeCloseTo(DEUX_PI / n, 6);
      }
    }
  });

  it("l ordre des valeurs change la rosace : il grave le sceau", () => {
    const a = rosaceDuPacte("Ananta", ["Liberté", "Discipline"]);
    const b = rosaceDuPacte("Ananta", ["Discipline", "Liberté"]);
    expect(a.medaillons.map((m) => m.d)).not.toEqual(b.medaillons.map((m) => m.d));
  });
});

describe("DEUX PACTES NE PORTENT PAS LE MEME SCEAU", () => {
  it("mille noms distincts donnent mille rosaces distinctes", () => {
    /* Repeter le meme motif sur chaque branche n employait que deux ou
       trois lettres : mesure sur deux mille noms, deux cent soixante et
       un partageaient leur sceau. */
    const vus = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const r = rosaceDuPacte(`pacte-${i.toString(36)}-${(i * 7).toString(36)}`);
      vus.add(`${r.branches}|${r.bandes.map((b) => b.signes.join(",")).join(";")}|${r.coeur}`);
    }
    expect(vus.size).toBe(1000);
  });
});

describe("la version", () => {
  it("dessine avec l alphabet de la version demandee", () => {
    const v1 = rosaceDuPacte("Ananta", ["Liberté"], 1);
    expect(v1.version).toBe(1);
    for (const b of v1.bandes) for (const d of b.signes) expect(alphabetDeLaVersion(1)).toContain(d);
    expect(alphabetDeLaVersion(1)).toContain(v1.coeur!);
  });

  it("un pacte jure sous la v1 ne se redessine pas en v2", () => {
    const v1 = rosaceDuPacte("Ananta", [], 1);
    const v2 = rosaceDuPacte("Ananta", [], 2);
    expect(v1.bandes[0].signes).not.toEqual(v2.bandes[0].signes);
    /* Meme structure, autre ecriture : les branches ne bougent pas. */
    expect(v1.branches).toBe(v2.branches);
  });

  it("prend la version courante quand on ne lui en donne pas", () => {
    expect(rosaceDuPacte("Ananta").version).toBe(VERSION_ALPHABET);
  });
});

describe("LA FIN DU NOM COMPTE AUTANT QUE LE DEBUT", () => {
  it("deux noms qui ne different que par leur queue n ont pas la meme rosace", () => {
    /* Les tranches se lisaient consecutivement depuis le debut : a six
       branches, huit places pour un nom de dix, et les deux derniers
       caracteres n etaient jamais lus. Mesure sur mille noms, trois
       paires portaient le meme sceau. */
    const a = rosaceDuPacte("pacte-1p-bv");
    const b = rosaceDuPacte("pacte-ap-22v");
    expect(a.bandes.map((x) => x.signes.join())).not.toEqual(b.bandes.map((x) => x.signes.join()));
  });

  it("changer le dernier caractere change la rosace", () => {
    const base = "unnompactelong";
    expect(rosaceDuPacte(base + "a").bandes.map((b) => b.signes.join()))
      .not.toEqual(rosaceDuPacte(base + "z").bandes.map((b) => b.signes.join()));
  });
});
