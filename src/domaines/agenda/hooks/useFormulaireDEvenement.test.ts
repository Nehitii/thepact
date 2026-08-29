import { describe, it, expect } from "vitest";
import { bornesDuFormulaire, refusDeSaisie, dureeRetenue } from "./useFormulaireDEvenement";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Trois décisions de saisie. Aucune ne casse quand elle se trompe :
   elle enregistre simplement un événement au mauvais moment, ou refuse
   une saisie correcte.

   La plus discrète : UNE FIN SANS DATE PREND CELLE DU DÉBUT. Un
   événement d'une heure se saisit en tapant deux heures et une seule
   date ; exiger la seconde serait un péage. Si ce repli disparaît, le
   formulaire refuse une saisie que tout le monde fait.
   ═══════════════════════════════════════════════════════════════ */

const MESSAGES = { titre: "titre", dates: "dates", ordre: "ordre" };
const champs = (p: Partial<Parameters<typeof bornesDuFormulaire>[0]> = {}) =>
  bornesDuFormulaire({
    allDay: false, startDate: "2026-03-04", startTime: "14:00",
    endDate: "2026-03-04", endTime: "15:00", ...p,
  });

describe("les bornes", () => {
  it("compose des instants LOCAUX, pas des chaînes collées", () => {
    /* `${date}T${heure}:00` ne porte aucun fuseau, et la colonne qui la
       reçoit en attend un : Postgres la lirait en UTC. */
    const { debut, fin } = champs();
    expect(debut).toBeInstanceOf(Date);
    expect(debut!.getHours()).toBe(14);
    expect(fin!.getHours()).toBe(15);
  });

  it("prend la date du début quand la fin n'en a pas", () => {
    /* Deux heures, une seule date : c'est la saisie normale d'un
       événement d'une heure. */
    const { debut, fin } = champs({ endDate: "" });
    expect(fin!.getTime() - debut!.getTime()).toBe(3600_000);
  });

  it("prend aussi la date du début en journée entière", () => {
    /* Écrit d'abord seulement pour l'horaire, ce test laissait passer la
       mutation qui retirait le repli de la branche « toute la journée » :
       le même repli est écrit deux fois, et une seule était éprouvée.
       C'est aussi pourquoi les deux instants portent maintenant un nom
       — cinq ternaires identiques peuvent diverger, une fonction non. */
    const { debut, fin } = champs({ allDay: true, endDate: "" });
    expect(debut).not.toBeNull();
    expect(fin).not.toBeNull();
    expect(fin!.getTime()).toBeGreaterThan(debut!.getTime());
    expect(fin!.getDate()).toBe(debut!.getDate());
  });

  it("ouvre la journée entière du premier au dernier instant", () => {
    const { debut, fin } = champs({ allDay: true });
    expect([debut!.getHours(), debut!.getMinutes()]).toEqual([0, 0]);
    expect(fin!.getHours()).toBe(23);
    expect(fin!.getTime()).toBeGreaterThan(debut!.getTime());
  });

  it("ignore l'heure saisie quand c'est une journée entière", () => {
    /* Sinon un événement « toute la journée » commencerait à 14 h. */
    expect(champs({ allDay: true, startTime: "14:00" }).debut!.getHours()).toBe(0);
  });

  it("rend null plutôt qu'une date invalide quand la saisie est vide", () => {
    expect(champs({ startDate: "" }).debut).toBeNull();
    expect(champs({ startDate: "", endDate: "" }).fin).toBeNull();
  });
});

describe("les trois refus", () => {
  it("refuse un titre vide ou fait d'espaces", () => {
    expect(refusDeSaisie("", champs(), MESSAGES).map((r) => r.champ)).toEqual(["titre"]);
    expect(refusDeSaisie("   ", champs(), MESSAGES).map((r) => r.champ)).toEqual(["titre"]);
  });

  it("refuse une date manquante", () => {
    const r = refusDeSaisie("Titre", champs({ startDate: "" }), MESSAGES);
    expect(r).toEqual([{ champ: "dates", texte: "dates" }]);
  });

  it("refuse une fin AVANT le début", () => {
    const r = refusDeSaisie("Titre", champs({ endTime: "13:00" }), MESSAGES);
    expect(r).toEqual([{ champ: "dates", texte: "ordre" }]);
  });

  it("refuse aussi une fin ÉGALE au début", () => {
    /* `<=` et non `<` : un événement de durée nulle ne se voit pas sur
       une grille horaire, donc il n'existe pas pour qui le relit. */
    const r = refusDeSaisie("Titre", champs({ endTime: "14:00" }), MESSAGES);
    expect(r).toEqual([{ champ: "dates", texte: "ordre" }]);
  });

  it("ne dit pas deux fois la même chose sur les dates", () => {
    /* Une date manquante et un ordre inversé ne peuvent pas coexister :
       sans borne, il n'y a pas d'ordre à vérifier. */
    const r = refusDeSaisie("", champs({ startDate: "" }), MESSAGES);
    expect(r.filter((x) => x.champ === "dates")).toHaveLength(1);
    expect(r.map((x) => x.champ)).toEqual(["titre", "dates"]);
  });

  it("ne refuse rien quand tout est bon", () => {
    expect(refusDeSaisie("Titre", champs(), MESSAGES)).toEqual([]);
  });
});

describe("la durée retenue", () => {
  it("garde ce que l'utilisateur a voulu", () => {
    /* C'est une DURÉE qu'il a voulue, pas un instant de fin figé :
       déplacer le début doit reporter la fin d'autant. */
    expect(dureeRetenue(new Date(2026, 2, 4, 14), new Date(2026, 2, 4, 17))).toBe(3 * 3600_000);
  });

  it("ne descend jamais sous la minute", () => {
    /* La plus petite durée qui laisse une trace sur une grille. Sans ce
       plancher, régler la fin AVANT le début mémoriserait une durée
       négative — et le prochain déplacement du début enverrait la fin
       en arrière. */
    const meme = new Date(2026, 2, 4, 14);
    expect(dureeRetenue(meme, meme)).toBe(60000);
    expect(dureeRetenue(new Date(2026, 2, 4, 14), new Date(2026, 2, 4, 10))).toBe(60000);
  });
});
