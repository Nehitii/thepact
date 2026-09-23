import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { PREF, PREFERENCES_EFFACABLES } from "@/socle/outils/preferencesAffichage";
import { PROPOSITIONS } from "./catalogue";
import { FONDS_AU_CHOIX, lireLeFond, useFondDuTableau } from "./choix";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Le fond du tableau de bord se choisit dans les options et s'affiche
   ailleurs. Entre les deux, une clé du navigateur — et trois façons de
   mentir sans rien casser :

   - UNE VALEUR QUI N'EST PLUS UN CHOIX. L'atlas est resté au banc ; un
     identifiant ancien, retiré ou tapé à la main doit ramener le ciel
     classique, pas un fond blanc ni une erreur.
   - UN CHOIX QUI NE TRAVERSE PAS. Les options et le tableau de bord ne
     partagent aucun parent : sans avis, il faudrait recharger pour voir
     le nouveau fond.
   - UN DÉFAUT QU'ON RETIENT. Revenir au classique doit effacer la clé,
     pas l'écrire : la remise à zéro compte ce qui est posé.
   ═══════════════════════════════════════════════════════════════ */

afterEach(() => localStorage.clear());

describe("les fonds au choix", () => {
  it("proposent tout le catalogue sauf l'atlas", () => {
    expect(FONDS_AU_CHOIX).not.toContain("atlas");
    expect(FONDS_AU_CHOIX).toHaveLength(PROPOSITIONS.length - 1);
  });

  it("commencent par le ciel classique", () => {
    expect(FONDS_AU_CHOIX[0]).toBe("classique");
  });
});

describe("la lecture d'une valeur", () => {
  it("garde un choix possible", () => {
    expect(lireLeFond("horizon")).toBe("horizon");
    expect(lireLeFond("constellation")).toBe("constellation");
  });

  it("ramène au classique tout ce qui n'en est pas un", () => {
    for (const brut of [null, undefined, "", "atlas", "actuel", "HORIZON", "n'importe quoi"]) {
      expect(lireLeFond(brut)).toBe("classique");
    }
  });
});

describe("la préférence", () => {
  it("part du classique quand rien n'est posé", () => {
    const { result } = renderHook(() => useFondDuTableau());
    expect(result.current[0]).toBe("classique");
  });

  it("relit ce qui a été posé", () => {
    localStorage.setItem(PREF.HUB_FOND, "aurore");
    const { result } = renderHook(() => useFondDuTableau());
    expect(result.current[0]).toBe("aurore");
  });

  it("retient un choix, et efface la clé au retour au classique", () => {
    const { result } = renderHook(() => useFondDuTableau());
    act(() => result.current[1]("essaim"));
    expect(localStorage.getItem(PREF.HUB_FOND)).toBe("essaim");
    act(() => result.current[1]("classique"));
    expect(localStorage.getItem(PREF.HUB_FOND)).toBeNull();
    expect(result.current[0]).toBe("classique");
  });

  it("prévient le tableau de bord monté ailleurs dans la page", () => {
    const options = renderHook(() => useFondDuTableau());
    const tableau = renderHook(() => useFondDuTableau());
    act(() => options.result.current[1]("orbite"));
    expect(tableau.result.current[0]).toBe("orbite");
  });

  it("suit un autre onglet", () => {
    const { result } = renderHook(() => useFondDuTableau());
    act(() => {
      localStorage.setItem(PREF.HUB_FOND, "derive");
      window.dispatchEvent(new StorageEvent("storage", { key: PREF.HUB_FOND, newValue: "derive" }));
    });
    expect(result.current[0]).toBe("derive");
  });

  it("part avec la remise à zéro des préférences d'affichage", () => {
    expect(PREFERENCES_EFFACABLES).toContain(PREF.HUB_FOND);
  });
});
