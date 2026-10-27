import { describe, expect, it } from "vitest";
import {
  REGLAGES_PAR_DEFAUT, colonnesDeLObjet, objetDeLaClause, reglagesLus,
} from "./preferences";

describe("les trois durees relues du stockage", () => {
  it("rend le pomodoro d origine quand il n y a rien", () => {
    expect(REGLAGES_PAR_DEFAUT).toEqual({ work: 25, pause: 5, longue: 15 });
    expect(reglagesLus(null)).toEqual(REGLAGES_PAR_DEFAUT);
    expect(reglagesLus("")).toEqual(REGLAGES_PAR_DEFAUT);
  });

  it("garde les defauts pour ce qui n est pas stocke", () => {
    expect(reglagesLus('{"work":45}')).toEqual({ work: 45, pause: 5, longue: 15 });
    expect(reglagesLus('{"pause":10,"longue":30}')).toEqual({ work: 25, pause: 10, longue: 30 });
    expect(reglagesLus("{}")).toEqual(REGLAGES_PAR_DEFAUT);
  });

  it("retombe sur les defauts devant du texte illisible", () => {
    expect(reglagesLus("{pas du json")).toEqual(REGLAGES_PAR_DEFAUT);
    expect(reglagesLus("undefined")).toEqual(REGLAGES_PAR_DEFAUT);
  });

  /* LE RACCOURCI SUR LA CHAINE VIDE NE DECIDE RIEN — il evite une
   * exception, c est tout. Le balayage de mutations y a survecu, et
   * c est juste : `JSON.parse("")` LEVE, donc le filet du `catch`
   * rendrait deja les defauts. Code DOMINE par ce filet.
   *
   * Ce qui le rendrait vivant : retirer le `catch` — et cette
   * mutation-la, elle, tombe. */
  it("passe par deux chemins differents pour le meme resultat", () => {
    expect(() => JSON.parse("")).toThrow();
    expect(reglagesLus("")).toEqual(REGLAGES_PAR_DEFAUT);
    expect(reglagesLus(null)).toEqual(REGLAGES_PAR_DEFAUT);
    expect(reglagesLus("")).toEqual(reglagesLus("{pas du json"));
  });

  /* `{ ...defaut, ...null }` et `{ ...defaut, ...5 }` ne changent rien :
     etaler un non-objet n ajoute aucune cle. Le repli est donc correct
     par accident, pas par verification. */
  it("survit a un JSON valide qui n est pas un objet", () => {
    expect(reglagesLus("null")).toEqual(REGLAGES_PAR_DEFAUT);
    expect(reglagesLus("5")).toEqual(REGLAGES_PAR_DEFAUT);
    expect(reglagesLus("true")).toEqual(REGLAGES_PAR_DEFAUT);
  });

  /* SAUF UNE CHAINE ET UN TABLEAU : ceux-la S ETALENT, par index. Les
     trois durees restent bonnes, l objet gagne des cles parasites qui
     partiront telles quelles au prochain enregistrement. */
  it("laisse une chaine stockee polluer l objet rendu", () => {
    expect(reglagesLus('"abc"')).toEqual({ ...REGLAGES_PAR_DEFAUT, 0: "a", 1: "b", 2: "c" });
    expect(reglagesLus("[7,8]")).toEqual({ ...REGLAGES_PAR_DEFAUT, 0: 7, 1: 8 });
    /* Les trois qui comptent sont intactes. */
    expect(reglagesLus('"abc"').work).toBe(25);
  });

  /* ═══ CE QUI EST STOCKE ARRIVE TEL QUEL DANS LE MINUTEUR ═══
   *
   * La fusion ne verifie rien : `workMinutes * 60` recoit ce qu il y a.
   * Aucune de ces valeurs ne peut venir de l ecran — les reglages y sont
   * bornes — mais rien ici ne les arrete. Constate, non corrige. */
  it("laisse passer un texte la ou le minuteur attend un nombre", () => {
    const r = reglagesLus('{"work":"abc"}');
    expect(r.work).toBe("abc");
    expect((r.work as unknown as number) * 60).toBeNaN();
  });

  it("laisse passer zero, et une duree negative", () => {
    expect(reglagesLus('{"work":0}').work).toBe(0);
    expect(reglagesLus('{"work":-5}').work).toBe(-5);
    expect(reglagesLus('{"pause":null}').pause).toBeNull();
  });

  it("garde une cle inconnue au lieu de l ecarter", () => {
    expect(reglagesLus('{"inconnue":1}')).toEqual({ ...REGLAGES_PAR_DEFAUT, inconnue: 1 });
  });
});

describe("l objet de la clause", () => {
  it("rend rien quand il n y a rien", () => {
    expect(objetDeLaClause(null)).toBeNull();
    expect(objetDeLaClause("")).toBeNull();
    expect(objetDeLaClause("null")).toBeNull();
  });

  it("accepte les deux formes reconnues", () => {
    expect(objetDeLaClause('{"type":"goal","id":"g1"}')).toEqual({ type: "goal", id: "g1" });
    expect(objetDeLaClause('{"type":"todo","id":"t1"}')).toEqual({ type: "todo", id: "t1" });
  });

  it("refuse un type inconnu et un identifiant qui n est pas du texte", () => {
    expect(objetDeLaClause('{"type":"habit","id":"h1"}')).toBeNull();
    expect(objetDeLaClause('{"type":"goal","id":7}')).toBeNull();
    expect(objetDeLaClause('{"type":"goal"}')).toBeNull();
  });

  it("retombe sur rien devant du texte illisible", () => {
    expect(objetDeLaClause("{pas du json")).toBeNull();
  });

  /* L ANCIEN FORMAT EST ENCORE LU, ET L ORDRE DECIDE : quand les deux
     champs sont la — le cas que le format neuf rend impossible — c est
     l objectif qui gagne. */
  it("replie l ancien format sur un seul emplacement", () => {
    expect(objetDeLaClause('{"goal":"g1"}')).toEqual({ type: "goal", id: "g1" });
    expect(objetDeLaClause('{"todo":"t1"}')).toEqual({ type: "todo", id: "t1" });
    expect(objetDeLaClause('{"goal":"g1","todo":"t1"}')).toEqual({ type: "goal", id: "g1" });
  });

  it("ignore un ancien format vide des deux cotes", () => {
    expect(objetDeLaClause('{"goal":null,"todo":null}')).toBeNull();
    expect(objetDeLaClause("{}")).toBeNull();
  });

  /* L ANCIEN FORMAT EST AUSSI STRICT QUE LE NEUF. Le balayage de
     mutations a survecu tant que ce test n existait pas : remplacer
     `typeof o.goal === "string"` par un simple test de verite laissait
     passer un identifiant numerique — donc une clause portant un `id`
     que le format neuf, lui, refuse dans la ligne juste au-dessus. */
  it("refuse un ancien identifiant qui n est pas du texte", () => {
    expect(objetDeLaClause('{"goal":7}')).toBeNull();
    expect(objetDeLaClause('{"todo":true}')).toBeNull();
    expect(objetDeLaClause('{"goal":{"id":"g1"}}')).toBeNull();
    expect(objetDeLaClause('{"goal":["g1"]}')).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════
   LES DEUX LECTURES DU MEME STOCKAGE N ONT PAS LA MEME DEFIANCE.

   Elles sont ecrites a deux lignes d intervalle, elles lisent le meme
   `localStorage`, et devant la meme sorte d entree elles font
   l inverse : l une refuse, l autre laisse passer.
   ═══════════════════════════════════════════════════════════════ */
describe("l ecart entre les deux lectures", () => {
  it("refuse un identifiant numerique, mais accepte une duree textuelle", () => {
    expect(objetDeLaClause('{"type":"goal","id":7}')).toBeNull();
    expect(reglagesLus('{"work":"7"}').work).toBe("7");
  });

  it("refuse une forme inconnue, mais garde une cle inconnue", () => {
    expect(objetDeLaClause('{"type":"autre","id":"x"}')).toBeNull();
    expect(reglagesLus('{"autre":"x"}')).toHaveProperty("autre", "x");
  });
});

describe("les deux colonnes derivees a l ecriture", () => {
  it("n en remplit jamais deux", () => {
    expect(colonnesDeLObjet({ type: "goal", id: "g1" }))
      .toEqual({ linked_goal_id: "g1", linked_todo_id: null });
    expect(colonnesDeLObjet({ type: "todo", id: "t1" }))
      .toEqual({ linked_goal_id: null, linked_todo_id: "t1" });
  });

  it("n en remplit aucune sans objet", () => {
    expect(colonnesDeLObjet(null)).toEqual({ linked_goal_id: null, linked_todo_id: null });
  });

  /* LA PROPRIETE QUE LE FORMAT NEUF GARANTIT : quoi qu on lise, au plus
     une colonne sort remplie. C est ce qui rendait la convention
     d avant seulement probable, et qui la rend maintenant certaine. */
  it("tient pour tout ce que la lecture peut rendre", () => {
    const entrees = [
      null, "", "null", "{}", "{pas du json",
      '{"type":"goal","id":"g1"}', '{"type":"todo","id":"t1"}',
      '{"goal":"g1","todo":"t1"}', '{"type":"goal","id":7}',
    ];
    for (const brut of entrees) {
      const c = colonnesDeLObjet(objetDeLaClause(brut));
      const remplies = [c.linked_goal_id, c.linked_todo_id].filter((v) => v !== null);
      expect(remplies.length).toBeLessThanOrEqual(1);
    }
  });
});
