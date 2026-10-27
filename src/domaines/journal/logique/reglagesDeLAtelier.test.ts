import { describe, expect, it } from "vitest";
import {
  REQUETE_DU_TIROIR, RUPTURE_DU_RAIL, drapeauEcrit, drapeauLu, railParDefaut,
} from "./reglagesDeLAtelier";

describe("lire un drapeau retenu", () => {
  it("rend vrai pour un et faux pour zero", () => {
    expect(drapeauLu("1", false)).toBe(true);
    expect(drapeauLu("0", true)).toBe(false);
  });

  /* SEULE L ABSENCE VAUT LE DEFAUT. Un reglage jamais touche le prend ;
     un reglage volontairement ferme reste ferme. */
  it("ne rend le defaut que pour une clef absente", () => {
    expect(drapeauLu(null, true)).toBe(true);
    expect(drapeauLu(null, false)).toBe(false);
    expect(drapeauLu("0", true)).toBe(false);
  });

  /* TOUT CE QUI N EST PAS « 1 » EST FAUX, y compris ce qui ressemble a
     un oui. C est severe, et c est ce qui evite qu un stockage abime
     rouvre un rail qu on avait ferme. */
  it("refuse tout ce qui n est pas exactement un", () => {
    for (const brut of ["", "true", "oui", "01", " 1", "1 ", "2"]) {
      expect(drapeauLu(brut, true)).toBe(false);
    }
  });

  it("ecrit ce qu il saura relire", () => {
    expect(drapeauEcrit(true)).toBe("1");
    expect(drapeauEcrit(false)).toBe("0");
    for (const v of [true, false]) expect(drapeauLu(drapeauEcrit(v), !v)).toBe(v);
  });
});

describe("le rail et sa rupture", () => {
  it("s ouvre au-dessus de la rupture, se ferme en dessous", () => {
    expect(RUPTURE_DU_RAIL).toBe(1100);
    expect(railParDefaut(1400)).toBe(true);
    expect(railParDefaut(1099)).toBe(false);
    expect(railParDefaut(800)).toBe(false);
  });

  /* ═══ ILS SE CHEVAUCHENT D UN PIXEL ═══
   *
   * `journal.css` porte `@media (max-width: 1100px)` : le rail y devient
   * un TIROIR pose par-dessus le texte. Or `max-width: 1100px` est vraie
   * A 1100, et la condition d ouverture est vraie a 1100 elle aussi.
   *
   * A cette largeur exacte, le rail s ouvre donc par defaut ET s affiche
   * en tiroir — au lieu de la colonne qu il serait un pixel plus loin.
   * Constate, non corrige : accorder les deux changerait ce que voit
   * quelqu un dont la fenetre fait exactement 1100 pixels. */
  it("s ouvre a la largeur meme ou la feuille de style le met en tiroir", () => {
    expect(railParDefaut(RUPTURE_DU_RAIL)).toBe(true);
    /* La requete que la feuille applique, ecrite ici pour qu on puisse
       la comparer sans quitter le fichier. */
    expect(REQUETE_DU_TIROIR).toBe("(max-width: 1100px)");
    /* Et la meme largeur satisfait les deux. */
    const enTiroir = (largeur: number) => largeur <= RUPTURE_DU_RAIL;
    expect(enTiroir(RUPTURE_DU_RAIL) && railParDefaut(RUPTURE_DU_RAIL)).toBe(true);
    /* Un pixel plus loin, elles se separent proprement. */
    expect(enTiroir(RUPTURE_DU_RAIL + 1)).toBe(false);
    expect(railParDefaut(RUPTURE_DU_RAIL + 1)).toBe(true);
    expect(enTiroir(RUPTURE_DU_RAIL - 1) && !railParDefaut(RUPTURE_DU_RAIL - 1)).toBe(true);
  });

  /* LE DEFAUT NE VAUT QU AU PREMIER RENDU : il est lu dans l initialiseur
     d etat. Retrecir la fenetre ensuite ne referme pas le rail — c est
     un reglage, pas une reaction. */
  it("ne dit rien de ce qui arrive apres l ouverture", () => {
    expect(railParDefaut(1400)).toBe(railParDefaut(1400));
  });
});
