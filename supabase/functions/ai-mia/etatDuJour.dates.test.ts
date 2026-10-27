import { describe, expect, it } from "vitest";
import {
  ECHEANCES_MONTREES, dateCourte, dateLongue, jourCivil, jourSuivant,
  prochainesEcheances, quandDire,
} from "./etatDuJour.ts";

const PARIS = "Europe/Paris";

/* ── LES DATES ───────────────────────────────────────────────── */

describe("jourCivil — le jour de quelqu un, pas celui du serveur", () => {
  /* LE CAS QUI A DONNE SON NOM AU MODULE : un rendez-vous du 27 saisi
     a minuit heure de Paris est enregistre a 22 h UTC le 26. Date en
     UTC, il ressort « 26 ». */
  it("date un instant dans le fuseau demande", () => {
    const minuitAParis = new Date("2026-08-27T00:00:00+02:00");
    expect(jourCivil(minuitAParis, PARIS)).toBe("2026-08-27");
    expect(jourCivil(minuitAParis, "UTC")).toBe("2026-08-26");
  });

  it("ecrit toujours en AAAA-MM-JJ, donc comparable avec ===", () => {
    expect(jourCivil(new Date("2026-01-05T12:00:00Z"), "UTC")).toBe("2026-01-05");
    expect(jourCivil(new Date("2026-12-31T23:00:00Z"), PARIS)).toBe("2027-01-01");
  });

  it("range comme des dates quand on les compare comme du texte", () => {
    const a = jourCivil(new Date("2026-09-09T12:00:00Z"), "UTC");
    const b = jourCivil(new Date("2026-09-10T12:00:00Z"), "UTC");
    expect(a < b).toBe(true);
  });
});

describe("dateCourte et dateLongue", () => {
  it("ecrivent la meme date de deux facons", () => {
    const d = new Date("2026-08-30T09:15:00+02:00");
    expect(dateCourte(d, PARIS)).toBe("30/08/2026");
    expect(dateLongue(d, PARIS)).toBe("dimanche 30 août 2026");
  });

  it("suivent le fuseau, pas le serveur", () => {
    const d = new Date("2026-08-30T23:30:00Z");
    expect(dateCourte(d, "UTC")).toBe("30/08/2026");
    expect(dateCourte(d, "Pacific/Auckland")).toBe("31/08/2026");
  });

  /* L ORDRE JOUR-MOIS-ANNEE VIENT DE LA LOCALE, PAS DE L ORDRE DES
     OPTIONS. Le balayage de mutations a survecu a l echange des cles
     `day` et `month` dans l objet d options : `Intl` les lit comme un
     ensemble, pas comme une suite. Ce qui decide, c est « fr-FR » — et
     cette mutation-la, elle, tombe. */
  it("doit son ordre a la locale, pas a l ordre des options", () => {
    const d = new Date("2026-08-30T09:15:00+02:00");
    const options = { timeZone: PARIS, day: "2-digit", month: "2-digit", year: "numeric" } as const;
    expect(dateCourte(d, PARIS)).toBe("30/08/2026");
    expect(new Intl.DateTimeFormat("fr-FR", options).format(d)).toBe("30/08/2026");
    expect(new Intl.DateTimeFormat("en-US", options).format(d)).toBe("08/30/2026");
  });
});

describe("quandDire — aujourd hui, demain, ou une date", () => {
  const maintenant = new Date("2026-08-30T09:15:00+02:00");

  it("dit aujourd hui pour le meme jour civil", () => {
    expect(quandDire(new Date("2026-08-30T23:59:00+02:00"), maintenant, PARIS)).toBe("aujourd'hui");
    expect(quandDire(new Date("2026-08-30T00:01:00+02:00"), maintenant, PARIS)).toBe("aujourd'hui");
  });

  it("dit demain pour le lendemain", () => {
    expect(quandDire(new Date("2026-08-31T08:00:00+02:00"), maintenant, PARIS)).toBe("demain");
  });

  it("ecrit la date au-dela", () => {
    expect(quandDire(new Date("2026-09-01T08:00:00+02:00"), maintenant, PARIS)).toBe("01/09/2026");
    expect(quandDire(new Date("2026-08-29T08:00:00+02:00"), maintenant, PARIS)).toBe("29/08/2026");
  });

  /* UNE ECHEANCE PASSEE N EST PAS SIGNALEE COMME TELLE : elle s ecrit
     en date, comme une echeance lointaine. Rien ne la distingue. */
  it("ne dit rien de particulier d une echeance depassee", () => {
    expect(quandDire(new Date("2020-01-01T08:00:00Z"), maintenant, PARIS)).toBe("01/01/2020");
  });

  it("change de reponse quand le fuseau change", () => {
    const echeance = new Date("2026-08-31T00:30:00+02:00");
    expect(quandDire(echeance, maintenant, PARIS)).toBe("demain");
    expect(quandDire(echeance, maintenant, "UTC")).toBe("aujourd'hui");
  });
});

describe("jourSuivant — vingt-quatre heures ne font pas toujours un jour", () => {
  it("donne le lendemain un jour ordinaire", () => {
    expect(jourSuivant(new Date("2026-06-15T00:30:00+02:00"), PARIS)).toBe("2026-06-16");
    expect(jourSuivant(new Date("2026-06-15T23:30:00+02:00"), PARIS)).toBe("2026-06-16");
  });

  /* LE JOUR OU L HEURE RECULE, « DEMAIN » VAUT AUJOURD HUI.
   *
   * Le 25 octobre 2026, l heure d hiver rallonge la journee parisienne
   * a vingt-cinq heures. Entre minuit et une heure, ajouter
   * vingt-quatre heures de millisecondes reste dans la MEME journee
   * civile. Consequence exacte, et unique : pendant cette heure-la,
   * une echeance du lendemain s ecrit en date au lieu de « demain ».
   * Jamais un mauvais jour annonce — le premier test, celui du jour
   * meme, passe avant et gagne. */
  it("reste sur le jour meme a l heure d hiver", () => {
    const nuitDHiver = new Date("2026-10-25T00:30:00+02:00");
    expect(jourCivil(nuitDHiver, PARIS)).toBe("2026-10-25");
    expect(jourSuivant(nuitDHiver, PARIS)).toBe("2026-10-25");
    /* Le 26 existe pourtant bien, et il n aura pas droit a « demain ». */
    expect(quandDire(new Date("2026-10-26T09:00:00+01:00"), nuitDHiver, PARIS)).toBe("26/10/2026");
    /* Une heure plus tard, tout est rentre dans l ordre. */
    const plusTard = new Date("2026-10-25T12:00:00+01:00");
    expect(quandDire(new Date("2026-10-26T09:00:00+01:00"), plusTard, PARIS)).toBe("demain");
  });

  /* L ORDRE DES DEUX TESTS COMPTE, ET IL NE COMPTE QUE CETTE
   * HEURE-LA. Pendant l heure ou « demain » vaut le jour meme, une
   * echeance du jour repond aux DEUX conditions. Le test du jour meme
   * passe en premier : elle s annonce « aujourd hui ». Echanger les
   * deux lignes ferait dire « demain » d une echeance qui tombe dans
   * les heures qui viennent — le balayage de mutations y a survecu
   * jusqu a ce que ce test existe. */
  it("dit aujourd hui, pas demain, quand les deux se confondent", () => {
    const nuitDHiver = new Date("2026-10-25T00:30:00+02:00");
    expect(jourSuivant(nuitDHiver, PARIS)).toBe(jourCivil(nuitDHiver, PARIS));
    expect(quandDire(new Date("2026-10-25T20:00:00+01:00"), nuitDHiver, PARIS)).toBe("aujourd'hui");
  });

  it("passe droit au printemps, ou la journee raccourcit", () => {
    const nuitDEte = new Date("2026-03-29T00:30:00+01:00");
    expect(jourCivil(nuitDEte, PARIS)).toBe("2026-03-29");
    expect(jourSuivant(nuitDEte, PARIS)).toBe("2026-03-30");
  });
});

describe("prochainesEcheances", () => {
  const maintenant = new Date("2026-08-30T09:15:00+02:00");
  const taches = [
    { name: "Quatre", deadline: "2026-10-01T09:00:00+02:00" },
    { name: "Un", deadline: "2026-08-30T14:00:00+02:00" },
    { name: "Sans date", deadline: null },
    { name: "Trois", deadline: "2026-09-15T09:00:00+02:00" },
    { name: "Cinq", deadline: "2026-11-01T09:00:00+01:00" },
    { name: "Deux", deadline: "2026-08-31T09:00:00+02:00" },
  ];

  it("range par echeance, pas par ordre d arrivee", () => {
    expect(prochainesEcheances(taches, maintenant, PARIS)).toEqual([
      "Un (aujourd'hui)", "Deux (demain)", "Trois (15/09/2026)", "Quatre (01/10/2026)",
    ]);
  });

  it("s arrete a quatre", () => {
    expect(ECHEANCES_MONTREES).toBe(4);
    expect(prochainesEcheances(taches, maintenant, PARIS)).toHaveLength(4);
    expect(prochainesEcheances(taches, maintenant, PARIS, 2)).toEqual([
      "Un (aujourd'hui)", "Deux (demain)",
    ]);
  });

  /* CINQ N APPARAIT NULLE PART, ET RIEN NE LE DIT. La ligne annonce le
     nombre total de taches, mais la liste s arrete a quatre sans
     « et N autres ». */
  it("laisse tomber la cinquieme sans le dire", () => {
    expect(prochainesEcheances(taches, maintenant, PARIS).join()).not.toContain("Cinq");
  });

  it("ecarte les taches sans echeance de la liste", () => {
    expect(prochainesEcheances(taches, maintenant, PARIS).join()).not.toContain("Sans date");
    expect(prochainesEcheances([{ name: "Rien", deadline: null }], maintenant, PARIS)).toEqual([]);
  });

  /* UNE ECHEANCE VIDE EST UNE ECHEANCE ABSENTE : `Boolean("")` est
     faux, et c est ce qui evite un `new Date("")` — donc un
     « Invalid Date » ecrit tel quel dans le prompt. */
  it("traite une echeance vide comme une echeance absente", () => {
    expect(prochainesEcheances([{ name: "Vide", deadline: "" }], maintenant, PARIS)).toEqual([]);
  });
});
