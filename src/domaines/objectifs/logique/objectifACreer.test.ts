import { describe, expect, it } from "vitest";
import {
  colonnesDuGroupe, enfantsDuGroupe, instantDuDepart, objectifACreer,
  type SaisieDUnObjectif,
} from "./creation";

describe("le jour choisi devient un instant", () => {
  /* MINUIT UTC, PAS MINUIT CHEZ SOI. `new Date("2026-08-30")` lit la
     forme ISO courte comme une date UTC — c est la specification. Les
     38 objectifs du compte portent tous « 00:00:00+00 » (mesure le
     30/08/2026), ce qui confirme ce chemin. */
  it("pose minuit UTC", () => {
    expect(instantDuDepart("2026-08-30")).toBe("2026-08-30T00:00:00.000Z");
    expect(instantDuDepart("2026-02-15")).toBe("2026-02-15T00:00:00.000Z");
  });

  /* EN FRANCE, CE MINUIT-LA EST UNE HEURE DU MATIN — deux en ete. Un
     objectif « du 15 fevrier » commence donc a 01h00 le 15 fevrier
     pour qui l a cree. Tout ce qui compte une duree depuis
     `start_date` herite de ce decalage. Constate, non corrige : le
     lire en heure locale changerait l instant enregistre. */
  it("decale d une heure ou deux vu de Paris", () => {
    const depart = new Date(instantDuDepart("2026-02-15"));
    expect(depart.toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }))
      .toContain("01");
    const ete = new Date(instantDuDepart("2026-08-30"));
    expect(ete.toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }))
      .toContain("02");
  });

  /* ET LA FORME AVEC DES BARRES SE LIRAIT EN HEURE LOCALE — c est le
     piege exact, et c est pourquoi la forme employee compte. */
  it("ne se lit pas comme la forme a barres", () => {
    expect(new Date("2026-08-30").getTime()).not.toBe(new Date("2026/08/30").getTime());
  });
});

describe("les enfants d un groupe", () => {
  it("prend la selection a la main, la regle sinon", () => {
    expect(enfantsDuGroupe("manual", ["a", "b"], ["c"])).toEqual(["a", "b"]);
    expect(enfantsDuGroupe("auto", ["a", "b"], ["c"])).toEqual(["c"]);
  });

  /* Le refus d un groupe vide lit exactement ce que la colonne
     ecrira : c est ce que la double evaluation ne garantissait pas. */
  it("rend vide quand le mode choisi ne designe rien", () => {
    expect(enfantsDuGroupe("manual", [], ["c", "d"])).toEqual([]);
    expect(enfantsDuGroupe("auto", ["a"], [])).toEqual([]);
  });
});

describe("les trois colonnes d un groupe", () => {
  /* UN OBJECTIF QUI N EST PAS UN GROUPE N ECRIT AUCUNE DES TROIS —
     pas meme a null : les clefs sont absentes, et les colonnes gardent
     leur defaut. */
  it("n ecrit rien pour un objectif ordinaire ou une habitude", () => {
    expect(colonnesDuGroupe("normal", "manual", ["a"], ["b"], null, true)).toEqual({});
    expect(colonnesDuGroupe("habit", "auto", ["a"], ["b"], null, true)).toEqual({});
  });

  it("garde la selection, sans regle, pour un groupe a la main", () => {
    expect(colonnesDuGroupe("super", "manual", ["a", "b"], ["z"], { x: 1 }, true))
      .toEqual({ child_goal_ids: ["a", "b"], is_dynamic_super: false });
  });

  /* UN GROUPE DYNAMIQUE NE GARDE PAS SA LISTE : `child_goal_ids` vaut
     NULL et la regle fait foi a chaque lecture. Y figer les
     identifiants du moment ferait croire a une liste que plus rien ne
     mettrait a jour. */
  it("laisse la liste a null quand le groupe est dynamique", () => {
    expect(colonnesDuGroupe("super", "auto", ["a"], ["b", "c"], { x: 1 }, true))
      .toEqual({ child_goal_ids: null, super_goal_rule: { x: 1 }, is_dynamic_super: true });
  });

  it("fige la liste quand le groupe ne l est pas", () => {
    expect(colonnesDuGroupe("super", "auto", ["a"], ["b", "c"], { x: 1 }, false))
      .toEqual({ child_goal_ids: ["b", "c"], super_goal_rule: { x: 1 }, is_dynamic_super: false });
  });
});

describe("la ligne d un objectif neuf", () => {
  const base: SaisieDUnObjectif = {
    pacteId: "p1", nom: "Avarice", type: "personal", palier: "hard", genre: "normal",
    notes: "", etapes: [], joursDHabitude: 30, pieces: [],
    jourDeDepart: "2026-08-30", echeance: "", image: "", groupe: {},
  };

  it("pose un objectif ordinaire", () => {
    const l = objectifACreer({
      ...base,
      etapes: [{ id: "1", title: "a", order: 1 }, { id: "2", title: "b", order: 2 }] as never,
      pieces: [{ price: 10 }, { price: 5.5 }] as never,
    });
    expect(l.pact_id).toBe("p1");
    expect(l.status).toBe("not_started");
    expect(l.goal_type).toBe("normal");
    expect(l.total_steps).toBe(2);
    expect(l.estimated_cost).toBe(15.5);
    expect(l.potential_score).toBeGreaterThan(0);
  });

  /* LE VIDE DEVIENT NULL, PAS LA CHAINE VIDE : une chaine vide en base
     se lit comme une valeur posee, NULL comme « rien ». */
  it("rend null ce qui n a pas ete rempli", () => {
    const l = objectifACreer(base);
    expect(l.notes).toBeNull();
    expect(l.image_url).toBeNull();
    expect(l.deadline).toBeNull();
  });

  it("garde ce qui a ete rempli", () => {
    const l = objectifACreer({ ...base, notes: "une note", image: "u", echeance: "2026-12-01" });
    expect(l.notes).toBe("une note");
    expect(l.image_url).toBe("u");
    expect(l.deadline).toBe("2026-12-01");
  });

  /* TROIS COLONNES NE VALENT QUE POUR UNE HABITUDE. Les poser sur un
     objectif ordinaire lui donnerait une duree que rien n afficherait
     mais que tout compte lirait. */
  it("ne donne une duree d habitude qu a une habitude", () => {
    expect(objectifACreer(base).habit_duration_days).toBeNull();
    expect(objectifACreer(base).habit_checks).toBeNull();
    const h = objectifACreer({ ...base, genre: "habit", joursDHabitude: 3 });
    expect(h.habit_duration_days).toBe(3);
    expect(h.habit_checks).toEqual([false, false, false]);
    expect(h.total_steps).toBe(3);
  });

  it("porte les colonnes du groupe telles qu on les lui donne", () => {
    const l = objectifACreer({
      ...base, genre: "super",
      groupe: { child_goal_ids: null, super_goal_rule: { x: 1 }, is_dynamic_super: true },
    });
    expect(l.child_goal_ids).toBeNull();
    expect(l.is_dynamic_super).toBe(true);
  });

  it("pose le depart a minuit UTC du jour choisi", () => {
    expect(objectifACreer(base).start_date).toBe("2026-08-30T00:00:00.000Z");
  });
});
