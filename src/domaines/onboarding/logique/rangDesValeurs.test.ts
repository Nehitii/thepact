/* L ORDRE QUI GRAVE LE SCEAU.
 *
 * Un deplacement qui se trompe ne leve aucune erreur : il redessine la
 * corde du sceau, et le porteur jure sous un dessin qu il n a pas
 * voulu. On teste donc les bords, pas seulement le cas courant.
 */
import { describe, expect, it } from "vitest";
import { deplacerValeur, peutDescendre, peutMonter } from "./rangDesValeurs";

const V = ["Liberté", "Discipline", "Création"];

describe("deplacerValeur", () => {
  it("monte une valeur d un rang", () => {
    expect(deplacerValeur(V, 1, 0)).toEqual(["Discipline", "Liberté", "Création"]);
  });

  it("descend une valeur d un rang", () => {
    expect(deplacerValeur(V, 0, 1)).toEqual(["Discipline", "Liberté", "Création"]);
  });

  it("deplace d un bout a l autre sans perdre personne", () => {
    expect(deplacerValeur(V, 0, 2)).toEqual(["Discipline", "Création", "Liberté"]);
    expect(deplacerValeur(V, 2, 0)).toEqual(["Création", "Liberté", "Discipline"]);
  });

  it("NE PERD NI NE DUPLIQUE JAMAIS UNE VALEUR", () => {
    /* Le pire defaut possible : le porteur perdrait une valeur en
       reordonnant, et le sceau changerait sans qu il l ait demande. */
    for (let d = 0; d < V.length; d++) {
      for (let v = 0; v < V.length; v++) {
        const suite = deplacerValeur(V, d, v);
        expect([...suite].sort()).toEqual([...V].sort());
      }
    }
  });

  it("ne bouge pas hors des bornes, et rend le meme tableau", () => {
    /* Rendre une copie ferait rendre React pour rien. */
    expect(deplacerValeur(V, -1, 0)).toBe(V);
    expect(deplacerValeur(V, 0, 3)).toBe(V);
    expect(deplacerValeur(V, 5, 0)).toBe(V);
    expect(deplacerValeur(V, 1, 1)).toBe(V);
  });

  it("ne touche pas au tableau d origine", () => {
    const source = [...V];
    deplacerValeur(source, 0, 2);
    expect(source).toEqual(V);
  });

  it("supporte une liste vide ou a une seule valeur", () => {
    expect(deplacerValeur([], 0, 0)).toEqual([]);
    expect(deplacerValeur(["Seule"], 0, 1)).toEqual(["Seule"]);
  });
});

describe("les bouts de la liste", () => {
  it("la premiere ne monte pas, la derniere ne descend pas", () => {
    expect(peutMonter(0)).toBe(false);
    expect(peutMonter(1)).toBe(true);
    expect(peutDescendre(2, 3)).toBe(false);
    expect(peutDescendre(1, 3)).toBe(true);
  });

  it("une valeur seule ne bouge dans aucun sens", () => {
    expect(peutMonter(0)).toBe(false);
    expect(peutDescendre(0, 1)).toBe(false);
  });
});
