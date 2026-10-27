/* CE QU UNE ECRITURE DOIT TENIR.
 *
 * Un signe rate ne leve aucune erreur : il dessine. Deux lettres qui
 * portent la meme forme, un signe ecrase dans une bande sans largeur,
 * une famille qui se repete — les trois se lisent comme du dessin
 * correct. Ces tests fixent ce que l oeil ne verifie pas.
 */
import { describe, expect, it } from "vitest";
import { ALPHABET_V2, alphabetEngendre, signeDuReseau } from "./reseau";

/** Les points d un chemin, pour mesurer sa boite. */
function boite(d: string): { largeur: number; hauteur: number } {
  const nombres = d.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
  const xs: number[] = [];
  const ys: number[] = [];
  /* On ne lit que les couples de coordonnees : les rayons d arc sont
     suivis de trois drapeaux, qu on saute. */
  const jetons = d.split(/(?=[MLA])/);
  for (const jeton of jetons) {
    const n = jeton.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
    if (jeton.startsWith("M") || jeton.startsWith("L")) {
      xs.push(n[0]); ys.push(n[1]);
    } else if (jeton.startsWith("A")) {
      xs.push(n[5]); ys.push(n[6]);
    }
  }
  void nombres;
  return { largeur: Math.max(...xs) - Math.min(...xs), hauteur: Math.max(...ys) - Math.min(...ys) };
}

describe("l alphabet engendre", () => {
  it("porte vingt-quatre signes", () => {
    expect(ALPHABET_V2).toHaveLength(24);
  });

  it("N EN A AUCUN EN DOUBLE — deux lettres identiques sont une lettre perdue", () => {
    /* Le tirage direct en laissait seize distincts sur vingt-quatre :
       le melangeur ne suffit pas, on retient explicitement les formes
       qu on n a pas deja vues. */
    expect(new Set(ALPHABET_V2).size).toBe(24);
  });

  it("EST DETERMINISTE — le meme indice, toujours le meme signe", () => {
    expect(signeDuReseau(7)).toBe(signeDuReseau(7));
    expect(alphabetEngendre(signeDuReseau)).toEqual([...ALPHABET_V2]);
  });

  it("tient tout entier dans la boite unitaire", () => {
    for (const d of ALPHABET_V2) {
      const n = d.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
      for (const v of n) {
        expect(v).toBeGreaterThanOrEqual(-0.05);
        expect(v).toBeLessThanOrEqual(1.05);
      }
    }
  });

  it("AUCUN SIGNE N EST ECRASE : ils occupent tous les deux dimensions", () => {
    /* Trois noeuds presque alignes donnaient un signe haut de huit
       centiemes — un trait, pas une forme. Les noeuds se repartissent
       donc sur la couronne, deux places au moins entre eux. */
    for (const d of ALPHABET_V2) {
      const b = boite(d);
      expect(b.largeur).toBeGreaterThan(0.35);
      expect(b.hauteur).toBeGreaterThan(0.35);
    }
  });

  it("relie trois ou quatre noeuds, jamais deux ni cinq", () => {
    for (let i = 0; i < 48; i++) {
      /* Chaque noeud pose deux arcs ; les segments droits comptent les
         liens. On compte les « M » : un pour le trace, un par noeud. */
      const m = (signeDuReseau(i).match(/M/g) ?? []).length;
      expect(m).toBeGreaterThanOrEqual(4);
      expect(m).toBeLessThanOrEqual(5);
    }
  });

  it("s arrete meme si la regle ne produit qu une forme", () => {
    /* Sans borne, une regle mal ecrite tournerait sans fin. */
    expect(alphabetEngendre(() => "M0 0 L1 1", 24)).toHaveLength(1);
  });
});
