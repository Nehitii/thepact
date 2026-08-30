import { describe, expect, it } from "vitest";
import {
  basculeDUneEtape, compteDesEtapesTenues, etatDeLHabitude,
} from "./basculesDuDossier";

const e = (id: string, status: string | null, is_ultimate = false) => ({ id, status, is_ultimate });

describe("basculeDUneEtape", () => {
  it("decoche une etape cochee", () => {
    expect(basculeDUneEtape("completed")).toBe("pending");
  });
  /* TOUT CE QUI N EST PAS « COCHE » SE COCHE. Une etape peut porter
     n importe quel statut, ou aucun : la bascule ne connait que deux
     etats. */
  it.each(["pending", "in_progress", "", "validated"])("coche une etape en « %s »", (s) => {
    expect(basculeDUneEtape(s)).toBe("completed");
  });
});

describe("compteDesEtapesTenues", () => {
  it("compte les etapes achevees, l etape basculee comprise", () => {
    const etapes = [e("a", "completed"), e("b", "pending"), e("c", "pending")];
    expect(compteDesEtapesTenues(etapes, "b", "completed")).toBe(2);
  });

  it("fait baisser le compte quand on decoche", () => {
    const etapes = [e("a", "completed"), e("b", "completed")];
    expect(compteDesEtapesTenues(etapes, "b", "pending")).toBe(1);
  });

  /* L ETAPE ULTIME NE COMPTE PAS DANS L AVANCEMENT — c est ce qui
     tient ce compte dans la meme unite que total_steps, qui l exclut
     lui aussi a l enregistrement. */
  it("ignore l etape ultime deja cochee", () => {
    const etapes = [e("a", "completed"), e("z", "completed", true)];
    expect(compteDesEtapesTenues(etapes, "a", "completed")).toBe(1);
  });

  it("ignore l etape ultime meme quand c est elle qu on vient de cocher", () => {
    const etapes = [e("a", "completed"), e("z", "pending", true)];
    expect(compteDesEtapesTenues(etapes, "z", "completed")).toBe(1);
  });

  it("rend zero pour un objectif sans etape", () => {
    expect(compteDesEtapesTenues([], "x", "completed")).toBe(0);
  });

  /* UNE ETAPE SANS STATUT N EST PAS ACHEVEE. La colonne est nullable. */
  it("ne compte pas une etape sans statut", () => {
    expect(compteDesEtapesTenues([e("a", null)], "b", "completed")).toBe(0);
  });

  /* CE COMPTE EST DESORMAIS CELUI QUE L ECRAN MONTRE AUSSITOT.
     onMutate, dans useGoalDetailActions, en tenait un second qui
     n excluait pas l etape ultime : cocher l etape ultime montrait un
     de trop jusqu a ce que l invalidation ramene le compte de la
     base. Ce test garde la trace du calcul qui a ete retire — si
     quelqu un le reintroduit, il verra ici pourquoi il avait tort. */
  it("ne compte pas comme le faisait l ancien calcul de l affichage", () => {
    const etapes = [e("a", "completed"), e("z", "pending", true)];
    const ancienAffichage = etapes
      .map((s) => (s.id === "z" ? { ...s, status: "completed" } : s))
      .filter((s) => s.status === "completed").length;
    expect(ancienAffichage).toBe(2);
    expect(compteDesEtapesTenues(etapes, "z", "completed")).toBe(1);
  });
});

describe("etatDeLHabitude", () => {
  const sept = [false, false, false, false, false, false, false];

  it("coche un jour et compte", () => {
    const r = etatDeLHabitude(sept, 2, true, 7);
    expect(r.coches[2]).toBe(true);
    expect(r.tenus).toBe(1);
    expect(r.acheve).toBe(false);
    expect(r.statut).toBe("in_progress");
  });

  /* NE PAS MODIFIER LE TABLEAU QU ON LUI DONNE : le cache de React
     Query le tient encore, et une mutation en place le corromprait
     sans qu aucun rendu ne s en apercoive. */
  it("laisse intact le tableau qu on lui donne", () => {
    const origine = [...sept];
    etatDeLHabitude(origine, 0, true, 7);
    expect(origine).toEqual(sept);
  });

  it("honore l habitude au dernier jour", () => {
    const six = [true, true, true, true, true, true, false];
    const r = etatDeLHabitude(six, 6, true, 7);
    expect(r.tenus).toBe(7);
    expect(r.acheve).toBe(true);
    expect(r.statut).toBe("fully_completed");
  });

  it("retombe a « pas commencee » quand on decoche le dernier jour tenu", () => {
    const un = [true, false, false, false, false, false, false];
    const r = etatDeLHabitude(un, 0, false, 7);
    expect(r.tenus).toBe(0);
    expect(r.statut).toBe("not_started");
  });

  /* DECOCHER UN JOUR DEFAIT UNE HABITUDE HONOREE. */
  it("defait une habitude honoree quand un jour retombe", () => {
    const pleine = [true, true, true, true, true, true, true];
    const r = etatDeLHabitude(pleine, 3, false, 7);
    expect(r.acheve).toBe(false);
    expect(r.statut).toBe("in_progress");
  });

  /* L EGALITE STRICTE, ET NON « AU MOINS ». Une duree raccourcie apres
     coup laisse l habitude en cours plutot que de l honorer sur un
     total qui n a jamais ete celui promis. Constate, non corrige. */
  it("n honore pas une habitude qui depasse une duree raccourcie", () => {
    const trois = [true, true, false];
    const r = etatDeLHabitude(trois, 2, true, 2);
    expect(r.tenus).toBe(3);
    expect(r.acheve).toBe(false);
    expect(r.statut).toBe("in_progress");
  });

  /* SANS DUREE DECLAREE, RIEN N EST JAMAIS ACHEVE. */
  it.each([null, undefined])("n honore jamais une habitude sans duree (%s)", (duree) => {
    const r = etatDeLHabitude([false], 0, true, duree);
    expect(r.acheve).toBe(false);
    expect(r.statut).toBe("in_progress");
  });

  /* COCHER DEUX FOIS LE MEME JOUR NE LE COMPTE PAS DEUX FOIS : la
     bascule pose la valeur voulue au lieu de la deduire. */
  it("est idempotente", () => {
    const a = etatDeLHabitude(sept, 1, true, 7);
    const b = etatDeLHabitude(a.coches, 1, true, 7);
    expect(b.tenus).toBe(1);
    expect(b.coches).toEqual(a.coches);
  });
});
