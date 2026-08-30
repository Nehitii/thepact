import { describe, expect, it } from "vitest";
import { apercuDeLExistant, prixEnregistre } from "./prix";
import type { PactWishlistItem } from "@/domaines/souhaits/types";

describe("lire un prix deja enregistre", () => {
  it("rend le nombre tel quel", () => {
    expect(prixEnregistre(29.99)).toBe(29.99);
    expect(prixEnregistre(4199)).toBe(4199);
  });

  /* LA BASE PEUT ENVOYER DU TEXTE : un `numeric` PostgreSQL arrive
     souvent en chaine (« 30678.34 »), et c est ce qui obligeait chaque
     lecture a passer par `Number`. */
  it("lit un montant venu en texte", () => {
    expect(prixEnregistre("30678.34")).toBe(30678.34);
    expect(prixEnregistre("7")).toBe(7);
  });

  /* ZERO EST UN PRIX, pas une absence : un article offert coute zero,
     et un repli qui le remplacerait mentirait sur le total. C est tout
     l ecart avec un `|| defaut`. */
  it("garde le zero", () => {
    expect(prixEnregistre(0)).toBe(0);
    expect(prixEnregistre("0")).toBe(0);
    expect(prixEnregistre("0.00")).toBe(0);
  });

  /* UN SEUL NaN CONTAMINE TOUTE UNE SOMME, et l ecran affiche
     « NaN € » au lieu d un total. La colonne est NOT NULL et n a
     produit aucune valeur illisible sur les 83 lignes du compte
     (mesure le 30/08/2026) — mais un total d argent ne doit pas
     dependre de ce que la base ne devrait pas faire. */
  it("refuse ce qui n est pas un nombre", () => {
    expect(prixEnregistre(null)).toBe(0);
    expect(prixEnregistre(undefined)).toBe(0);
    expect(prixEnregistre("")).toBe(0);
    expect(prixEnregistre("gratuit")).toBe(0);
    expect(prixEnregistre(Number.NaN)).toBe(0);
    expect(prixEnregistre(Number.POSITIVE_INFINITY)).toBe(0);
  });

  /* IL LIT LE NOMBRE QUI COMMENCE LA CHAINE. `Number("29.99 €")` rend
     NaN, donc zero apres repli ; ici l unite ne fait pas perdre le
     montant. C est le seul point ou cette lecture differe des six
     qu elle remplace — et aucune ligne du compte ne le declenche. */
  it("ne perd pas un montant suivi d une unite", () => {
    expect(prixEnregistre("29.99 €")).toBe(29.99);
    expect(prixEnregistre("1500EUR")).toBe(1500);
  });

  /* Une somme reste une somme : le total du compte, recompose. */
  it("additionne sans deriver", () => {
    const lignes = ["29.99", "59.99", "399.99", 4199, "1500"];
    expect(lignes.reduce<number>((s, x) => s + prixEnregistre(x), 0)).toBeCloseTo(6188.97, 2);
  });
});

describe("l apercu de l article deja la", () => {
  const article = (p: Partial<PactWishlistItem>) => ({
    name: "Bouilloire", goal_id: null, category: "Maison",
    estimated_cost: 29.99, item_type: "optional", notes: "a verifier",
    goal: null, ...p,
  }) as unknown as PactWishlistItem;

  it("montre la ligne complete quand on l a", () => {
    expect(apercuDeLExistant(article({}), { name: "autre" })).toEqual({
      name: "Bouilloire", goalId: null, goalName: null, category: "Maison",
      estimatedCost: 29.99, itemType: "optional", notes: "a verifier",
    });
  });

  /* LE DOUBLON NE PORTE QUE SON NOM : quand la ligne complete manque —
     elle vient d une autre requete — c est ce nom qui s affiche, plutot
     qu une fenetre vide qui ferait douter de ce qu on fusionne. */
  it("retombe sur le nom du doublon quand la ligne manque", () => {
    const a = apercuDeLExistant(undefined, { name: "Bouilloire" });
    expect(a.name).toBe("Bouilloire");
    expect(a.estimatedCost).toBe(0);
    expect(a.itemType).toBe("optional");
    expect(a.goalId).toBeNull();
    expect(a.goalName).toBeNull();
    expect(a.notes).toBeNull();
  });

  /* « OPTIONNEL » EST LE REPLI, ET IL EST PRUDENT DANS LE BON SENS :
     annoncer « requis » pour un type inconnu ferait croire a une
     obligation qui n existe peut-etre pas. La fusion, elle, fait
     l inverse — elle garde « requis » des que l un des deux l est.

     MAIS UN REPLI N EST PAS UNE VALEUR PAR DEFAUT : un article
     REELLEMENT requis doit s afficher requis. Sans la seconde
     assertion, remplacer la lecture par la constante « optional »
     passait le balayage de mutations — et la fenetre aurait sous-dit
     une obligation. */
  it("retombe sur « optionnel » sans ecraser « requis »", () => {
    expect(apercuDeLExistant(article({ item_type: undefined as never }), { name: "x" }).itemType)
      .toBe("optional");
    expect(apercuDeLExistant(article({ item_type: "required" }), { name: "x" }).itemType)
      .toBe("required");
  });

  it("lit le prix comme partout ailleurs", () => {
    expect(apercuDeLExistant(article({ estimated_cost: "1500" as never }), { name: "x" }).estimatedCost)
      .toBe(1500);
    expect(apercuDeLExistant(article({ estimated_cost: null as never }), { name: "x" }).estimatedCost)
      .toBe(0);
  });

  /* Le nom de l objectif ne s affiche que s il y en a un. */
  it("porte le nom de l objectif quand il y en a un", () => {
    const a = apercuDeLExistant(
      article({ goal_id: "g1", goal: { name: "Voyage" } as never }), { name: "x" },
    );
    expect(a.goalId).toBe("g1");
    expect(a.goalName).toBe("Voyage");
  });
});
