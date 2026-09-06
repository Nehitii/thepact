import { describe, expect, it } from "vitest";
import {
  CL_PAR_VERRE, formaterQuantite, pasAffiche, quantiteAffichee,
  uniteCourte, uniteValide, verresDepuisAffichage,
} from "./hydratation";

/* VERRES OU LITRES — LA MEME QUANTITE, DEUX LANGUES.
 *
 * La base ne stocke que des verres entiers : « hydration_glasses » est
 * un entier, et tout l historique est deja ecrit avec. La conversion
 * n existe qu a l affichage.
 *
 * CE QUI PEUT CASSER ICI, c est l aller-retour. Un affichage qui ne
 * revient pas a la meme valeur stockee fait deriver le releve a chaque
 * ouverture du curseur — l utilisateur ne touche a rien et son compte
 * change. C est le seul defaut de ce module qui serait invisible en
 * relecture et evident a l usage.
 */

describe("L unite lue en base", () => {
  it("ne connait que deux mots, et retombe sur les verres", () => {
    expect(uniteValide("liters")).toBe("liters");
    expect(uniteValide("glasses")).toBe("glasses");
    /* Une colonne vide, une valeur d une version anterieure, une faute
       de frappe : tout retombe sur l unite domestique plutot que de
       rendre undefined a un composant qui n en attend pas. */
    expect(uniteValide(null)).toBe("glasses");
    expect(uniteValide(undefined)).toBe("glasses");
    expect(uniteValide("")).toBe("glasses");
    expect(uniteValide("litres")).toBe("glasses");
  });
});

describe("L aller-retour entre les deux langues", () => {
  it("REND EXACTEMENT LE MEME NOMBRE DE VERRES, dans les deux unites", () => {
    /* La garde qui compte : afficher puis relire ne doit rien deplacer.
       Zero a vingt verres couvre tout ce qu un curseur propose. */
    for (let verres = 0; verres <= 20; verres++) {
      for (const unite of ["glasses", "liters"] as const) {
        expect(verresDepuisAffichage(quantiteAffichee(verres, unite), unite)).toBe(verres);
      }
    }
  });

  it("un verre vaut un quart de litre, et le facteur ne vit qu a un endroit", () => {
    expect(CL_PAR_VERRE).toBe(25);
    expect(quantiteAffichee(4, "liters")).toBeCloseTo(1, 10);
    expect(quantiteAffichee(6, "liters")).toBeCloseTo(1.5, 10);
    expect(quantiteAffichee(6, "glasses")).toBe(6);
  });

  it("une saisie en litres tombe sur le verre le plus proche", () => {
    /* Le stockage est entier : 0,3 L n existe pas en base. On arrondit
       plutot que de tronquer, sinon toute saisie perdrait un demi-verre
       vers le bas. */
    expect(verresDepuisAffichage(0.3, "liters")).toBe(1);
    expect(verresDepuisAffichage(0.4, "liters")).toBe(2);
    expect(verresDepuisAffichage(1.5, "liters")).toBe(6);
    expect(verresDepuisAffichage(2.4, "glasses")).toBe(2);
  });
});

describe("La quantite ecrite", () => {
  it("n ecrit jamais un zero decimal inutile", () => {
    /* « 1,0 L » se lit comme une precision qu on n a pas. */
    expect(formaterQuantite(4, "liters")).toBe("1");
    expect(formaterQuantite(8, "liters")).toBe("2");
  });

  it("garde la virgule francaise pour les demis et les quarts", () => {
    expect(formaterQuantite(2, "liters")).toBe("0,5");
    expect(formaterQuantite(6, "liters")).toBe("1,5");
    expect(formaterQuantite(1, "liters")).toBe("0,25");
  });

  it("en verres, un entier et rien d autre", () => {
    expect(formaterQuantite(6, "glasses")).toBe("6");
    expect(formaterQuantite(0, "glasses")).toBe("0");
  });
});

describe("Le pas du curseur", () => {
  it("avance d un verre, ou d un quart de litre", () => {
    expect(pasAffiche("glasses")).toBe(1);
    expect(pasAffiche("liters")).toBeCloseTo(0.25, 10);
  });

  it("ET UN PAS TOMBE TOUJOURS SUR UN VERRE ENTIER", () => {
    /* Sinon le curseur proposerait des positions que la base ne sait
       pas stocker, et deux crans differents rendraient la meme valeur. */
    const pas = pasAffiche("liters");
    for (let n = 0; n <= 20; n++) {
      expect(verresDepuisAffichage(n * pas, "liters")).toBe(n);
    }
  });
});

describe("Le mot qui suit le nombre", () => {
  it("« L » ne s accorde pas, « verre » si", () => {
    expect(uniteCourte("liters", "verres")).toBe("L");
    expect(uniteCourte("glasses", "verres")).toBe("verres");
    /* Le pluriel vient de la cle de traduction : ce module ne fait que
       choisir entre les deux registres. */
    expect(uniteCourte("glasses", "glasses")).toBe("glasses");
  });
});
