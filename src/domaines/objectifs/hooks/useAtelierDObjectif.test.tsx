import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { useAtelierDObjectif } from "./useAtelierDObjectif";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTEGE : DEUX ETATS QUI DOIVENT S ACCORDER.

   editStepItems est la liste des etapes en cours d edition ;
   editSteps est leur nombre. Rien dans les types n oblige le second a
   suivre le premier. Ce qui les tenait ensemble etait une fonction
   anonyme posee en passant dans une prop de la page :

     onStepItemsChange={(items) => { setEditStepItems(items);
                                     setEditSteps(items.length); }}

   Oublier ce second appel — en deplacant la prop, en la recablant sur
   setEditStepItems seul — laissait le compte mentir sans que rien ne
   rougisse : les types s accordent, la chaine reste verte, et
   l objectif s enregistre avec un nombre d etapes faux.
   ═══════════════════════════════════════════════════════════════ */

const contexte = () => ({
  goal: null,
  goalDetailData: undefined,
  steps: [],
  allGoals: [],
  id: undefined,
  goalTagsData: [],
  costItems: [],
  saveCostItems: { mutateAsync: async () => 0 },
  saveGoalTags: { mutateAsync: async () => undefined },
  queryClient: new QueryClient(),
  customDifficultyName: "",
  onObjectifEnregistre: () => {},
  onEtapesEnregistrees: () => {},
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const monter = () => renderHook(() => useAtelierDObjectif(contexte() as any));

const etape = (name: string) => ({ name, dbId: undefined }) as never;

describe("poserLesEtapes tient le compte d accord avec la liste", () => {
  it("part de zero etape et de zero", () => {
    const { result } = monter();
    expect(result.current.editStepItems).toEqual([]);
    expect(result.current.editSteps).toBe(0);
  });

  it("pose la liste ET son compte", () => {
    const { result } = monter();
    act(() => result.current.poserLesEtapes([etape("Gammes"), etape("Arpeges")]));
    expect(result.current.editStepItems).toHaveLength(2);
    expect(result.current.editSteps).toBe(2);
  });

  /* RETIRER UNE ETAPE FAIT BAISSER LE COMPTE. Une mise a jour qui
     n irait que dans un sens laisserait un compte trop grand, et
     l objectif paraitrait moins avance qu il n est. */
  it("fait baisser le compte quand la liste raccourcit", () => {
    const { result } = monter();
    act(() => result.current.poserLesEtapes([etape("a"), etape("b"), etape("c")]));
    act(() => result.current.poserLesEtapes([etape("a")]));
    expect(result.current.editSteps).toBe(1);
  });

  it("retombe a zero quand on vide la liste", () => {
    const { result } = monter();
    act(() => result.current.poserLesEtapes([etape("a")]));
    act(() => result.current.poserLesEtapes([]));
    expect(result.current.editStepItems).toEqual([]);
    expect(result.current.editSteps).toBe(0);
  });

  /* LE COMPTE SUIT LA LISTE, PAS LE NOMBRE D APPELS. */
  it("ne cumule pas d un appel a l autre", () => {
    const { result } = monter();
    act(() => result.current.poserLesEtapes([etape("a"), etape("b")]));
    act(() => result.current.poserLesEtapes([etape("c"), etape("d")]));
    expect(result.current.editSteps).toBe(2);
  });
});
