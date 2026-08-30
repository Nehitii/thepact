import { describe, expect, it } from "vitest";
import { etapesCopiees, objectifCopie, piecesCopiees, SEMAINE } from "./duplication";
import type { ObjectifACopier } from "./duplication";

const MAINTENANT = "2026-08-29T10:00:00.000Z";

const OBJECTIF: ObjectifACopier = {
  name: "Apprendre le piano",
  type: "personal",
  difficulty: "hard",
  estimated_cost: 240,
  notes: "commencer par les gammes",
  total_steps: 4,
  potential_score: 120,
  goal_type: "normal",
  habit_duration_days: null,
  image_url: "piano.png",
};

describe("objectifCopie — ce qui suit l objectif", () => {
  it("emporte le nom suffixe, le palier, le cout, les notes et l image", () => {
    const c = objectifCopie(OBJECTIF, "pacte-1", " (Copie)", MAINTENANT);
    expect(c.name).toBe("Apprendre le piano (Copie)");
    expect(c.difficulty).toBe("hard");
    expect(c.estimated_cost).toBe(240);
    expect(c.notes).toBe("commencer par les gammes");
    expect(c.image_url).toBe("piano.png");
    expect(c.potential_score).toBe(120);
    expect(c.total_steps).toBe(4);
    expect(c.pact_id).toBe("pacte-1");
  });
});

describe("objectifCopie — ce qui NE suit PAS", () => {
  /* LA COPIE NAIT AUJOURD HUI ET N EST PAS COMMENCEE. Recopier le
     statut ou l echeance ferait naitre un objectif deja en retard sur
     un parcours qui n est pas le sien. */
  it("ne nait ni commencee, ni datee, ni en retard", () => {
    const c = objectifCopie(OBJECTIF, "p", " (Copie)", MAINTENANT);
    expect(c.status).toBe("not_started");
    expect(c.start_date).toBe(MAINTENANT);
    expect(c.deadline).toBeNull();
  });

  it("ne recopie pas la date d achevement", () => {
    const c = objectifCopie(OBJECTIF, "p", " (Copie)", MAINTENANT);
    expect(c.completion_date).toBeUndefined();
  });

  it("ne recopie pas les etapes deja tenues", () => {
    const c = objectifCopie(OBJECTIF, "p", " (Copie)", MAINTENANT);
    expect(c.validated_steps).toBeUndefined();
  });
});

describe("objectifCopie — les habitudes", () => {
  const habitude: ObjectifACopier = { ...OBJECTIF, goal_type: "habit", habit_duration_days: 30 };

  /* LES JOURS COCHES NE SUIVENT PAS : un tableau neuf, de la meme
     longueur. Les recopier ferait naitre une habitude a moitie tenue. */
  it("rend un tableau de jours neuf, de la longueur voulue", () => {
    const c = objectifCopie(habitude, "p", " (Copie)", MAINTENANT);
    expect(c.habit_checks).toHaveLength(30);
    expect(c.habit_checks?.every((j) => j === false)).toBe(true);
  });

  it("copie une habitude sans duree sur une semaine", () => {
    const c = objectifCopie({ ...habitude, habit_duration_days: null }, "p", " (C)", MAINTENANT);
    expect(c.habit_checks).toHaveLength(SEMAINE);
  });

  /* UNE DUREE DE ZERO EST INATTEIGNABLE PAR L APPLICATION : les deux
     seuls points d entree la bornent a un — Math.max(1, …) dans les
     deux champs de saisie, et un z.number().min(1) a la creation.
     Seule une ecriture directe en base pourrait en produire une.
     Le balayage de mutations l a montre en laissant survivre le
     passage de « || » a « ?? », qui ne different que sur ce zero.
     Le comportement est fixe ici pour qu un changement soit
     deliberement voulu : zero jour se copie sur une semaine, comme
     une duree absente. */
  it("copie une duree de zero — inatteignable — sur une semaine", () => {
    const c = objectifCopie({ ...habitude, habit_duration_days: 0 }, "p", " (C)", MAINTENANT);
    expect(c.habit_checks).toHaveLength(SEMAINE);
  });

  it("ne donne pas de jours a ce qui n est pas une habitude", () => {
    expect(objectifCopie(OBJECTIF, "p", " (C)", MAINTENANT).habit_checks).toBeNull();
  });

  /* UN OBJECTIF SANS TYPE EST UN OBJECTIF ORDINAIRE. */
  it.each([null, undefined, ""])("traite un type absent (%s) comme « normal »", (t) => {
    const c = objectifCopie({ ...OBJECTIF, goal_type: t as never }, "p", " (C)", MAINTENANT);
    expect(c.goal_type).toBe("normal");
  });
});

describe("etapesCopiees", () => {
  const etapes = [
    { title: "Gammes", notes: "tous les jours" },
    { title: "Arpeges", notes: null },
    { title: "Jouer devant quelqu un", is_ultimate: true },
  ];

  it("recopie les titres et les notes", () => {
    const c = etapesCopiees(OBJECTIF, etapes, "neuf");
    expect(c.map((e) => e.title)).toEqual(["Gammes", "Arpeges", "Jouer devant quelqu un"]);
    expect(c[0].notes).toBe("tous les jours");
    expect(c[1].notes).toBe("");
  });

  /* LE RANG EST REFAIT DE UN A N : les rangs d origine peuvent avoir
     des trous, une etape ayant pu etre supprimee. */
  it("renumerote les rangs a partir de un", () => {
    expect(etapesCopiees(OBJECTIF, etapes, "neuf").map((e) => e.order)).toEqual([1, 2, 3]);
  });

  it("ne recopie aucune etape deja tenue", () => {
    expect(etapesCopiees(OBJECTIF, etapes, "neuf").every((e) => e.status === "pending")).toBe(true);
  });

  /* UN GROUPE N A PAS D ETAPES A LUI, une habitude non plus : ses
     jours en tiennent lieu. */
  it.each(["habit", "super"])("ne copie pas d etapes pour un objectif « %s »", (type) => {
    expect(etapesCopiees({ goal_type: type }, etapes, "neuf")).toEqual([]);
  });

  it("rend une liste vide quand l objectif n a pas d etapes", () => {
    expect(etapesCopiees(OBJECTIF, [], "neuf")).toEqual([]);
  });

  /* LE RANG D ETAPE ULTIME SUIT LA COPIE. Il ne suivait pas, alors
     que total_steps — qui exclut l etape ultime — est recopie tel
     quel : la copie recevait trois etapes ordinaires pour un total de
     deux, et son compte ne pouvait plus l atteindre. */
  it("emporte le rang d etape ultime", () => {
    const c = etapesCopiees(OBJECTIF, etapes, "neuf");
    expect(c.map((e) => e.is_ultimate)).toEqual([false, false, true]);
  });

  /* LA COPIE COMPTE COMME L ORIGINAL. C est la seule chose qui
     importe : autant d etapes ordinaires de part et d autre, donc le
     meme total_steps, donc un compte qui peut atteindre son total. */
  it("garde le meme nombre d etapes ordinaires que l original", () => {
    const c = etapesCopiees(OBJECTIF, etapes, "neuf");
    expect(c.filter((e) => !e.is_ultimate)).toHaveLength(
      etapes.filter((e) => !e.is_ultimate).length,
    );
  });

  /* UNE ETAPE SANS DRAPEAU N EST PAS ULTIME : la colonne n est pas
     nullable en base, il faut donc poser « faux » et non « rien ». */
  it("pose faux, et non rien, pour une etape ordinaire", () => {
    const c = etapesCopiees(OBJECTIF, [{ title: "Gammes" }], "neuf");
    expect(c[0].is_ultimate).toBe(false);
  });
});

describe("piecesCopiees", () => {
  const pieces = [
    { name: "Metronome", price: 29, category: "materiel" },
    { name: "Partitions", price: 15, category: null },
  ];

  it("recopie le nom, le prix et la categorie", () => {
    const c = piecesCopiees(pieces, "neuf");
    expect(c.map((p) => [p.name, p.price, p.category])).toEqual([
      ["Metronome", 29, "materiel"],
      ["Partitions", 15, null],
    ]);
    expect(c.every((p) => p.goal_id === "neuf")).toBe(true);
  });

  /* LES PIECES PERDENT LEUR ETAPE : les identifiants d etapes de la
     copie sont neufs, garder l ancien pointerait sur l original. */
  it("detache chaque piece de son etape", () => {
    expect(piecesCopiees(pieces, "neuf").every((p) => p.step_id === null)).toBe(true);
  });

  it("rend une liste vide quand il n y a rien a chiffrer", () => {
    expect(piecesCopiees([], "neuf")).toEqual([]);
  });
});
