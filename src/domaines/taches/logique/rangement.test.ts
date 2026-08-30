import { describe, expect, it } from "vitest";
import {
  CATEGORIE_PAR_DEFAUT, GENRE_PAR_DEFAUT, ligneDeTacheNeuve, ligneDHistorique,
  lignesDeRangement, rangDeTete, reordonner,
} from "./rangement";
import type { CreateTaskInput, TodoTask } from "@/domaines/taches/types";

const tache = (id: string, extra: Partial<TodoTask> = {}): TodoTask => ({
  id, user_id: "u", name: "Tache " + id, status: "active",
  priority: "medium", is_urgent: false, postpone_count: 0,
  category: "general", task_type: "flexible", reminder_frequency: null,
  location: null, deadline: null, position: 0, completed_at: null,
  created_at: null, reminder_enabled: false, appointment_time: null,
  ...extra,
}) as TodoTask;

describe("rangDeTete — une tache neuve se pose en tete", () => {
  it("passe devant la plus haute tache existante", () => {
    expect(rangDeTete([{ position: 3 }, { position: -2 }, { position: 0 }])).toBe(-3);
  });

  /* L AMORCE EST ZERO, PAS L INFINI. Sans elle, la premiere tache
     d une liste vide recevrait -Infinity, que la colonne ne peut pas
     porter. */
  it("rend -1 pour une liste vide", () => {
    expect(rangDeTete([])).toBe(-1);
    expect(Number.isFinite(rangDeTete([]))).toBe(true);
  });

  /* ZERO PLAFONNE LE MINIMUM : une liste dont tout est au-dessus de
     zero donne quand meme -1, et non « le plus petit moins un ». */
  it("rend -1 quand toutes les taches sont au-dessus de zero", () => {
    expect(rangDeTete([{ position: 5 }, { position: 9 }])).toBe(-1);
  });

  /* LE REPLI PROTEGE DE « undefined », PAS DU RESULTAT.
     Math.min(0, undefined) vaut NaN : sans repli, une tache sans
     position empoisonnerait le rang. Mais sa VALEUR est inatteignable
     — l amorce vaut zero, donc tout repli positif ou nul donne le
     meme minimum. Le balayage l a montre en laissant survivre le
     passage de « ?? 0 » a « ?? 1 ». Ce n est pas un trou dans les
     tests : c est du code domine. Seule sa presence est fixee ici. */
  it("traite une position absente sans empoisonner le rang", () => {
    expect(rangDeTete([{ position: null }, {}])).toBe(-1);
    expect(Number.isNaN(rangDeTete([{ position: undefined }]))).toBe(false);
    expect(Number.isNaN(Math.min(0, undefined as unknown as number))).toBe(true);
  });

  it("descend d un cran a chaque ajout", () => {
    const liste = [{ position: 0 }];
    const un = rangDeTete(liste);
    liste.push({ position: un });
    expect(rangDeTete(liste)).toBe(un - 1);
  });
});

describe("ligneDeTacheNeuve — ce qu on ecrit d une tache neuve", () => {
  const minimal: CreateTaskInput = { name: "Appeler Pierre", priority: "high", is_urgent: true };

  /* LES DEUX DEFAUTS NE SONT PAS DECORATIFS : l historique les relit
     pour classer, et une categorie vide y deviendrait une categorie a
     part entiere. */
  /* ON COMPARE AUX LITTERAUX, PAS AUX CONSTANTES. Le balayage de
     mutations a montre ce trou : changer « general » en « divers »
     passait tous les tests, parce qu ils comparaient la constante a
     elle-meme. Ces deux chaines partent en base et l historique
     classe dessus — leur valeur exacte compte. */
  it("pose les deux defauts quand rien n est choisi", () => {
    const l = ligneDeTacheNeuve(minimal, "u1", -1);
    expect(l.category).toBe("general");
    expect(l.task_type).toBe("flexible");
    expect([CATEGORIE_PAR_DEFAUT, GENRE_PAR_DEFAUT]).toEqual(["general", "flexible"]);
  });

  it("respecte ce qui est choisi", () => {
    const l = ligneDeTacheNeuve({ ...minimal, category: "sante", task_type: "rendezvous" }, "u1", -1);
    expect(l.category).toBe("sante");
    expect(l.task_type).toBe("rendezvous");
  });

  /* LA CHAINE VIDE N EST PAS UNE ECHEANCE : un champ de date qu on
     efface envoie "", et l enregistrer tel quel donnerait une date
     invalide plutot qu une absence de date. */
  it.each(["", null, undefined])("traite une echeance vide (%s) comme aucune", (d) => {
    expect(ligneDeTacheNeuve({ ...minimal, deadline: d as string }, "u1", -1).deadline).toBeNull();
  });

  it("emporte le rang qu on lui donne", () => {
    expect(ligneDeTacheNeuve(minimal, "u1", -7).position).toBe(-7);
  });

  it("emporte le porteur, le nom, le palier et l urgence", () => {
    const l = ligneDeTacheNeuve(minimal, "u1", 0);
    expect([l.user_id, l.name, l.priority, l.is_urgent]).toEqual(["u1", "Appeler Pierre", "high", true]);
  });

  it("ne rappelle rien tant qu on ne l a pas demande", () => {
    const l = ligneDeTacheNeuve(minimal, "u1", 0);
    expect(l.reminder_enabled).toBe(false);
    expect(l.reminder_frequency).toBeNull();
  });
});

describe("ligneDHistorique — ce qu on garde d une tache achevee", () => {
  const faite = tache("t1", {
    name: "Faire une brocante", priority: "low", is_urgent: true,
    postpone_count: 3, category: "loisir", task_type: "deadline", location: "Lyon",
  });

  it("garde le nom, ce qu elle valait, et combien de fois elle a ete repoussee", () => {
    const h = ligneDHistorique(faite, "u1");
    expect(h.task_name).toBe("Faire une brocante");
    expect(h.priority).toBe("low");
    expect(h.was_urgent).toBe(true);
    expect(h.postpone_count).toBe(3);
    expect(h.location).toBe("Lyon");
  });

  /* NI SON ECHEANCE, NI SA POSITION : elles ne veulent plus rien dire
     une fois la tache faite. */
  it("ne garde ni l echeance ni la position", () => {
    const h = ligneDHistorique(faite, "u1") as Record<string, unknown>;
    expect("deadline" in h).toBe(false);
    expect("position" in h).toBe(false);
  });

  it("pose les memes deux defauts que la creation", () => {
    const nue = tache("t2", { category: null, task_type: null } as Partial<TodoTask>);
    const h = ligneDHistorique(nue, "u1");
    expect(h.category).toBe("general");
    expect(h.task_type).toBe("flexible");
  });
});

describe("reordonner — le meme rangement pour l ecran et pour la base", () => {
  const liste = [tache("a"), tache("b"), tache("c")];

  it("numerote a partir de zero dans l ordre donne", () => {
    expect(reordonner(liste, ["c", "a", "b"]).map((t) => [t.id, t.position]))
      .toEqual([["c", 0], ["a", 1], ["b", 2]]);
  });

  /* UN IDENTIFIANT INCONNU EST ECARTE : ecrire une ligne qui n existe
     pas creerait une tache fantome, et l afficher ferait apparaitre
     une tache que personne n a demandee. */
  it("ecarte un identifiant inconnu sans laisser de trou dans les rangs", () => {
    expect(reordonner(liste, ["c", "fantome", "a"]).map((t) => [t.id, t.position]))
      .toEqual([["c", 0], ["a", 1]]);
  });

  it("ne modifie pas la liste qu on lui donne", () => {
    const origine = [tache("a", { position: 9 })];
    reordonner(origine, ["a"]);
    expect(origine[0].position).toBe(9);
  });

  it("rend une liste vide quand aucun identifiant n est donne", () => {
    expect(reordonner(liste, [])).toEqual([]);
  });

  /* UNE LISTE PARTIELLE NE GARDE QUE CE QU ON LUI DONNE — des deux
     cotes. C est ce qui fait que l ecran et la base ne peuvent plus
     diverger : ils ecartent les memes taches. */
  it("ecarte les memes taches des deux cotes", () => {
    const pourLEcran = reordonner(liste, ["b", "a"]).map((t) => t.id);
    const pourLaBase = lignesDeRangement(liste, ["b", "a"], "u1").map((l) => l.id);
    expect(pourLEcran).toEqual(pourLaBase);
  });
});

describe("lignesDeRangement — les quatre colonnes que l ecriture touche", () => {
  it("n ecrit que l identifiant, le porteur, le nom et le rang", () => {
    const l = lignesDeRangement([tache("a", { name: "Toupie" })], ["a"], "u1");
    expect(l).toEqual([{ id: "a", user_id: "u1", name: "Toupie", position: 0 }]);
  });

  /* AVEC UNE SEULE TACHE, LE RANG VAUT ZERO QUOI QU IL ARRIVE — le
     balayage de mutations l a montre en laissant survivre l ecriture
     du rang d origine. Il en faut deux pour que le rang se voie. */
  it("ecrit le rang du NOUVEL ordre, pas celui d origine", () => {
    const liste = [tache("a", { position: 7 }), tache("b", { position: 3 })];
    expect(lignesDeRangement(liste, ["b", "a"], "u1").map((l) => [l.id, l.position]))
      .toEqual([["b", 0], ["a", 1]]);
  });

  /* LE NOM EN FAIT PARTIE parce que la colonne ne l accepte pas nul :
     un upsert qui l omettrait creerait une ligne sans nom si
     l identifiant n existait pas. */
  it("emporte toujours le nom", () => {
    expect(lignesDeRangement([tache("a")], ["a"], "u1")[0].name).toBeTruthy();
  });

  it("rend une liste vide quand rien ne correspond", () => {
    expect(lignesDeRangement([tache("a")], ["z"], "u1")).toEqual([]);
  });
});
