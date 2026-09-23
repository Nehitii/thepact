import { describe, expect, it } from "vitest";
import { INTERRUPTEURS, INTERRUPTEUR_PAR_DEFAUT, lireLInterrupteur } from "./interrupteurs";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Le modèle d'interrupteur se lit d'une adresse de banc — et demain
   d'un réglage. Une valeur inconnue ne doit jamais laisser l'enseigne
   sans interrupteur : sans lui, on ne peut plus changer de mesure.
   ═══════════════════════════════════════════════════════════════ */

describe("les interrupteurs de l'enseigne", () => {
  it("ont chacun un identifiant à eux", () => {
    const ids = INTERRUPTEURS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("se lisent par leur identifiant", () => {
    expect(lireLInterrupteur("cle")).toBe("cle");
    expect(lireLInterrupteur("cordon")).toBe("cordon");
  });

  it("retombent sur le levier pour une valeur inconnue ou absente", () => {
    expect(lireLInterrupteur("inconnu")).toBe(INTERRUPTEUR_PAR_DEFAUT);
    expect(lireLInterrupteur(null)).toBe("levier");
    expect(lireLInterrupteur(undefined)).toBe("levier");
  });
});
