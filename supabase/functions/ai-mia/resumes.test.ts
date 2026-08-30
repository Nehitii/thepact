import { describe, expect, it } from "vitest";
import {
  PLAFOND_EVENEMENTS, fenetreAutour, fenetreEnArriere, resumeDuFocus,
} from "./resumes.ts";
import { MS_PAR_JOUR, ilYAJours } from "./bornes.ts";

const MAINTENANT = Date.UTC(2026, 8, 15, 14, 30, 0);

describe("la fenetre en arriere", () => {
  it("recule du nombre de jours demande", () => {
    expect(fenetreEnArriere(7, MAINTENANT)).toBe("2026-09-08T14:30:00.000Z");
    expect(fenetreEnArriere(1, MAINTENANT)).toBe("2026-09-14T14:30:00.000Z");
  });

  it("ne recule pas quand on demande zero jour", () => {
    expect(fenetreEnArriere(0, MAINTENANT)).toBe(new Date(MAINTENANT).toISOString());
  });

  /* C EST UN INSTANT, PAS UN JOUR — et l heure est conservee. Une
   * fenetre « sept jours » ne part donc pas de minuit : elle part
   * d il y a sept fois vingt-quatre heures. Une seance d il y a sept
   * jours et une heure en tombe dehors.
   *
   * `pomodoro_sessions.started_at` est un horodatage : comparer une
   * date nue le decalerait d une fraction de journee. */
  it("garde l heure, elle ne remonte pas a minuit", () => {
    expect(fenetreEnArriere(7, MAINTENANT)).toContain("T14:30:00");
    expect(fenetreEnArriere(7, MAINTENANT).endsWith("T00:00:00.000Z")).toBe(false);
  });

  /* L AUTRE FORME EXISTE, ET ELLE EST JUSTE AUSSI : `health_data
     .entry_date` est une DATE, donc sa borne se calcule avec
     `ilYAJours`, qui rend « AAAA-MM-JJ ». Les deux coexistent parce que
     les deux colonnes n ont pas le meme type. */
  it("coexiste avec la borne en jour civil, qui vise une autre colonne", () => {
    expect(ilYAJours(7, MAINTENANT)).toBe("2026-09-08");
    expect(fenetreEnArriere(7, MAINTENANT).slice(0, 10)).toBe(ilYAJours(7, MAINTENANT));
  });

  it("compte les jours en millisecondes pleines", () => {
    const d = Date.parse(fenetreEnArriere(3, MAINTENANT));
    expect(MAINTENANT - d).toBe(3 * MS_PAR_JOUR);
    expect(MS_PAR_JOUR).toBe(86_400_000);
  });
});

describe("la fenetre autour", () => {
  it("ouvre en arriere et en avant", () => {
    const f = fenetreAutour(2, 5, MAINTENANT);
    expect(f.debut).toBe("2026-09-13T14:30:00.000Z");
    expect(f.fin).toBe("2026-09-20T14:30:00.000Z");
  });

  it("se referme sur l instant present quand on ne demande rien", () => {
    const f = fenetreAutour(0, 0, MAINTENANT);
    expect(f.debut).toBe(f.fin);
  });

  /* UNE SEULE LECTURE D HORLOGE POUR LES DEUX BORNES. Le code d avant
     appelait `Date.now()` deux fois — jamais un jour d ecart, mais deux
     sources pour un seul instant, et rien qui puisse etre fige. */
  it("pose les deux bornes sur le meme instant", () => {
    const f = fenetreAutour(3, 3, MAINTENANT);
    expect(Date.parse(f.fin) - Date.parse(f.debut)).toBe(6 * MS_PAR_JOUR);
    expect(Date.parse(f.debut) + 3 * MS_PAR_JOUR).toBe(MAINTENANT);
  });

  it("s inverse si on lui donne des jours negatifs", () => {
    const f = fenetreAutour(-1, -1, MAINTENANT);
    expect(Date.parse(f.debut)).toBeGreaterThan(Date.parse(f.fin));
  });
});

describe("le plafond des evenements", () => {
  /* SOIXANTE, ET LE MODELE NE SAIT PAS QU IL Y EN AVAIT PLUS. La
     requete coupe sans rien dire : au-dela, l agenda rendu est
     incomplet et rien dans la reponse ne l indique. */
  it("est de soixante", () => {
    expect(PLAFOND_EVENEMENTS).toBe(60);
  });
});

describe("le resume du focus", () => {
  const seance = (started_at: string, duration_minutes: number | null) => ({ started_at, duration_minutes });

  it("ne compte rien sur une liste vide", () => {
    expect(resumeDuFocus([])).toEqual({ seances: 0, minutes: 0, par_jour: {} });
  });

  it("additionne les minutes et les range par jour", () => {
    expect(resumeDuFocus([
      seance("2026-09-15T09:00:00Z", 25),
      seance("2026-09-15T11:00:00Z", 50),
      seance("2026-09-14T20:00:00Z", 25),
    ])).toEqual({
      seances: 3,
      minutes: 100,
      par_jour: { "2026-09-15": 75, "2026-09-14": 25 },
    });
  });

  /* UNE SEANCE SANS DUREE COMPTE POUR UNE SEANCE ET ZERO MINUTE. Les
     deux nombres ne disent pas la meme chose, et le modele lit les
     deux : « 3 seances, 50 minutes » est juste, pas contradictoire. */
  it("compte une seance sans duree, sans lui compter de minutes", () => {
    expect(resumeDuFocus([
      seance("2026-09-15T09:00:00Z", 25),
      seance("2026-09-15T10:00:00Z", null),
      seance("2026-09-15T11:00:00Z", 25),
    ])).toEqual({ seances: 3, minutes: 50, par_jour: { "2026-09-15": 50 } });
  });

  it("cree quand meme la journee d une seance sans duree", () => {
    expect(resumeDuFocus([seance("2026-09-15T09:00:00Z", null)]))
      .toEqual({ seances: 1, minutes: 0, par_jour: { "2026-09-15": 0 } });
  });

  /* ═══ LE DECOUPAGE EST EN UTC, PAS DANS LE FUSEAU DE LA PERSONNE ═══
   *
   * `jourDe` coupe les dix premiers caracteres de l horodatage : le
   * jour obtenu est celui de Greenwich. L etat du jour, lui, date les
   * choses dans le fuseau du navigateur.
   *
   * DEUX FRONTIERES DE JOURNEE COEXISTENT DONC POUR LA MEME PERSONNE :
   * a Paris, une seance de 01 h 30 tombe la veille pour ce resume-ci et
   * le jour meme pour l etat du jour. Le TOTAL de minutes reste juste
   * dans tous les cas — seule la repartition bouge. Constate, non
   * corrige. */
  it("range une seance de la nuit parisienne sur la veille", () => {
    /* 01 h 30 a Paris le 15 septembre, soit 23 h 30 UTC le 14. */
    const r = resumeDuFocus([seance("2026-09-14T23:30:00Z", 25)]);
    expect(Object.keys(r.par_jour)).toEqual(["2026-09-14"]);
    expect(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" })
      .format(new Date("2026-09-14T23:30:00Z"))).toBe("2026-09-15");
    /* Le total, lui, ne bouge pas. */
    expect(r.minutes).toBe(25);
  });

  /* UN HORODATAGE MANQUANT DEVIENT UN NOM DE JOURNEE.
     `String(undefined).slice(0, 10)` vaut « undefined », et
     `String(null)` vaut « null » : la journee porte le nom du trou.
     Personne n en produit — la colonne est NOT NULL — mais si cela
     arrivait, le modele recopierait cette journee-la telle quelle. */
  it("nomme la journee d apres le trou quand l horodatage manque", () => {
    expect(resumeDuFocus([{ duration_minutes: 10 }]).par_jour).toEqual({ undefined: 10 });
    expect(resumeDuFocus([{ duration_minutes: 10, started_at: null }]).par_jour).toEqual({ null: 10 });
    expect(resumeDuFocus([{ duration_minutes: 10 }]).minutes).toBe(10);
  });
});
