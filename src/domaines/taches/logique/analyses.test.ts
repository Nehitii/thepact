import { describe, it, expect } from "vitest";
import { genererAnalyses } from "./analyses";
import type { TodoHistory, TodoTask } from "@/domaines/taches/types";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Ces trois observations ne conseillent pas, elles CONSTATENT — et
   elles constatent sur toi. Un seuil mal placé ne casse rien : il fait
   dire à l'application une chose fausse sur la personne qui la lit,
   ce qui est pire qu'une erreur visible.

   Les tests portent donc sur les bords : cinq entrées, exactement la
   moitié, exactement trois reports, exactement vingt pour cent.
   ═══════════════════════════════════════════════════════════════ */

const aH = (h: number, p: TodoHistory["priority"] = "medium"): TodoHistory =>
  ({ completed_at: new Date(2026, 2, 4, h).toISOString(), priority: p } as TodoHistory);
const tache = (postpone_count: number): TodoTask => ({ postpone_count } as TodoTask);
const cles = (h: TodoHistory[], t: TodoTask[] = []) => genererAnalyses(h, t).map((a) => a.cle);

describe("le seuil d'ouverture", () => {
  it("ne dit rien tant qu'il n'y a pas cinq tâches faites", () => {
    /* Trois matinées d'affilée ne font pas de toi quelqu'un du matin. */
    expect(genererAnalyses(Array.from({ length: 4 }, () => aH(9)), [])).toEqual([]);
  });

  it("parle dès la cinquième", () => {
    expect(cles(Array.from({ length: 5 }, () => aH(9)))).toContain("todo.insights.morning");
  });
});

describe("le moment de la journée", () => {
  const beaucoup = (h: number, n: number) => Array.from({ length: n }, () => aH(h));

  it("ne tranche pas à exactement la moitié", () => {
    /* Le seuil est un « strictement plus de » : cinq matins sur dix ne
       suffisent pas à dire que tu es du matin. */
    expect(cles([...beaucoup(9, 5), ...beaucoup(14, 5)])).toEqual([]);
    expect(cles([...beaucoup(9, 6), ...beaucoup(14, 5)])).toEqual(["todo.insights.morning"]);
  });

  it("range les heures : matin 6-11, après-midi 12-17, soir 18-5", () => {
    expect(cles(beaucoup(6, 6))).toEqual(["todo.insights.morning"]);
    expect(cles(beaucoup(11, 6))).toEqual(["todo.insights.morning"]);
    expect(cles(beaucoup(12, 6))).toEqual(["todo.insights.afternoon"]);
    expect(cles(beaucoup(17, 6))).toEqual(["todo.insights.afternoon"]);
    expect(cles(beaucoup(18, 6))).toEqual(["todo.insights.evening"]);
    /* Deux heures du matin est un SOIR qui dure, pas un matin. */
    expect(cles(beaucoup(2, 6))).toEqual(["todo.insights.evening"]);
    expect(cles(beaucoup(5, 6))).toEqual(["todo.insights.evening"]);
  });

  it("n'en désigne qu'un seul", () => {
    const r = cles([...beaucoup(9, 6), ...beaucoup(20, 5)]);
    expect(r.filter((c) => /morning|afternoon|evening/.test(c))).toHaveLength(1);
  });
});

describe("les tâches souvent reportées", () => {
  it("compte à partir de trois reports, pas de deux", () => {
    const h = Array.from({ length: 5 }, () => aH(9));
    expect(genererAnalyses(h, [tache(2)]).find((a) => a.cle === "todo.insights.postponed")).toBeUndefined();
    expect(genererAnalyses(h, [tache(3), tache(9), tache(0)]).find((a) => a.cle === "todo.insights.postponed"))
      .toEqual({ cle: "todo.insights.postponed", params: { count: 2 } });
  });
});

describe("les tâches importantes délaissées", () => {
  const dix = (hautes: number, total: number) =>
    Array.from({ length: total }, (_, i) => aH(9, i < hautes ? "high" : "low"));

  it("se tait tant que l'historique n'a pas plus de dix entrées", () => {
    expect(cles(dix(1, 10))).not.toContain("todo.insights.fewHighPriority");
    expect(cles(dix(1, 11))).toContain("todo.insights.fewHighPriority");
  });

  it("se tait quand aucune importante n'a été faite", () => {
    /* Zéro sur vingt n'est pas « peu d'importantes » : c'est peut-être
       qu'il n'y en avait aucune. L'application ne l'invente pas. */
    expect(cles(dix(0, 20))).not.toContain("todo.insights.fewHighPriority");
  });

  it("ne tranche pas à exactement vingt pour cent", () => {
    expect(cles(dix(4, 20))).not.toContain("todo.insights.fewHighPriority");
    expect(cles(dix(3, 20))).toContain("todo.insights.fewHighPriority");
  });
});

describe("ce qui est montré", () => {
  it("ne dit jamais deux fois la même chose", () => {
    /* Le `.slice(0, 3)` final est INATTEIGNABLE — une mutation qui le
       porte à neuf ne fait rien tomber. La raison n'est pas un trou
       dans les tests : il n'existe que trois observations, et chacune
       est poussée au plus une fois. C'est cette propriété-là qui borne
       la liste ; le `slice` n'est qu'une ceinture. */
    const h = [...Array.from({ length: 15 }, () => aH(9, "low")), aH(9, "high")];
    const r = genererAnalyses(h, [tache(5), tache(7)]);
    expect(new Set(r.map((a) => a.cle)).size).toBe(r.length);
    expect(r.length).toBeLessThanOrEqual(3);
  });
});
