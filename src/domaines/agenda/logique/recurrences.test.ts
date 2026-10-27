import { describe, expect, it } from "vitest";
import { parseISO } from "date-fns";
import { DAY_MAP, MAX_STEPS, expandRecurrences, makeVirtualOccurrence, rankInWeek } from "./recurrences";
import type { CalendarEvent, RecurrenceRule } from "@/domaines/agenda/types";

/* Un evenement d une heure, le LUNDI 7 septembre 2026 a 10h UTC. Dix
   heures : le jour de la semaine est le meme sur toute l Europe et les
   Ameriques, donc le test ne depend pas du fuseau de la machine. */
const LUNDI = "2026-09-07T10:00:00.000Z";

const evenement = (rule: RecurrenceRule | null, debut = LUNDI, heures = 1): CalendarEvent => ({
  id: "e1", user_id: "u", title: "essai", description: null, location: null,
  start_time: debut,
  end_time: new Date(parseISO(debut).getTime() + heures * 3600_000).toISOString(),
  all_day: false, color: "#fff", category: "perso",
  recurrence_rule: rule, recurrence_parent_id: null, recurrence_exception: false,
  reminders: [], is_busy: true, linked_goal_id: null, linked_todo_id: null, tags: [],
  created_at: debut, updated_at: debut,
});

const fenetre = (du: string, au: string): [Date, Date] => [parseISO(du), parseISO(au)];
const jours = (occ: CalendarEvent[]) => occ.map((o) => o.start_time.slice(0, 10));

describe("le rang d un jour dans la semaine", () => {
  /* LA SEMAINE COMMENCE LE LUNDI. `getDay()` rend zero pour dimanche ;
     ce rang le renvoie en fin de semaine, ou il se lit. */
  it("met lundi en tete et dimanche en queue", () => {
    expect(rankInWeek(1)).toBe(0);
    expect(rankInWeek(2)).toBe(1);
    expect(rankInWeek(6)).toBe(5);
    expect(rankInWeek(0)).toBe(6);
  });

  it("nomme les sept jours comme la regle les ecrit", () => {
    expect(DAY_MAP).toEqual({ SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 });
  });
});

describe("un evenement sans regle", () => {
  it("se rend lui-meme, sans copie", () => {
    const e = evenement(null);
    const [d, f] = fenetre("2026-09-01T00:00:00Z", "2026-09-30T00:00:00Z");
    const occ = expandRecurrences(e, d, f);
    expect(occ).toHaveLength(1);
    expect(occ[0]).toBe(e);
  });

  /* UNE DATE DE DEPART ILLISIBLE NE FAIT PAS DISPARAITRE L EVENEMENT :
     il est rendu tel quel, sans etre deplie. */
  it("se rend lui-meme quand son depart est illisible", () => {
    const e = { ...evenement({ freq: "daily" }), start_time: "pas une date" };
    const [d, f] = fenetre("2026-09-01T00:00:00Z", "2026-09-30T00:00:00Z");
    expect(expandRecurrences(e, d, f)).toEqual([e]);
  });
});

describe("le quotidien", () => {
  it("rend un jour par jour dans la fenetre", () => {
    const occ = expandRecurrences(evenement({ freq: "daily" }),
      ...fenetre("2026-09-07T00:00:00Z", "2026-09-11T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11"]);
  });

  /* ═══ ON NE DEROULE PAS LA SERIE DEPUIS SON ORIGINE ═══
     Un quotidien de 2018 n a pas a couter deux mille tours pour
     afficher un mois de 2026 : on saute au premier rang utile. Le
     saut porte UN RANG DE MARGE, pour absorber les arrondis de fuseau
     et d heure d ete — sans lui, la premiere occurrence de la fenetre
     pourrait manquer a l appel. */
  it("retrouve les bons jours d une serie qui commence des annees plus tot", () => {
    const vieux = evenement({ freq: "daily" }, "2018-03-01T10:00:00.000Z");
    const occ = expandRecurrences(vieux, ...fenetre("2026-09-07T00:00:00Z", "2026-09-09T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-09-08", "2026-09-09"]);
  });

  it("saute un jour sur deux avec un intervalle de deux", () => {
    const occ = expandRecurrences(evenement({ freq: "daily", interval: 2 }),
      ...fenetre("2026-09-07T00:00:00Z", "2026-09-12T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-09-09", "2026-09-11"]);
  });

  /* UN INTERVALLE DE ZERO BOUCLERAIT SUR PLACE, UN NEGATIF REMONTERAIT
     LE TEMPS : les deux valent un. Ce sont DEUX gardes et non une —
     `|| 1` ne rattrape que le zero (et l absence), le plancher rattrape
     le negatif. Les tester ensemble, c est laisser croire qu une seule
     suffit. */
  it("ramene un intervalle nul, negatif ou absent a un", () => {
    const w = fenetre("2026-09-07T00:00:00Z", "2026-09-09T23:59:59Z");
    const attendu = ["2026-09-07", "2026-09-08", "2026-09-09"];
    for (const interval of [0, -2, undefined]) {
      expect(jours(expandRecurrences(evenement({ freq: "daily", interval }), ...w)), String(interval))
        .toEqual(attendu);
    }
  });

  /* LE SAUT NE RECULE PAS AVANT LA NAISSANCE DE LA SERIE. Une fenetre
     ouverte avant le depart donne un rang negatif ; sans le plancher,
     la serie se deroulerait A REBOURS et le calendrier afficherait des
     occurrences d avant l evenement lui-meme. */
  it("ne fabrique rien avant le premier jour de la serie", () => {
    const occ = expandRecurrences(evenement({ freq: "daily" }),
      ...fenetre("2026-09-01T00:00:00Z", "2026-09-09T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-09-08", "2026-09-09"]);
  });
});

describe("ce qui arrete la serie", () => {
  /* `count` COMPTE LES OCCURRENCES DE LA REGLE, pas celles de la
     fenetre : la troisieme et derniere tombe le 9, et demander une
     fenetre plus large n en fait pas apparaitre une quatrieme. */
  it("s arrete au nombre d occurrences declare", () => {
    const occ = expandRecurrences(evenement({ freq: "daily", count: 3 }),
      ...fenetre("2026-09-07T00:00:00Z", "2026-09-30T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-09-08", "2026-09-09"]);
  });

  /* UN COMPTE NUL OU NEGATIF N EST PAS UN COMPTE : la serie est sans
     fin, plutot que vide. Rendre une serie vide effacerait du
     calendrier un evenement que la base decrit. */
  it("ignore un compte nul ou negatif au lieu de tout effacer", () => {
    for (const count of [0, -3]) {
      const occ = expandRecurrences(evenement({ freq: "daily", count }),
        ...fenetre("2026-09-07T00:00:00Z", "2026-09-09T23:59:59Z"));
      expect(jours(occ), String(count)).toEqual(["2026-09-07", "2026-09-08", "2026-09-09"]);
    }
  });

  /* `until` EST INCLUSIF, A LA JOURNEE PRES : la borne est portee a la
     fin du jour, donc une occurrence du 9 a 10h passe encore. */
  it("va jusqu au bout du jour de la borne", () => {
    const occ = expandRecurrences(evenement({ freq: "daily", until: "2026-09-09" }),
      ...fenetre("2026-09-07T00:00:00Z", "2026-09-30T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-09-08", "2026-09-09"]);
  });
});

describe("la fenetre", () => {
  /* UNE OCCURRENCE QUI DEBORDE DANS LA FENETRE Y RESTE. On vise
     l instant ou une occurrence FINIT juste apres le debut de fenetre,
     et non celui ou elle commence : un evenement de trois heures
     commence a 10h la veille chevauche une fenetre qui ouvre a 11h. */
  it("garde une occurrence commencee avant l ouverture mais finie apres", () => {
    const long = evenement({ freq: "daily" }, LUNDI, 3);
    const occ = expandRecurrences(long, ...fenetre("2026-09-08T11:00:00Z", "2026-09-08T23:00:00Z"));
    expect(jours(occ)).toEqual(["2026-09-08"]);
  });

  it("ecarte ce qui finit avant l ouverture", () => {
    const occ = expandRecurrences(evenement({ freq: "daily" }),
      ...fenetre("2026-09-08T12:00:00Z", "2026-09-08T23:00:00Z"));
    expect(occ).toEqual([]);
  });

  /* ═══ POURQUOI LE SAUT RETRANCHE LA DUREE ═══
   *
   * Le premier rang utile se cherche depuis `debutDeFenetre - duree`,
   * et non depuis le debut de fenetre : une occurrence peut avoir
   * commence des jours plus tot et courir encore.
   *
   * Ici, un evenement de CINQUANTE HEURES repete chaque jour. Trois
   * occurrences couvrent le lundi 14 — celles des 12, 13 et 14. Viser
   * le 14 tout court ferait partir le saut deux rangs trop loin, et la
   * marge d un rang n en rattraperait qu un : l occurrence du 12
   * disparaitrait du calendrier sans un mot. */
  it("retrouve les occurrences longues qui couvrent la fenetre sans y commencer", () => {
    const long = evenement({ freq: "daily" }, LUNDI, 50);
    const occ = expandRecurrences(long, ...fenetre("2026-09-14T00:00:00Z", "2026-09-14T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-12", "2026-09-13", "2026-09-14"]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   L HEBDOMADAIRE SUR PLUSIEURS JOURS — LE CAS QUI A DEJA CASSE.

   Le code d avant avancait un curseur par semaines entieres depuis la
   date de depart, puis FILTRAIT sur le jour de la semaine. Le curseur
   retombant toujours sur le jour de depart, une regle « lundi,
   mercredi, vendredi » creee un LUNDI ne produisait que des lundis, et
   creee un MARDI ne produisait rien du tout.
   ═══════════════════════════════════════════════════════════════ */
describe("l hebdomadaire sur plusieurs jours", () => {
  const LMV: RecurrenceRule = { freq: "weekly", byDay: ["MO", "WE", "FR"] };

  it("rend les trois jours de chaque semaine", () => {
    const occ = expandRecurrences(evenement(LMV),
      ...fenetre("2026-09-07T00:00:00Z", "2026-09-18T23:59:59Z"));
    expect(jours(occ)).toEqual([
      "2026-09-07", "2026-09-09", "2026-09-11",
      "2026-09-14", "2026-09-16", "2026-09-18",
    ]);
  });

  /* CREEE UN MARDI, ELLE COMMENCE LE MERCREDI. La semaine d origine ne
     compte que les jours a partir du depart : le lundi passe est
     derriere, le mercredi et le vendredi sont devant. */
  it("commence au premier jour utile quand elle nait en cours de semaine", () => {
    const mardi = evenement(LMV, "2026-09-08T10:00:00.000Z");
    const occ = expandRecurrences(mardi, ...fenetre("2026-09-07T00:00:00Z", "2026-09-16T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-09", "2026-09-11", "2026-09-14", "2026-09-16"]);
  });

  /* L ORDRE EST CELUI DE LA SEMAINE, pas celui ou la regle les ecrit. */
  it("range les jours dans l ordre de la semaine", () => {
    const desordre = evenement({ freq: "weekly", byDay: ["FR", "MO", "WE"] });
    const occ = expandRecurrences(desordre, ...fenetre("2026-09-07T00:00:00Z", "2026-09-13T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-09-09", "2026-09-11"]);
  });

  it("saute une semaine sur deux avec un intervalle de deux", () => {
    const occ = expandRecurrences(evenement({ ...LMV, interval: 2 }),
      ...fenetre("2026-09-07T00:00:00Z", "2026-09-25T23:59:59Z"));
    expect(jours(occ)).toEqual([
      "2026-09-07", "2026-09-09", "2026-09-11",
      "2026-09-21", "2026-09-23", "2026-09-25",
    ]);
  });

  /* LE COMPTE TRAVERSE LES SEMAINES : la semaine d origine peut en
     porter moins que les suivantes, et l arithmetique du rang en tient
     compte. Quatre occurrences depuis un mardi : mer, ven, lun, mer. */
  it("compte les occurrences a travers les semaines, pas par semaine", () => {
    const mardi = evenement({ ...LMV, count: 4 }, "2026-09-08T10:00:00.000Z");
    const occ = expandRecurrences(mardi, ...fenetre("2026-09-07T00:00:00Z", "2026-09-30T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-09", "2026-09-11", "2026-09-14", "2026-09-16"]);
  });

  /* UN JOUR QUE LA TABLE NE CONNAIT PAS EST ECARTE, et les autres
     tiennent : une regle a moitie lisible vaut mieux qu un calendrier
     vide. */
  it("ecarte un jour inconnu sans perdre les autres", () => {
    const occ = expandRecurrences(evenement({ freq: "weekly", byDay: ["MO", "XX", "WE"] }),
      ...fenetre("2026-09-07T00:00:00Z", "2026-09-13T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-09-09"]);
  });

  /* UN JOUR ECRIT DEUX FOIS N EST PAS DEUX RENDEZ-VOUS. */
  it("ne compte qu une fois un jour repete", () => {
    const occ = expandRecurrences(evenement({ freq: "weekly", byDay: ["MO", "MO", "WE"] }),
      ...fenetre("2026-09-07T00:00:00Z", "2026-09-13T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-09-09"]);
  });

  /* LA BORNE S APPLIQUE AU JOUR, PAS A LA SEMAINE. La boucle n arrete
     que des semaines entieres ; c est a l emission que le vendredi
     d une semaine bornee au mercredi est ecarte. Sans cette garde-la,
     la serie deborderait toujours d une semaine. */
  it("s arrete a la borne au milieu d une semaine", () => {
    const occ = expandRecurrences(evenement({ ...LMV, until: "2026-09-09" }),
      ...fenetre("2026-09-07T00:00:00Z", "2026-09-30T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-09-09"]);
  });

  /* MEME PLANCHER QUE POUR LE QUOTIDIEN : une fenetre ouverte avant le
     depart donne un rang de semaine negatif, et la serie se
     deroulerait a rebours. */
  it("ne fabrique rien avant la premiere semaine de la serie", () => {
    const occ = expandRecurrences(evenement(LMV),
      ...fenetre("2026-08-24T00:00:00Z", "2026-09-11T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-09-09", "2026-09-11"]);
  });
});

describe("le mensuel et l annuel", () => {
  it("avance de mois en mois", () => {
    const occ = expandRecurrences(evenement({ freq: "monthly" }),
      ...fenetre("2026-09-01T00:00:00Z", "2026-12-31T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2026-10-07", "2026-11-07", "2026-12-07"]);
  });

  it("avance d annee en annee", () => {
    const occ = expandRecurrences(evenement({ freq: "yearly" }),
      ...fenetre("2026-01-01T00:00:00Z", "2029-12-31T23:59:59Z"));
    expect(jours(occ)).toEqual(["2026-09-07", "2027-09-07", "2028-09-07", "2029-09-07"]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   CINQ MILLE TOURS BORNENT LE TRAVAIL, JAMAIS LA REGLE.

   Confondre les deux faisait disparaitre du calendrier des evenements
   parfaitement valides. La borne s applique aux TOURS DE BOUCLE apres
   le saut au premier rang utile — et comme le saut place le curseur a
   l entree de la fenetre, une fenetre ordinaire n en consomme qu une
   poignee, quel que soit l age de la serie.

   CONSTATE, NON CORRIGE : si une fenetre demandait plus de cinq mille
   occurrences, la serie s arreterait la SANS RIEN DIRE. Il faudrait
   afficher plus de treize ans de quotidien d un coup pour y arriver.
   ═══════════════════════════════════════════════════════════════ */
describe("la borne de travail", () => {
  it("porte le nombre d origine", () => {
    expect(MAX_STEPS).toBe(5000);
  });

  it("ne coute que quelques tours pour une fenetre ordinaire, meme sur une serie ancienne", () => {
    const vieux = evenement({ freq: "daily" }, "2010-01-01T10:00:00.000Z");
    const occ = expandRecurrences(vieux, ...fenetre("2026-09-07T00:00:00Z", "2026-09-13T23:59:59Z"));
    expect(occ).toHaveLength(7);
  });
});

describe("ce qu une occurrence virtuelle porte", () => {
  const e = evenement({ freq: "daily" });

  /* L ORIGINAL N EST RENDU TEL QUEL QUE S IL TOMBE VRAIMENT SUR
     L OCCURRENCE. Une regle « lundi, mercredi, vendredi » creee un
     mardi a pour premiere occurrence un mercredi : la renvoyer comme
     l original l afficherait le mardi, et la rendrait deplacable a
     tort. */
  it("rend l original pour le rang zero qui tombe juste", () => {
    expect(makeVirtualOccurrence(e, parseISO(e.start_time), parseISO(e.end_time), 0)).toBe(e);
  });

  it("fabrique une copie des que l instant differe, meme au rang zero", () => {
    const ailleurs = new Date(parseISO(e.start_time).getTime() + 86_400_000);
    const o = makeVirtualOccurrence(e, ailleurs, ailleurs, 0);
    expect(o).not.toBe(e);
    expect(o._virtual).toBe(true);
  });

  it("porte un identifiant derive et la trace de son original", () => {
    const plusTard = new Date(parseISO(e.start_time).getTime() + 86_400_000);
    const o = makeVirtualOccurrence(e, plusTard, plusTard, 3);
    expect(o.id).toBe("e1_r3");
    expect(o._virtual).toBe(true);
    expect(o._originalStart).toBe(e.start_time);
    expect(o.title).toBe(e.title);
  });

  /* LES OCCURRENCES SUIVANTES SONT DES COPIES, jamais l original : le
     calendrier doit pouvoir les distinguer pour savoir laquelle une
     modification touche. */
  it("ne rend jamais l original au-dela du rang zero", () => {
    const occ = expandRecurrences(e, ...fenetre("2026-09-07T00:00:00Z", "2026-09-09T23:59:59Z"));
    expect(occ[0]).toBe(e);
    expect(occ.slice(1).every((o) => o._virtual === true)).toBe(true);
    expect(occ.map((o) => o.id)).toEqual(["e1", "e1_r1", "e1_r2"]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   TROIS MUTATIONS QUE CES TESTS N ATTRAPENT PAS, ET POURQUOI.

   Balayage du 30/08/2026 : quarante et une mutations, trente-huit
   attrapees. Les trois restantes ne sont pas des trous, et le dire
   evite qu un prochain balayage les prenne pour du code mort.

   1. `if (base >= total) break;` — SUPPRIMEE, LE RESULTAT NE BOUGE PAS.
      La boucle interne porte deja `if (idx >= total) break;`, qui
      empeche toute emission au-dela du compte. Cette garde-ci ne fait
      qu arreter le tour de semaine plus tot : elle borne le TRAVAIL,
      comme `MAX_STEPS`, et rien d autre. Mutation equivalente sur le
      resultat, garde utile sur le cout.

   2. `Math.floor(away / interval) - 1` — LA MARGE D UN RANG NE CHANGE
      AUCUN RESULTAT ATTEIGNABLE. Elle est la pour absorber un arrondi
      de fuseau ou d heure d ete ; je n ai pas su construire le cas ou
      elle sauve une occurrence, et voici pourquoi : `addDays` conserve
      l heure LOCALE et `differenceInCalendarDays` compte des dates
      LOCALES, donc les deux s accordent de part et d autre d un
      changement d heure ; `addMonths` et `addYears`, eux, ne rabotent
      jamais que vers le BAS (31 janvier plus un mois donne le 28
      fevrier). Le saut ne peut donc pas depasser sa cible. La marge
      coute un tour de boucle et couvre un risque que je n ai pas su
      rendre visible : elle reste, et ce paragraphe dit ce qu on sait.

   3. `idx === 0 ? eventStart : advanceFn(...)` — LE RACCOURCI EST
      EXACTEMENT EQUIVALENT. `addDays(d, 0)` rend un instant identique,
      et `makeVirtualOccurrence` compare par `getTime()`, pas par
      identite d objet. Le ternaire dit que le rang zero EST
      l evenement ; il ne le fabrique pas.
   ═══════════════════════════════════════════════════════════════ */
