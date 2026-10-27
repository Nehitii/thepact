import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { energieMoyenne, preparerVues } from "./vues";
import type { AnalyticsData } from "@/domaines/analytique/types";

/* Le fuseau est fixe : deux tests portent sur la facon dont une date
   sans heure est interpretee, et cela n a de sens que dans un fuseau
   connu. */
const FUSEAU_AVANT = process.env.TZ;
beforeAll(() => { process.env.TZ = "Europe/Paris"; });
afterAll(() => {
  if (FUSEAU_AVANT === undefined) delete process.env.TZ;
  else process.env.TZ = FUSEAU_AVANT;
});

afterEach(() => { vi.useRealTimers(); });

/** Le strict necessaire : `preparerVues` ne lit que ces huit champs. */
const donnees = (p: Partial<AnalyticsData> = {}): AnalyticsData => ({
  habitStreak: [], reports: [], sommeil: [], anneeQuiPreleve: [],
  serieTaches: [], cequiTombe: [], heureDOuvrage: [],
  summary: {
    totalGoals: 0, completedGoals: 0, totalSteps: 0, completedSteps: 0,
    totalCost: 0, paidCost: 0,
  },
  ...p,
} as unknown as AnalyticsData);

describe("l energie moyenne de la quinzaine", () => {
  const releve = (m: unknown, a: unknown, s: unknown) =>
    ({ energy_morning: m, energy_afternoon: a, energy_evening: s });

  it("moyenne chaque moment et arrondit au dixieme", () => {
    expect(energieMoyenne([releve(3, 4, 5), releve(4, 5, 6)])).toEqual([
      { moment: "Matin", niveau: 3.5 },
      { moment: "Après-midi", niveau: 4.5 },
      { moment: "Soir", niveau: 5.5 },
    ]);
    /* Un tiers arrondi : 3,33 et non 3,3333. */
    expect(energieMoyenne([releve(3, 0, 0), releve(3, 0, 0), releve(4, 0, 0)])[0].niveau).toBe(3.3);
  });

  /* ═══ UN MOMENT SANS RELEVE DISPARAIT, IL NE VAUT PAS ZERO ═══
     Le graphique porte donc une, deux ou trois barres selon ce qui a
     ete note. Rendre zero ferait lire « energie nulle le soir » la ou
     personne n a rien saisi. */
  it("retire un moment que personne n a renseigne", () => {
    expect(energieMoyenne([releve(3, null, undefined)])).toEqual([{ moment: "Matin", niveau: 3 }]);
    expect(energieMoyenne([releve(null, null, null)])).toEqual([]);
    expect(energieMoyenne([])).toEqual([]);
  });

  /* ET CE QUI N EST PAS UN NOMBRE N ENTRE PAS DANS LA MOYENNE. Une
     chaine venue de la base — « 4 » plutot que 4 — fausserait la
     division en la comptant pour un releve. */
  it("ignore ce qui n est pas un nombre", () => {
    expect(energieMoyenne([releve(4, 0, 0), releve("4", 0, 0), releve(true, 0, 0)])[0].niveau).toBe(4);
  });

  it("garde le zero, qui est un niveau et non une absence", () => {
    expect(energieMoyenne([releve(0, 0, 0)])).toEqual([
      { moment: "Matin", niveau: 0 },
      { moment: "Après-midi", niveau: 0 },
      { moment: "Soir", niveau: 0 },
    ]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   TROIS POURCENTAGES, TROIS TRAITEMENTS DIFFERENTS.

   Les deux premiers sont ARRONDIS et non plafonnes ; le troisieme est
   PLAFONNE et non arrondi. Ce n est pas une etourderie : un objectif
   ne peut pas etre acheve plus d une fois, tandis qu on peut payer
   plus que le cout annonce — un depassement, un frais de plus. Le
   plafond est donc la ou le depassement est possible, et nulle part
   ailleurs.
   ═══════════════════════════════════════════════════════════════ */
describe("les trois pourcentages", () => {
  const resume = (p: Record<string, number>) =>
    preparerVues(donnees({ summary: {
      totalGoals: 0, completedGoals: 0, totalSteps: 0, completedSteps: 0,
      totalCost: 0, paidCost: 0, ...p,
    } } as Partial<AnalyticsData>));

  it("rend zero plutot qu une division par rien", () => {
    const v = resume({});
    expect([v.pctObjectifs, v.pctEtapes, v.pctPaye]).toEqual([0, 0, 0]);
    expect(resume({ completedGoals: 5 }).pctObjectifs).toBe(0);
  });

  it("arrondit les objectifs et les etapes a l entier", () => {
    expect(resume({ totalGoals: 3, completedGoals: 1 }).pctObjectifs).toBe(33);
    expect(resume({ totalSteps: 3, completedSteps: 2 }).pctEtapes).toBe(67);
  });

  it("plafonne le paye a cent, et lui seul", () => {
    expect(resume({ totalCost: 100, paidCost: 150 }).pctPaye).toBe(100);
    /* Les deux autres n ont pas de plafond : rien dans les donnees ne
       peut les faire depasser cent, et rien ici ne les en empeche. */
    expect(resume({ totalGoals: 2, completedGoals: 3 }).pctObjectifs).toBe(150);
  });

  it("laisse le paye avec ses decimales", () => {
    expect(resume({ totalCost: 3, paidCost: 1 }).pctPaye).toBeCloseTo(33.333, 3);
  });
});

/* ═══════════════════════════════════════════════════════════════
   LES REPORTS SONT UN HISTOGRAMME, PAS UNE LISTE.

   Chaque ligne dit : « autant de taches ont ete repoussees autant de
   fois ». `faites` est donc un NOMBRE DE TACHES, et `reports` le
   nombre de fois qu on les a repoussees — l etiquette du casier, pas
   une quantite a sommer.

   D ou la forme des deux totaux : on somme `faites`, jamais `reports`.
   Sommer `reports` donnerait « combien de reports au total », qui n est
   pas ce que l ecran annonce.
   ═══════════════════════════════════════════════════════════════ */
describe("les taches et leurs reports", () => {
  const casiers = [
    { reports: 0, faites: 40 },
    { reports: 1, faites: 5 },
    { reports: 2, faites: 3 },
    { reports: 5, faites: 1 },
  ];

  it("compte toutes les taches, tous casiers confondus", () => {
    expect(preparerVues(donnees({ reports: casiers })).totalTaches).toBe(49);
  });

  it("ne compte comme reportees que celles d au moins un casier non nul", () => {
    expect(preparerVues(donnees({ reports: casiers })).totalReportees).toBe(9);
    /* Et non 5 + 2 x 3 + 5 x 1 = 16, qui serait le nombre de reports. */
  });

  it("rend zero quand rien n a jamais ete repousse", () => {
    const v = preparerVues(donnees({ reports: [{ reports: 0, faites: 12 }] }));
    expect([v.totalTaches, v.totalReportees]).toEqual([12, 0]);
  });

  /* ═══ CONSTATE : CE TOTAL NE VIENT PAS DU MEME ENDROIT QUE LA BANDE
     DES JOURS ═══
     `totalTaches` est tire de `reports`, qui compte TOUTES les lignes
     d historique. `parJourDeSemaine` est tire de `serieTaches`, qui ne
     compte que celles portant une date d achevement. Rien dans ce
     fichier ne lie les deux — et l ecran affiche pourtant le premier
     comme legende du second.

     Ils s accordent aujourd hui, et ce qui le garantit est dans le
     SCHEMA, pas dans le code : `todo_history.completed_at` est NOT
     NULL. Mesure du 31/08/2026 : 69 lignes, 69 avec date. */
  it("ne tire pas ses totaux de la meme source que la bande des jours", () => {
    const v = preparerVues(donnees({
      reports: [{ reports: 0, faites: 10 }],
      serieTaches: [{ date: "2026-08-30", n: 4 }],
    }));
    expect(v.totalTaches).toBe(10);
    expect(v.parJourDeSemaine.reduce((s, j) => s + j.valeur, 0)).toBe(4);
  });
});

describe("la moyenne de sommeil", () => {
  /* ELLE SORT EN TEXTE, AVEC UNE VIRGULE. C est une valeur d affichage,
     pas un nombre : la suite ne la recalcule pas. */
  it("rend un texte a une decimale, virgule francaise", () => {
    const v = preparerVues(donnees({ sommeil: [
      { date: "a", heures: 7 }, { date: "b", heures: 8 },
    ] }));
    expect(v.moyenneSommeil).toBe("7,5");
  });

  it("arrondit au dixieme", () => {
    const v = preparerVues(donnees({ sommeil: [
      { date: "a", heures: 7 }, { date: "b", heures: 7 }, { date: "c", heures: 8 },
    ] }));
    expect(v.moyenneSommeil).toBe("7,3");
  });

  /* ═══ CONSTATE : SANS NUIT MESUREE, C EST « 0 » ET NON « 0,0 » ═══
     Le repli ne passe pas par `toFixed`. L ecart se voit a cote d une
     vraie moyenne, qui porte toujours sa decimale. */
  it("rend zero sans decimale quand aucune nuit n est mesuree", () => {
    expect(preparerVues(donnees({ sommeil: [] })).moyenneSommeil).toBe("0");
  });
});

/* ═══════════════════════════════════════════════════════════════
   LES JOURS QUI PORTENT — ET L HEURE DE MIDI QUI LES SAUVE.

   Une date sans heure est lue par `Date` comme MINUIT UTC. A Paris,
   minuit UTC est deux heures du matin le meme jour ; mais dans tout
   fuseau NEGATIF, c est la veille au soir — et la barre change de
   colonne. Lire la date a midi met six a douze heures de marge de
   chaque cote : aucun fuseau habite ne peut faire basculer le jour.
   ═══════════════════════════════════════════════════════════════ */
describe("les jours de la semaine", () => {
  it("commence le lundi et finit le dimanche", () => {
    const v = preparerVues(donnees({ serieTaches: [] }));
    expect(v.parJourDeSemaine.map((j) => j.nom)).toEqual([
      "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche",
    ]);
  });

  it("garde les sept colonnes meme quand rien n a ete fait", () => {
    const v = preparerVues(donnees({ serieTaches: [] }));
    expect(v.parJourDeSemaine.every((j) => j.valeur === 0)).toBe(true);
  });

  it("range chaque jour dans sa colonne", () => {
    /* Le 31 aout 2026 est un lundi ; le 6 septembre, un dimanche. */
    const v = preparerVues(donnees({ serieTaches: [
      { date: "2026-08-31", n: 3 }, { date: "2026-09-02", n: 1 },
      { date: "2026-09-06", n: 5 }, { date: "2026-09-07", n: 2 },
    ] }));
    expect(v.parJourDeSemaine.map((j) => j.valeur)).toEqual([5, 0, 1, 0, 0, 0, 5]);
  });

  /* ═══ ET C EST DANS UN FUSEAU NEGATIF QUE CA SE JOUE ═══
     A Paris, minuit UTC tombe a deux heures du matin le MEME jour :
     lire la date a minuit ou a midi ne change rien, et un test pose
     ici ne verrait jamais la difference. A New York, minuit UTC est
     vingt heures la VEILLE — le lundi deviendrait un dimanche, et la
     barre changerait de colonne.

     Ce test se deplace donc expres, puis repose le fuseau. C est la
     seule facon de montrer a quoi sert le « T12:00:00 ». */
  it("ne glisse pas d un jour dans un fuseau negatif", () => {
    const avant = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      /* Sans l heure, la date serait lue comme un dimanche ici. */
      expect(new Date("2026-08-31").getDay()).toBe(0);
      expect(new Date("2026-08-31T12:00:00").getDay()).toBe(1);

      const v = preparerVues(donnees({ serieTaches: [{ date: "2026-08-31", n: 4 }] }));
      expect(v.parJourDeSemaine[0]).toEqual({ nom: "Lundi", valeur: 4 });
      expect(v.parJourDeSemaine[6].valeur).toBe(0);
      /* La bande s ouvre elle aussi sur le bon jour. */
      expect(v.bandeDesJours[0].date).toBe("2026-08-31");
    } finally {
      if (avant === undefined) delete process.env.TZ;
      else process.env.TZ = avant;
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   LA BANDE DES JOURS : CE SONT LES TROUS QU ON VIENT LIRE.

   Un jour sans tache n existe pas en base — il n y a rien a
   enregistrer. La bande les fabrique donc, un par un, du premier jour
   connu jusqu a aujourd hui. Sans eux, la bande montrerait une serie
   ininterrompue la ou il y a eu des ruptures.
   ═══════════════════════════════════════════════════════════════ */
describe("la bande des jours", () => {
  const hier = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
      .map((n, i) => String(n).padStart(i === 0 ? 4 : 2, "0")).join("-");
  };

  it("ne rend rien quand aucune tache n a jamais ete faite", () => {
    const v = preparerVues(donnees({ serieTaches: [] }));
    expect(v.bandeDesJours).toEqual([]);
    expect(v.joursTenus).toBe(0);
  });

  it("remplit les jours vides entre les jours tenus", () => {
    const v = preparerVues(donnees({ serieTaches: [{ date: hier(), n: 2 }] }));
    /* Hier et aujourd hui : le jour vide d aujourd hui est fabrique. */
    expect(v.bandeDesJours).toHaveLength(2);
    expect(v.bandeDesJours[0]).toEqual({ date: hier(), n: 2 });
    expect(v.bandeDesJours.at(-1)!.n).toBe(0);
    expect(v.joursTenus).toBe(1);
  });

  /* ═══ LE JOUR COURANT Y EST DES LE MATIN ═══
     Le curseur avance de midi en midi. Tant que la borne haute etait
     l INSTANT courant, la boucle s arretait a la veille avant midi : une
     tache faite le matin n avait pas de colonne, et la serie se lisait
     comme rompue depuis la veille.

     MESURE AVANT CORRECTION : a 8 h 30 et a 11 h 30, deux jours dans la
     bande au lieu de trois, et un jour tenu au lieu de deux — alors que
     cinq taches avaient ete faites le jour meme. */
  it("porte le jour courant quelle que soit l heure", () => {
    for (const heure of [0, 8, 11, 12, 13, 23]) {
      vi.setSystemTime(new Date(`2026-08-31T${String(heure).padStart(2, "0")}:30:00`));
      const v = preparerVues(donnees({ serieTaches: [
        { date: "2026-08-29", n: 2 }, { date: "2026-08-31", n: 5 },
      ] }));
      expect(v.bandeDesJours.map((j) => j.date), String(heure))
        .toEqual(["2026-08-29", "2026-08-30", "2026-08-31"]);
      expect(v.bandeDesJours.at(-1), String(heure)).toEqual({ date: "2026-08-31", n: 5 });
      expect(v.joursTenus, String(heure)).toBe(2);
    }
    vi.useRealTimers();
  });

  /* ═══ CONSTATE : LA BANDE EST COUPEE A CENT VINGT JOURS, EN SILENCE ═══
     Une pratique plus ancienne que quatre mois n apparait pas, et
     `joursTenus` ne compte que dans cette fenetre — « X jours sur
     120 », jamais « X jours sur toute la duree ». La legende de
     l ecran dit bien « sur `bandeDesJours.length` », donc elle ne
     ment pas ; mais rien n annonce que le debut a ete coupe. */
  it("ne garde que les cent vingt derniers jours", () => {
    const vieux = new Date();
    vieux.setDate(vieux.getDate() - 400);
    const cle = [vieux.getFullYear(), vieux.getMonth() + 1, vieux.getDate()]
      .map((n, i) => String(n).padStart(i === 0 ? 4 : 2, "0")).join("-");
    const v = preparerVues(donnees({ serieTaches: [{ date: cle, n: 9 }] }));
    expect(v.bandeDesJours).toHaveLength(120);
    /* Le jour tenu, vieux de quatre cents jours, est hors de la fenetre :
       il ne compte plus. */
    expect(v.joursTenus).toBe(0);
  });
});

describe("l heure de pointe", () => {
  const heures = (v: [number, number, number][]) =>
    v.map(([heure, taches, focus]) => ({ heure, taches, focus }));

  /* ELLE CUMULE LES DEUX SERIES : c est le moment ou l on est A
     L OUVRAGE, pas celui ou l on coche le plus. Une heure de focus sans
     une seule tache cochee compte donc autant. */
  it("prend l heure ou taches et focus cumules sont au plus haut", () => {
    const v = preparerVues(donnees({ heureDOuvrage: heures([[9, 5, 0], [14, 2, 9], [20, 3, 3]]) }));
    expect(v.heurePleine).toBe(14);
  });

  it("garde la premiere heure en cas d egalite", () => {
    const v = preparerVues(donnees({ heureDOuvrage: heures([[9, 4, 0], [14, 2, 2], [20, 1, 3]]) }));
    expect(v.heurePleine).toBe(9);
  });

  /* MINUIT EST UNE HEURE COMME UNE AUTRE : zero n est pas « pas
     d heure ». C est ce que la garde sur la somme protege — sans elle,
     une heure de pointe a minuit serait indiscernable de l absence. */
  it("rend minuit quand c est minuit, et rien quand il n y a rien", () => {
    expect(preparerVues(donnees({ heureDOuvrage: heures([[0, 1, 0], [9, 0, 0]]) })).heurePleine).toBe(0);
    expect(preparerVues(donnees({ heureDOuvrage: heures([[0, 0, 0], [9, 0, 0]]) })).heurePleine).toBeNull();
    expect(preparerVues(donnees({ heureDOuvrage: [] })).heurePleine).toBeNull();
  });
});

describe("les deux sommes restantes", () => {
  it("additionne les habitudes tenues et la charge annuelle", () => {
    const v = preparerVues(donnees({
      habitStreak: [{ completed: 3 }, { completed: 4 }] as AnalyticsData["habitStreak"],
      anneeQuiPreleve: [{ mois: 1, montant: 120.5, lignes: 2 }, { mois: 2, montant: 80, lignes: 1 }],
    }));
    expect(v.totalHabitudes).toBe(7);
    expect(v.chargeAnnuelle).toBe(200.5);
  });

  /* CE QUI TOMBE A DATE CUMULE DEUX SOURCES : les evenements d agenda et
     les echeances d objectifs. Une seule des deux donnerait un calendrier
     a moitie vide. */
  it("cumule evenements et echeances", () => {
    const v = preparerVues(donnees({ cequiTombe: [
      { mois: "2026-08", evenements: 3, echeances: 2, jours: 31 },
      { mois: "2026-09", evenements: 1, echeances: 0, jours: 30 },
    ] }));
    expect(v.totalQuiTombe).toBe(6);
  });
});
