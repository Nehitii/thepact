import { describe, it, expect } from "vitest";
import { construireExport, csvDeSante, type Lire, type Categorie } from "./exportDesDonnees";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   L'export est la seule promesse de l'application : « tu peux partir
   avec tes données ». Une sauvegarde incomplète est pire qu'une
   sauvegarde ratée — la ratée, on la refait.

   Le premier test ci-dessous est celui qui manquait. La page portait un
   commentaire disant le défaut corrigé ; il l'était pour cinq lectures
   sur quinze. Les six requêtes de finance, celle de santé, le profil
   complet et les succès jetaient toujours leur `error`, et le fichier
   partait sans eux, sans un mot.
   ═══════════════════════════════════════════════════════════════ */

const QUAND = new Date("2026-03-14T10:00:00Z");
const MOI = { id: "u1", email: "moi@exemple.fr" };

/* Un lecteur de comptoir : il rend ce qu'on lui a mis dans la table
   demandée, et note ce qu'on lui a demandé.
 *
 * IL PROJETTE LES COLONNES, comme le vrai. Sans ça il rendait la ligne
 * entière à chaque lecture de `profiles` — y compris là où le code ne
 * demande que quatre champs — et le test du code de déverrouillage
 * tombait sur une fuite qui n'existe pas. Un faux plus permissif que le
 * vrai fabrique de faux défauts ; un faux plus strict en cache. */
function lecteur(tables: Record<string, unknown> = {}) {
  const vues: string[] = [];
  const projeter = (v: unknown, colonnes?: string) => {
    if (!colonnes || colonnes === "*" || !v || typeof v !== "object") return v;
    const gardees = colonnes.split(",").map((c) => c.trim());
    const une = (o: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(o).filter(([c]) => gardees.includes(c)));
    return Array.isArray(v) ? v.map((o) => une(o as Record<string, unknown>)) : une(v as Record<string, unknown>);
  };
  const lire: Lire = async (d) => {
    vues.push(d.table);
    const v = tables[d.table];
    if (v && typeof v === "object" && "error" in (v as object)) return v as { data: unknown; error: { message: string } };
    return { data: projeter(v, d.colonnes) ?? (d.unique ? null : []), error: null };
  };
  return { lire, vues };
}

describe("une lecture qui échoue arrête tout", () => {
  /* Chaque table, une par une : c'est le seul moyen de prouver qu'aucun
     chemin n'évite la vérification. Un test qui n'en couvre qu'une
     laisse exactement le trou qu'on vient de boucher. */
  const TOUTES = [
    "profiles", "goals", "steps", "journal_entries", "health_data",
    "recurring_income", "recurring_expenses", "finance",
    "monthly_finance_validations", "pact_spending", "user_achievements",
  ];

  for (const table of TOUTES) {
    it(`refuse d'exporter si « ${table} » répond une erreur`, async () => {
      const { lire } = lecteur({
        profiles: { active_pact_id: "p1" },
        goals: [{ id: "g1" }],
        health_data: [{ entry_date: "2026-01-01" }],
        [table]: { data: null, error: { message: "réseau" } },
      });
      await expect(construireExport({ lire, categorie: "all", utilisateur: MOI, maintenant: QUAND }))
        .rejects.toThrow(/réseau/);
    });
  }

  it("nomme dans l'erreur ce qui n'a pas pu être lu", async () => {
    /* « échec » tout court oblige à deviner ce qui manque au fichier. */
    const { lire } = lecteur({
      profiles: { active_pact_id: "p1" },
      recurring_expenses: { data: null, error: { message: "délai dépassé" } },
    });
    await expect(construireExport({ lire, categorie: "finance", utilisateur: MOI, maintenant: QUAND }))
      .rejects.toThrow("dépenses récurrentes : délai dépassé");
  });
});

describe("ce que chaque catégorie emporte", () => {
  const cases: [Categorie, string[], string[]][] = [
    ["goals-steps", ["goals", "steps"], ["journalEntries", "finance", "profile"]],
    ["journal", ["journalEntries"], ["goals", "finance", "profile"]],
    ["finance", ["finance"], ["goals", "journalEntries", "profile"]],
  ];
  for (const [categorie, presents, absents] of cases) {
    it(`« ${categorie} » emporte ${presents.join(", ")} et rien d'autre`, async () => {
      const { lire } = lecteur({ profiles: { active_pact_id: "p1" }, goals: [{ id: "g1" }] });
      const out = await construireExport({ lire, categorie, utilisateur: MOI, maintenant: QUAND });
      for (const c of presents) expect(out, categorie).toHaveProperty(c);
      for (const c of absents) expect(out, categorie).not.toHaveProperty(c);
    });
  }

  it("emporte tout, et se date", async () => {
    const { lire } = lecteur({ profiles: { active_pact_id: "p1", goal_unlock_code: "1234", pseudo: "moi" }, goals: [{ id: "g1" }] });
    const out = await construireExport({ lire, categorie: "all", utilisateur: MOI, stats: { n: 3 }, maintenant: QUAND });
    expect(out.exportedAt).toBe("2026-03-14T10:00:00.000Z");
    expect(out.user).toEqual({ id: "u1", email: "moi@exemple.fr" });
    expect(out.stats).toEqual({ n: 3 });
    for (const c of ["goals", "steps", "journalEntries", "finance", "profile", "pact", "achievements"])
      expect(out).toHaveProperty(c);
  });
});

describe("ce que l'export ne doit pas emporter", () => {
  it("laisse le code de déverrouillage hors du fichier", async () => {
    /* Quatre chiffres qui masquent le contenu d'un objectif, en clair
       dans un fichier fait pour être rangé ailleurs. */
    const { lire } = lecteur({ profiles: { active_pact_id: "p1", goal_unlock_code: "1234", pseudo: "moi" } });
    const out = await construireExport({ lire, categorie: "all", utilisateur: MOI, maintenant: QUAND });
    expect(out.profile).toEqual({ active_pact_id: "p1", pseudo: "moi" });
    expect(JSON.stringify(out)).not.toContain("1234");
  });
});

describe("le pacte lu est l'actif", () => {
  it("suit active_pact_id quand le profil en désigne un", async () => {
    const { lire, vues } = lecteur({ profiles: { active_pact_id: "p-actif" } });
    await construireExport({ lire, categorie: "goals-steps", utilisateur: MOI, maintenant: QUAND });
    /* Deux lectures de pacts suffiraient à trahir un repli inutile. */
    expect(vues.filter((t) => t === "pacts")).toHaveLength(1);
  });

  it("retombe sur le dernier pacte créé quand le profil n'en désigne aucun", async () => {
    const { lire, vues } = lecteur({ profiles: {}, pacts: { id: "p-dernier" } });
    await construireExport({ lire, categorie: "goals-steps", utilisateur: MOI, maintenant: QUAND });
    expect(vues.filter((t) => t === "pacts")).toHaveLength(2);
  });

  it("n'invente pas d'objectifs quand il n'y a aucun pacte", async () => {
    const { lire, vues } = lecteur({ profiles: {}, pacts: null });
    const out = await construireExport({ lire, categorie: "goals-steps", utilisateur: MOI, maintenant: QUAND });
    expect(out.goals).toEqual([]);
    expect(vues).not.toContain("goals");
  });

  it("ne demande pas les étapes quand il n'y a aucun objectif", async () => {
    const { lire, vues } = lecteur({ profiles: { active_pact_id: "p1" }, goals: [] });
    await construireExport({ lire, categorie: "goals-steps", utilisateur: MOI, maintenant: QUAND });
    expect(vues).not.toContain("steps");
  });
});

describe("le tableur de santé", () => {
  it("écrit ses quinze colonnes en français, dans l'ordre", () => {
    const l = csvDeSante([]).split("\n")[0].split(",");
    expect(l).toHaveLength(15);
    expect(l[0]).toBe("Date");
    expect(l[14]).toBe("Notes");
    /* « stress » est aussi un mot francais : chercher les jetons qui ne
       le sont PAS, sinon le test refuse un en-tete correct. */
    expect(csvDeSante([]).toLowerCase()).not.toMatch(/sleep|mood|hydration|entry_date|balance/);
  });

  it("laisse une case vide plutôt qu'un « undefined » dans le tableur", () => {
    const [, ligne] = csvDeSante([{ entry_date: "2026-01-02", sleep_hours: 7 }]).split("\n");
    expect(ligne).toBe('2026-01-02,7,,,,,,,,,,,,,""');
  });

  it("entoure les notes et double leurs guillemets", () => {
    /* Une note contenant une virgule décalerait toutes les colonnes ;
       un guillemet non doublé fermerait la cellule au milieu. */
    const [, ligne] = csvDeSante([{ entry_date: "j", notes: 'a, b "c"' }]).split("\n");
    expect(ligne.endsWith('"a, b ""c"""')).toBe(true);
  });
});
