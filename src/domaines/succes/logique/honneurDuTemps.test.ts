import { describe, expect, it } from "vitest";
import {
  DIFFICULTE_PAR_DEFAUT, HEURES_CHEMIN_COURBE, HEURES_ECHO, HEURES_SANG_RESOLU,
  JOURS_HORS_DU_TEMPS, dureeEnHeures, honneursDuTemps, mesureDeLHonneur,
} from "./honneurDuTemps";

/* Les trois premieres distinctions se comptent depuis le DEPART, la
   quatrieme depuis la CREATION. Ces deux raccourcis disent lequel des
   deux un test fait varier. */
const depuisLeDepart = (difficulte: string, heures: number | null) =>
  honneursDuTemps(difficulte, heures, null);
const depuisLaCreation = (difficulte: string, heures: number | null) =>
  honneursDuTemps(difficulte, null, heures);

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
    expect(honneursDuTemps("medium", 200, 200)).toEqual([]);
    expect(honneursDuTemps("hard", 10, 10)).toEqual([]);
  });

  it("reserve le premier aux impossibles, sous un mois", () => {
    expect(depuisLeDepart("impossible", 29 * 24)).toEqual(["cut_through_time"]);
    expect(depuisLeDepart("impossible", 31 * 24)).toEqual([]);
    expect(depuisLeDepart("extreme", 29 * 24)).toEqual([]);
  });

  /* LES DEUX SEUILS EXTREMES S EMBOITENT : sous 48 heures on gagne les
     deux, entre 48 et 72 on n en gagne qu un. Il n existe aucune duree
     qui donne « blood_of_resolve » sans « warping_path ». */
  it("emboite les deux extremes", () => {
    expect(depuisLeDepart("extreme", 47)).toEqual(["warping_path", "blood_of_resolve"]);
    expect(depuisLeDepart("extreme", 50)).toEqual(["warping_path"]);
    expect(depuisLeDepart("extreme", 71)).toEqual(["warping_path"]);
    expect(depuisLeDepart("extreme", 100)).toEqual([]);
    expect(HEURES_SANG_RESOLU).toBeLessThan(HEURES_CHEMIN_COURBE);
  });

  /* LES SEUILS SONT STRICTS : a l heure pile, le succes n est pas
     donne. Une seconde de moins, il l est. */
  it("refuse la valeur exacte du seuil", () => {
    expect(depuisLeDepart("extreme", HEURES_SANG_RESOLU)).toEqual(["warping_path"]);
    expect(depuisLeDepart("extreme", HEURES_SANG_RESOLU - 0.001))
      .toEqual(["warping_path", "blood_of_resolve"]);
    expect(depuisLeDepart("impossible", JOURS_HORS_DU_TEMPS * 24)).toEqual([]);
    expect(depuisLaCreation("medium", HEURES_ECHO)).toEqual([]);
    expect(depuisLaCreation("medium", HEURES_ECHO - 0.001)).toEqual(["echo_breaker"]);
  });

  /* L ORDRE EST CELUI DES QUATRE `if` D ORIGINE, et c est l ordre des
     notifications qui s empilent a l ecran. */
  it("garde l ordre des deblocages", () => {
    expect(honneursDuTemps("extreme", 0, 0))
      .toEqual(["warping_path", "blood_of_resolve", "echo_breaker"]);
  });

  it("donne tout a un objectif impossible acheve en zero temps", () => {
    expect(honneursDuTemps("impossible", 0, 0)).toEqual(["cut_through_time", "echo_breaker"]);
    expect(honneursDuTemps("extreme", 0, 0))
      .toEqual(["warping_path", "blood_of_resolve", "echo_breaker"]);
    expect(honneursDuTemps("medium", 0, 0)).toEqual(["echo_breaker"]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   DEUX HORLOGES, ET ELLES NE DISENT PAS LA MEME CHOSE.

   « Briseur d echo » se compte depuis la CREATION de la ligne — sa
   definition en base le dit mot pour mot. Les trois autres se comptent
   depuis le DEPART, qui se choisit a la main.

   MESURE LE 30/08/2026, sur les 14 objectifs honores du compte :
   depuis le depart, AUCUN ne passait sous les trois minutes ; depuis la
   creation, DIX y passent.
   ═══════════════════════════════════════════════════════════════ */
describe("les deux horloges", () => {
  /* Un objectif commence il y a des mois, mais cree et franchi dans le
     meme geste : c est exactement ce que « briseur d echo » nomme. */
  it("donne la signature a un objectif cree et franchi d un geste", () => {
    expect(honneursDuTemps("medium", 5000, 0.01)).toEqual(["echo_breaker"]);
  });

  /* L inverse : une ligne ecrite il y a longtemps, dont le depart est
     tout recent. Le travail a bien dure trois minutes — mais ce n est
     pas ce que la distinction recompense. */
  it("refuse la signature a un objectif ancien franchi vite", () => {
    expect(honneursDuTemps("extreme", 0.01, 5000))
      .toEqual(["warping_path", "blood_of_resolve"]);
  });

  /* CHAQUE HORLOGE SE TAIT SEPAREMENT. Un depart manquant n empeche pas
     la signature ; une creation manquante n empeche pas le reste. */
  it("laisse chaque horloge decider de son cote", () => {
    expect(honneursDuTemps("extreme", null, 0.01)).toEqual(["echo_breaker"]);
    expect(honneursDuTemps("extreme", 10, null)).toEqual(["warping_path", "blood_of_resolve"]);
    expect(honneursDuTemps("extreme", null, null)).toEqual([]);
  });

  /* ═══ UN ECART NEGATIF PASSE ENCORE ═══
     Un objectif acheve AVANT d avoir ete cree n est pas une performance
     de trois minutes ; c est une ligne retrodatee. La comparaison ne le
     distingue pas de zero. MESURE : sur les 14 objectifs honores, UN
     porte un achevement anterieur a sa creation, de 3 161 heures.
     Constate, non corrige. */
  it("donne encore la signature a un achevement anterieur a la creation", () => {
    expect(depuisLaCreation("medium", -3161)).toEqual(["echo_breaker"]);
    expect(honneursDuTemps("impossible", -100, -100))
      .toEqual(["cut_through_time", "echo_breaker"]);
  });
});

describe("d ou part la mesure", () => {
  const maintenant = new Date("2026-09-15T12:00:00Z");

  it("porte les deux instants et celui de l achevement", () => {
    expect(mesureDeLHonneur({
      difficulty: "extreme",
      start_date: "2026-09-10T08:00:00Z",
      created_at: "2026-09-01T06:00:00Z",
    }, maintenant)).toEqual({
      difficulte: "extreme",
      depuis: "2026-09-10T08:00:00Z",
      cree: "2026-09-01T06:00:00Z",
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
    expect(honneursDuTemps("", 0, 0)).toEqual(honneursDuTemps(DIFFICULTE_PAR_DEFAUT, 0, 0));
    expect(honneursDuTemps("", 1000, 1000)).toEqual(honneursDuTemps(DIFFICULTE_PAR_DEFAUT, 1000, 1000));
  });

  /* ═══ UN INSTANT MANQUANT NE SE FABRIQUE PAS ═══
   *
   * L appelant passait `goal.start_date || maintenant` : la duree valait
   * alors ZERO, et zero passe sous les seuils. Le repli est retire — ce
   * qui ne se mesure pas ne se gagne pas — et les deux colonnes se
   * lisent de la meme facon. */
  it("rend nuls les deux instants quand l objectif ne les porte pas", () => {
    for (const but of [
      { start_date: null, created_at: null },
      { start_date: undefined, created_at: undefined },
      { start_date: "", created_at: "" },
      {},
    ]) {
      const m = mesureDeLHonneur(but, maintenant);
      expect(m.depuis).toBeNull();
      expect(m.cree).toBeNull();
      expect(m.jusqua).toBe("2026-09-15T12:00:00.000Z");
      expect(dureeEnHeures(m.depuis, m.jusqua)).toBeNull();
      expect(dureeEnHeures(m.cree, m.jusqua)).toBeNull();
    }
  });

  it("ne donne plus rien a un achevement dont on ignore les deux instants", () => {
    for (const difficulte of ["impossible", "extreme", "medium"]) {
      const m = mesureDeLHonneur({ difficulty: difficulte }, maintenant);
      expect(honneursDuTemps(
        m.difficulte, dureeEnHeures(m.depuis, m.jusqua), dureeEnHeures(m.cree, m.jusqua),
      )).toEqual([]);
    }
  });

  it("distingue une duree nulle d une duree inconnue", () => {
    expect(honneursDuTemps("impossible", 0, 0)).toEqual(["cut_through_time", "echo_breaker"]);
    expect(honneursDuTemps("impossible", null, null)).toEqual([]);
  });

  /* UNE DATE ILLISIBLE TOMBE AU MEME ENDROIT : elle donnerait NaN
     heures, et NaN n est pas une mesure. */
  it("traite une date illisible comme un instant inconnu", () => {
    expect(dureeEnHeures("pas une date", "2026-09-15T12:00:00Z")).toBeNull();
    expect(honneursDuTemps(
      "extreme",
      dureeEnHeures("pas une date", "2026-09-15T12:00:00Z"),
      dureeEnHeures("pas une date", "2026-09-15T12:00:00Z"),
    )).toEqual([]);
  });

  /* CE REPLI EST DOMINE PAR LA BASE, AUJOURD HUI. Releve le 30/08/2026
     sur le compte : 38 objectifs, AUCUN sans date de depart, et la
     colonne `created_at` porte une valeur par defaut. Ce qui le rendrait
     vivant : `start_date` reste NULLABLE. */
  it("ne se declenche pas quand la base a fait son travail", () => {
    const m = mesureDeLHonneur({
      difficulty: "impossible",
      start_date: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
    }, maintenant);
    expect(m.depuis).not.toBe(m.jusqua);
    expect(dureeEnHeures(m.depuis, m.jusqua)).toBeGreaterThan(JOURS_HORS_DU_TEMPS * 24);
    expect(honneursDuTemps(
      m.difficulte, dureeEnHeures(m.depuis, m.jusqua), dureeEnHeures(m.cree, m.jusqua),
    )).toEqual([]);
  });
});
