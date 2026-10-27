import { describe, it, expect } from "vitest";
import {
  momentDuJour, evenementDeTache, evenementDObjectif, evenementDEtape, fusionnerLesSources,
  type LigneTache, type LigneObjectif, type LigneEtape,
} from "./projections";
import type { CalendarEvent } from "@/domaines/agenda/types";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Ce que ces fonctions décident ne se voit pas : une teinte, une heure,
   un « journée entière ». Un rendez-vous qui perd son heure ressemble
   en tout point à une tâche du jour — il se range simplement là où
   personne ne le cherche, et on le rate.

   Le dédoublonnage de la fusion est du même genre : sans lui, chaque
   événement récurrent apparaît DEUX FOIS sur la grille, et deux fois
   ressemble à deux événements.
   ═══════════════════════════════════════════════════════════════ */

const tache = (p: Partial<LigneTache> = {}): LigneTache => ({
  id: "t1", name: "Appeler Pierre", deadline: "2026-03-04T09:00:00.000Z",
  category: null, location: null, task_type: "flexible", appointment_time: null, ...p,
});

describe("un rendez-vous garde son heure", () => {
  it("pose le début à l'heure saisie et lui prête une heure de durée", () => {
    /* Un événement de durée nulle ne se voit pas sur une grille
       horaire : une heure est la longueur qu'on prête à un rendez-vous
       quand on n'en sait rien. */
    const e = evenementDeTache(tache({ task_type: "rendezvous", appointment_time: "14:30:00" }), "u1");
    expect(e.all_day).toBe(false);
    const debut = new Date(e.start_time), fin = new Date(e.end_time);
    expect(debut.getHours()).toBe(14);
    expect(debut.getMinutes()).toBe(30);
    expect(fin.getTime() - debut.getTime()).toBe(3600_000);
  });

  it("laisse la tâche sur la journée quand aucune heure n'est saisie", () => {
    /* On ne devine pas : sans heure, la journée entière est honnête. */
    const e = evenementDeTache(tache({ task_type: "rendezvous", appointment_time: null }), "u1");
    expect(e.all_day).toBe(true);
    expect(e.start_time).toBe("2026-03-04T09:00:00.000Z");
  });

  it("ignore une heure posée sur une tâche qui n'est pas un rendez-vous", () => {
    const e = evenementDeTache(tache({ task_type: "flexible", appointment_time: "14:30:00" }), "u1");
    expect(e.all_day).toBe(true);
  });

  it("laisse la journée entière plutôt que d'inventer un moment si l'échéance est illisible", () => {
    const e = evenementDeTache(tache({ task_type: "rendezvous", appointment_time: "14:30", deadline: "pas une date" }), "u1");
    expect(e.all_day).toBe(true);
  });
});

describe("le jour se lit en local, pas dans la chaîne ISO", () => {
  it("place le rendez-vous le jour LOCAL de l'échéance", () => {
    /* 22 h UTC le 25 août, c'est déjà le 26 à Paris. Découper la chaîne
       ISO donnerait le 25 et ferait glisser le rendez-vous d'un jour
       pour tout le monde à l'est de Greenwich. */
    const local = new Date("2026-08-25T22:00:00.000Z");
    const m = momentDuJour("2026-08-25T22:00:00.000Z", "09:00");
    expect(m).not.toBeNull();
    expect(new Date(m!.debut).getDate()).toBe(local.getDate());
    expect(new Date(m!.debut).getHours()).toBe(9);
  });

  it("rend null sur une échéance illisible au lieu d'une date invalide", () => {
    expect(momentDuJour("n'importe quoi", "09:00")).toBeNull();
  });

  it("accepte une heure en « hh:mm:ss » comme en « hh:mm »", () => {
    const a = momentDuJour("2026-03-04T09:00:00.000Z", "14:30:00");
    const b = momentDuJour("2026-03-04T09:00:00.000Z", "14:30");
    expect(a).toEqual(b);
  });
});

describe("ce que chaque source devient", () => {
  it("préfixe l'identifiant par sa source — deux sources peuvent porter le même", () => {
    /* Sans préfixe, une tâche et un objectif de même identifiant se
       dédoublonneraient l'un l'autre à la fusion. */
    expect(evenementDeTache(tache({ id: "x" }), "u1").id).toBe("todo_x");
    expect(evenementDObjectif({ id: "x", name: "N", deadline: "2026-03-04T09:00:00Z" }, "u1").id).toBe("goal_x");
    expect(evenementDEtape({ id: "x", title: "T", due_date: "2026-03-04T09:00:00Z", goal_id: "g" }, "u1").id).toBe("step_x");
  });

  it("marque tout ce qui vient d'ailleurs comme virtuel", () => {
    /* Un événement virtuel ne se modifie pas dans l'agenda : il faut
       aller le changer là où il vit. */
    const g: LigneObjectif = { id: "g1", name: "Écrire", deadline: "2026-03-04T09:00:00Z" };
    const s: LigneEtape = { id: "s1", title: "Plan", due_date: "2026-03-04T09:00:00Z", goal_id: "g1" };
    for (const e of [evenementDeTache(tache(), "u1"), evenementDObjectif(g, "u1"), evenementDEtape(s, "u1")]) {
      expect(e._virtual).toBe(true);
      expect(e.recurrence_rule).toBeNull();
      expect(e.user_id).toBe("u1");
    }
  });

  it("range la catégorie de la tâche en étiquette, et rien quand il n'y en a pas", () => {
    expect(evenementDeTache(tache({ category: "maison" }), "u1").tags).toEqual(["maison"]);
    expect(evenementDeTache(tache({ category: null }), "u1").tags).toEqual([]);
  });

  it("nomme l'objectif d'une étape en français", () => {
    /* « Goal: » était le dernier mot anglais de cet écran. La garde de
       langue ne le voyait pas : elle veille sur le glossaire, pas sur
       la langue. */
    const avec = evenementDEtape({ id: "s", title: "T", due_date: "2026-03-04T09:00:00Z", goal_id: "g", goals: { name: "Écrire" } }, "u1");
    expect(avec.description).toBe("Objectif : Écrire");
    const sans = evenementDEtape({ id: "s", title: "T", due_date: "2026-03-04T09:00:00Z", goal_id: "g" }, "u1");
    expect(sans.description).toBeNull();
  });

  it("pose l'objectif et l'étape sur la journée entière, chacun sa teinte", () => {
    const g = evenementDObjectif({ id: "g", name: "N", deadline: "2026-03-04T09:00:00Z" }, "u1");
    const s = evenementDEtape({ id: "s", title: "T", due_date: "2026-03-04T09:00:00Z", goal_id: "g" }, "u1");
    expect([g.all_day, s.all_day]).toEqual([true, true]);
    expect(g.color).not.toBe(s.color);
    expect(g.linked_goal_id).toBe("g");
    expect(s.linked_goal_id).toBe("g");
  });
});

describe("la fusion des cinq sources", () => {
  const ev = (id: string, regle: string | null = null) =>
    ({ id, recurrence_rule: regle } as unknown as CalendarEvent);
  const deployer = (e: CalendarEvent) => [e, { ...e, id: e.id + "@2" } as CalendarEvent];

  it("ne montre qu'une fois un récurrent lu par les deux requêtes", () => {
    /* La requête de la fenêtre ET celle des récurrents ramènent le même
       événement. Sans dédoublonnage, chaque série apparaît en double. */
    const r = fusionnerLesSources({
      propres: [ev("a", "FREQ=DAILY")], recurrents: [ev("a", "FREQ=DAILY")],
      importes: [], debut: new Date(2026, 2, 1), fin: new Date(2026, 2, 31), deployer,
    });
    expect(r.map((e) => e.id)).toEqual(["a", "a@2"]);
  });

  it("ne déploie que ce qui porte une règle", () => {
    const r = fusionnerLesSources({
      propres: [ev("a"), ev("b", "FREQ=WEEKLY")], recurrents: [],
      importes: [], debut: new Date(), fin: new Date(), deployer,
    });
    expect(r.map((e) => e.id)).toEqual(["a", "b", "b@2"]);
  });

  it("ajoute les sources importées après, sans les dédoublonner ni les déployer", () => {
    /* Elles arrivent déjà plates et déjà filtrées : les repasser au
       même traitement coûterait sans rien protéger. */
    const r = fusionnerLesSources({
      propres: [ev("a")], recurrents: [],
      importes: [[ev("todo_1")], [ev("goal_1")], [ev("step_1")]],
      debut: new Date(), fin: new Date(), deployer,
    });
    expect(r.map((e) => e.id)).toEqual(["a", "todo_1", "goal_1", "step_1"]);
  });

  it("rend une liste vide quand rien n'arrive", () => {
    expect(fusionnerLesSources({ propres: [], recurrents: [], importes: [], debut: new Date(), fin: new Date(), deployer })).toEqual([]);
  });
});
