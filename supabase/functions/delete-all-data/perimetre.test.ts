import { describe, expect, it } from "vitest";
import { colonnesDesTables, colonnesPersonnelles } from "@/socle/supabase/schemaDesTypes";
import { DEPOTS_PERSONNELS, EFFACEES, GARDEES } from "./perimetre";

/* « SUPPRIMER TOUTES MES DONNEES » NE PEUT PLUS EN OUBLIER EN SILENCE.
 *
 * La fonction vidait trente tables sur quatre-vingt-huit et annoncait
 * « toutes tes donnees ». Ces tests tiennent la promesse contre le
 * schema engendre : chaque colonne qui designe une personne est soit
 * effacee, soit gardee pour une raison ecrite. */

const effacees = EFFACEES.map(([t, c]) => `${t}.${c}`);
const gardees = Object.keys(GARDEES);

describe("le perimetre de « supprimer toutes mes donnees »", () => {
  it("lit vraiment le schema — sinon tout le reste passerait a vide", () => {
    expect(colonnesDesTables().size).toBeGreaterThan(100);
    expect(colonnesPersonnelles().length).toBeGreaterThan(80);
  });

  it("decide du sort de chaque colonne qui designe une personne", () => {
    const sansDecision = colonnesPersonnelles().filter((k) => !effacees.includes(k) && !gardees.includes(k));
    expect(sansDecision).toEqual([]);
  });

  it("ne nomme aucune table ni colonne qui n existe pas", () => {
    const schema = colonnesDesTables();
    const inconnues = [...effacees, ...gardees].filter((k) => {
      const [table, colonne] = k.split(".");
      return !schema.get(table)?.has(colonne);
    });
    expect(inconnues).toEqual([]);
  });

  it("ne decide jamais deux fois", () => {
    expect(new Set(effacees).size).toBe(effacees.length);
    expect(effacees.filter((k) => gardees.includes(k))).toEqual([]);
  });

  it("donne une raison lisible a chaque table gardee", () => {
    const muettes = Object.entries(GARDEES).filter(([, raison]) => raison.trim().length < 20);
    expect(muettes).toEqual([]);
  });

  it("efface toute la memoire du coach", () => {
    for (const t of ["mia_conversations", "mia_messages", "mia_embeddings", "mia_insights"])
      expect(effacees).toContain(`${t}.user_id`);
  });

  it("garde la liste de blocage, le journal de securite et les codes deja utilises", () => {
    expect(gardees).toContain("blocked_users.user_id");
    expect(gardees).toContain("security_events.user_id");
    expect(gardees).toContain("promo_code_redemptions.user_id");
  });

  it("ne vide jamais le depot des guildes, range par guilde et non par personne", () => {
    expect(DEPOTS_PERSONNELS).not.toContain("guild-media");
  });
});
