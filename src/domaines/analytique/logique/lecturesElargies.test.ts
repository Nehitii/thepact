import { describe, it, expect } from "vitest";
import { lecturesElargies, type MatiereBrute } from "./lecturesElargies";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Ces douze comptages vivaient dans le `queryFn` de `useAnalytics`, au
   milieu de dix variables partagées. Rien ne pouvait les éprouver sans
   une base de données, donc rien ne les éprouvait : ils étaient exacts
   par confiance.

   Les cas retenus ne sont pas des exemples, ce sont les endroits où le
   code prend une DÉCISION qu'on ne relit pas : un plafond, un modulo,
   un repli d'une colonne sur une autre, un jour compté une seule fois.
   Chacun a été vu échouer avant d'être vu passer.
   ═══════════════════════════════════════════════════════════════ */

const RIEN: MatiereBrute = {
  taches: [], sessions: [], sante: [], depenses: [],
  mois: [], agenda: [], echeances: [], objectifs: [],
};
const avec = (p: Partial<MatiereBrute>) => lecturesElargies({ ...RIEN, ...p });
/* Les lignes de base sont volontairement incomplètes : le calcul ne lit
   qu'une poignée de colonnes, et le test ne doit pas prétendre le
   contraire. */
const tache = (p: Record<string, unknown>) => p as unknown as MatiereBrute["taches"][number];
const session = (p: Record<string, unknown>) => p as unknown as MatiereBrute["sessions"][number];
const releve = (p: Record<string, unknown>) => p as unknown as MatiereBrute["sante"][number];
const depense = (p: Record<string, unknown>) => p as unknown as MatiereBrute["depenses"][number];

describe("les reports", () => {
  it("regroupe tout ce qui dépasse cinq reports dans la case cinq", () => {
    const { reports } = avec({
      taches: [0, 2, 5, 9, 40].map((n) => tache({ postpone_count: n })),
    });
    /* Le plafond est le seul endroit où le nombre affiché n'est pas le
       nombre réel. Sans lui, une tâche reportée quarante fois ouvre
       quarante colonnes vides sur le graphique. */
    expect(reports.map((r) => r.reports)).toEqual([0, 2, 5]);
    expect(reports.find((r) => r.reports === 5)?.faites).toBe(3);
  });

  it("compte une tâche jamais reportée comme zéro, pas comme absente", () => {
    const { reports } = avec({ taches: [tache({}), tache({ postpone_count: null })] });
    expect(reports).toEqual([{ reports: 0, faites: 2 }]);
  });
});

describe("l'année qui prélève", () => {
  it("fait tomber une dépense trimestrielle sur quatre mois, pas sur douze", () => {
    const { anneeQuiPreleve } = avec({
      depenses: [depense({ periode_mois: 3, montant_total: 120, mois_ancre: "2025-02-15" })],
    });
    const charges = anneeQuiPreleve.filter((m) => m.lignes > 0).map((m) => m.mois);
    /* Février est le mois 1 ; congru à 1 modulo 3 : 1, 4, 7, 10. */
    expect(charges).toEqual([1, 4, 7, 10]);
    expect(anneeQuiPreleve[1].montant).toBe(120);
    expect(anneeQuiPreleve[2].montant).toBe(0);
  });

  it("étale une dépense mensuelle sur les douze mois", () => {
    const { anneeQuiPreleve } = avec({ depenses: [depense({ periode_mois: 1, amount: 30 })] });
    expect(anneeQuiPreleve.every((m) => m.montant === 30)).toBe(true);
  });

  it("traite une période absente, nulle ou négative comme mensuelle", () => {
    /* Zéro est déjà rattrapé par le `|| 1`. Le `Math.max(1, …)` ne sert
       qu'au cas NÉGATIF — et c'est ce que ce test devait dire. Écrit
       d'abord avec un zéro, il passait encore une fois le `Math.max`
       retiré : il décrivait une protection au lieu de l'éprouver. */
    for (const periode_mois of [0, null, -3]) {
      const { anneeQuiPreleve } = avec({ depenses: [depense({ periode_mois, amount: 10 })] });
      expect(anneeQuiPreleve.filter((m) => m.lignes > 0)).toHaveLength(12);
    }
  });
});

describe("l'heure d'ouvrage", () => {
  it("range les tâches à l'heure où elles ont été faites, et les sessions à leur départ", () => {
    const { heureDOuvrage } = avec({
      taches: [tache({ completed_at: "2025-03-04T09:30:00" }), tache({ completed_at: null })],
      sessions: [session({ started_at: "2025-03-04T14:05:00" })],
    });
    expect(heureDOuvrage).toHaveLength(24);
    expect(heureDOuvrage[9]).toEqual({ heure: 9, taches: 1, focus: 0 });
    expect(heureDOuvrage[14]).toEqual({ heure: 14, taches: 0, focus: 1 });
  });

  it("replie une session sans heure de départ sur son heure de fin", () => {
    /* `s.started_at || s.completed_at` : une session interrompue puis
       reprise n'a parfois que sa fin. La perdre creuserait un trou dans
       la journée au moment précis où quelque chose a eu lieu. */
    const { heureDOuvrage } = avec({
      sessions: [session({ started_at: null, completed_at: "2025-03-04T21:10:00" })],
    });
    expect(heureDOuvrage[21].focus).toBe(1);
  });
});

describe("le focus par objectif", () => {
  it("nomme l'objectif, ignore les sessions libres, et nomme aussi ce qui a été retiré", () => {
    const { focusParObjectif, matiere } = avec({
      objectifs: [{ id: "a", name: "Écrire" }],
      sessions: [
        session({ linked_goal_id: "a", duration_minutes: 25 }),
        session({ linked_goal_id: "a", duration_minutes: 50 }),
        session({ linked_goal_id: "disparu", duration_minutes: 5 }),
        session({ linked_goal_id: null, duration_minutes: 90 }),
      ],
    });
    expect(focusParObjectif).toEqual([
      { id: "a", nom: "Écrire", minutes: 75, sessions: 2 },
      { id: "disparu", nom: "Objectif retiré", minutes: 5, sessions: 1 },
    ]);
    /* Les quatre-vingt-dix minutes sans objectif ne sont pas perdues :
       elles ne sont simplement pas attribuables, et `matiere` le dit. */
    expect(matiere.sessionsLiees).toBe(3);
  });

  it("ne garde que les huit premiers, du plus long au plus court", () => {
    const { focusParObjectif } = avec({
      objectifs: Array.from({ length: 10 }, (_, i) => ({ id: String(i), name: "O" + i })),
      sessions: Array.from({ length: 10 }, (_, i) => session({ linked_goal_id: String(i), duration_minutes: i })),
    });
    expect(focusParObjectif).toHaveLength(8);
    expect(focusParObjectif[0].id).toBe("9");
  });
});

describe("ce qui tombe, mois par mois", () => {
  it("compte deux événements du même jour comme un seul jour occupé", () => {
    const { cequiTombe } = avec({
      agenda: [{ start_time: "2025-05-12T08:00:00" }, { start_time: "2025-05-12T18:00:00" }],
      echeances: [{ deadline: "2025-05-30T00:00:00" }],
    });
    expect(cequiTombe).toEqual([{ mois: "2025-05", evenements: 2, echeances: 1, jours: 2 }]);
  });

  it("écarte une date vide ou illisible au lieu de fabriquer un mois", () => {
    /* Sans le garde-fou sur `NaN`, une date invalide produisait un mois
       nommé « Invalid Date » — une colonne de plus sur le graphique. */
    const { cequiTombe } = avec({
      agenda: [{ start_time: null }, { start_time: "pas une date" }],
    });
    expect(cequiTombe).toEqual([]);
  });
});

describe("la matière", () => {
  it("annonce ce sur quoi les courbes reposent, y compris quand il n'y a rien", () => {
    expect(avec({}).matiere).toEqual({
      relevesSante: 0, relevesEnergie: 0, nuitsMesurees: 0, moisValides: 0, sessionsLiees: 0,
    });
  });

  it("ne compte comme relevé d'énergie que celui qui porte au moins un des trois temps", () => {
    const { energieTroisTemps, sommeil, matiere } = avec({
      sante: [
        releve({ entry_date: "2025-01-02", energy_morning: 4, sleep_hours: 7 }),
        releve({ entry_date: "2025-01-01", energy_evening: 2 }),
        releve({ entry_date: "2025-01-03" }),
      ],
    });
    expect(matiere).toMatchObject({ relevesSante: 3, relevesEnergie: 2, nuitsMesurees: 1 });
    /* Les séries sortent triées par date, pas dans l'ordre de la base. */
    expect(energieTroisTemps.map((e) => e.date)).toEqual(["2025-01-01", "2025-01-02"]);
    expect(energieTroisTemps[0]).toEqual({ date: "2025-01-01", matin: null, apresMidi: null, soir: 2 });
    expect(sommeil).toEqual([{ date: "2025-01-02", heures: 7 }]);
  });
});

describe("les tâches par catégorie et par difficulté", () => {
  it("range une tâche sans catégorie dans « general » et sans priorité dans « medium »", () => {
    const { tachesParCategorie, tachesParDifficulte } = avec({
      taches: [tache({}), tache({ category: "maison", priority: "high" }), tache({ category: "maison" })],
    });
    expect(tachesParCategorie).toEqual([{ categorie: "maison", n: 2 }, { categorie: "general", n: 1 }]);
    /* L'ordre des difficultés est celui de l'échelle, pas celui des
       effectifs — et un niveau vide ne prend pas de place. */
    expect(tachesParDifficulte).toEqual([{ niveau: "medium", n: 2 }, { niveau: "high", n: 1 }]);
  });
});

describe("le prévu contre le réel", () => {
  it("laisse l'imprévu à part au lieu de le fondre dans le total", () => {
    const { prevuReel, matiere } = avec({
      mois: [{ month: "2025-04", actual_total_expenses: 1200, unplanned_expenses: 300, actual_total_income: 2000, unplanned_income: 0 }] as unknown as MatiereBrute["mois"],
    });
    expect(prevuReel).toEqual([{
      month: "2025-04", reelDepenses: 1200, imprevuDepenses: 300, reelRevenus: 2000, imprevuRevenus: 0,
    }]);
    expect(matiere.moisValides).toBe(1);
  });
});
