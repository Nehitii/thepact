import { describe, expect, it } from "vitest";
import { fusionDeDeuxArticles, nombreDuPrix, prixCorrige, prixDuFormulaire } from "./prix";
import type { PactWishlistItem } from "@/domaines/souhaits/types";

const garde = (p: Partial<PactWishlistItem> = {}) =>
  ({
    name: "Casque", goal_id: null, category: null,
    estimated_cost: 100, item_type: "optional", notes: null, ...p,
  }) as PactWishlistItem;

const entrant = (p: Record<string, unknown> = {}) =>
  ({
    name: "Casque bis", goalId: null, category: null,
    estimatedCost: 50, itemType: "optional" as const, notes: null, ...p,
  });

describe("nombreDuPrix — la virgule est un separateur decimal", () => {
  /* UN CLAVIER FRANCAIS PRODUIT UNE VIRGULE, et « 12,50 » vaut douze
     euros cinquante, pas NaN. */
  it("lit une virgule comme un point", () => {
    expect(nombreDuPrix("12,50")).toBe(12.5);
    expect(nombreDuPrix("12.50")).toBe(12.5);
  });

  /* NUMBER() COUPE DEJA LES BLANCS LUI-MEME — c est pour cela qu un
     « .trim() » a pu etre retire sans rien changer. Ce test fixe le
     fait de JavaScript sur lequel repose ce retrait. */
  it("supporte les blancs autour, sans avoir a les couper", () => {
    expect(nombreDuPrix("  19,99  ")).toBe(19.99);
    expect(Number("  19,99  ".replace(",", "."))).toBe(19.99);
  });

  /* NUMBER("") VAUT DEJA ZERO — c est pour cela qu un repli « || "0" »
     a pu etre retire sans rien changer. */
  it("lit un champ vide comme zero, sans repli", () => {
    expect(nombreDuPrix("")).toBe(0);
    expect(Number("")).toBe(0);
  });

  /* TRADUIRE LA PREMIERE VIRGULE OU TOUTES REVIENT AU MEME ICI, et le
     balayage de mutations l a montre en laissant survivre le passage
     de l un a l autre. Avec deux virgules ou plus, l un laisse une
     virgule et l autre laisse deux points : Number rend NaN des deux
     cotes. Avec une virgule ou zero, les deux font la meme chose.
     Ce n est pas un trou dans les tests, c est du code domine — et la
     cible TypeScript du projet ne connait meme pas replaceAll, donc
     la mutation n aurait pas compile. On l ecrit ici avec
     split/join, qui fait la meme chose et compile. */
  it.each(["12,50", "12", "1,2,3", "1,000,00", "a,b,c"])(
    "traduire la premiere virgule ou toutes revient au meme sur « %s »",
    (saisie) => {
      const laPremiere = Number(saisie.replace(",", "."));
      const toutes = Number(saisie.split(",").join("."));
      expect(Object.is(laPremiere, toutes)).toBe(true);
      expect(nombreDuPrix(saisie)).toBe(laPremiere);
    },
  );

  /* SEULE LA PREMIERE VIRGULE EST REMPLACEE : « 1,234,56 » n est pas
     un nombre, et le declarer illisible vaut mieux que d en inventer
     un. */
  it("ne lit pas un nombre a deux virgules", () => {
    expect(Number.isNaN(nombreDuPrix("1,234,56"))).toBe(true);
  });

  it("declare illisible ce qui porte un symbole", () => {
    expect(Number.isNaN(nombreDuPrix("12,50 €"))).toBe(true);
    expect(Number.isNaN(nombreDuPrix("gratuit"))).toBe(true);
  });
});

describe("prixCorrige — la correction en ligne refuse plutot que d inventer", () => {
  it("accepte un prix lisible", () => {
    expect(prixCorrige("19,99")).toBe(19.99);
    expect(prixCorrige("0")).toBe(0);
  });

  /* ON NE REMPLACE PAS UN PRIX CONNU PAR UNE INVENTION : rien n est
     ecrit, l ancien montant reste. */
  it.each(["12,50 €", "gratuit", "abc"])("refuse « %s »", (saisie) => {
    expect(prixCorrige(saisie)).toBeNull();
  });

  it("refuse un prix negatif", () => {
    expect(prixCorrige("-5")).toBeNull();
  });

  /* MAIS UN CHAMP VIDE N EST PAS REFUSE : il ECRIT ZERO.
     Number("") vaut zero en JavaScript, et zero est fini et positif —
     le garde le laisse donc passer. Effacer le prix d un article a la
     main le met a « 0 € », c est-a-dire a « gratuit », et non a
     « inconnu ». Ce test constate, il n approuve pas. */
  it.each(["", "   "])("ecrit zero, et ne refuse pas, sur « %s »", (saisie) => {
    expect(prixCorrige(saisie)).toBe(0);
  });
});

describe("prixDuFormulaire — le meme champ, une autre regle", () => {
  it("accepte un prix lisible", () => {
    expect(prixDuFormulaire("19,99")).toBe(19.99);
  });

  it("lit un champ vide comme zero", () => {
    expect(prixDuFormulaire("")).toBe(0);
  });

  it("rend toujours un nombre fini", () => {
    for (const s of ["12,50 €", "gratuit", "", "abc"]) {
      expect(Number.isFinite(prixDuFormulaire(s))).toBe(true);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   LES DEUX REGLES DIVERGENT, ET CE N EST ECRIT NULLE PART AILLEURS.

   Ces trois tests ne sont pas la pour approuver l ecart : ils sont la
   pour qu il cesse d etre invisible.
   ═══════════════════════════════════════════════════════════════ */
describe("l ecart entre les deux lectures du meme champ", () => {
  /* TAPER « 12,50 € » AVEC LE SYMBOLE : refuse a la correction, mais
     enregistre a ZERO a la creation. Le bordereau compte alors un
     article de plus pour pas un centime de plus. */
  it("un prix illisible est refuse a la correction et vaut zero au formulaire", () => {
    expect(prixCorrige("12,50 €")).toBeNull();
    expect(prixDuFormulaire("12,50 €")).toBe(0);
  });

  /* UN PRIX NEGATIF DIVERGE DANS L AUTRE SENS : la correction le
     refuse, le formulaire l accepte tel quel. */
  it("un prix negatif est refuse a la correction et accepte au formulaire", () => {
    expect(prixCorrige("-5")).toBeNull();
    expect(prixDuFormulaire("-5")).toBe(-5);
  });

  /* SUR UN CHAMP VIDE, LES DEUX S ACCORDENT — et sur zero. C est le
     seul des trois cas ou elles ne divergent pas. */
  it("un champ vide vaut zero des deux cotes", () => {
    expect(prixCorrige("")).toBe(0);
    expect(prixDuFormulaire("")).toBe(0);
  });
});

describe("fusionDeDeuxArticles", () => {
  /* DEUX FOIS LE MEME ARTICLE, C EST DEUX FOIS LA DEPENSE. */
  it("additionne les deux couts", () => {
    expect(fusionDeDeuxArticles(garde({ estimated_cost: 100 }), entrant({ estimatedCost: 50 })).estimated_cost)
      .toBe(150);
  });

  it("traite un cout absent comme zero", () => {
    expect(fusionDeDeuxArticles(garde({ estimated_cost: undefined }), entrant({ estimatedCost: undefined })).estimated_cost)
      .toBe(0);
  });

  it("additionne meme quand on ne garde rien", () => {
    expect(fusionDeDeuxArticles(undefined, entrant({ estimatedCost: 42 })).estimated_cost).toBe(42);
  });

  /* « REQUIS » L EMPORTE : retomber sur « optionnel » ferait
     disparaitre une obligation. */
  it.each([
    ["required", "optional"],
    ["optional", "required"],
    ["required", "required"],
  ])("garde « requis » quand l un des deux l est (%s + %s)", (a, b) => {
    const f = fusionDeDeuxArticles(
      garde({ item_type: a as PactWishlistItem["item_type"] }),
      entrant({ itemType: b }),
    );
    expect(f.item_type).toBe("required");
  });

  it("reste optionnel quand aucun des deux ne l exige", () => {
    expect(fusionDeDeuxArticles(garde(), entrant()).item_type).toBe("optional");
  });

  it("prefere le nom et l objectif de celui qu on garde", () => {
    const f = fusionDeDeuxArticles(garde({ name: "Casque", goal_id: "g1" }), entrant({ name: "Bis", goalId: "g2" }));
    expect(f.name).toBe("Casque");
    expect(f.goal_id).toBe("g1");
  });

  it("retombe sur l entrant quand celui qu on garde n a rien", () => {
    const f = fusionDeDeuxArticles(garde({ goal_id: null }), entrant({ goalId: "g2" }));
    expect(f.goal_id).toBe("g2");
  });

  /* DES BLANCS NE COMPTENT PAS POUR UNE CATEGORIE. */
  it("ignore une categorie faite de blancs", () => {
    expect(fusionDeDeuxArticles(garde({ category: "   " }), entrant({ category: "audio" })).category).toBe("audio");
  });

  it("rend une categorie nulle quand aucun des deux n en a", () => {
    expect(fusionDeDeuxArticles(garde(), entrant()).category).toBeNull();
  });

  /* LES DEUX NOTES SONT GARDEES : perdre ce qui a ete ecrit sur un
     article est irrattrapable. */
  it("empile les deux notes l une sous l autre", () => {
    const f = fusionDeDeuxArticles(garde({ notes: "avant" }), entrant({ notes: "apres" }));
    expect(f.notes).toBe("avant\n\napres");
  });

  it("ne garde qu une note quand l autre est vide", () => {
    expect(fusionDeDeuxArticles(garde({ notes: "seule" }), entrant({ notes: "  " })).notes).toBe("seule");
    expect(fusionDeDeuxArticles(garde({ notes: null }), entrant({ notes: "seule" })).notes).toBe("seule");
  });

  it("rend des notes nulles quand il n y en a aucune", () => {
    expect(fusionDeDeuxArticles(garde(), entrant()).notes).toBeNull();
  });
});
