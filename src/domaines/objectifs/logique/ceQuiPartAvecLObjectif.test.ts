/* CE QUE LA FENETRE DOIT DIRE — ET CE QU ELLE NE DOIT PAS DIRE.
 *
 * Le fond du sujet n est pas la peinture de la fenetre : c est qu elle
 * NOMME ce qu elle va detruire. Trois faits, et trois facons de se
 * tromper sans que rien ne casse : un nom qu on oublie de reprendre,
 * un compte d etapes pris ailleurs que dans les etapes, et un montant
 * a zero annonce comme une baisse.
 */
import { describe, expect, it } from "vitest";
import { ceQuiPartAvecLObjectif } from "./ceQuiPartAvecLObjectif";

const etapes = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i) }));

describe("ceQuiPartAvecLObjectif", () => {
  it("rend le nom, le compte d etapes et le montant", () => {
    expect(ceQuiPartAvecLObjectif({ name: "Studio", estimated_cost: 9317.5 }, etapes(4)))
      .toEqual({ nom: "Studio", etapes: 4, montant: 9317.5 });
  });

  it("compte les etapes RECUES, pas celles que l objectif croit avoir", () => {
    /* La ligne « goals » porte un « total_steps » qui peut avoir
       derive ; la liste des etapes, elle, est ce qui va disparaitre. */
    expect(ceQuiPartAvecLObjectif({ name: "x", estimated_cost: 10 }, etapes(0)).etapes).toBe(0);
    expect(ceQuiPartAvecLObjectif({ name: "x", estimated_cost: 10 }, etapes(17)).etapes).toBe(17);
  });

  it("un objectif sans montant n annonce AUCUNE baisse", () => {
    /* « Le coût du pacte baissera de 0 € » inquiete pour rien : elle
       annonce une consequence qui n existe pas. C est « null » qui
       fait taire la phrase — zero se formaterait comme un montant. */
    expect(ceQuiPartAvecLObjectif({ name: "x", estimated_cost: 0 }, etapes(2)).montant).toBeNull();
    expect(ceQuiPartAvecLObjectif({ name: "x", estimated_cost: null }, etapes(2)).montant).toBeNull();
    expect(ceQuiPartAvecLObjectif({ name: "x" }, etapes(2)).montant).toBeNull();
  });

  it("un montant negatif ne « baisse » rien : on se tait", () => {
    /* La base n en produit pas, mais l annoncer sous un titre de
       suppression dirait le contraire de ce qui se passe. */
    expect(ceQuiPartAvecLObjectif({ name: "x", estimated_cost: -50 }, etapes(1)).montant).toBeNull();
  });

  it("garde les centimes : un budget ne s arrondit pas dans un avertissement", () => {
    expect(ceQuiPartAvecLObjectif({ name: "x", estimated_cost: 141.75 }, etapes(1)).montant).toBe(141.75);
  });

  it("reprend le nom tel quel, guillemets et espaces compris", () => {
    /* Le nom est repris entre guillemets a l ecran : le nettoyer ici
       ferait diverger la fenetre de la fiche. */
    expect(ceQuiPartAvecLObjectif({ name: "  Le « grand » saut ", estimated_cost: 1 }, []).nom)
      .toBe("  Le « grand » saut ");
    expect(ceQuiPartAvecLObjectif({ name: "", estimated_cost: 1 }, []).nom).toBe("");
  });

  it("un objectif nu : rien a annoncer que son nom", () => {
    expect(ceQuiPartAvecLObjectif({ name: "Seul" }, []))
      .toEqual({ nom: "Seul", etapes: 0, montant: null });
  });
});
