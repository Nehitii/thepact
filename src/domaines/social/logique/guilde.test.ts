import { describe, expect, it } from "vitest";
import {
  champsAEnregistrer, MEMBRES_PAR_DEFAUT, nombreDeMembresMax, partRemplie,
  peutDetruire, plafondAffiche, SEPARATEUR, signatureDeGuilde,
} from "./guilde";

const saisie = (p: Record<string, unknown> = {}) => ({
  name: "Ananta", description: "Old life", icon: "shield", color: "#fff",
  banniere: null, embleme: null, motd: "We are nothing.", pose: "coin",
  fondEmbleme: "", isPublic: true, maxMembres: "25", ...p,
});

describe("nombreDeMembresMax — aucune borne, ni ici ni en base", () => {
  it("lit un nombre ordinaire", () => {
    expect(nombreDeMembresMax("50")).toBe(50);
  });

  it("retombe sur vingt-cinq pour une saisie illisible", () => {
    expect(MEMBRES_PAR_DEFAUT).toBe(25);
    expect(nombreDeMembresMax("abc")).toBe(25);
    expect(nombreDeMembresMax("")).toBe(25);
  });

  /* PARSEINT S ARRETE AU PREMIER CARACTERE QUI N EST PAS UN CHIFFRE :
     « 25abc » vaut vingt-cinq, pas NaN. */
  it("s arrete au premier caractere non chiffre", () => {
    expect(nombreDeMembresMax("25abc")).toBe(25);
    expect(nombreDeMembresMax("30 membres")).toBe(30);
  });

  /* ZERO EST FAUX, DONC LE REPLI TOMBE : une guilde a zero place
     devient une guilde a vingt-cinq. */
  it("transforme zero en vingt-cinq", () => {
    expect(nombreDeMembresMax("0")).toBe(25);
  });

  /* ═══════════════════════════════════════════════════════════
     LE TROU : AUCUNE BORNE. Ces trois tests constatent, ils
     n approuvent pas. La colonne est `integer NOT NULL DEFAULT 25`,
     sans contrainte de verification.
     ═══════════════════════════════════════════════════════════ */
  it("accepte un plafond negatif", () => {
    expect(nombreDeMembresMax("-5")).toBe(-5);
  });

  it("accepte un plafond demesure", () => {
    expect(nombreDeMembresMax("999999")).toBe(999999);
  });

  /* UN PLAFOND SOUS L EFFECTIF EST ACCEPTE : la page annoncera
     « 30 membres sur 3 ». */
  it("accepte un plafond inferieur a l effectif", () => {
    expect(nombreDeMembresMax("3")).toBe(3);
  });
});

describe("plafondAffiche", () => {
  it("rend le plafond quand il y en a un", () => {
    expect(plafondAffiche(50)).toBe(50);
  });

  it.each([null, undefined, 0])("retombe sur vingt-cinq pour %s", (v) => {
    expect(plafondAffiche(v)).toBe(25);
  });

  /* CE REPLI EST LE MEME AUX SIX ENDROITS QUI L UTILISENT : le
     formulaire, la creation, la carte du panneau, la page de guilde
     et le crochet de creation. Il n y en a plus qu un. */
  it("laisse passer un plafond negatif, comme la saisie", () => {
    expect(plafondAffiche(-5)).toBe(-5);
  });
});

describe("partRemplie", () => {
  it("rend le pourcentage rempli", () => {
    expect(partRemplie(5, 25)).toBe(20);
    expect(partRemplie(0, 25)).toBe(0);
    expect(partRemplie(25, 25)).toBe(100);
  });

  it("arrondit au plus proche", () => {
    expect(partRemplie(1, 3)).toBe(33);
    expect(partRemplie(2, 3)).toBe(67);
  });

  /* ECRETEE A CENT PAR LE HAUT : une guilde peut depasser son plafond
     si celui-ci a ete abaisse apres coup. */
  it("ecrete a cent quand l effectif depasse le plafond", () => {
    expect(partRemplie(30, 3)).toBe(100);
  });

  /* MAIS PAS PAR LE BAS : un plafond negatif donne une part negative,
     et la barre se dessine a l envers. Constate, non corrige. */
  it("rend une part negative pour un plafond negatif", () => {
    expect(partRemplie(5, -5)).toBe(-100);
  });

  it("prend le repli quand le plafond est absent", () => {
    expect(partRemplie(5, null)).toBe(20);
  });
});

describe("signatureDeGuilde — le caractere nul n est pas decoratif", () => {
  it("change quand un champ enregistre change", () => {
    const a = signatureDeGuilde({ name: "Ananta", motd: "x" });
    const b = signatureDeGuilde({ name: "Ananta", motd: "y" });
    expect(a).not.toBe(b);
  });

  it("ne change pas quand rien ne bouge", () => {
    expect(signatureDeGuilde({ name: "Ananta" })).toBe(signatureDeGuilde({ name: "Ananta" }));
  });

  /* AVEC UNE VIRGULE, DEUX ETATS DIFFERENTS DONNERAIENT LA MEME
     SIGNATURE : une devise « a,b » suivie d une icone « c » se lirait
     comme une devise « a » suivie d une icone « b,c ». Le formulaire
     cesserait de se remettre a jour, en silence. */
  it("distingue deux repartitions qu une virgule confondrait", () => {
    const a = signatureDeGuilde({ name: "a,b", description: "c" });
    const b = signatureDeGuilde({ name: "a", description: "b,c" });
    expect(a).not.toBe(b);
    /* La preuve du piege : avec une virgule, elles seraient egales. */
    expect(["a,b", "c"].join(",")).toBe(["a", "b,c"].join(","));
  });

  it("joint avec un caractere nul", () => {
    expect(SEPARATEUR).toBe(String.fromCharCode(0));
    expect(SEPARATEUR).toHaveLength(1);
  });

  /* LA SIGNATURE NE RETIENT QUE LES CHAMPS ENREGISTRES : une colonne
     qui ne concerne pas le formulaire — l XP d un raid — ne doit pas
     le faire se reinitialiser en pleine saisie. */
  it("ignore une colonne qui n est pas dans le formulaire", () => {
    const a = signatureDeGuilde({ name: "Ananta" } as never);
    const b = signatureDeGuilde({ name: "Ananta", xp: 999 } as never);
    expect(a).toBe(b);
  });

  it("porte les onze champs", () => {
    expect(signatureDeGuilde({}).split(SEPARATEUR)).toHaveLength(11);
  });
});

describe("champsAEnregistrer", () => {
  it("coupe les blancs du nom, de la devise et du mot du jour", () => {
    const c = champsAEnregistrer(saisie({ name: "  Ananta  ", description: "  Old life  ", motd: "  x  " }));
    expect(c.name).toBe("Ananta");
    expect(c.description).toBe("Old life");
    expect(c.motd).toBe("x");
  });

  /* UN CHAMP VIDE DEVIENT « RIEN » plutot qu une chaine vide : la
     difference se voit a l affichage, ou une devise vide laisse un
     bloc sans texte au lieu de disparaitre. */
  it.each(["", "   "])("transforme une devise vide (%s) en rien", (v) => {
    expect(champsAEnregistrer(saisie({ description: v })).description).toBeNull();
    expect(champsAEnregistrer(saisie({ motd: v })).motd).toBeNull();
  });

  it("transforme un fond d embleme vide en rien", () => {
    expect(champsAEnregistrer(saisie({ fondEmbleme: "" })).emblem_bg).toBeNull();
  });

  /* MAIS PAS LE NOM : une guilde sans nom n est pas enregistrable, et
     c est le formulaire qui le refuse avant d arriver ici. */
  it("laisse un nom vide passer tel quel", () => {
    expect(champsAEnregistrer(saisie({ name: "   " })).name).toBe("");
  });

  it("emporte le plafond lu depuis la saisie", () => {
    expect(champsAEnregistrer(saisie({ maxMembres: "50" })).max_members).toBe(50);
    expect(champsAEnregistrer(saisie({ maxMembres: "zero" })).max_members).toBe(25);
  });

  it("pose exactement les onze colonnes de la signature", () => {
    expect(Object.keys(champsAEnregistrer(saisie())).sort()).toEqual([
      "banner_url", "blason_pose", "color", "description", "emblem_bg",
      "emblem_url", "icon", "is_public", "max_members", "motd", "name",
    ]);
  });
});

describe("peutDetruire", () => {
  /* LE NOM DOIT ETRE RECOPIE A L IDENTIQUE : c est le seul frein
     devant une suppression sans retour. */
  it("exige le nom exact", () => {
    expect(peutDetruire("Ananta", "Ananta")).toBe(true);
  });

  it.each(["ananta", "ANANTA", " Ananta", "Ananta ", "Anant", ""])(
    "refuse « %s »",
    (saisi) => {
      expect(peutDetruire(saisi, "Ananta")).toBe(false);
    },
  );
});

/* ═══════════════════════════════════════════════════════════════
   LA BASE DIX N EST PAS DECORATIVE, ET LES DEUX APPELANTS NE
   S ACCORDAIENT PAS.

   Avant cette coupe, la CREATION d une guilde lisait le plafond avec
   `parseInt(x, 10)` et sa MODIFICATION avec `parseInt(x)`. Depuis
   ES5, parseInt suppose la base dix pour tout ce qui ne commence pas
   par « 0x » — les deux etaient donc identiques SAUF sur une saisie
   hexadecimale. Taper « 0x1F » donnait 25 a la creation (la base dix
   lit zero, et le repli tombe) et 31 a la modification.

   Le balayage de mutations a laisse survivre le retrait de la base
   dix jusqu a ce que ce cas soit ecrit. La coupe unifie sur la base
   dix : c est la seule des deux qui ait un sens pour un nombre de
   membres.
   ═══════════════════════════════════════════════════════════════ */
describe("la base dix, et la divergence qu elle refermait", () => {
  it("lit « 0x1F » comme zero, donc comme le defaut", () => {
    expect(nombreDeMembresMax("0x1F")).toBe(25);
  });

  it("aurait lu trente et un sans la base dix", () => {
    expect(parseInt("0x1F")).toBe(31);
    expect(parseInt("0x1F", 10)).toBe(0);
  });

  /* SUR TOUT LE RESTE, LES DEUX SONT IDENTIQUES : un zero de tete ne
     fait plus lire en octal depuis ES5. */
  it.each(["25", "08", "010", "  30", "3.9", "-5", "abc", ""])(
    "donne la meme chose avec ou sans base dix pour « %s »",
    (saisi) => {
      expect(Object.is(parseInt(saisi, 10), parseInt(saisi))).toBe(true);
    },
  );

  /* PARSEINT TRONQUE UN DECIMAL, il n arrondit pas : « 3.9 » places
     font trois places. */
  it("tronque un plafond decimal", () => {
    expect(nombreDeMembresMax("3.9")).toBe(3);
  });
});
