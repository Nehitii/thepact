/* LA MACHINE A REPLIQUES.
 *
 * Ce qui se casse ici ne casse rien : une expression qui saute, un
 * visage qui parait trop tot, une bulle qui remplace la precedente au
 * lieu de s y ajouter. Trois defauts qui se lisent comme une scene
 * correcte, et qui defont le seul effet qu on cherche — qu elle
 * commence etrange DEUX repliques, puis se reprenne.
 */
import { describe, expect, it } from "vitest";
import {
  DERNIERE, REPLIQUES, aFiniDeParler, expressionAu, repliquesDites, visageVisible,
} from "./repliques";

describe("la sequence", () => {
  it("compte dix repliques, sans cle en double", () => {
    expect(REPLIQUES).toHaveLength(10);
    expect(new Set(REPLIQUES.map((r) => r.cle)).size).toBe(10);
  });

  it("LES DEUX PREMIERES SORTENT DU NOIR, sans visage", () => {
    /* Elle arrive dans le noir qui suit le pacte : d abord l anneau
       seul. Un visage des la premiere ligne ferait d elle une
       presence attendue, ce qu elle n est pas. */
    expect(REPLIQUES[0].visage).toBe(false);
    expect(REPLIQUES[1].visage).toBe(false);
    expect(REPLIQUES[2].visage).toBe(true);
  });

  it("ELLE COMMENCE ETRANGE DEUX REPLIQUES, PUIS SE REPREND", () => {
    /* C est tout le dosage : au-dela, on invente un deuxieme
       personnage, et le premier ne s en remet pas. */
    expect(REPLIQUES.slice(0, 2).map((r) => r.cle)).toEqual(["quelquun", "nouveau"]);
    expect(REPLIQUES[2].cle).toBe("nom");
  });

  it("n emploie que des visages deja precharges", () => {
    /* Les six de « VISAGES_FREQUENTS » : le rite ne coute pas un
       octet de plus au demarrage. */
    const frequents = new Set(["surprise", "calme", "complice", "reflexion", "genee", "neutre"]);
    for (const r of REPLIQUES) expect(frequents.has(r.expression)).toBe(true);
  });

  it("marque le temps trop long avant ce qui lui echappe", () => {
    /* « Peut-etre pourras-tu… » arrive apres un silence plus long que
       les autres : c est le silence qui fait entendre l hesitation. */
    const peutEtre = REPLIQUES.findIndex((r) => r.cle === "peutEtre");
    const avant = REPLIQUES[peutEtre - 1];
    expect(REPLIQUES[peutEtre].attente).toBeGreaterThan(avant.attente);
    expect(REPLIQUES[peutEtre].expression).toBe("reflexion");
  });

  it("se reprend en genee, puis retombe en neutre pour demander", () => {
    const cles = REPLIQUES.map((r) => r.cle);
    expect(REPLIQUES[cles.indexOf("rien")].expression).toBe("genee");
    expect(REPLIQUES[cles.indexOf("pasEncore")].expression).toBe("genee");
    expect(REPLIQUES[cles.indexOf("vide")].expression).toBe("neutre");
  });

  it("finit sur la demande — c est elle qui reclame l objectif", () => {
    /* La relation commence par une demande, ce qui est exactement ce
       qu elle sera ensuite. */
    expect(REPLIQUES[DERNIERE].cle).toBe("vide");
  });

  it("chaque attente est un temps positif et raisonnable", () => {
    for (const r of REPLIQUES) {
      expect(r.attente).toBeGreaterThan(0);
      expect(r.attente).toBeLessThanOrEqual(4000);
    }
  });

  it("LE RITE TIENT SOUS LES DEUX MINUTES TRENTE", () => {
    /* La spec le pose comme condition : au-dela, la sortie « passer »
       devient le chemin normal, et on aura ecrit un rite pour
       personne. La rencontre en est la partie la plus bavarde. */
    const total = REPLIQUES.reduce((s, r) => s + r.attente, 0);
    expect(total).toBeLessThan(30_000);
  });
});

describe("repliquesDites : elles s empilent, elles ne se remplacent pas", () => {
  it("rend ce qui a ete dit jusqu au rang, inclus", () => {
    expect(repliquesDites(0)).toHaveLength(1);
    expect(repliquesDites(3)).toHaveLength(4);
    expect(repliquesDites(DERNIERE)).toHaveLength(REPLIQUES.length);
  });

  it("ne deborde jamais, dans un sens comme dans l autre", () => {
    expect(repliquesDites(-5)).toHaveLength(0);
    expect(repliquesDites(999)).toHaveLength(REPLIQUES.length);
  });
});

describe("visageVisible", () => {
  it("reste absent pendant les deux etranges", () => {
    expect(visageVisible(0)).toBe(false);
    expect(visageVisible(1)).toBe(false);
  });

  it("parait a la troisieme, et NE DISPARAIT PLUS", () => {
    /* Une fois la, elle est la : un visage qui clignote d une bulle a
       l autre serait un defaut, pas une intention. */
    for (let r = 2; r <= DERNIERE; r++) expect(visageVisible(r)).toBe(true);
  });
});

describe("expressionAu", () => {
  it("suit la replique courante", () => {
    expect(expressionAu(0)).toBe("surprise");
    expect(expressionAu(2)).toBe("calme");
    expect(expressionAu(DERNIERE)).toBe("neutre");
  });

  it("tient avant le debut", () => {
    expect(expressionAu(-1)).toBe("surprise");
  });
});

describe("aFiniDeParler", () => {
  it("dit non avant la derniere, oui a la derniere", () => {
    expect(aFiniDeParler(DERNIERE - 1)).toBe(false);
    expect(aFiniDeParler(DERNIERE)).toBe(true);
  });
});
