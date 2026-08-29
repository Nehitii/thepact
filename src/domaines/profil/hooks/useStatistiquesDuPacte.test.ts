import { describe, it, expect } from "vitest";
import { fr } from "date-fns/locale";
import { composerLesStatistiques } from "./useStatistiquesDuPacte";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Six chiffres montrés AVANT de proposer une sauvegarde : ils disent ce
   qu'on emporterait. S'ils mentent, on part avec moins que ce qu'on
   croit — et on ne s'en aperçoit qu'en ayant besoin du fichier.

   Le cas qui compte : UNE DATE ILLISIBLE N'EST PAS UNE DATE. Sans le
   contrôle, la fiche affichait « Invalid Date » et un nombre de jours
   tenus égal à NaN — deux façons de dire « je ne sais pas » qui
   ressemblent à des réponses.
   ═══════════════════════════════════════════════════════════════ */

const MARS = new Date(2026, 2, 4);
const composer = (p: Partial<Parameters<typeof composerLesStatistiques>[0]> = {}) =>
  composerLesStatistiques({
    pactId: "p1", pacte: null, idsObjectifs: [], etapes: [],
    entreesDeJournal: 0, succesObtenus: 0, locale: fr, maintenant: MARS, ...p,
  });

describe("la date du pacte", () => {
  it("met en forme une date valide et compte les jours tenus", () => {
    /* 58 et non 59, et l'écart vaut d'être nommé : `created_at` est un
       instant UTC, « aujourd'hui » est local. Du 4 janvier 00:00 UTC au
       4 mars 00:00 local il y a 58 jours et 23 heures à l'est de
       Greenwich, et `differenceInDays` tronque.
     *
     * Conséquence réelle, petite mais réelle : sceller son pacte à
     * 23 h 30 ou à 9 h du matin ne donne pas le même compteur le
     * lendemain. Le test le CONSTATE — le corriger demanderait de
     * décider ce qu'est « un jour tenu », et ce n'est pas une décision
     * de refactoring. */
    const s = composer({ pacte: { name: "Le pacte", created_at: "2026-01-04T00:00:00Z" } });
    expect(s.scelleLe).toMatch(/janv/);
    expect(s.joursTenus).toBe(58);
    expect(s.pactName).toBe("Le pacte");
  });

  it("rend null plutôt que « Invalid Date » sur une date illisible", () => {
    const s = composer({ pacte: { name: "X", created_at: "pas une date" } });
    expect(s.scelleLe).toBeNull();
    expect(s.joursTenus).toBe(0);
  });

  it("ne compte aucun jour quand il n'y a pas de pacte", () => {
    const s = composer({ pacte: null });
    expect(s).toMatchObject({ scelleLe: null, joursTenus: 0, pactName: "" });
  });

  it("ne rend jamais NaN pour les jours tenus", () => {
    /* NaN s'affiche, et ressemble à un compteur cassé plutôt qu'à une
       absence de réponse. */
    for (const created_at of [null, undefined, "", "2026-13-45", "hier"]) {
      expect(Number.isNaN(composer({ pacte: { created_at } }).joursTenus)).toBe(false);
    }
  });
});

describe("ce que le pacte a produit", () => {
  it("ne compte comme faite que l'étape au statut « completed »", () => {
    /* « completed » est bien le statut des ÉTAPES — contrairement aux
       objectifs, où il n'existe pas. Compter les autres gonflerait
       l'avancement affiché juste avant une sauvegarde. */
    const s = composer({
      etapes: [{ status: "completed" }, { status: "in_progress" }, { status: "validated" }, { status: null }],
    });
    expect(s.stepsCompleted).toBe(1);
    expect(s.totalSteps).toBe(4);
  });

  it("compte les objectifs, le journal et les succès tels quels", () => {
    const s = composer({ idsObjectifs: ["a", "b", "c"], entreesDeJournal: 12, succesObtenus: 36 });
    expect(s).toMatchObject({ goalsCreated: 3, journalEntries: 12, achievementsUnlocked: 36 });
  });

  it("rend des zéros, pas des absences, sur un pacte vide", () => {
    /* Un tiret ou un vide laisserait croire à une erreur de lecture. */
    expect(composer()).toMatchObject({
      goalsCreated: 0, stepsCompleted: 0, totalSteps: 0,
      journalEntries: 0, achievementsUnlocked: 0,
    });
  });
});
