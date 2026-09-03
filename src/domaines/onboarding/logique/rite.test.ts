/* CE QUI LAISSE PASSER, ET CE QUI RETIENT.
 *
 * Une condition d avancement qui se trompe ne casse rien : elle laisse
 * passer un pacte sans nom — que la base refusera au dernier moment du
 * rite —, ou elle retient quelqu un sur un ecran qu il a rempli. Les
 * deux se lisent comme un ecran correct.
 */
import { describe, expect, it } from "vitest";
import {
  ACTE_DE, ETAT_VIDE, RITE_ABREGE, RITE_COMPLET, VALEURS_MAX,
  ecranPrecedent, ecranSuivant, ecransDuRite, fenetresCloses,
  LIMITES, pacteDeclare, peutAvancer, peutSigner, pretASceller, type EtatDuRite,
} from "./rite";

/* Un pacte REMPLI declare son signe : l etat vide n en a plus. */
const rempli = (p: Partial<EtatDuRite> = {}): EtatDuRite => ({
  ...ETAT_VIDE,
  nomDuPorteur: "Nehiti",
  nomDuPacte: "Ananta",
  mantra: "Tenir ce qui est jure",
  symbole: "flame",
  couleur: "violet",
  valeurs: ["courage"],
  clausesAcceptees: true,
  signe: true,
  objectif: { gabarit: "30day-habit" },
  ...p,
});

describe("la forme du rite", () => {
  it("compte neuf ecrans, quatre actes", () => {
    expect(RITE_COMPLET).toHaveLength(9);
    expect(new Set(RITE_COMPLET.map((e) => ACTE_DE[e]))).toEqual(
      new Set(["eveil", "forge", "scellement", "rencontre"]),
    );
  });

  it("la forge en tient cinq, une par declaration", () => {
    expect(RITE_COMPLET.filter((e) => ACTE_DE[e] === "forge")).toHaveLength(5);
  });

  it("LE SCEAU PASSE AVANT LA PHRASE", () => {
    /* L ecart qui fait tout : en troisieme position, le sceau est un
       objet au centre de l ecran pendant tout le reste du rite. */
    expect(RITE_COMPLET.indexOf("sceau")).toBeLessThan(RITE_COMPLET.indexOf("phrase"));
  });

  it("le second passage saute l eveil et la rencontre, garde le reste", () => {
    expect(RITE_ABREGE).not.toContain("eveil");
    expect(RITE_ABREGE).not.toContain("rencontre");
    expect(RITE_ABREGE.filter((e) => ACTE_DE[e] === "forge")).toHaveLength(5);
    expect(RITE_ABREGE).toContain("scellement");
  });

  it("aucun ecran en double, dans l un comme dans l autre", () => {
    for (const suite of [RITE_COMPLET, RITE_ABREGE]) {
      expect(new Set(suite).size).toBe(suite.length);
    }
  });
});

describe("peutAvancer", () => {
  it("l eveil ne demande rien — on le regarde", () => {
    expect(peutAvancer("eveil", ETAT_VIDE)).toBe(true);
  });

  it("retient sur le porteur, le pacte et la phrase tant qu ils sont vides", () => {
    expect(peutAvancer("porteur", ETAT_VIDE)).toBe(false);
    expect(peutAvancer("pacte", ETAT_VIDE)).toBe(false);
    expect(peutAvancer("phrase", ETAT_VIDE)).toBe(false);
  });

  it("ne se laisse pas berner par des espaces", () => {
    /* « name » et « mantra » sont NOT NULL en base ; trois espaces
       passeraient la longueur et pas la colonne. */
    for (const champ of ["nomDuPorteur", "nomDuPacte", "mantra"] as const) {
      expect(peutAvancer(
        champ === "nomDuPorteur" ? "porteur" : champ === "nomDuPacte" ? "pacte" : "phrase",
        { ...ETAT_VIDE, [champ]: "   " },
      )).toBe(false);
    }
  });

  it("LES VALEURS SONT FACULTATIVES — ne rien choisir est une reponse", () => {
    /* Forcer trois cases produirait trois mensonges plutot qu un
       silence. */
    expect(peutAvancer("valeurs", { ...ETAT_VIDE, valeurs: [] })).toBe(true);
  });

  it("LE SCEAU EXIGE UN VRAI CHOIX : rien n est pose d avance", () => {
    /* L etat vide valait « flame » et « amber » : l ecran laissait
       passer sans rien toucher, et l on scellait un pacte sous un signe
       jamais choisi — grave a vie. Un choix par defaut n est pas un
       choix. */
    expect(ETAT_VIDE.symbole).toBe("");
    expect(ETAT_VIDE.couleur).toBe("");
    expect(peutAvancer("sceau", ETAT_VIDE)).toBe(false);
    expect(peutAvancer("sceau", { ...ETAT_VIDE, symbole: "flame" })).toBe(false);
    expect(peutAvancer("sceau", { ...ETAT_VIDE, couleur: "violet" })).toBe(false);
    expect(peutAvancer("sceau", { ...ETAT_VIDE, symbole: "flame", couleur: "violet" })).toBe(true);
  });

  it("le scellement refuse un pacte non declare, meme consenti et signe", () => {
    /* Sans cela « Passer le rite » depuis le premier ecran menait a un
       bouton mort : signe, consenti, et rien a ecrire. */
    expect(peutAvancer("scellement", rempli({ symbole: "" }))).toBe(false);
    expect(peutAvancer("scellement", rempli({ nomDuPacte: "" }))).toBe(false);
  });

  it("LE SCELLEMENT DEMANDE DEUX GESTES SEPARES", () => {
    /* Les fondre en un seul rendrait le consentement equivoque, ce
       qu il n a pas le droit d etre. */
    expect(peutAvancer("scellement", rempli({ clausesAcceptees: true, signe: false }))).toBe(false);
    expect(peutAvancer("scellement", rempli({ clausesAcceptees: false, signe: true }))).toBe(false);
    expect(peutAvancer("scellement", rempli({ clausesAcceptees: true, signe: true }))).toBe(true);
  });

  it("la rencontre attend un objectif, et un titre s il est sur mesure", () => {
    expect(peutAvancer("rencontre", rempli({ objectif: null }))).toBe(false);
    expect(peutAvancer("rencontre", rempli({ objectif: { surMesure: "  " } }))).toBe(false);
    expect(peutAvancer("rencontre", rempli({ objectif: { surMesure: "Ecrire" } }))).toBe(true);
    expect(peutAvancer("rencontre", rempli({ objectif: { gabarit: "fitness" } }))).toBe(true);
  });
});

describe("peutSigner : la case avant le geste", () => {
  it("ON NE COMMENCE PAS A SIGNER SANS LES CLAUSES", () => {
    /* Le theatre enrobe le consentement, il ne le remplace pas : le
       geste ne doit meme pas pouvoir demarrer avant la case. */
    expect(peutSigner(rempli({ clausesAcceptees: false }))).toBe(false);
    expect(peutSigner(rempli({ clausesAcceptees: true }))).toBe(true);
  });
});

describe("la navigation", () => {
  it("enchaine les ecrans du rite complet", () => {
    expect(ecranSuivant("eveil", false)).toBe("porteur");
    expect(ecranSuivant("sceau", false)).toBe("phrase");
    expect(ecranSuivant("rencontre", false)).toBeNull();
  });

  it("enchaine ceux du rite abrege, en sautant ce qu il saute", () => {
    expect(ecranSuivant("valeurs", true)).toBe("lecture");
    expect(ecranSuivant("scellement", true)).toBeNull();
    expect(ecranPrecedent("porteur", true)).toBeNull();
  });

  it("revient en arriere, et s arrete au premier", () => {
    expect(ecranPrecedent("porteur", false)).toBe("eveil");
    expect(ecranPrecedent("eveil", false)).toBeNull();
  });

  it("un ecran absent du rite en cours ne mene nulle part", () => {
    /* « eveil » n existe pas dans le rite abrege. */
    expect(ecranSuivant("eveil", true)).toBeNull();
    expect(ecranPrecedent("eveil", true)).toBeNull();
  });

  it("le parcours entier se traverse sans trou", () => {
    for (const abrege of [false, true]) {
      const suite = ecransDuRite(abrege);
      let ecran: string | null = suite[0];
      const vus: string[] = [];
      while (ecran) { vus.push(ecran); ecran = ecranSuivant(ecran as never, abrege); }
      expect(vus).toEqual([...suite]);
    }
  });
});

describe("fenetresCloses : la trace qui remplace la barre", () => {
  it("aucune a l eveil, puis une par fenetre franchie", () => {
    expect(fenetresCloses("eveil", false)).toBe(0);
    expect(fenetresCloses("porteur", false)).toBe(0);
    expect(fenetresCloses("pacte", false)).toBe(1);
    expect(fenetresCloses("valeurs", false)).toBe(4);
  });

  it("toutes closes une fois la forge passee", () => {
    expect(fenetresCloses("scellement", false)).toBe(5);
    expect(fenetresCloses("rencontre", false)).toBe(5);
  });

  it("compte pareil dans le rite abrege, qui garde la forge entiere", () => {
    expect(fenetresCloses("pacte", true)).toBe(1);
    expect(fenetresCloses("scellement", true)).toBe(5);
  });
});

describe("pretASceller : la garde avant l ecriture", () => {
  it("laisse passer un pacte complet et signe", () => {
    expect(pretASceller(rempli())).toBe(true);
  });

  it("REFUSE ce que la base refuserait, plutot que de le lui presenter", () => {
    /* « name » et « mantra » sont NOT NULL : un ecran saute par un
       bouton mal garde produirait un refus au dernier moment du rite. */
    expect(pretASceller(rempli({ nomDuPacte: "" }))).toBe(false);
    expect(pretASceller(rempli({ mantra: "  " }))).toBe(false);
  });

  it("refuse un pacte sans signe ou sans teinte : rien de vide n atteint la base", () => {
    expect(pretASceller(rempli({ symbole: "" }))).toBe(false);
    expect(pretASceller(rempli({ couleur: "" }))).toBe(false);
  });

  it("refuse un pacte non consenti ou non signe", () => {
    expect(pretASceller(rempli({ clausesAcceptees: false }))).toBe(false);
    expect(pretASceller(rempli({ signe: false }))).toBe(false);
  });

  it("ne demande PAS de valeurs ni d objectif", () => {
    /* Les valeurs sont facultatives, et l objectif se demande apres le
       scellement — c est M.I.A. qui le reclame, le pacte est deja jure
       quand elle arrive. */
    expect(pretASceller(rempli({ valeurs: [], objectif: null }))).toBe(true);
  });
});

describe("VALEURS_MAX", () => {
  it("plafonne a cinq", () => {
    expect(VALEURS_MAX).toBe(5);
  });
});

describe("pacteDeclare : ce sans quoi on ne scelle pas", () => {
  it("demande un nom, une phrase, un signe et une teinte", () => {
    expect(pacteDeclare(rempli())).toBe(true);
    expect(pacteDeclare(rempli({ nomDuPacte: " " }))).toBe(false);
    expect(pacteDeclare(rempli({ mantra: "" }))).toBe(false);
    expect(pacteDeclare(rempli({ symbole: "" }))).toBe(false);
    expect(pacteDeclare(rempli({ couleur: "" }))).toBe(false);
  });

  it("ne demande ni valeurs, ni consentement, ni signature : ce n est pas son role", () => {
    /* Les valeurs sont facultatives ; le consentement et la signature
       sont l affaire de « pretASceller ». Declarer, c est avoir de quoi
       sceller — pas l avoir fait. */
    expect(pacteDeclare(rempli({ valeurs: [], clausesAcceptees: false, signe: false }))).toBe(true);
  });

  it("l etat vide n est pas declare : « Passer le rite » n a rien a abreger", () => {
    expect(pacteDeclare(ETAT_VIDE)).toBe(false);
  });
});

describe("LIMITES : ce qu on peut taper dans chaque champ libre", () => {
  it("plafonne les quatre champs libres du rite", () => {
    /* Le rite ne plafonnait rien : les colonnes sont « TEXT », la base
       n oppose aucune limite, et quatre cents signes dans le nom du
       pacte portaient le cadre de l objet de 288 a 6239 pixels — un
       anneau de 6239 sur 6239 par-dessus la page. */
    expect(Object.keys(LIMITES).sort()).toEqual(
      ["mantra", "nomDuPacte", "nomDuPorteur", "objectif"],
    );
    for (const n of Object.values(LIMITES)) {
      expect(n).toBeGreaterThan(0);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it("REPREND LES PLAFONDS QUE L APPLICATION IMPOSE DEJA AUX MEMES CHAMPS", () => {
    /* Ce ne sont pas des nombres inventes ici. Le rite ecrivait des
       pactes que la page des reglages refusait ensuite de rouvrir sans
       les tronquer — deux ecrans qui ne s accordaient pas sur ce qu est
       un nom. Changer l un de ces nombres sans changer l autre ecran
       fait revenir le desaccord, et ce test le dit. */
    expect(LIMITES.nomDuPorteur).toBe(40);  // ProfileAccountSettings
    expect(LIMITES.nomDuPacte).toBe(50);    // PactIdentityCard
    expect(LIMITES.mantra).toBe(200);       // PactIdentityCard
    expect(LIMITES.objectif).toBe(100);     // NewGoal
  });

  it("laisse passer un pacte tout juste a la limite", () => {
    /* La garde est un plafond, pas un refus : ce qui tient dedans doit
       se sceller. */
    const aLaLimite = rempli({
      nomDuPorteur: "N".repeat(LIMITES.nomDuPorteur),
      nomDuPacte: "P".repeat(LIMITES.nomDuPacte),
      mantra: "M".repeat(LIMITES.mantra),
    });
    expect(pacteDeclare(aLaLimite)).toBe(true);
    expect(pretASceller(aLaLimite)).toBe(true);
  });
});

describe("la lecture : on relit avant de jurer", () => {
  it("se place entre les valeurs et le scellement, dans les deux rites", () => {
    for (const suite of [RITE_COMPLET, RITE_ABREGE]) {
      expect(suite.indexOf("lecture")).toBe(suite.indexOf("valeurs") + 1);
      expect(suite.indexOf("lecture")).toBe(suite.indexOf("scellement") - 1);
    }
  });

  it("LE SECOND PASSAGE Y PASSE AUSSI : on revoit ce qu on avait jure", () => {
    expect(RITE_ABREGE).toContain("lecture");
  });

  it("appartient au scellement, pas a la forge", () => {
    /* On n y declare plus rien : le compte des fenetres closes ne doit
       pas bouger, et le jalonnement reste sur son acte. */
    expect(ACTE_DE.lecture).toBe("scellement");
    expect(fenetresCloses("lecture", false)).toBe(5);
    expect(fenetresCloses("lecture", true)).toBe(5);
  });

  it("ne laisse relire que ce qui est declare", () => {
    expect(peutAvancer("lecture", rempli())).toBe(true);
    expect(peutAvancer("lecture", rempli({ nomDuPacte: "" }))).toBe(false);
    expect(peutAvancer("lecture", rempli({ symbole: "" }))).toBe(false);
    expect(peutAvancer("lecture", ETAT_VIDE)).toBe(false);
  });

  it("ne demande ni consentement ni signature : ils viennent apres", () => {
    expect(peutAvancer("lecture", rempli({ clausesAcceptees: false, signe: false }))).toBe(true);
  });
});
