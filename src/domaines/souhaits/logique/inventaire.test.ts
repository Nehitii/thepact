import { describe, it, expect } from "vitest";
import { compterLesArticles, filtrerEtTrier } from "./inventaire";
import type { PactWishlistItem } from "@/domaines/souhaits/types";
import type { Goal } from "@/domaines/objectifs";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Des nombres et un ordre — les deux se trompent sans bruit. Un total
   qui oublie une catégorie s'affiche comme un total ; une liste mal
   triée s'affiche comme une liste.

   Le cas le plus discret est l'article SANS objectif ET SANS liste :
   il n'apparaît que dans « Global ». La migration n'en a laissé aucun,
   mais rien n'empêche d'en créer un — et il ne doit pas devenir
   invisible.
   ═══════════════════════════════════════════════════════════════ */

let n = 0;
const article = (p: Record<string, unknown> = {}): PactWishlistItem => ({
  id: `a${++n}`, name: "Article", estimated_cost: 0, acquired: false,
  created_at: "2026-01-01T00:00:00Z", source_goal_cost_id: null, list_id: null,
  ...p,
} as unknown as PactWishlistItem);
const objectif = (cout: number) => ({ estimated_cost: cout } as unknown as Goal);

describe("les comptes", () => {
  it("sépare ce qui vient du pacte de ce qui est libre", () => {
    const c = compterLesArticles([
      article({ source_goal_cost_id: "p1", estimated_cost: 100 }),
      article({ estimated_cost: 40 }),
    ], []);
    expect([c.duPacte.length, c.libres.length]).toEqual([1, 1]);
    expect([c.total, c.totalPacte, c.totalLibre]).toEqual([140, 100, 40]);
  });

  it("ne range dans aucune liste un article libre qui n'en a pas", () => {
    /* Il n'apparaît que dans « Global ». Le mettre sous une clé vide
       le ferait disparaître de partout. */
    const c = compterLesArticles([article({ list_id: null }), article({ list_id: "L1" })], []);
    expect([...c.parListe.keys()]).toEqual(["L1"]);
    expect(c.libres).toHaveLength(2);
  });

  it("compte l'acquis séparément, par origine", () => {
    const c = compterLesArticles([
      article({ source_goal_cost_id: "p", estimated_cost: 100, acquired: true }),
      article({ estimated_cost: 40, acquired: true }),
      article({ estimated_cost: 7 }),
    ], []);
    expect([c.paye, c.payePacte, c.payeLibre, c.nbPaye]).toEqual([140, 100, 40, 2]);
  });

  it("traite un coût absent ou illisible comme zéro, jamais comme NaN", () => {
    /* Un seul NaN contamine toute la somme, et l'écran affiche « NaN € »
       au lieu d'un total. */
    const c = compterLesArticles([
      article({ estimated_cost: null }), article({ estimated_cost: "pas un nombre" }), article({ estimated_cost: 10 }),
    ], []);
    expect(c.total).toBe(10);
  });

  it("compte les objectifs distincts du pacte, pas les pièces", () => {
    /* Deux pièces d'un même objectif ne font pas deux objectifs. */
    const c = compterLesArticles([
      article({ source_goal_cost_id: "p1", goal_id: "g1" }),
      article({ source_goal_cost_id: "p2", goal_id: "g1" }),
      article({ source_goal_cost_id: "p3", goal_id: "g2" }),
    ], []);
    expect(c.nbObjectifs).toBe(2);
  });

  it("additionne le coût des objectifs à part — c'est une vérification, pas un total", () => {
    const c = compterLesArticles([article({ source_goal_cost_id: "p", estimated_cost: 90 })], [objectif(50), objectif(40)]);
    expect(c.coutObjectifs).toBe(90);
    expect(c.totalPacte).toBe(90);
  });
});

describe("la vue regardée", () => {
  const duPacte = article({ source_goal_cost_id: "p", name: "Du pacte" });
  const dansListe = article({ list_id: "L1", name: "Dans la liste" });
  const orphelin = article({ name: "Sans rien" });
  const items = [duPacte, dansListe, orphelin];
  const filtrer = (vue: string, recherche = "", tri = "recent") =>
    filtrerEtTrier({ vue, items, comptes: compterLesArticles(items, []), recherche, tri }).tous.map((i) => i.name);

  it("« tout » montre même l'article sans objectif et sans liste", () => {
    expect(filtrer("tout").sort()).toEqual(["Dans la liste", "Du pacte", "Sans rien"]);
  });

  it("« pacte » ne montre que ce qui vient du pacte", () => {
    expect(filtrer("pacte")).toEqual(["Du pacte"]);
  });

  it("une liste ne montre que la sienne, et une liste inconnue ne montre rien", () => {
    expect(filtrer("L1")).toEqual(["Dans la liste"]);
    expect(filtrer("liste-disparue")).toEqual([]);
  });
});

describe("la recherche", () => {
  const items = [
    article({ name: "Casque", category: "audio", notes: null }),
    article({ name: "Bureau", category: "meuble", notes: "en chêne" }),
    article({ name: "Écran", category: null, notes: null, goal: { name: "Atelier" } }),
  ];
  const chercher = (mot: string) =>
    filtrerEtTrier({ vue: "tout", items, comptes: compterLesArticles(items, []), recherche: mot, tri: "recent" })
      .tous.map((i) => i.name);

  it("cherche dans le nom, la catégorie, les notes et l'objectif lié", () => {
    expect(chercher("casq")).toEqual(["Casque"]);
    expect(chercher("meuble")).toEqual(["Bureau"]);
    expect(chercher("chêne")).toEqual(["Bureau"]);
    expect(chercher("atelier")).toEqual(["Écran"]);
  });

  it("ignore la casse et les espaces autour", () => {
    expect(chercher("  CASQUE ")).toEqual(["Casque"]);
  });

  it("ne cherche rien quand le mot est vide", () => {
    expect(chercher("   ")).toHaveLength(3);
  });
});

describe("l'ordre", () => {
  const A = article({ name: "A", estimated_cost: 10, created_at: "2026-01-01T00:00:00Z" });
  const B = article({ name: "B", estimated_cost: 500, created_at: "2026-03-01T00:00:00Z" });
  const C = article({ name: "C", estimated_cost: 90, created_at: "2026-02-01T00:00:00Z", image_url: "photo.png" });
  const items = [A, B, C];
  const trier = (tri: string) =>
    filtrerEtTrier({ vue: "tout", items, comptes: compterLesArticles(items, []), recherche: "", tri })
      .tous.map((i) => i.name);

  it("range du plus cher au moins cher, et l'inverse", () => {
    expect(trier("cher")).toEqual(["B", "C", "A"]);
    expect(trier("abordable")).toEqual(["A", "C", "B"]);
  });

  it("met les articles photographiés devant, puis les départage par récence", () => {
    /* Une photo achète une case : encore faut-il la voir. Sans ce tri,
       les articles photographiés tombaient à deux mille pixels du haut. */
    expect(trier("visuel")).toEqual(["C", "B", "A"]);
  });

  it("range du plus récent au plus ancien par défaut", () => {
    expect(trier("recent")).toEqual(["B", "C", "A"]);
    expect(trier("n'importe quoi")).toEqual(["B", "C", "A"]);
  });

  it("ne modifie pas la liste qu'on lui donne", () => {
    /* Un tri en place réordonnerait l'état React sous les pieds du
       rendu, et le suivant partirait d'une liste déjà remuée.
     *
     * ÉCRIT D'ABORD SUR LE `items` PARTAGÉ DU BLOC, ce test ne tombait
     * pas : les tests d'ordre au-dessus l'avaient déjà trié, donc
     * « avant » valait déjà l'ordre trié et le comparer à lui-même ne
     * prouvait rien. Un test qui partage son sujet avec ses voisins
     * mesure l'ordre d'exécution autant que le code. Liste locale. */
    const liste = [A, B, C];
    filtrerEtTrier({ vue: "tout", items: liste, comptes: compterLesArticles(liste, []), recherche: "", tri: "cher" });
    expect(liste.map((i) => i.name)).toEqual(["A", "B", "C"]);
  });
});

describe("acquis et actifs", () => {
  it("sépare les deux en gardant l'ordre du tri", () => {
    const items = [
      article({ name: "cher-acquis", estimated_cost: 900, acquired: true }),
      article({ name: "moyen", estimated_cost: 90 }),
      article({ name: "cher", estimated_cost: 500 }),
    ];
    const v = filtrerEtTrier({ vue: "tout", items, comptes: compterLesArticles(items, []), recherche: "", tri: "cher" });
    expect(v.tous.map((i) => i.name)).toEqual(["cher-acquis", "cher", "moyen"]);
    expect(v.actifs.map((i) => i.name)).toEqual(["cher", "moyen"]);
    expect(v.acquis.map((i) => i.name)).toEqual(["cher-acquis"]);
  });
});
