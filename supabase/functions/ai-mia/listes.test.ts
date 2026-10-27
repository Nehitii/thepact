import { describe, expect, it } from "vitest";
import { listeRendue, pourSonder } from "./listes.ts";
import { LIMITE_MAX, LIMITE_MIN, limiteDemandee } from "./bornes.ts";

describe("la sonde", () => {
  /* UNE LIGNE DE PLUS, PAS DEUX, PAS UN `count` SEPARE. Un compte
     separe se ferait dans une seconde requete, et pourrait desaccorder
     avec les lignes rendues si quelque chose bouge entre les deux. */
  it("demande exactement une ligne de plus que le plafond", () => {
    expect(pourSonder(30)).toBe(31);
    expect(pourSonder(1)).toBe(2);
  });
});

describe("ce qu une liste rend", () => {
  const dix = Array.from({ length: 10 }, (_, i) => ({ n: i }));

  it("rend tout et ne coupe pas quand il y a moins que le plafond", () => {
    const r = listeRendue(dix.slice(0, 4), 10);
    expect(r.lignes).toHaveLength(4);
    expect(r.coupe).toBe(false);
    expect(r.plafond).toBe(10);
  });

  /* LE CAS EXACT COMPTE : dix lignes rendues pour un plafond de dix,
     c est que la sonde n a RIEN ramene — la liste est entiere. Couper
     ici annoncerait un au-dela qui n existe pas. */
  it("ne coupe pas quand il y en a exactement le plafond", () => {
    const r = listeRendue(dix, 10);
    expect(r.lignes).toHaveLength(10);
    expect(r.coupe).toBe(false);
  });

  /* UNE DE PLUS, ET C EST COUPE. La onzieme est la sonde : elle prouve
     l au-dela et ne part pas au modele. */
  it("coupe des que la sonde revient, et jette la sonde", () => {
    const r = listeRendue([...dix, { n: 10 }], 10);
    expect(r.lignes).toHaveLength(10);
    expect(r.coupe).toBe(true);
    expect(r.lignes.at(-1)).toEqual({ n: 9 });
  });

  it("garde l ordre recu", () => {
    const r = listeRendue([{ n: 3 }, { n: 1 }, { n: 2 }], 2);
    expect(r.lignes).toEqual([{ n: 3 }, { n: 1 }]);
    expect(r.coupe).toBe(true);
  });

  /* UNE REQUETE QUI ECHOUE REND `null` : c est une liste vide, pas une
     liste coupee. Annoncer une coupe la ferait redemander pour rien. */
  it("traite une absence de donnees comme une liste vide et entiere", () => {
    for (const rien of [null, undefined, []]) {
      const r = listeRendue(rien, 10);
      expect(r.lignes).toEqual([]);
      expect(r.coupe).toBe(false);
    }
  });

  /* ELLE NE REND PAS LE TABLEAU RECU : le modifier ensuite ne doit pas
     modifier ce qu on a repondu. */
  it("rend un tableau a elle", () => {
    const source = [{ n: 1 }];
    const r = listeRendue(source, 10);
    source.push({ n: 2 });
    expect(r.lignes).toHaveLength(1);
  });
});

/* ═══════════════════════════════════════════════════════════════
   LA LIMITE DEMANDEE PAR LE MODELE EST ENFIN BORNEE.

   C etait `Number(args?.limit ?? 20)`, sans rien d autre : les quatre
   cas ci-dessous partaient tels quels dans l URL de la requete.
   ═══════════════════════════════════════════════════════════════ */
describe("la limite demandee", () => {
  it("prend le defaut quand rien n est demande", () => {
    expect(limiteDemandee(undefined, 20)).toBe(20);
    expect(limiteDemandee(null, 30)).toBe(30);
  });

  it("prend ce qui est demande quand c est raisonnable", () => {
    expect(limiteDemandee(5, 20)).toBe(5);
    expect(limiteDemandee(150, 20)).toBe(150);
  });

  /* LE MODELE PEUT REPONDRE EN CHAINE — c etait deja connu pour le
     journal, et un commentaire le disait. */
  it("lit un nombre ecrit en chaine", () => {
    expect(limiteDemandee("10", 20)).toBe(10);
  });

  /* « VINGT » EN TOUTES LETTRES DONNAIT NaN, et la requete partait avec
     `limit=NaN`. Ce qui ne se lit pas comme un nombre retombe sur le
     defaut — pas sur zero, qui rendrait une liste vide. */
  it("retombe sur le defaut pour ce qui n est pas un nombre", () => {
    for (const brut of ["vingt", "", "abc", {}, [], Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(limiteDemandee(brut, 20), String(brut)).toBe(20);
    }
  });

  /* ZERO RENDAIT UNE LISTE VIDE, qui se lit comme « tu n as rien ».
     C est le pire des cas : une reponse fausse et confiante. */
  it("remonte zero et les negatifs au minimum", () => {
    expect(limiteDemandee(0, 20)).toBe(LIMITE_MIN);
    expect(limiteDemandee(-5, 20)).toBe(LIMITE_MIN);
    expect(LIMITE_MIN).toBe(1);
  });

  it("ecrete ce qui depasse", () => {
    expect(limiteDemandee(100000, 20)).toBe(LIMITE_MAX);
    expect(limiteDemandee(LIMITE_MAX + 1, 20)).toBe(LIMITE_MAX);
    expect(limiteDemandee(LIMITE_MAX, 20)).toBe(LIMITE_MAX);
    expect(LIMITE_MAX).toBe(200);
  });

  /* UNE LIMITE FRACTIONNAIRE partait telle quelle. On tronque vers le
     bas : demander 2,7 lignes en donne deux. */
  it("tronque vers le bas", () => {
    expect(limiteDemandee(2.7, 20)).toBe(2);
    expect(limiteDemandee(0.9, 20)).toBe(LIMITE_MIN);
  });

  /* LE DEFAUT LUI-MEME N EST PAS ECRETE : il vient du code, pas du
     modele, et les cinq valent 10, 20, 30, 30 et 40. */
  it("rend les cinq defauts du fichier tels quels", () => {
    for (const d of [10, 20, 30, 40]) expect(limiteDemandee(undefined, d)).toBe(d);
  });
});
