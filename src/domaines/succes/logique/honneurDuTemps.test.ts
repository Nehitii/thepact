import { describe, expect, it } from "vitest";
import {
  DIFFICULTE_PAR_DEFAUT, HEURES_CHEMIN_COURBE, HEURES_ECHO, HEURES_SANG_RESOLU,
  JOURS_HORS_DU_TEMPS, dureeEnHeures, honneursDuTemps, mesureDeLHonneur,
} from "./honneurDuTemps";

describe("la duree mesuree", () => {
  it("compte les heures entre deux instants", () => {
    expect(dureeEnHeures("2026-09-15T10:00:00Z", "2026-09-15T13:30:00Z")).toBe(3.5);
    expect(dureeEnHeures("2026-09-01T00:00:00Z", "2026-09-08T00:00:00Z")).toBe(168);
  });

  it("rend zero quand les deux instants sont le meme", () => {
    expect(dureeEnHeures("2026-09-15T10:00:00Z", "2026-09-15T10:00:00Z")).toBe(0);
  });

  /* UNE DUREE NEGATIVE EST POSSIBLE : rien n exige que l achevement
     suive le depart. Un objectif date du futur passerait donc sous tous
     les seuils. */
  it("rend une duree negative si l achevement precede le depart", () => {
    expect(dureeEnHeures("2026-09-15T10:00:00Z", "2026-09-15T09:00:00Z")).toBe(-1);
  });
});

describe("les quatre seuils", () => {
  it("porte les nombres d origine", () => {
    expect(JOURS_HORS_DU_TEMPS).toBe(30);
    expect(HEURES_CHEMIN_COURBE).toBe(72);
    expect(HEURES_SANG_RESOLU).toBe(48);
    expect(HEURES_ECHO).toBe(0.05);
    /* Trois minutes. */
    expect(HEURES_ECHO * 60).toBeCloseTo(3, 10);
  });

  it("ne donne rien a un objectif ordinaire mene normalement", () => {
    expect(honneursDuTemps("medium", 200)).toEqual([]);
    expect(honneursDuTemps("hard", 10)).toEqual([]);
  });

  it("reserve le premier aux impossibles, sous un mois", () => {
    expect(honneursDuTemps("impossible", 29 * 24)).toEqual(["cut_through_time"]);
    expect(honneursDuTemps("impossible", 31 * 24)).toEqual([]);
    expect(honneursDuTemps("extreme", 29 * 24)).toEqual([]);
  });

  /* LES DEUX SEUILS EXTREMES S EMBOITENT : sous 48 heures on gagne les
     deux, entre 48 et 72 on n en gagne qu un. Il n existe aucune duree
     qui donne « blood_of_resolve » sans « warping_path ». */
  it("emboite les deux extremes", () => {
    expect(honneursDuTemps("extreme", 47)).toEqual(["warping_path", "blood_of_resolve"]);
    expect(honneursDuTemps("extreme", 50)).toEqual(["warping_path"]);
    expect(honneursDuTemps("extreme", 71)).toEqual(["warping_path"]);
    expect(honneursDuTemps("extreme", 100)).toEqual([]);
    expect(HEURES_SANG_RESOLU).toBeLessThan(HEURES_CHEMIN_COURBE);
  });

  /* LES SEUILS SONT STRICTS : a l heure pile, le succes n est pas
     donne. Une seconde de moins, il l est. */
  it("refuse la valeur exacte du seuil", () => {
    expect(honneursDuTemps("extreme", HEURES_SANG_RESOLU)).toEqual(["warping_path"]);
    expect(honneursDuTemps("extreme", HEURES_SANG_RESOLU - 0.001))
      .toEqual(["warping_path", "blood_of_resolve"]);
    expect(honneursDuTemps("impossible", JOURS_HORS_DU_TEMPS * 24)).toEqual([]);
    expect(honneursDuTemps("medium", HEURES_ECHO)).toEqual([]);
  });

  /* L ORDRE EST CELUI DES QUATRE `if` D ORIGINE, et c est l ordre des
     notifications qui s empilent a l ecran. */
  it("garde l ordre des deblocages", () => {
    expect(honneursDuTemps("extreme", 0))
      .toEqual(["warping_path", "blood_of_resolve", "echo_breaker"]);
  });

  /* ═══ UNE DUREE NULLE PASSE SOUS LES QUATRE SEUILS D UN COUP ═══
   *
   * C est ce qui rendait le repli sur l instant present dangereux : un
   * objectif « impossible » sans date de depart repartait avec deux
   * distinctions. Le repli est retire ; la regle, elle, reste — un
   * achevement VRAIMENT instantane gagne toujours autant. */
  it("donne tout a un objectif impossible acheve en zero temps", () => {
    expect(honneursDuTemps("impossible", 0)).toEqual(["cut_through_time", "echo_breaker"]);
    expect(honneursDuTemps("extreme", 0))
      .toEqual(["warping_path", "blood_of_resolve", "echo_breaker"]);
    expect(honneursDuTemps("medium", 0)).toEqual(["echo_breaker"]);
  });

  it("donne aussi tout pour une duree negative", () => {
    expect(honneursDuTemps("impossible", -100)).toEqual(["cut_through_time", "echo_breaker"]);
  });
});

describe("d ou part la mesure", () => {
  const maintenant = new Date("2026-09-15T12:00:00Z");

  it("part de la date de depart de l objectif", () => {
    expect(mesureDeLHonneur({ difficulty: "extreme", start_date: "2026-09-10T08:00:00Z" }, maintenant))
      .toEqual({
        difficulte: "extreme",
        depuis: "2026-09-10T08:00:00Z",
        jusqua: "2026-09-15T12:00:00.000Z",
      });
  });

  it("retombe sur « medium » quand la difficulte manque", () => {
    expect(mesureDeLHonneur({ start_date: "2026-09-10T08:00:00Z" }, maintenant).difficulte)
      .toBe(DIFFICULTE_PAR_DEFAUT);
    expect(mesureDeLHonneur({ difficulty: null }, maintenant).difficulte).toBe(DIFFICULTE_PAR_DEFAUT);
    expect(DIFFICULTE_PAR_DEFAUT).toBe("medium");
  });

  /* ═══ `??` PLUTOT QUE `||`, ET LA BASE REND LE CHOIX SANS EFFET ═══
   *
   * Les deux formes ne divergent que sur la chaine VIDE : `??` la
   * garde, `||` la remplace par « medium ». Le balayage de mutations a
   * survecu a l echange, et la base explique pourquoi —
   * `goals.difficulty` est une ENUMERATION Postgres (`goal_difficulty`),
   * qui refuse la chaine vide : la requete qui a tente de la comparer a
   * ete rejetee avec « invalid input value for enum ». La divergence
   * n est donc pas atteignable.
   *
   * ET MEME SI ELLE L ETAIT, elle ne changerait aucun succes : une
   * difficulte vide n est ni « impossible » ni « extreme », donc elle se
   * comporte exactement comme « medium » pour les quatre regles. Le
   * test epingle le choix, pas son effet. */
  it("garde une difficulte vide, que la base ne peut de toute facon pas produire", () => {
    expect(mesureDeLHonneur({ difficulty: "" }, maintenant).difficulte).toBe("");
    expect(honneursDuTemps("", 0)).toEqual(honneursDuTemps(DIFFICULTE_PAR_DEFAUT, 0));
    expect(honneursDuTemps("", 1000)).toEqual(honneursDuTemps(DIFFICULTE_PAR_DEFAUT, 1000));
  });

  /* ═══ UN DEPART MANQUANT NE SE FABRIQUE PAS ═══
   *
   * L appelant passait `goal.start_date || maintenant` : la duree valait
   * alors ZERO, et zero passe sous les quatre seuils d un coup. Un
   * objectif « impossible » sans date de depart repartait avec deux
   * distinctions, un « extreme » avec trois.
   *
   * Le repli est retire : un depart inconnu rend `null`, et ce qui ne
   * se mesure pas ne se gagne pas. */
  it("rend un depart nul quand l objectif n en a pas", () => {
    for (const but of [{ start_date: null }, { start_date: undefined }, { start_date: "" }, {}]) {
      const m = mesureDeLHonneur(but, maintenant);
      expect(m.depuis).toBeNull();
      expect(m.jusqua).toBe("2026-09-15T12:00:00.000Z");
      expect(dureeEnHeures(m.depuis, m.jusqua)).toBeNull();
    }
  });

  it("ne donne plus rien a un achevement dont on ignore le depart", () => {
    for (const difficulte of ["impossible", "extreme", "medium"]) {
      const m = mesureDeLHonneur({ difficulty: difficulte }, maintenant);
      expect(honneursDuTemps(m.difficulte, dureeEnHeures(m.depuis, m.jusqua))).toEqual([]);
    }
  });

  /* CE QUE CELA DONNAIT AVANT, pour que le changement reste lisible :
     une duree de zero — ce que le repli fabriquait — gagne toujours
     autant. C est la duree INCONNUE qui ne gagne plus rien, pas la
     duree nulle. */
  it("distingue une duree nulle d une duree inconnue", () => {
    expect(honneursDuTemps("impossible", 0)).toEqual(["cut_through_time", "echo_breaker"]);
    expect(honneursDuTemps("impossible", null)).toEqual([]);
  });

  /* UNE DATE DE DEPART ILLISIBLE TOMBE AU MEME ENDROIT : elle donnerait
     NaN heures, et NaN n est pas une mesure. */
  it("traite une date de depart illisible comme un depart inconnu", () => {
    expect(dureeEnHeures("pas une date", "2026-09-15T12:00:00Z")).toBeNull();
    expect(honneursDuTemps("extreme", dureeEnHeures("pas une date", "2026-09-15T12:00:00Z")))
      .toEqual([]);
  });

  /* CE REPLI EST DOMINE PAR LA BASE, AUJOURD HUI. Releve le 30/08/2026
     sur le compte : 38 objectifs, AUCUN sans date de depart, et la
     colonne porte une valeur par defaut. Ce qui le rendrait vivant :
     la colonne reste NULLABLE — une insertion qui pose explicitement
     `start_date: null` suffirait. */
  it("ne se declenche pas quand la base a fait son travail", () => {
    const m = mesureDeLHonneur({ difficulty: "impossible", start_date: "2026-01-01T00:00:00Z" }, maintenant);
    expect(m.depuis).not.toBe(m.jusqua);
    expect(dureeEnHeures(m.depuis, m.jusqua)).toBeGreaterThan(JOURS_HORS_DU_TEMPS * 24);
    expect(honneursDuTemps(m.difficulte, dureeEnHeures(m.depuis, m.jusqua))).toEqual([]);
  });
});
