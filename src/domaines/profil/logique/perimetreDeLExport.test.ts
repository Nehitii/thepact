import { describe, it, expect } from "vitest";
import { colonnesDesTables, colonnesPersonnelles } from "@/socle/supabase/schemaDesTypes";
import { construireExport, LIGNES_PAR_PAGE, type Lire } from "./exportDesDonnees";
import { DANS_LES_SECTIONS, NON_EXPORTEES, TABLES_DU_COMPTE } from "./perimetreDeLExport";

/* ═══════════════════════════════════════════════════════════════
   « SAUVEGARDE COMPLETE DE TOUTES TES DONNEES »

   Le fichier lisait douze tables sur quatre-vingt-huit colonnes de
   personne, et coupait chacune a sa millieme ligne. Ces tests tiennent
   les trois promesses que la phrase fait : TOUTES les tables, TOUTES
   leurs lignes, et chacune UNE fois.
   ═══════════════════════════════════════════════════════════════ */

const QUAND = new Date("2026-09-23T10:00:00Z");
const MOI = { id: "u1", email: "moi@exemple.fr" };
const exportees = TABLES_DU_COMPTE.map(([t, c]) => `${t}.${c}`);
const exclues = Object.keys(NON_EXPORTEES);

describe("le perimetre de l export, confronte au schema", () => {
  it("lit vraiment le schema — sinon tout le reste passerait a vide", () => {
    expect(colonnesPersonnelles().length).toBeGreaterThan(80);
  });

  it("decide du sort de chaque colonne qui designe une personne", () => {
    const sansDecision = colonnesPersonnelles().filter(
      (k) => !exportees.includes(k) && !DANS_LES_SECTIONS.includes(k) && !exclues.includes(k));
    expect(sansDecision).toEqual([]);
  });

  it("ne nomme aucune table ni colonne qui n existe pas", () => {
    const schema = colonnesDesTables();
    const inconnues = [...exportees, ...DANS_LES_SECTIONS, ...exclues].filter((k) => {
      const [table, colonne] = k.split(".");
      return !schema.get(table)?.has(colonne);
    });
    expect(inconnues).toEqual([]);
  });

  it("ne decide jamais deux fois", () => {
    const toutes = [...exportees, ...DANS_LES_SECTIONS, ...exclues];
    expect(new Set(toutes).size).toBe(toutes.length);
  });

  it("ne lit par pages que des tables qui ont un identifiant pour les ordonner", () => {
    const schema = colonnesDesTables();
    const sansId = [...new Set(TABLES_DU_COMPTE.map(([t]) => t))].filter((t) => !schema.get(t)?.has("id"));
    expect(sansId).toEqual([]);
  });

  it("donne une raison lisible a chaque table laissee hors du fichier", () => {
    expect(Object.entries(NON_EXPORTEES).filter(([, r]) => r.trim().length < 20)).toEqual([]);
  });

  it("emporte les conversations avec Mia, et laisse les secrets dehors", () => {
    expect(exportees).toContain("mia_conversations.user_id");
    expect(exportees).toContain("mia_messages.user_id");
    expect(exclues).toContain("mfa_recovery_codes.user_id");
    expect(exclues).toContain("push_subscriptions.user_id");
  });
});

/* Un lecteur plus fidele que celui de `exportDesDonnees.test.ts` : il
   filtre sur `ou`, ordonne, et decoupe selon `plage`, comme PostgREST. */
function lecteurFidele(tables: Record<string, Record<string, unknown>[]>) {
  const lire: Lire = async (d) => {
    let lignes = [...(tables[d.table] ?? [])];
    for (const [c, v] of Object.entries(d.ou ?? {})) lignes = lignes.filter((l) => l[c] === v);
    if (d.parmi) lignes = lignes.filter((l) => d.parmi![1].includes(l[d.parmi![0]] as string));
    if (d.ordre) {
      const [c, croissant] = d.ordre;
      lignes.sort((a, b) => String(a[c]).localeCompare(String(b[c])) * (croissant ? 1 : -1));
    }
    if (d.unique) return { data: lignes[0] ?? null, error: null };
    if (d.plage) lignes = lignes.slice(d.plage[0], d.plage[1] + 1);
    return { data: lignes, error: null };
  };
  return lire;
}

describe("ce que « toutes les donnees » emporte vraiment", () => {
  it("n arrete pas une table a sa millieme ligne", async () => {
    const n = LIGNES_PAR_PAGE * 2 + 500;
    const calendar_events = Array.from({ length: n }, (_, i) => ({ id: `e${String(i).padStart(5, "0")}`, user_id: "u1" }));
    const out = await construireExport({ lire: lecteurFidele({ calendar_events }), categorie: "all", utilisateur: MOI, maintenant: QUAND });
    const lues = (out.tables as Record<string, unknown[]>).calendar_events;
    expect(lues).toHaveLength(n);
    expect(new Set(lues.map((l) => (l as { id: string }).id)).size).toBe(n);
  });

  it("garde une seule fois le message qu on s est envoye a soi-meme", async () => {
    const private_messages = [
      { id: "m1", sender_id: "u1", receiver_id: "u2" },
      { id: "m2", sender_id: "u2", receiver_id: "u1" },
      { id: "m3", sender_id: "u1", receiver_id: "u1" },
    ];
    const out = await construireExport({ lire: lecteurFidele({ private_messages }), categorie: "all", utilisateur: MOI, maintenant: QUAND });
    const ids = ((out.tables as Record<string, { id: string }[]>).private_messages).map((m) => m.id).sort();
    expect(ids).toEqual(["m1", "m2", "m3"]);
  });

  it("n emporte que les lignes de la personne", async () => {
    const mia_messages = [{ id: "a", user_id: "u1" }, { id: "b", user_id: "quelqu-un-d-autre" }];
    const out = await construireExport({ lire: lecteurFidele({ mia_messages }), categorie: "all", utilisateur: MOI, maintenant: QUAND });
    expect((out.tables as Record<string, { id: string }[]>).mia_messages.map((m) => m.id)).toEqual(["a"]);
  });

  it("emporte les pactes precedents avec leurs objectifs et leurs etapes", async () => {
    const out = await construireExport({
      lire: lecteurFidele({
        profiles: [{ id: "u1", active_pact_id: "p2" }],
        pacts: [{ id: "p1", user_id: "u1" }, { id: "p2", user_id: "u1" }],
        goals: [{ id: "g1", pact_id: "p1" }, { id: "g2", pact_id: "p2" }],
        steps: [{ id: "s1", goal_id: "g1" }, { id: "s2", goal_id: "g2" }],
      }),
      categorie: "all", utilisateur: MOI, maintenant: QUAND,
    });
    expect((out.pact as { id: string }).id).toBe("p2");
    expect(out.autresPactes).toEqual([{
      pact: { id: "p1", user_id: "u1" },
      goals: [{ id: "g1", pact_id: "p1" }],
      steps: [{ id: "s1", goal_id: "g1" }],
    }]);
  });

  it("refuse d exporter si une seule table du compte repond une erreur", async () => {
    for (const [table] of TABLES_DU_COMPTE) {
      const lire: Lire = async (d) => d.table === table
        ? { data: null, error: { message: "réseau" } }
        : { data: d.unique ? null : [], error: null };
      await expect(construireExport({ lire, categorie: "all", utilisateur: MOI, maintenant: QUAND }), table)
        .rejects.toThrow(`${table} : réseau`);
    }
  });
});
