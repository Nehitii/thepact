import { describe, expect, it } from "vitest";
import {
  brigadeDe, butsDesPactes, comptesDesObjectifs, dureeDuPacte, etapesRestantes,
  minutesDeFocus, pacteActif, PLUS_GROS_RESTES, plusGrosRestes, primeDesOrdres,
  resteDe, STATUTS_FINIS, ZONE_DE_REPLI, zoneHoraireValide, type ObjectifLu,
} from "./etatDuPacte";

const but = (p: Partial<ObjectifLu> = {}): ObjectifLu =>
  ({ name: "Un but", status: "in_progress", total_steps: 0, validated_steps: 0, ...p });

describe("zoneHoraireValide — UTC plutot qu une erreur", () => {
  const T = new Date("2026-08-30T12:00:00Z");

  it("garde un fuseau valide", () => {
    expect(zoneHoraireValide("Europe/Paris", T)).toBe("Europe/Paris");
  });

  /* UN FUSEAU INVENTE FERAIT LEVER Intl : une date approximative vaut
     mieux qu une reponse qui n arrive pas. */
  it.each(["Mars/Olympus", "n importe quoi", "Europe/Pariss"])(
    "retombe sur UTC pour « %s »",
    (z) => {
      expect(zoneHoraireValide(z, T)).toBe(ZONE_DE_REPLI);
    },
  );

  it("retombe sur UTC quand aucun fuseau n est donne", () => {
    expect(zoneHoraireValide(undefined, T)).toBe("UTC");
    expect(zoneHoraireValide("", T)).toBe("UTC");
  });

  it("ne leve jamais", () => {
    for (const z of [undefined, "", "x", "Europe/Paris", "UTC"]) {
      expect(() => zoneHoraireValide(z, T)).not.toThrow();
    }
  });
});

describe("pacteActif — l actif, sinon le premier", () => {
  const pactes = [{ id: "un" }, { id: "deux" }, { id: "trois" }];

  it("prend celui qui est marque actif", () => {
    expect(pacteActif("deux", pactes)).toEqual({ id: "deux" });
  });

  /* UN COMPTE PEUT AVOIR PLUSIEURS PACTES ET AUCUN MARQUE : repondre
     sur le premier vaut mieux que de dire qu il n y en a aucun. */
  it.each([null, undefined, "inconnu"])("retombe sur le premier pour %s", (id) => {
    expect(pacteActif(id as string | null, pactes)).toEqual({ id: "un" });
  });

  it("rend rien quand il n y a aucun pacte", () => {
    expect(pacteActif("un", [])).toBeNull();
    expect(pacteActif(null, [])).toBeNull();
  });
});

describe("dureeDuPacte", () => {
  const JOUR = 86_400_000;
  const DEBUT = Date.UTC(2026, 0, 1);
  const FIN = DEBUT + 100 * JOUR;

  it("compte le total, l ecoule et le reste", () => {
    const d = dureeDuPacte(DEBUT, FIN, DEBUT + 40 * JOUR);
    expect(d).toEqual({ total: 100, ecoule: 40, reste: 60 });
  });

  /* SANS DEUX DATES COHERENTES, ON NE COMPTE RIEN : une fin avant le
     debut donnerait un « jour -12 / -40 » que le modele repeterait
     tel quel. */
  it("ne compte rien quand la fin precede le debut", () => {
    expect(dureeDuPacte(FIN, DEBUT, DEBUT)).toBeNull();
  });

  it("ne compte rien quand les deux dates sont la meme", () => {
    expect(dureeDuPacte(DEBUT, DEBUT, DEBUT)).toBeNull();
  });

  it.each([
    [null, FIN], [DEBUT, null], [null, null], [0, FIN], [DEBUT, 0],
  ])("ne compte rien sans deux dates (%s, %s)", (d, f) => {
    expect(dureeDuPacte(d as number | null, f as number | null, DEBUT)).toBeNull();
  });

  /* APRES LA FIN, IL NE RESTE PAS DE JOURS NEGATIFS. */
  it("ne rend jamais un reste negatif", () => {
    expect(dureeDuPacte(DEBUT, FIN, FIN + 50 * JOUR)?.reste).toBe(0);
  });

  it("ne rend jamais un ecoule negatif", () => {
    expect(dureeDuPacte(DEBUT, FIN, DEBUT - 50 * JOUR)?.ecoule).toBe(0);
  });

  it("arrondit le total au jour le plus proche", () => {
    expect(dureeDuPacte(DEBUT, DEBUT + 10.4 * JOUR, DEBUT)?.total).toBe(10);
    expect(dureeDuPacte(DEBUT, DEBUT + 10.6 * JOUR, DEBUT)?.total).toBe(11);
  });
});

describe("comptesDesObjectifs — les six nombres que M.I.A lit", () => {
  const buts = [
    but({ status: "in_progress", total_steps: 10, validated_steps: 4 }),
    but({ status: "in_progress", total_steps: 5, validated_steps: 5 }),
    but({ status: "not_started", total_steps: 8, validated_steps: 0 }),
    but({ status: "fully_completed", total_steps: 3, validated_steps: 3 }),
    but({ status: "validated", total_steps: 2, validated_steps: 2 }),
  ];

  it("compte chaque statut", () => {
    const c = comptesDesObjectifs(buts);
    expect(c.enCours).toBe(2);
    expect(c.aVenir).toBe(1);
    expect(c.finis).toBe(2);
  });

  /* « FINI » VEUT DIRE « fully_completed » OU « validated », comme
     partout ailleurs dans l application. */
  it("compte un objectif valide comme fini", () => {
    expect(STATUTS_FINIS).toEqual(["fully_completed", "validated"]);
    expect(comptesDesObjectifs([but({ status: "validated" })]).finis).toBe(1);
  });

  it("somme les etapes faites et les totaux", () => {
    const c = comptesDesObjectifs(buts);
    expect(c.faites).toBe(14);
    expect(c.etapes).toBe(28);
    expect(c.restantes).toBe(14);
  });

  it("traite une colonne absente comme zero", () => {
    const c = comptesDesObjectifs([but({ total_steps: null, validated_steps: null })]);
    expect(c.faites).toBe(0);
    expect(c.etapes).toBe(0);
  });

  /* ═══════════════════════════════════════════════════════════
     LE Math.max(0, …) N EST PAS UNE PRECAUTION THEORIQUE.

     Deux chemins connus produisent des objectifs dont les etapes
     faites depassent le total : l ONBOARDING pose total_steps a cinq
     sans creer une seule etape, et la DUPLICATION perdait le rang
     d etape ultime — une copie a trois etapes ordinaires pour un
     total de deux. Sans ce garde, M.I.A annoncerait un nombre
     d etapes restantes NEGATIF.
     ═══════════════════════════════════════════════════════════ */
  it("ne rend jamais un reste negatif, meme sur des donnees incoherentes", () => {
    const incoherent = [but({ total_steps: 2, validated_steps: 3 })];
    expect(comptesDesObjectifs(incoherent).restantes).toBe(0);
    expect(resteDe(incoherent[0])).toBe(0);
  });

  it("ne laisse pas un objectif incoherent en compenser un autre", () => {
    const melange = [
      but({ status: "in_progress", total_steps: 2, validated_steps: 5 }),
      but({ status: "in_progress", total_steps: 10, validated_steps: 0 }),
    ];
    /* Somme par objectif : 0 + 10, et non (2-5) + (10-0) = 7. */
    expect(etapesRestantes(melange, "in_progress")).toBe(10);
  });

  it("rend six zeros sur une liste vide", () => {
    expect(comptesDesObjectifs([])).toEqual({
      enCours: 0, aVenir: 0, finis: 0, faites: 0, etapes: 0, restantes: 0,
    });
  });
});

describe("etapesRestantes — par statut", () => {
  const buts = [
    but({ status: "in_progress", total_steps: 10, validated_steps: 4 }),
    but({ status: "in_progress", total_steps: 5, validated_steps: 5 }),
    but({ status: "not_started", total_steps: 8, validated_steps: 0 }),
  ];

  it("ne somme que le statut demande", () => {
    expect(etapesRestantes(buts, "in_progress")).toBe(6);
    expect(etapesRestantes(buts, "not_started")).toBe(8);
  });

  it("rend zero pour un statut absent", () => {
    expect(etapesRestantes(buts, "fully_completed")).toBe(0);
  });
});

describe("plusGrosRestes", () => {
  const buts = [
    but({ name: "A", status: "in_progress", total_steps: 10, validated_steps: 1 }),
    but({ name: "B", status: "in_progress", total_steps: 20, validated_steps: 0 }),
    but({ name: "C", status: "in_progress", total_steps: 5, validated_steps: 1 }),
    but({ name: "D", status: "in_progress", total_steps: 3, validated_steps: 0 }),
    but({ name: "E", status: "not_started", total_steps: 99, validated_steps: 0 }),
  ];

  it("rend les trois plus gros, du plus grand au plus petit", () => {
    expect(PLUS_GROS_RESTES).toBe(3);
    expect(plusGrosRestes(buts)).toEqual([
      { nom: "B", reste: 20 }, { nom: "A", reste: 9 }, { nom: "C", reste: 4 },
    ]);
  });

  /* SEULS LES OBJECTIFS EN COURS : celui qui n est pas commence a beau
     porter quatre-vingt-dix-neuf etapes, il n est pas « en cours ». */
  it("ecarte ce qui n est pas en cours", () => {
    expect(plusGrosRestes(buts).map((g) => g.nom)).not.toContain("E");
  });

  /* CEUX QUI N ONT PLUS RIEN A FAIRE SONT ECARTES AVANT LE TRI : sans
     cela, un objectif a zero reste entrerait dans les trois par
     simple manque de concurrents. */
  it("n annonce jamais un plus gros reste a zero", () => {
    const presqueFinis = [
      but({ name: "X", status: "in_progress", total_steps: 4, validated_steps: 4 }),
      but({ name: "Y", status: "in_progress", total_steps: 2, validated_steps: 1 }),
    ];
    expect(plusGrosRestes(presqueFinis)).toEqual([{ nom: "Y", reste: 1 }]);
  });

  it("rend une liste vide quand rien n est en cours", () => {
    expect(plusGrosRestes([but({ status: "not_started", total_steps: 9 })])).toEqual([]);
  });

  it("en rend autant qu on demande", () => {
    expect(plusGrosRestes(buts, 1)).toEqual([{ nom: "B", reste: 20 }]);
    expect(plusGrosRestes(buts, 99)).toHaveLength(4);
  });

  it("ne modifie pas la liste qu on lui donne", () => {
    const noms = buts.map((g) => g.name);
    plusGrosRestes(buts);
    expect(buts.map((g) => g.name)).toEqual(noms);
  });
});

describe("brigadeDe", () => {
  it("garde les objectifs epingles qui ne sont pas acheves", () => {
    const buts = [
      but({ name: "A", is_focus: true, status: "in_progress" }),
      but({ name: "B", is_focus: false, status: "in_progress" }),
      but({ name: "C", is_focus: true, status: "fully_completed" }),
    ];
    expect(brigadeDe(buts)).toEqual(["A"]);
  });

  /* LA BRIGADE EXCLUT « fully_completed » MAIS PAS « validated »,
     contrairement au compte des finis. Les deux notions divergent
     donc sur un objectif VALIDE : il compte comme fini, et reste
     pourtant dans la brigade. Ce test constate l ecart, il ne
     l approuve pas. */
  it("garde un objectif valide, que le compte des finis ecarte pourtant", () => {
    const valide = [but({ name: "V", is_focus: true, status: "validated" })];
    expect(brigadeDe(valide)).toEqual(["V"]);
    expect(comptesDesObjectifs(valide).finis).toBe(1);
  });

  it("rend une liste vide quand rien n est epingle", () => {
    expect(brigadeDe([but({ is_focus: false })])).toEqual([]);
    expect(brigadeDe([])).toEqual([]);
  });
});

describe("butsDesPactes", () => {
  it("ne garde que les objectifs d un pacte connu", () => {
    const buts = [
      { pact_id: "un", name: "A" }, { pact_id: "orphelin", name: "B" }, { pact_id: null, name: "C" },
    ];
    expect(butsDesPactes(buts, [{ id: "un" }]).map((g) => g.name)).toEqual(["A"]);
  });

  it("rend une liste vide sans pacte", () => {
    expect(butsDesPactes([{ pact_id: "un" }], [])).toEqual([]);
  });
});

describe("primeDesOrdres et minutesDeFocus", () => {
  const ordres = [
    { status: "claimed", reward_bonds: 50 },
    { status: "completed", reward_bonds: 30 },
    { status: "active", reward_bonds: 20 },
    { status: "claimed", reward_bonds: null },
  ];

  /* LA PRIME ACQUISE NE COMPTE QUE LES ORDRES RECLAMES : un ordre
     termine mais dont la prime n a pas ete prise n est pas acquis. */
  it("separe l acquis du total", () => {
    expect(primeDesOrdres(ordres)).toEqual({ acquise: 50, totale: 100 });
  });

  it("traite une prime absente comme zero", () => {
    expect(primeDesOrdres([{ status: "claimed" }])).toEqual({ acquise: 0, totale: 0 });
  });

  it("rend zero sur zero sans ordre", () => {
    expect(primeDesOrdres([])).toEqual({ acquise: 0, totale: 0 });
  });

  it("somme les minutes de focus", () => {
    expect(minutesDeFocus([{ duration_minutes: 25 }, { duration_minutes: 5 }])).toBe(30);
    expect(minutesDeFocus([{ duration_minutes: null }, {}])).toBe(0);
    expect(minutesDeFocus([])).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUE LE BALAYAGE A LAISSE PASSER, ET POURQUOI.
   ═══════════════════════════════════════════════════════════════ */
describe("une colonne ABSENTE n est pas une colonne NULLE", () => {
  /* TROU — mes cas posaient les colonnes a zero ou a null, jamais
     ABSENTES. Or « s + null » vaut « s » en JavaScript, tandis que
     « s + undefined » vaut NaN : le repli « ?? 0 » ne se voyait donc
     pas. Un `select` qui cesserait de demander une colonne la rendrait
     absente, et M.I.A annoncerait « NaN etapes ». */
  it("somme une colonne absente sans devenir NaN", () => {
    const sansColonnes = [{ name: "A", status: "in_progress" }] as ObjectifLu[];
    const c = comptesDesObjectifs(sansColonnes);
    expect(Number.isNaN(c.faites)).toBe(false);
    expect(Number.isNaN(c.etapes)).toBe(false);
    expect(c).toEqual({ enCours: 1, aVenir: 0, finis: 0, faites: 0, etapes: 0, restantes: 0 });
  });

  it("ne devient pas NaN non plus sur le reste d un objectif", () => {
    expect(resteDe({ name: "A" } as ObjectifLu)).toBe(0);
    expect(etapesRestantes([{ name: "A", status: "in_progress" }] as ObjectifLu[], "in_progress")).toBe(0);
  });

  /* LA PREUVE DU PIEGE : null et undefined ne se comportent pas
     pareil dans une addition. */
  it("montre pourquoi null ne suffisait pas a le prouver", () => {
    const nul: number | null = null;
    const absent: number | undefined = undefined;
    expect(0 + (nul as unknown as number)).toBe(0);
    expect(Number.isNaN(0 + (absent as unknown as number))).toBe(true);
  });

  it("ne devient pas NaN sur les primes ni sur le focus", () => {
    expect(primeDesOrdres([{ status: "claimed" }])).toEqual({ acquise: 0, totale: 0 });
    expect(minutesDeFocus([{}])).toBe(0);
  });
});

/* DOMINE — le repli sur UTC est ecrit DEUX FOIS : une fois comme
   second element de la boucle, une fois comme valeur de retour finale.
   L une ou l autre suffit, et le balayage l a montre en laissant
   survivre le retrait de la premiere. Cette redondance vient du code
   d origine ; elle est gardee parce que la boucle dit « essaie
   ceux-ci, dans cet ordre » et que le retour final dit « et si rien
   ne marche ». Ce test etablit l equivalence. */
describe("le repli sur UTC, ecrit deux fois", () => {
  const T = new Date("2026-08-30T12:00:00Z");
  const sansReplyDansLaBoucle = (fuseau: string | undefined) => {
    for (const z of [fuseau]) {
      if (!z) continue;
      try {
        new Intl.DateTimeFormat("fr-FR", { timeZone: z }).format(T);
        return z;
      } catch { /* zone refusee */ }
    }
    return ZONE_DE_REPLI;
  };

  it.each([undefined, "", "Europe/Paris", "Mars/Olympus", "UTC"])(
    "donne la meme zone avec ou sans le repli de boucle pour %s",
    (fuseau) => {
      expect(zoneHoraireValide(fuseau, T)).toBe(sansReplyDansLaBoucle(fuseau));
    },
  );
});
