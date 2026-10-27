/* CE QUE LA TABLE DES REFLEXES DECIDE, ET QUE PERSONNE NE RELIT.
 *
 * `reflexes.test.ts` mesure la RECHERCHE : quelle intention gagne. Il
 * ne regarde jamais ce qui sort — pas une ligne n y touche a `texte`
 * ni a `expression`. Les douze corps de `repondre` etaient donc
 * entierement libres : un accord au pluriel, un arrondi, un total
 * faux y passaient sans bruit.
 *
 * LA PREUVE QUE LE TROU ETAIT REEL. L etat de reference de ce
 * fichier-la porte `focus: { minutes, sessions }` et
 * `ordres: [{ titre, fait }]` — deux formes absentes de `EtatDuJour`,
 * qui dit `focusMinutes` et `{ titre, progression, cible, reclame,
 * prime }`. Les regles y lisent donc `undefined`, « ordres » rend
 * « Prime NaN/NaN bonds », et le test passe quand meme : il ne
 * regarde que l intention. Le transtypage `as unknown as EtatDuJour`
 * a permis les deux. Ici l etat est TYPE, sans transtypage.
 *
 * CE QUI A ETE CORRIGE. Le groupe ["ferme", "la"] de la provocation
 * n avait pas de destinataire — la faute meme que le commentaire
 * voisin decrit et corrige pour « stupide » et « idiote ». Mesure
 * avant : « ferme la fenetre », « ferme la modale », « ferme la
 * boutique », « ferme la liste de souhaits » recevaient une reponse
 * d insulte ; « ferme le panneau » passait. Apres : les cinq passent.
 *
 * Voir `reglesDeReflexe.formulation.test.ts` pour les trois aides de
 * formulation — nombres, dates, tirage sans repetition.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { POSSIBLES } from "./possibles";
import { chercherReflexe } from "./reflexes";
import { GESTES_CONNUS, REGLES, dernier, nb } from "./reglesDeReflexe";
import type { EtatDuJour } from "@/domaines/mia/types";

const ETAT: EtatDuJour = {
  nom: "Geoffrey",
  pacte: { id: "p", nom: "Ananta", jour: 10, total: 100, reste: 90, pctEcoule: 10.4, fin: "2026-12-31" },
  phase: "nominal",
  joursSansPointage: 1,
  objectifs: {
    enCours: 2, aVenir: 1, finis: 3, restantEnCours: 5, restantAVenir: 10,
    faites: 1234, etapes: 2000, plusGros: [{ nom: "Ananta", reste: 3 }],
  },
  ordres: [
    { titre: "Trois focus", progression: 2, cible: 3, reclame: false, prime: 10 },
    { titre: "Une tache", progression: 1, cible: 1, reclame: true, prime: 5 },
  ],
  focusMinutes: 30,
  taches: {
    ouvertes: 2,
    prochaines: [
      { id: "a", nom: "Payer", echeance: "2026-08-26T22:00:00+00:00", enRetard: true },
      { id: "b", nom: "Lire", echeance: null, enRetard: false },
    ],
  },
  solde: 1234,
};

const VIDE: EtatDuJour = {
  ...ETAT, nom: null, pacte: null, solde: null, focusMinutes: 0, ordres: [],
  objectifs: { enCours: 0, aVenir: 0, finis: 0, restantEnCours: 0, restantAVenir: 0, faites: 0, etapes: 0, plusGros: [] },
  taches: { ouvertes: 0, prochaines: [] },
};

const regle = (intention: string) => {
  const r = REGLES.find((x) => x.intention === intention);
  if (!r) throw new Error("regle absente : " + intention);
  return r;
};
const dire = (intention: string, e: EtatDuJour = ETAT) => regle(intention).repondre(e);

/* `dernier` est un etat de MODULE : il survit d un test a l autre et
   changerait la variante tiree. On le vide avant chaque cas. */
beforeEach(() => dernier.clear());

describe("les douze regles, texte rendu", () => {
  it("l etat dit le jour, les etapes et les taches, en une phrase", () => {
    expect(dire("etat")).toEqual({
      intention: "etat",
      texte: "Jour 10 sur 100, 10 % écoulé. 5 étapes restantes sur tes 2 objectifs en cours,"
        + " dont 3 pour Ananta. 2 tâches ouvertes, dont une en retard.",
      expression: "contrariee",
    });
  });

  it("l etat arrondit le pourcentage ecoule", () => {
    const pourcent = (pct: number) =>
      /, (\d+) % écoulé\./.exec(
        dire("etat", { ...ETAT, pacte: { ...ETAT.pacte!, pctEcoule: pct } })?.texte ?? "",
      )?.[1];
    expect(pourcent(10.4)).toBe("10");
    expect(pourcent(10.5)).toBe("11");
    expect(pourcent(99.6)).toBe("100");
  });

  it("l etat se tait sans pacte, et laisse la place a la regle suivante", () => {
    expect(dire("etat", VIDE)).toBeNull();
    expect(dire("reste", VIDE)).toBeNull();
    expect(dire("etapes", VIDE)).toBeNull();
    expect(dire("solde", VIDE)).toBeNull();
  });

  it("le reste ne parle que si le pacte a une duree", () => {
    expect(dire("reste")).toMatchObject({ intention: "reste", expression: "calme" });
    expect(dire("reste", { ...ETAT, pacte: { ...ETAT.pacte!, total: 0 } })).toBeNull();
  });

  it("le reste durcit son visage avec la phase du pacte", () => {
    const visage = (phase: EtatDuJour["phase"]) => dire("reste", { ...ETAT, phase })?.expression;
    expect(visage("nominal")).toBe("calme");
    expect(visage("attention")).toBe("neutre");
    expect(visage("critique")).toBe("menacante");
    expect(visage("inconnue")).toBe("calme");
  });

  it("les etapes ont deux formulations, et une seule cite le plus gros", () => {
    /* `choisir` tire au sort : on ne peut pas fixer LA phrase, on fixe
       l ENSEMBLE des phrases possibles. Soixante tirages suffisent —
       la variante precedente est ecartee a chaque fois, donc les deux
       alternent. */
    const dites = new Set(Array.from({ length: 60 }, () => dire("etapes")?.texte));
    expect(dites).toEqual(new Set([
      "5 étapes restantes sur tes 2 objectifs en cours. Ananta en concentre 3 à lui seul.",
      `${nb(1234)} étapes faites sur ${nb(2000)}. 5 restent sur ce qui est en cours,`
        + " 10 sur ce qui n'a pas commencé.",
    ]));
  });

  it("les etapes repondent des qu il y a des etapes, meme aucune faite", () => {
    /* BALAYAGE : la garde `!o.etapes` remplacee par `!o.faites`
       survivait. Elle ne survit plus — et la difference est celle d un
       compte fraichement ouvert : des objectifs poses, rien de valide
       encore. Sous la mutation, cet utilisateur-la n obtenait rien et
       payait un appel au modele. */
    expect(dire("etapes", { ...ETAT, objectifs: { ...ETAT.objectifs, faites: 0 } })).not.toBeNull();
    expect(dire("etapes", { ...ETAT, objectifs: { ...ETAT.objectifs, etapes: 0 } })).toBeNull();
  });

  it("les etapes taisent le plus gros quand il n y en a pas", () => {
    const sans = { ...ETAT, objectifs: { ...ETAT.objectifs, plusGros: [] } };
    const dites = Array.from({ length: 60 }, () => dire("etapes", sans)?.texte ?? "");
    expect(dites.some((t) => t.startsWith("5 étapes restantes sur tes 2 objectifs en cours."))).toBe(true);
    for (const t of dites) expect(t).not.toContain("concentre");
  });

  it("les taches accordent le pluriel et comptent les retards", () => {
    expect(dire("taches")?.texte).toBe(
      "2 tâches ouvertes. Les plus proches : Payer (27 août, en retard), Lire (sans échéance). 1 en retard.",
    );
    const une: EtatDuJour = {
      ...ETAT,
      taches: { ouvertes: 1, prochaines: [{ id: "a", nom: "Payer", echeance: null, enRetard: false }] },
    };
    expect(dire("taches", une)?.texte).toBe("1 tâche ouverte. Les plus proches : Payer (sans échéance).");
    expect(dire("taches", une)?.expression).toBe("neutre");
  });

  it("les taches ne citent que les trois plus proches", () => {
    const cinq: EtatDuJour = {
      ...ETAT,
      taches: {
        ouvertes: 5,
        prochaines: Array.from({ length: 5 }, (_, i) =>
          ({ id: String(i), nom: "T" + i, echeance: null, enRetard: false })),
      },
    };
    const t = dire("taches", cinq)?.texte ?? "";
    expect(t).toContain("T0 (sans échéance), T1 (sans échéance), T2 (sans échéance).");
    expect(t).not.toContain("T3");
  });

  it("les taches se taisent en douceur quand il n y en a aucune", () => {
    expect(dire("taches", VIDE)).toEqual({
      intention: "taches", texte: "Aucune tâche ouverte.", expression: "calme",
    });
  });

  it("le focus se rejouit a partir d un quart d heure et demi", () => {
    const visage = (m: number) => dire("focus", { ...ETAT, focusMinutes: m })?.expression;
    expect(visage(24)).toBe("neutre");
    expect(visage(25)).toBe("contente");
    expect(dire("focus", VIDE)?.expression).toBe("neutre");
  });

  it("le focus sans seance dit l absence, et ne dit pas « 0 minutes »", () => {
    /* BALAYAGE : forcer la branche pleine survivait, parce que la
       phrase attendue etait cherchee par « aujourd hui » — que les
       quatre variantes contiennent. On fixe donc l ENSEMBLE. */
    const dites = new Set(Array.from({ length: 60 }, () => dire("focus", VIDE)?.texte));
    expect(dites).toEqual(new Set([
      "Aucune séance de focus aujourd'hui.",
      "Rien en focus aujourd'hui pour l'instant.",
    ]));
  });

  it("les ordres additionnent les primes, et ne comptent acquis que le reclame", () => {
    /* Deux ordres : dix bonds non reclames, cinq reclames. */
    expect(dire("ordres")).toEqual({
      intention: "ordres",
      texte: "Trois focus 2/3 · Une tache 1/1. Prime 5/15 bonds.",
      expression: "neutre",
    });
  });

  it("les ordres se rejouissent quand tout est reclame", () => {
    const tous = ETAT.ordres.map((o) => ({ ...o, reclame: true }));
    expect(dire("ordres", { ...ETAT, ordres: tous })?.expression).toBe("joie");
    expect(dire("ordres", { ...ETAT, ordres: tous })?.texte).toContain("Prime 15/15 bonds.");
  });

  it("les ordres absents ne rendent pas null : ils le disent", () => {
    /* La difference compte : `null` renverrait la question au modele,
       et payer un appel pour dire « rien aujourd hui » serait absurde. */
    expect(dire("ordres", VIDE)).toEqual({
      intention: "ordres", texte: "Pas d'ordre du jour aujourd'hui.", expression: "neutre",
    });
  });

  it("le solde se tait quand il est inconnu, et non quand il est nul", () => {
    expect(dire("solde", VIDE)).toBeNull();
    expect(dire("solde", { ...ETAT, solde: 0 })?.texte).toBe("0 bonds.");
    expect(dire("solde")?.texte).toBe("1 234 bonds.");
  });

  it("le salut connait le nom quand il y en a un", () => {
    const dits = new Set(Array.from({ length: 60 }, () => dire("salut")?.texte));
    expect(dits).toEqual(new Set(["Salut Geoffrey.", "Là.", "Salut. Jour 10."]));
    const anonyme = new Set(Array.from({ length: 60 }, () => dire("salut", VIDE)?.texte));
    expect(anonyme).toEqual(new Set(["Salut.", "Là."]));
  });

  it("la politesse et la provocation repondent sans etat", () => {
    for (const i of ["merci", "adieu", "provocation", "aide"]) {
      expect(dire(i, VIDE), i).not.toBeNull();
      expect(dire(i, VIDE)?.intention, i).toBe(i);
    }
    expect(dire("provocation")?.expression).toBe("severe");
  });
});

describe("l aide ne peut pas mentir sur ce qu elle sait faire", () => {
  it("recite les tournures de possibles.ts, et rien d autre", () => {
    const texte = dire("aide")?.texte ?? "";
    for (const p of POSSIBLES.filter((x) => x.couche === "reflexe"))
      expect(texte, p.exemple).toContain(p.exemple);
    for (const g of GESTES_CONNUS) expect(texte, g).toContain(g);
  });

  it("annonce six gestes", () => {
    expect(GESTES_CONNUS).toHaveLength(6);
  });
});

describe("le contrat de possibles.ts : un exemple qui ne declenche rien est un mensonge", () => {
  /* Le fichier des possibles l ecrit noir sur blanc — « les exemples
     sont TAPABLES TELS QUELS » — et rien ne le verifiait. Le panneau
     pose l exemple dans le champ : s il ne declenche pas, l ecran a
     promis une capacite qui n existe pas. */
  it.each(POSSIBLES.filter((p) => p.couche === "reflexe").map((p) => [p.exemple]))(
    "« %s » declenche bien un reflexe", (exemple) => {
      expect(chercherReflexe(exemple, ETAT)).not.toBeNull();
    },
  );

  it("les huit exemples tombent sur huit intentions distinctes", () => {
    const exemples = POSSIBLES.filter((p) => p.couche === "reflexe");
    const intentions = exemples.map((p) => chercherReflexe(p.exemple, ETAT)?.intention);
    expect(intentions).toEqual(["etat", "reste", "etapes", "taches", "focus", "ordres", "solde", "aide"]);
    expect(new Set(intentions).size).toBe(exemples.length);
  });
});

describe("la provocation s adresse a quelqu un", () => {
  const intention = (q: string) => chercherReflexe(q, ETAT)?.intention ?? null;

  it("laisse passer les demandes de fermeture", () => {
    /* Les quatre premieres recevaient « Noté. » avant la coupe du
       groupe ["ferme", "la"] ; la cinquieme passait deja, ce qui
       montrait que le verbe n y etait pour rien. */
    for (const q of [
      "ferme la fenetre", "ferme la modale", "ferme la boutique",
      "ferme la liste de souhaits", "ferme le panneau",
    ]) expect(intention(q), q).toBeNull();
  });

  it("garde les insultes qui la designent", () => {
    for (const q of [
      "tais toi", "tu es stupide", "t es nulle", "tu sers a rien", "tu es idiote",
    ]) expect(intention(q), q).toBe("provocation");
  });

  it("laisse passer les jugements qui ne la visent pas", () => {
    /* BALAYAGE : reduire ["t", "es", "nulle"] au seul ["nulle"]
       survivait, faute d une phrase ou l adjectif ne s adresse a
       personne. C est pourtant la faute exacte que le fichier corrige
       deja pour « stupide » et « idiote ». */
    for (const q of [
      "cette idee est nulle", "la journee est nulle", "cette approche est stupide",
      "cette idee est idiote a mon avis",
    ]) expect(intention(q), q).toBeNull();
  });
});

describe("la forme de la table", () => {
  it("porte douze regles, toutes d intention distincte", () => {
    expect(REGLES).toHaveLength(12);
    expect(new Set(REGLES.map((r) => r.intention)).size).toBe(12);
  });

  it("n a aucun motif vide, ni aucun mot accentue ou majuscule", () => {
    /* La question est aplatie avant comparaison : un motif accentue
       ou en majuscule ne pourrait JAMAIS coller. */
    for (const r of REGLES)
      for (const g of r.motifs) {
        expect(g.length, r.intention).toBeGreaterThan(0);
        for (const mot of g) expect(mot, r.intention + " / " + mot).toMatch(/^[a-z0-9]+$/);
      }
  });

  it("plafonne chaque intention au nombre de mots qui la porte encore", () => {
    /* BALAYAGE : monter le plafond de l aide de cinq a huit survivait
       a tout le reste du fichier. Le plafond EST une decision de la
       table — il vaut donc d etre ecrit, et prouve juste apres. */
    expect(REGLES.map((r) => [r.intention, r.motsMax])).toEqual([
      ["etat", 6], ["reste", 12], ["etapes", 12], ["taches", 8], ["focus", 12],
      ["ordres", 12], ["solde", 12], ["aide", 5], ["salut", 8], ["merci", 4],
      ["adieu", 6], ["provocation", 6],
    ]);
  });

  it("laisse passer la demande d aide qui demande un travail", () => {
    /* « aide moi a ecrire un mail de relance » fait huit mots : au-dela
       de cinq, ce n est plus « montre-moi la notice », c est un
       travail — et un travail merite le modele. */
    expect(chercherReflexe("aide moi a ecrire un mail de relance", ETAT)).toBeNull();
    expect(chercherReflexe("aide moi", ETAT)?.intention).toBe("aide");
  });

  it("n a aucun groupe plus long que le plafond de sa regle", () => {
    /* Un groupe de neuf mots dans une regle plafonnee a huit ne
       pourrait jamais l emporter : il serait mort a l ecriture. */
    for (const r of REGLES) {
      if (r.motsMax === undefined) continue;
      for (const g of r.motifs)
        expect(g.length, r.intention + " / " + g.join(" ")).toBeLessThanOrEqual(r.motsMax);
    }
  });

  it("compte un seul groupe dont un mot est repete", () => {
    /* MESURE, PAS CORRIGE. Le poids d un groupe est sa LONGUEUR et
       non son nombre de mots distincts : celui-ci pese huit alors
       qu il n en reconnait que sept, et l emporterait donc sur un
       groupe de sept mots vraiment distincts. Il est le seul, et
       corriger le comptage releve du chercheur, pas de la table. */
    const repetes = REGLES.flatMap((r) => r.motifs)
      .filter((g) => new Set(g).size !== g.length);
    expect(repetes).toEqual([["qu", "est", "ce", "qu", "il", "reste", "a", "faire"]]);
  });
});
