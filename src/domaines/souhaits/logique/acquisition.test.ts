import { describe, expect, it } from "vitest";
import {
  LONGUEUR_DU_NOM, NOM_PAR_DEFAUT, depenseDUnAchat, moisDeLAchat,
  montantDeLArticle, nomDeLaDepense,
} from "./acquisition";

const article = (sur: Partial<Parameters<typeof depenseDUnAchat>[0]> = {}) => ({
  id: "a1", name: "Casque", estimated_cost: 120, ...sur,
});

describe("le mois ou la depense tombe", () => {
  it("ramene au premier du mois", () => {
    const m = moisDeLAchat(new Date(2026, 8, 17, 23, 45));
    expect(m.cle).toBe("2026-09-01");
    expect(m.debut.getDate()).toBe(1);
    expect(m.debut.getHours()).toBe(0);
  });

  /* UNE SEULE LECTURE D HORLOGE POUR LA CLE ET POUR L AFFICHAGE : les
     deux sortent du meme instant, donc du meme mois. */
  it("rend la meme date pour la cle et pour l affichage", () => {
    const m = moisDeLAchat(new Date(2026, 0, 31, 12, 0));
    expect(m.cle).toBe("2026-01-01");
    expect(m.debut.getMonth()).toBe(0);
  });

  it("tient au dernier instant d un mois", () => {
    expect(moisDeLAchat(new Date(2026, 11, 31, 23, 59, 59)).cle).toBe("2026-12-01");
    expect(moisDeLAchat(new Date(2027, 0, 1, 0, 0, 0)).cle).toBe("2027-01-01");
  });
});

describe("le nom de la ligne", () => {
  it("coupe les blancs", () => {
    expect(nomDeLaDepense("  Casque  ")).toBe("Casque");
  });

  /* L ORDRE COMPTE : trimer, PUIS retomber sur le defaut. Un nom fait
     de blancs devient « Achat », pas une chaine vide que la table
     refuserait. */
  it("retombe sur le defaut pour un nom vide ou fait de blancs", () => {
    expect(nomDeLaDepense("")).toBe(NOM_PAR_DEFAUT);
    expect(nomDeLaDepense("   ")).toBe(NOM_PAR_DEFAUT);
    expect(NOM_PAR_DEFAUT).toBe("Achat");
  });

  /* ET TRONQUER EN DERNIER : couper avant de trimer laisserait un nom
     finissant par une espace, que la contrainte accepte mais qui
     s affiche de travers. */
  it("tronque a cent vingt, apres avoir coupe les blancs", () => {
    expect(LONGUEUR_DU_NOM).toBe(120);
    expect(nomDeLaDepense("x".repeat(200))).toHaveLength(120);
    const avecBlancs = `  ${"y".repeat(130)}  `;
    expect(nomDeLaDepense(avecBlancs)).toBe("y".repeat(120));
    expect(nomDeLaDepense(avecBlancs).endsWith(" ")).toBe(false);
  });
});

describe("le montant lu sur l article", () => {
  it("lit un nombre", () => {
    expect(montantDeLArticle({ estimated_cost: 120 })).toBe(120);
    expect(montantDeLArticle({ estimated_cost: 0.5 })).toBe(0.5);
  });

  it("lit un nombre ecrit en texte", () => {
    expect(montantDeLArticle({ estimated_cost: "120" })).toBe(120);
  });

  it("rend zero pour ce qui est absent ou vide", () => {
    expect(montantDeLArticle({ estimated_cost: null })).toBe(0);
    expect(montantDeLArticle({ estimated_cost: undefined })).toBe(0);
    expect(montantDeLArticle({ estimated_cost: "" })).toBe(0);
    expect(montantDeLArticle({ estimated_cost: 0 })).toBe(0);
  });

  /* ═══ UN TEXTE ILLISIBLE DONNAIT NaN. IL DONNE ZERO. ═══
   *
   * Cette lecture passait par `Number(x || 0)` : sur « cent vingt »
   * elle rendait NaN, et c est le refus suivant qui le rattrapait.
   * Elle passe desormais par `prixEnregistre`, le lecteur unique du
   * domaine, qui refuse aussi bien NaN que les infinis.
   *
   * CE QUE L ECRAN VOIT NE CHANGE PAS : `!(montant > 0)` refusait NaN,
   * il refuse zero de la meme facon, et la reponse reste
   * « montant-nul ». Ce qui change est plus haut — un montant infini
   * ne peut plus devenir une ligne de depense. */
  it("ramene un texte illisible a zero", () => {
    expect(montantDeLArticle({ estimated_cost: "cent vingt" })).toBe(0);
    expect(depenseDUnAchat({ id: "a1", name: "x", estimated_cost: "cent vingt" }))
      .toEqual({ refus: "montant-nul" });
  });

  /* NaN ET LES INFINIS TOMBENT A ZERO. Le premier tombait deja, par le
     `||` ; le second NON — `Number("Infinity")` vaut l infini, qui est
     strictement positif, et serait donc passe jusque dans la ligne du
     mois. Aucune colonne numerique ne produit cela ; un montant
     d argent ne doit pas dependre de ce que la base ne fait pas. */
  it("ramene NaN et les infinis a zero", () => {
    expect(montantDeLArticle({ estimated_cost: NaN })).toBe(0);
    expect(montantDeLArticle({ estimated_cost: "Infinity" })).toBe(0);
    expect(depenseDUnAchat({ id: "a1", name: "x", estimated_cost: NaN }))
      .toEqual({ refus: "montant-nul" });
    expect(depenseDUnAchat({ id: "a1", name: "x", estimated_cost: "Infinity" }))
      .toEqual({ refus: "montant-nul" });
  });
});

describe("les trois refus", () => {
  it("refuse quand il n y a pas d article", () => {
    expect(depenseDUnAchat(null)).toEqual({ refus: "sans-article" });
    expect(depenseDUnAchat(undefined)).toEqual({ refus: "sans-article" });
  });

  /* UN ARTICLE VENU DU COUT D UN OBJECTIF EST DEJA COMPTE DANS LE
     PACTE : l ecrire au mois le compterait deux fois. */
  it("refuse un article deja compte dans le pacte", () => {
    expect(depenseDUnAchat(article({ source_goal_cost_id: "c1" })))
      .toEqual({ refus: "compte-dans-le-pacte" });
  });

  it("refuse un montant nul ou negatif", () => {
    expect(depenseDUnAchat(article({ estimated_cost: 0 }))).toEqual({ refus: "montant-nul" });
    expect(depenseDUnAchat(article({ estimated_cost: null }))).toEqual({ refus: "montant-nul" });
    expect(depenseDUnAchat(article({ estimated_cost: -5 }))).toEqual({ refus: "montant-nul" });
  });

  /* ═══ `!(montant > 0)` ET NON `montant <= 0` ═══
   *
   * Les deux disent la meme chose pour tout nombre, mais PAS pour NaN :
   * `NaN <= 0` est FAUX, donc la seconde forme laisserait passer un
   * montant illisible jusque dans la ligne du mois — un « NaN € » dans
   * les depenses, que rien ensuite ne saurait additionner.
   *
   * DEPUIS QUE LA LECTURE PASSE PAR `prixEnregistre`, NaN N ARRIVE PLUS
   * PAR CE CHEMIN : il est deja ramene a zero en amont. La forme reste
   * pourtant celle-ci, et le test avec — `montant` est un `number`
   * ordinaire, rien dans sa signature n interdit a un futur appelant
   * de lui tendre un NaN, et c est la derniere garde avant l ecriture.
   * Les trois assertions du bas fixent le fait de JavaScript qui rend
   * cette forme necessaire, independamment de qui appelle. */
  it("refuse un montant illisible, ce qu une comparaison simple ne ferait pas", () => {
    expect(depenseDUnAchat(article({ estimated_cost: "cent vingt" })))
      .toEqual({ refus: "montant-nul" });
    /* Le montant illisible passe par une variable : comparer le
       litteral `NaN` est refuse par le lint, et c est justement parce
       que ces comparaisons-la surprennent. */
    const illisible = Number("cent vingt");
    expect(Number.isNaN(illisible)).toBe(true);
    expect(illisible <= 0).toBe(false);
    expect(!(illisible > 0)).toBe(true);
  });

  /* L ORDRE DES TROIS REFUS COMPTE : un article du pacte SANS montant
     est refuse pour le pacte, pas pour le montant. Inverser les deux
     changerait la raison, pas la decision — mais la raison est ce
     qu on lit quand on cherche pourquoi une depense n est pas apparue. */
  it("refuse pour le pacte avant de regarder le montant", () => {
    expect(depenseDUnAchat(article({ source_goal_cost_id: "c1", estimated_cost: 0 })))
      .toEqual({ refus: "compte-dans-le-pacte" });
  });
});

describe("la ligne ecrite", () => {
  it("porte l identifiant de l article comme cle", () => {
    const issue = depenseDUnAchat(article());
    expect("ligne" in issue && issue.ligne.ligne_id).toBe("a1");
  });

  /* LE PREVU ET LE REEL SONT LE MEME NOMBRE : un souhait n a qu une
     estimation, et inventer un ecart serait inventer une donnee. */
  it("pose le meme montant des deux cotes", () => {
    const issue = depenseDUnAchat(article({ estimated_cost: 89.9 }));
    expect(issue).toEqual({
      ligne: {
        ligne_id: "a1", genre: "expense", nom: "Casque",
        montant_prevu: 89.9, montant_reel: 89.9, pointe: true,
      },
    });
  });

  it("nettoie le nom avant de l ecrire", () => {
    const issue = depenseDUnAchat(article({ name: "   " }));
    expect("ligne" in issue && issue.ligne.nom).toBe(NOM_PAR_DEFAUT);
  });

  it("accepte un montant en texte", () => {
    const issue = depenseDUnAchat(article({ estimated_cost: "42" }));
    expect("ligne" in issue && issue.ligne.montant_reel).toBe(42);
  });

  it("marque toujours la ligne comme pointee", () => {
    const issue = depenseDUnAchat(article());
    expect("ligne" in issue && issue.ligne.pointe).toBe(true);
    expect("ligne" in issue && issue.ligne.genre).toBe("expense");
  });
});
