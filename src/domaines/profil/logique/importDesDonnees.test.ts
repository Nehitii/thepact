import { describe, it, expect } from "vitest";
import {
  preparerLaRestauration, riensARestaurer, bilanDeRestauration, apercuDuFichier,
} from "./importDesDonnees";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   L'export se relit ; l'import ÉCRIT. Une erreur de préparation ne se
   voit pas à l'écran : elle produit des lignes plausibles, acceptées
   par la base, et fausses. Une étape accrochée au mauvais objectif
   ressemble en tout point à une étape correcte.

   Le cas le plus grave n'est pas l'échec — c'est le fichier d'un AUTRE
   COMPTE : sans un test, rien n'empêche d'écrire des lignes au nom de
   qui a exporté.
   ═══════════════════════════════════════════════════════════════ */

/* Des identifiants prévisibles : le test doit pouvoir dire lequel. */
const compteur = () => { let n = 0; return () => `neuf-${++n}`; };
const preparer = (fichier: unknown, id = compteur()) =>
  preparerLaRestauration({ fichier, utilisateurId: "moi", pacteId: "pacte-a-moi", nouvelId: id });

describe("le propriétaire des lignes écrites", () => {
  it("réécrit le user_id du journal au nom de qui importe", () => {
    /* Le fichier peut venir d'un autre compte. Recopier son `user_id`
       écrirait des lignes qui ne sont ni à lui ni à moi. */
    const r = preparer({ journalEntries: [{ id: "j1", user_id: "quelqu-un-dautre", contenu: "x" }] });
    expect(r.journal).toEqual([{ user_id: "moi", contenu: "x" }]);
  });

  it("rattache les objectifs au pacte d'accueil, pas à celui du fichier", () => {
    const r = preparer({ goals: [{ id: "g1", pact_id: "pacte-dun-autre", nom: "Écrire" }] });
    expect(r.objectifs).toEqual([{ id: "neuf-1", pact_id: "pacte-a-moi", nom: "Écrire" }]);
  });
});

describe("les identifiants", () => {
  it("donne un identifiant neuf à chaque objectif et y raccroche ses étapes", () => {
    const r = preparer({
      goals: [{ id: "ancien-A" }, { id: "ancien-B" }],
      steps: [{ id: "s1", goal_id: "ancien-B" }, { id: "s2", goal_id: "ancien-A" }],
    });
    expect(r.objectifs.map((g) => g.id)).toEqual(["neuf-1", "neuf-2"]);
    /* L'ordre des étapes est celui du fichier ; c'est leur RATTACHEMENT
       qui doit suivre, pas leur rang. */
    expect(r.etapes.map((s) => s.goal_id)).toEqual(["neuf-2", "neuf-1"]);
  });

  it("ne recopie ni l'identifiant ni les dates posées par la base", () => {
    const r = preparer({
      goals: [{ id: "g", created_at: "2020-01-01", updated_at: "2021-01-01", nom: "X" }],
      steps: [{ id: "s", created_at: "2020-01-01", updated_at: "2021-01-01", goal_id: "g", titre: "Y" }],
    });
    expect(Object.keys(r.objectifs[0]).sort()).toEqual(["id", "nom", "pact_id"]);
    expect(Object.keys(r.etapes[0]).sort()).toEqual(["goal_id", "titre"]);
  });
});

describe("les étapes orphelines", () => {
  it("laisse une étape dont l'objectif n'est pas du lot, et la compte", () => {
    /* L'accrocher au hasard serait pire que de la perdre : une étape
       sous le mauvais objectif ressemble à une étape correcte. */
    const r = preparer({
      goals: [{ id: "g1" }],
      steps: [{ goal_id: "g1" }, { goal_id: "disparu" }, { goal_id: null }],
    });
    expect(r.etapes).toHaveLength(1);
    expect(r.orphelines).toBe(2);
  });

  it("compte toutes les étapes comme orphelines si le fichier n'a aucun objectif", () => {
    const r = preparer({ journalEntries: [{ id: "j" }], steps: [{ goal_id: "g" }, { goal_id: "h" }] });
    expect(r.etapes).toEqual([]);
    expect(r.orphelines).toBe(2);
  });
});

describe("un fichier qui n'est pas un export", () => {
  for (const [nom, f] of [["null", null], ["un nombre", 42], ["un objet vide", {}],
    ["des tableaux qui n'en sont pas", { goals: "pas un tableau", steps: 3, journalEntries: null }]] as [string, unknown][]) {
    it(`ne jette pas sur ${nom}, et n'a rien à restaurer`, () => {
      const r = preparer(f);
      expect(r).toEqual({ journal: [], objectifs: [], etapes: [], orphelines: 0 });
      expect(riensARestaurer(r)).toBe(true);
    });
  }

  it("a quelque chose à restaurer dès qu'il y a un objectif OU une entrée", () => {
    expect(riensARestaurer(preparer({ goals: [{ id: "g" }] }))).toBe(false);
    expect(riensARestaurer(preparer({ journalEntries: [{ id: "j" }] }))).toBe(false);
    /* Des étapes seules ne sont rien : elles n'ont aucun objectif. */
    expect(riensARestaurer(preparer({ steps: [{ goal_id: "g" }] }))).toBe(true);
  });

  it("ne produit jamais d'étape sans objectif — c'est ce qui rend le test ci-dessus suffisant", () => {
    /* Écrit après une mutation qui n'est jamais tombée : ajouter
       « et pas d'étapes » à `riensARestaurer` ne changeait rien. La
       raison n'était pas un trou dans les tests, c'est que la condition
       est IMPLIQUÉE — une étape ne survit qu'à travers la
       correspondance, qui vient des objectifs. Autant l'écrire. */
    for (const f of [
      { steps: [{ goal_id: "g" }] },
      { goals: [], steps: [{ goal_id: "g" }, { goal_id: "h" }] },
      { journalEntries: [{ id: "j" }], steps: [{ goal_id: "g" }] },
    ]) {
      const r = preparer(f);
      if (r.etapes.length) expect(r.objectifs.length).toBeGreaterThan(0);
      expect(r.etapes).toHaveLength(0);
    }
  });
});

describe("ce que l'écran annonce", () => {
  it("dit ce qui a été restauré, au singulier comme au pluriel", () => {
    const un = preparer({ goals: [{ id: "g" }], steps: [{ goal_id: "g" }], journalEntries: [{ id: "j" }] });
    expect(bilanDeRestauration(un)).toEqual(["1 entrée de journal", "1 objectif", "1 étape"]);
    const plusieurs = preparer({ goals: [{ id: "g" }, { id: "h" }], journalEntries: [{ id: "j" }, { id: "k" }] });
    expect(bilanDeRestauration(plusieurs)).toEqual(["2 entrées de journal", "2 objectifs"]);
  });

  it("annonce les orphelines : une restauration partiellement muette est le même défaut que la sauvegarde muette", () => {
    const r = preparer({ goals: [{ id: "g" }], steps: [{ goal_id: "g" }, { goal_id: "x" }, { goal_id: "y" }] });
    expect(bilanDeRestauration(r)).toEqual(["1 objectif", "1 étape", "2 étapes sans objectif, ignorées"]);
  });

  it("ne mentionne pas ce qu'il n'y a pas", () => {
    expect(bilanDeRestauration(preparer({ journalEntries: [{ id: "j" }] }))).toEqual(["1 entrée de journal"]);
  });
});

describe("l'aperçu montré avant d'écrire", () => {
  it("compte sans rien préparer, et se méfie d'un fichier incomplet", () => {
    expect(apercuDuFichier({ category: "all", exportedAt: "2026-03-14", goals: [1, 2], steps: [1], journalEntries: [] }))
      .toEqual({ category: "all", exportedAt: "2026-03-14", goals: 2, steps: 1, journalEntries: 0 });
    expect(apercuDuFichier({})).toEqual({ category: "unknown", exportedAt: "unknown", goals: 0, steps: 0, journalEntries: 0 });
    expect(apercuDuFichier(null)).toEqual({ category: "unknown", exportedAt: "unknown", goals: 0, steps: 0, journalEntries: 0 });
  });
});
