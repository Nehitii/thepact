import { describe, expect, it } from "vitest";
import {
  estTypeObjectif, TYPE_DE_REPLI, TYPE_PAR_DEFAUT, TYPES_OBJECTIF,
  typeALaCreation, typeALaModification,
} from "./typeDObjectif";

/* LES NEUF ETIQUETTES QUE L ENUM REFUSE. Elles existent dans
   GOAL_TAGS et pas dans goals.type : c est tout le sujet. */
const REFUSEES = [
  "arts", "tech", "travel", "work", "community",
  "nature", "spiritual", "lifestyle", "buying_selling",
];

describe("la liste des types, une seule fois", () => {
  it("porte exactement les neuf valeurs de l enum", () => {
    expect([...TYPES_OBJECTIF].sort()).toEqual([
      "creative", "diy", "financial", "health", "learning",
      "other", "personal", "professional", "relationship",
    ]);
  });

  it("reconnait chacune des neuf", () => {
    for (const t of TYPES_OBJECTIF) expect(estTypeObjectif(t)).toBe(true);
  });

  it("refuse les neuf etiquettes decoratives", () => {
    for (const t of REFUSEES) expect(estTypeObjectif(t)).toBe(false);
  });

  it("refuse la chaine vide et un mot inconnu", () => {
    expect(estTypeObjectif("")).toBe(false);
    expect(estTypeObjectif("chimere")).toBe(false);
  });

  /* LES DEUX REPLIS FONT PARTIE DE L ENUM : un repli hors liste
     ferait echouer l ecriture qu il est cense sauver. */
  it("pose deux replis qui sont eux-memes des types valides", () => {
    expect(estTypeObjectif(TYPE_PAR_DEFAUT)).toBe(true);
    expect(estTypeObjectif(TYPE_DE_REPLI)).toBe(true);
    expect([TYPE_PAR_DEFAUT, TYPE_DE_REPLI]).toEqual(["personal", "other"]);
  });
});

describe("typeALaCreation — il faut bien ecrire quelque chose", () => {
  it("prend la premiere etiquette quand l enum l accepte", () => {
    expect(typeALaCreation(["health", "arts"])).toBe("health");
  });

  /* CHOISIR « ARTS » EN PREMIERE ETIQUETTE FAISAIT ECHOUER LA
     CREATION, avec pour seul message « Failed to create goal ». */
  it.each(REFUSEES)("retombe sur « other » pour l etiquette « %s »", (tag) => {
    expect(typeALaCreation([tag])).toBe("other");
  });

  it("retombe sur « personal » quand aucune etiquette n est choisie", () => {
    expect(typeALaCreation([])).toBe("personal");
  });

  /* SEULE LA PREMIERE COMPTE : les autres sont enregistrees a part,
     par insertGoalTags — rien n est perdu. */
  it("ne regarde que la premiere etiquette", () => {
    expect(typeALaCreation(["arts", "health"])).toBe("other");
  });

  it("rend toujours un type que l enum accepte", () => {
    for (const cas of [[], ["arts"], ["health"], [""], ["chimere", "health"]]) {
      expect(estTypeObjectif(typeALaCreation(cas))).toBe(true);
    }
  });
});

describe("typeALaModification — la colonne porte deja une valeur valide", () => {
  it("ecrit le nouveau type quand il change et que l enum l accepte", () => {
    expect(typeALaModification(["health"], "personal")).toBe("health");
  });

  /* NE RIEN ECRIRE PLUTOT QUE REMPLACER PAR « OTHER » : ajouter une
     etiquette decorative ne doit pas effacer le type existant. C est
     LA difference avec la creation. */
  it.each(REFUSEES)("n ecrit rien pour l etiquette « %s »", (tag) => {
    expect(typeALaModification([tag], "health")).toBeNull();
  });

  it("n ecrit rien quand le type ne change pas", () => {
    expect(typeALaModification(["health"], "health")).toBeNull();
  });

  it("n ecrit rien quand la premiere etiquette est deja le type courant", () => {
    expect(typeALaModification([], "personal")).toBeNull();
  });

  /* LES DEUX MOMENTS DIVERGENT, ET C EST VOULU : la creation retombe,
     la modification s abstient. Ce test fixe l ecart. */
  it("s abstient la ou la creation retombe", () => {
    expect(typeALaCreation(["arts"])).toBe("other");
    expect(typeALaModification(["arts"], "health")).toBeNull();
  });
});
