import { describe, expect, it } from "vitest";
import { exigerLeSecondFacteur, secondFacteurManquant } from "./secondFacteur";

/* LA GARDE QUE « SUPPRIMER TOUTES MES DONNEES » N AVAIT PAS.
 *
 * Deux fonctions detruisent un compte ou son contenu. Une seule
 * exigeait le second facteur. Ces tests tiennent la definition
 * commune : si elle s ouvre, les deux s ouvrent, et on le voit ici. */

const ENTETES = { "Access-Control-Allow-Origin": "*" };
const facteur = (data: unknown, error: unknown = null) => () => Promise.resolve({ data, error });

describe("secondFacteurManquant", () => {
  it("laisse passer un compte sans facteur, quelle que soit la session", () => {
    expect(secondFacteurManquant(false, "aal1")).toBe(false);
    expect(secondFacteurManquant(false, undefined)).toBe(false);
  });

  it("exige aal2 d un compte muni d un facteur", () => {
    expect(secondFacteurManquant(true, "aal1")).toBe(true);
    expect(secondFacteurManquant(true, undefined)).toBe(true);
    expect(secondFacteurManquant(true, "aal2")).toBe(false);
  });

  it("ferme la porte sur une reponse inattendue plutot que de l ouvrir", () => {
    expect(secondFacteurManquant(null, "aal1")).toBe(true);
    expect(secondFacteurManquant(undefined, "aal1")).toBe(true);
    expect(secondFacteurManquant("false", "aal1")).toBe(true);
  });
});

describe("exigerLeSecondFacteur", () => {
  it("rend null quand l appel peut continuer", async () => {
    expect(await exigerLeSecondFacteur(facteur(false), "aal1", ENTETES)).toBeNull();
    expect(await exigerLeSecondFacteur(facteur(true), "aal2", ENTETES)).toBeNull();
  });

  it("refuse en 403 une session sans le second facteur, avec un code lisible par le client", async () => {
    const r = await exigerLeSecondFacteur(facteur(true), "aal1", ENTETES);
    expect(r?.status).toBe(403);
    expect(await r?.json()).toEqual({ error: "second_facteur_requis" });
    expect(r?.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("refuse en 500 quand l etat du facteur ne se lit pas", async () => {
    const r = await exigerLeSecondFacteur(facteur(null, { message: "reseau" }), "aal2", ENTETES);
    expect(r?.status).toBe(500);
    expect(await r?.json()).toEqual({ error: "second_facteur_illisible" });
  });

  it("lit l etat du facteur une seule fois", async () => {
    let lectures = 0;
    await exigerLeSecondFacteur(() => { lectures++; return Promise.resolve({ data: false, error: null }); }, "aal1", ENTETES);
    expect(lectures).toBe(1);
  });
});
