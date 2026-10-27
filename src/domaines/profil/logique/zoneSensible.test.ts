import { describe, it, expect } from "vitest";
import { MOT_REINIT, MOT_SUPPRESSION, recopieExacte, peutProceder } from "./zoneSensible";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Deux gestes de cette page ne se défont pas : remettre le pacte à zéro,
   et supprimer le compte. Ce qui les sépare d'un clic distrait est une
   chaîne à recopier — et une comparaison.

   UNE COMPARAISON QUI PASSE TOUJOURS NE SE VOIT PAS. Le bouton
   s'active, l'écran ne dit rien d'anormal, et le garde-fou a disparu.
   C'est le seul endroit de l'application où le défaut silencieux coûte
   tout — d'où des tests pour trois lignes de code.
   ═══════════════════════════════════════════════════════════════ */

describe("la recopie", () => {
  it("n'accepte que le mot exact", () => {
    expect(recopieExacte(MOT_REINIT, MOT_REINIT)).toBe(true);
    expect(recopieExacte(MOT_SUPPRESSION, MOT_SUPPRESSION)).toBe(true);
  });

  it("refuse une casse différente", () => {
    /* Le geste demandé est de TAPER le mot, pas de le reconnaître.
       Accepter « reinitialiser » rendrait le garde-fou franchissable
       par inattention — ce qui revient à ne pas en avoir. */
    expect(recopieExacte("reinitialiser", MOT_REINIT)).toBe(false);
    expect(recopieExacte("Reinitialiser", MOT_REINIT)).toBe(false);
  });

  it("refuse un espace en trop", () => {
    expect(recopieExacte(" REINITIALISER", MOT_REINIT)).toBe(false);
    expect(recopieExacte("REINITIALISER ", MOT_REINIT)).toBe(false);
  });

  it("refuse le vide, et tout ce qui n'est pas le mot", () => {
    expect(recopieExacte("", MOT_REINIT)).toBe(false);
    expect(recopieExacte("SUPPRIMER", MOT_REINIT)).toBe(false);
    expect(recopieExacte("REINITIALISERR", MOT_REINIT)).toBe(false);
  });

  it("ne confond pas les deux mots", () => {
    /* Les deux dialogues se ressemblent ; les mots, non. Taper l'un
       dans l'autre ne doit rien déclencher. */
    expect(recopieExacte(MOT_REINIT, MOT_SUPPRESSION)).toBe(false);
    expect(recopieExacte(MOT_SUPPRESSION, MOT_REINIT)).toBe(false);
    expect(MOT_REINIT).not.toBe(MOT_SUPPRESSION);
  });
});

describe("le passage à l'acte", () => {
  it("ne part que sur une recopie exacte", () => {
    expect(peutProceder(MOT_REINIT, MOT_REINIT, false)).toBe(true);
    expect(peutProceder("presque", MOT_REINIT, false)).toBe(false);
  });

  it("ne repart pas pendant que le geste est en cours", () => {
    /* Un double clic sur « Supprimer » lancerait deux fois la même
       destruction : la seconde trouverait un compte déjà à moitié
       défait. */
    expect(peutProceder(MOT_SUPPRESSION, MOT_SUPPRESSION, true)).toBe(false);
  });

  it("refuse les deux à la fois sans se contredire", () => {
    expect(peutProceder("", MOT_REINIT, true)).toBe(false);
  });
});
