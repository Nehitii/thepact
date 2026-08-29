import { describe, it, expect } from "vitest";
import {
  membresEtLiensCasses, coutParEtape, estHonore, auZenith, groupesPorteurs,
} from "./detailDuPacte";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Le cas qui porte tout le reste : UN LIEN CASSÉ. Un objectif supprimé
   laisse derrière lui un identifiant qui ne désigne plus rien. Le
   masquer donnerait un groupe qui affiche un total JUSTE sur une
   composition FAUSSE — « 3 sur 3 » alors qu'il en déclarait quatre.

   Rien ne casserait. C'est exactement pour ça.
   ═══════════════════════════════════════════════════════════════ */

let n = 0;
const objectif = (p: Record<string, unknown> = {}) => ({
  id: `g${++n}`, name: "Objectif", goal_type: "standard", status: "in_progress",
  difficulty: "medium", total_steps: 0, validated_steps: 0, ...p,
} as never);
const INTROUVABLE = "Objectif introuvable";

describe("les membres d'un groupe", () => {
  it("rend une liste vide pour ce qui n'est pas un groupe, MÊME s'il traîne des enfants", () => {
    /* Un objectif ordinaire peut porter un `child_goal_ids` périmé — il
       a été un groupe, ou l'a failli. Sans le test sur `goal_type`, sa
       fiche afficherait des lignes « Objectif introuvable » pour des
       liens qui ne le concernent plus.
     *
     * Écrit d'abord sans `child_goal_ids`, ce test ne tombait pas : les
       deux chemins rendaient une liste vide pour la même raison. */
    const simple = objectif({ id: "s", child_goal_ids: ["parti", "aussi-parti"] });
    expect(membresEtLiensCasses(simple, [simple], INTROUVABLE)).toEqual([]);
    expect(membresEtLiensCasses(null, [], INTROUVABLE)).toEqual([]);
  });

  it("calcule l'avancement de chaque membre, sans diviser par zéro", () => {
    const a = objectif({ id: "a", name: "A", total_steps: 4, validated_steps: 3 });
    const b = objectif({ id: "b", name: "B", total_steps: 0, validated_steps: 0 });
    const groupe = objectif({ id: "G", goal_type: "super", child_goal_ids: ["a", "b"] });
    const r = membresEtLiensCasses(groupe, [a, b, groupe], INTROUVABLE);
    expect(r.map((m) => [m.id, m.progress])).toEqual([["a", 75], ["b", 0]]);
  });

  it("préfère les compteurs calculés aux colonnes de la base", () => {
    /* `totalStepsCount` vient d'un décompte réel ; `total_steps` est une
       colonne qui peut avoir dérivé. Quand les deux existent, c'est le
       décompte qui gagne. */
    const a = objectif({ id: "a", total_steps: 99, validated_steps: 1, totalStepsCount: 4, completedStepsCount: 2 });
    const groupe = objectif({ id: "G", goal_type: "super", child_goal_ids: ["a"] });
    expect(membresEtLiensCasses(groupe, [a, groupe], INTROUVABLE)[0].progress).toBe(50);
  });

  it("MONTRE un lien cassé au lieu de le faire disparaître", () => {
    /* Sans cette ligne, le groupe afficherait « 1 membre » là où il en
       déclare deux — un total juste sur une composition fausse. */
    const a = objectif({ id: "a", name: "A" });
    const groupe = objectif({ id: "G", goal_type: "super", child_goal_ids: ["a", "parti"] });
    const r = membresEtLiensCasses(groupe, [a, groupe], INTROUVABLE);
    expect(r).toHaveLength(2);
    expect(r[1]).toMatchObject({ id: "parti", name: INTROUVABLE, isMissing: true, progress: 0, isCompleted: false });
  });

  it("ne cherche aucun lien cassé dans un groupe dynamique", () => {
    /* Sa composition se recalcule à chaque lecture : il n'y a pas de
       liste déclarée, donc rien qui puisse pointer dans le vide. */
    const groupe = objectif({
      id: "G", goal_type: "super", is_dynamic_super: true,
      super_goal_rule: { difficulties: ["hard"] }, child_goal_ids: ["fantome"],
    });
    expect(membresEtLiensCasses(groupe, [groupe], INTROUVABLE).some((m) => m.isMissing)).toBe(false);
  });

  it("marque comme franchi le membre qui l'est", () => {
    const fait = objectif({ id: "a", status: "fully_completed", total_steps: 2, validated_steps: 2 });
    const groupe = objectif({ id: "G", goal_type: "super", child_goal_ids: ["a"] });
    expect(membresEtLiensCasses(groupe, [fait, groupe], INTROUVABLE)[0].isCompleted).toBe(true);
  });
});

describe("le coût par étape", () => {
  it("additionne les postes d'une même étape", () => {
    const m = coutParEtape([
      { step_id: "e1", price: 30 }, { step_id: "e1", price: 12.5 }, { step_id: "e2", price: 7 },
    ]);
    expect([...m]).toEqual([["e1", 42.5], ["e2", 7]]);
  });

  it("laisse dehors un poste rattaché à aucune étape", () => {
    /* Il compte dans le coût du pacte, pas dans celui d'une ligne :
       l'accrocher quelque part ferait payer une étape pour une autre. */
    expect([...coutParEtape([{ step_id: null, price: 500 }])]).toEqual([]);
  });

  it("traite un prix absent ou illisible comme zéro, jamais comme NaN", () => {
    /* Un seul NaN contamine la somme, et le rail affiche « NaN € » en
       bout de ligne. */
    const m = coutParEtape([{ step_id: "e", price: null }, { step_id: "e", price: "x" }, { step_id: "e", price: 10 }]);
    expect(m.get("e")).toBe(10);
  });
});

describe("les deux états déduits", () => {
  it("appelle « honoré » les deux statuts qui le disent", () => {
    expect(estHonore({ status: "fully_completed" })).toBe(true);
    expect(estHonore({ status: "validated" })).toBe(true);
    expect(estHonore({ status: "in_progress" })).toBe(false);
    expect(estHonore({})).toBe(false);
  });

  it("déduit le zénith de l'étape ultime franchie, et d'elle seule", () => {
    /* Aucune colonne à tenir d'accord avec lui, donc rien qui puisse
       diverger — mais encore faut-il que ce soit l'ultime ET qu'elle
       soit faite. */
    expect(auZenith([{ is_ultimate: true, status: "completed" }])).toBe(true);
    expect(auZenith([{ is_ultimate: true, status: "in_progress" }])).toBe(false);
    expect(auZenith([{ is_ultimate: false, status: "completed" }])).toBe(false);
    expect(auZenith([])).toBe(false);
  });
});

describe("les groupes porteurs", () => {
  it("nomme les groupes qui portent l'objectif, et pas les autres", () => {
    const a = objectif({ id: "a", name: "A" });
    const g1 = objectif({ id: "g1", name: "Premier", goal_type: "super", child_goal_ids: ["a"] });
    const g2 = objectif({ id: "g2", name: "Second", goal_type: "super", child_goal_ids: ["autre"] });
    expect(groupesPorteurs("a", [a, g1, g2])).toEqual(["Premier"]);
  });

  it("trouve aussi un groupe DYNAMIQUE, qui n'a pas de liste déclarée", () => {
    /* Lire `child_goal_ids` au lieu de demander sa composition le
       rendrait invisible ici, alors qu'il porte bel et bien
       l'objectif. */
    const a = objectif({ id: "a", name: "A", difficulty: "hard" });
    const dyn = objectif({
      id: "d", name: "Automatique", goal_type: "super",
      is_dynamic_super: true, super_goal_rule: { difficulties: ["hard"] },
    });
    expect(groupesPorteurs("a", [a, dyn])).toEqual(["Automatique"]);
  });

  it("rend une liste vide quand personne ne le porte", () => {
    const a = objectif({ id: "a" });
    expect(groupesPorteurs("a", [a])).toEqual([]);
  });
});
