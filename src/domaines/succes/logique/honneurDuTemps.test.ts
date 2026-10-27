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
    expect(honneursDuTemps("medium", HEURES_ECHO - 0.001)).toEqual(["echo_breaker"]);
  });

  /* L ORDRE EST CELUI DES QUATRE `if` D ORIGINE, et c est l ordre des
     notifications qui s empilent a l ecran. */
  it("garde l ordre des deblocages", () => {
    expect(honneursDuTemps("extreme", 0))
      .toEqual(["warping_path", "blood_of_resolve", "echo_breaker"]);
  });

  it("donne tout a un objectif impossible acheve en zero temps", () => {
    expect(honneursDuTemps("impossible", 0)).toEqual(["cut_through_time", "echo_breaker"]);
    expect(honneursDuTemps("medium", 0)).toEqual(["echo_breaker"]);
  });

  it("donne aussi tout pour une duree negative", () => {
    expect(honneursDuTemps("impossible", -100)).toEqual(["cut_through_time", "echo_breaker"]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   UNE SEULE HORLOGE, ET C EST CELLE QUE LA PERSONNE DECLARE.

   « Briseur d echo » a passe une matinee sur `created_at` — la
   definition en base disait « dans les 3 minutes suivant SA CREATION »,
   et la mesure lui donnait raison : depuis le depart, aucun des
   quatorze objectifs honores ne passait sous les trois minutes ; depuis
   la creation, dix y passaient.

   C ETAIT LA DEFINITION QUI DECRIVAIT LA MAUVAISE CHOSE. `created_at`
   dit quand la LIGNE a ete ecrite. Dans une application entierement
   declarative, la seule date qui veuille dire quelque chose est celle
   que la personne pose — et la definition en base a ete recrite pour
   dire « suivant son depart ».

   Ces trois tests tiennent ce qui reste vrai des deux epoques : les
   quatre distinctions lisent LA MEME duree, et une duree absente n en
   donne aucune.
   ═══════════════════════════════════════════════════════════════ */
describe("l horloge declaree", () => {
  it("mesure les quatre depuis le meme instant", () => {
    /* Zero heure depuis le depart : les quatre seuils tombent ensemble
       si la difficulte s y prete. */
    expect(honneursDuTemps("extreme", 0))
      .toEqual(["warping_path", "blood_of_resolve", "echo_breaker"]);
    /* Cinq mille heures : aucune. */
    expect(honneursDuTemps("extreme", 5000)).toEqual([]);
  });

  /* SANS DATE DE DEPART, RIEN. C est ce que la case decochee produit a
     la creation : la colonne reste nulle, et un objectif sans depart ne
     peut gagner aucune des quatre — quelle que soit sa difficulte. */
  it("ne donne rien quand aucun depart n a ete declare", () => {
    for (const difficulte of ["impossible", "extreme", "hard", "medium", ""]) {
      expect(honneursDuTemps(difficulte, null), difficulte).toEqual([]);
    }
  });

  it("distingue une duree nulle d une duree inconnue", () => {
    expect(honneursDuTemps("impossible", 0)).toEqual(["cut_through_time", "echo_breaker"]);
    expect(honneursDuTemps("impossible", null)).toEqual([]);
  });
});

describe("d ou part la mesure", () => {
  const maintenant = new Date("2026-09-15T12:00:00Z");

  it("porte le depart et l instant de l achevement", () => {
    expect(mesureDeLHonneur({
      difficulty: "extreme",
      start_date: "2026-09-10T08:00:00Z",
    }, maintenant)).toEqual({
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
   * qui refuse la chaine vide.
   *
   * ET MEME SI ELLE L ETAIT, elle ne changerait aucun succes : une
   * difficulte vide n est ni « impossible » ni « extreme », donc elle se
   * comporte exactement comme « medium » pour les quatre regles. */
  it("garde une difficulte vide, que la base ne peut de toute facon pas produire", () => {
    expect(mesureDeLHonneur({ difficulty: "" }, maintenant).difficulte).toBe("");
    expect(honneursDuTemps("", 0)).toEqual(honneursDuTemps(DIFFICULTE_PAR_DEFAUT, 0));
    expect(honneursDuTemps("", 1000)).toEqual(honneursDuTemps(DIFFICULTE_PAR_DEFAUT, 1000));
  });

  /* ═══ UN DEPART MANQUANT NE SE FABRIQUE PAS ═══
   *
   * L appelant passait `goal.start_date || maintenant` : la duree valait
   * alors ZERO, et zero passe sous les quatre seuils d un coup.
   *
   * LE REPLI EST RETIRE, et il ne l est plus par precaution : depuis que
   * la case « je sais quand j ai commence » existe a la creation, un
   * objectif PEUT n avoir aucune date de depart, et c est une reponse.
   * La chaine vide compte comme une absence — d ou le OU logique. */
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

  /* UNE DATE ILLISIBLE TOMBE AU MEME ENDROIT : elle donnerait NaN
     heures, et NaN n est pas une mesure. */
  it("traite une date illisible comme un depart inconnu", () => {
    expect(dureeEnHeures("pas une date", "2026-09-15T12:00:00Z")).toBeNull();
    expect(honneursDuTemps("extreme", dureeEnHeures("pas une date", "2026-09-15T12:00:00Z")))
      .toEqual([]);
  });

  /* RELEVE LE 30/08/2026, apres correction des dates : les 38 objectifs
     du compte portent tous un depart, et tous anterieur a leur
     creation — aucun ne vient d un champ pre-rempli. La colonne reste
     NULLABLE, et la case decochee y ecrit desormais NULL. */
  it("ne se declenche pas quand le depart est loin", () => {
    const m = mesureDeLHonneur({
      difficulty: "impossible",
      start_date: "2026-01-01T00:00:00Z",
    }, maintenant);
    expect(m.depuis).not.toBe(m.jusqua);
    expect(dureeEnHeures(m.depuis, m.jusqua)).toBeGreaterThan(JOURS_HORS_DU_TEMPS * 24);
    expect(honneursDuTemps(m.difficulte, dureeEnHeures(m.depuis, m.jusqua))).toEqual([]);
  });
});
