/* CE QU UNE MINUTERIE INTERROMPUE RAPPORTE EN REVENANT.
 *
 * Ce module lit `localStorage` et decide, seul, combien de minutes de
 * concentration crediter. Ce qu il rend part dans `pomodoro_sessions`
 * — une ligne par cycle — puis dans le compteur `pomodoro_total_minutes`
 * des succes. Il n a jamais eu de test.
 *
 * `localStorage` N EST PAS UNE SOURCE SURE. Le navigateur le rend a
 * qui le lit, et rien ne garantit que son contenu vienne de cette
 * application. `lireSession` est la seule porte : ce qu elle laisse
 * passer devient une ligne en base.
 *
 * L EMPREINTE, PRISE AVANT LA CORRECTION. Elle ne verifiait que la
 * version, la phase et l age — et la troisieme ne tenait pas :
 * `Date.now() - undefined` vaut NaN, `NaN > AGE_MAX_MS` est faux, donc
 * une session SANS `ecritAt` franchissait la limite des douze heures
 * sans jamais la toucher. Le reste n etait pas regarde du tout :
 *
 *   debutCycleAt a zero  ->  29 803 432 minutes creditees, commencant
 *                            le 1er janvier 1970
 *   restant negatif      ->  secondsLeft: -300 rendu tel quel, la ou
 *                            la branche en cours le borne a zero
 *   cycles: 1e9          ->  accepte
 *   totalPhase: null     ->  accepte
 *
 * ET POURTANT RIEN N EST ARRIVE. Les cent quatorze seances reellement
 * enregistrees sur le compte vont de 1 a 45 minutes, moyenne 17,8,
 * aucune avant l an 2000 (releve du 31 aout 2026, lecture seule). Le
 * defaut etait possible, jamais realise : il fallait une ecriture
 * hostile ou corrompue dans le stockage du navigateur.
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  AGE_MAX_MS, AU_REPOS, AVANCES_MAX, CLE_SESSION, RETARD_MAX_MS, cleJour,
  lireSession, oublierSession, restaurer, secondesDePause,
} from "./sessionSauvegardee";

const T = Date.parse("2026-08-31T14:00:00.000Z");
const MIN = 60_000;

/** Une session credible : phase de travail de 25 min, finie a l instant. */
const session = (p: Record<string, unknown> = {}) => ({
  v: 1, phase: "work", finAt: T, restant: 0, totalPhase: 1500, cycles: 0,
  enPause: false, debutCycleAt: T - 25 * MIN, debutSessionISO: "2026-08-31T13:35:00.000Z",
  ecritAt: T - 1000, ...p,
});
const poser = (o: unknown) =>
  localStorage.setItem(CLE_SESSION, typeof o === "string" ? o : JSON.stringify(o));

/* `restaurer` lit l horloge. On la fige plutot que de calculer des
   ecarts a l instant du test, qui rendraient les attentes flottantes. */
const aInstant = <R>(instant: number, f: () => R): R => {
  const vrai = Date.now;
  Date.now = () => instant;
  try { return f(); } finally { Date.now = vrai; }
};

afterEach(() => { localStorage.clear(); });

describe("cleJour : la journee telle qu on la vit", () => {
  it("rend la date LOCALE, et non la date UTC", () => {
    /* Une seance close a 1 h 30 du matin a Paris appartient a ce
       jour-la. Lue en UTC, elle basculait sur la veille : total du
       jour faux et serie rompue pour qui travaille tard. */
    const tz = process.env.TZ;
    process.env.TZ = "Europe/Paris";
    expect(cleJour(new Date("2026-08-31T01:30:00.000Z"))).toBe("2026-08-31");
    expect(cleJour(new Date("2026-01-01T04:00:00.000Z"))).toBe("2026-01-01");
    process.env.TZ = "America/New_York";
    expect(cleJour(new Date("2026-08-31T01:30:00.000Z"))).toBe("2026-08-30");
    expect(cleJour(new Date("2026-01-01T04:00:00.000Z"))).toBe("2025-12-31");
    process.env.TZ = tz;
  });

  it("complete les mois et les jours a deux chiffres", () => {
    expect(cleJour(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(cleJour(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("secondesDePause : la longue tous les quatre cycles", () => {
  it("donne la longue au quatrieme, au huitieme, au douzieme", () => {
    for (const c of [4, 8, 12, 400]) expect(secondesDePause(c, 5, 15), String(c)).toBe(900);
  });

  it("donne la courte partout ailleurs", () => {
    for (const c of [1, 2, 3, 5, 7, 9]) expect(secondesDePause(c, 5, 15), String(c)).toBe(300);
  });

  it("ne prend pas le zero pour un multiple de quatre", () => {
    /* Elle est appelee APRES l incrementation : zero veut dire qu on
       n a pas encore acheve un seul cycle. */
    expect(secondesDePause(0, 5, 15)).toBe(300);
    expect(secondesDePause(-4, 5, 15)).toBe(300);
  });
});

describe("AU_REPOS et les trois bornes", () => {
  it("pose la minuterie a l arret, sur la duree configuree", () => {
    expect(AU_REPOS(25)).toEqual({
      phase: "idle", secondsLeft: 1500, totalPhase: 1500, cycles: 0, enPause: false,
    });
  });

  it("garde ses bornes ecrites en clair", () => {
    expect(AGE_MAX_MS).toBe(12 * 3600_000);
    expect(RETARD_MAX_MS).toBe(2 * 3600_000);
    expect(AVANCES_MAX).toBe(8);
  });
});

describe("lireSession : la porte du stockage", () => {
  it("laisse passer une session credible, telle quelle", () => {
    poser(session());
    expect(aInstant(T, lireSession)).toEqual(session());
  });

  it("rejette ce qui n est pas une session", () => {
    expect(lireSession()).toBeNull();
    for (const brut of ["{{{", "null", '"texte"', "[]", "12"]) {
      poser(brut);
      expect(lireSession(), brut).toBeNull();
    }
  });

  it("rejette une autre version et une phase inconnue", () => {
    for (const p of [{ v: 2 }, { v: undefined }, { phase: "sieste" }, { phase: "idle" }, { phase: null }]) {
      poser(session(p));
      expect(aInstant(T, lireSession), JSON.stringify(p)).toBeNull();
    }
  });

  it("oublie une session de plus de douze heures", () => {
    /* L heure d ecriture recule, et le debut du cycle avec elle : une
       session ecrite il y a onze heures n a pas pu commencer son cycle
       il y a vingt-cinq minutes. */
    const ancienne = (h: number) =>
      session({ ecritAt: T - h * 3600_000, debutCycleAt: T - h * 3600_000 - 25 * MIN });
    poser(ancienne(11));
    expect(aInstant(T, lireSession)).not.toBeNull();
    poser(ancienne(13));
    expect(aInstant(T, lireSession)).toBeNull();
  });

  it("ne se laisse plus contourner la limite des douze heures", () => {
    /* LE DEFAUT CORRIGE. `Date.now() - undefined` vaut NaN et
       `NaN > AGE_MAX_MS` est FAUX : une session sans horodatage
       d ecriture passait la porte sans que la limite s applique.
       Mesure avant : ACCEPTEE. Apres : rejetee. */
    for (const e of [undefined, null, "hier", NaN, Infinity, -1, {}])
      { poser(session({ ecritAt: e })); expect(aInstant(T, lireSession), String(e)).toBeNull(); }
  });

  it("rejette un debut de cycle impossible", () => {
    /* Zero, c est l epoque Unix — et c est ce qui creditait cinquante-
       six ans de concentration. Un debut posterieur a l ecriture est
       tout aussi impossible : un cycle commence avant qu on le note. */
    for (const d of [0, undefined, null, -1, "hier", T + 1])
      { poser(session({ debutCycleAt: d })); expect(aInstant(T, lireSession), String(d)).toBeNull(); }
    poser(session({ debutCycleAt: T - 1000, ecritAt: T - 1000 }));
    expect(aInstant(T, lireSession)).not.toBeNull();
  });

  it("rejette un compte negatif ou qui n est pas un nombre", () => {
    for (const champ of ["restant", "totalPhase", "cycles"])
      for (const v of [-1, null, undefined, "300", NaN, Infinity]) {
        poser(session({ [champ]: v }));
        expect(aInstant(T, lireSession), champ + "=" + String(v)).toBeNull();
      }
  });

  it("accepte une fin absente — c est ainsi qu on note une pause", () => {
    poser(session({ finAt: null, enPause: true }));
    expect(aInstant(T, lireSession)).not.toBeNull();
    for (const f of [undefined, "bientot", -1]) {
      poser(session({ finAt: f }));
      expect(aInstant(T, lireSession), String(f)).toBeNull();
    }
  });

  it("un NaN ecrit dans le stockage ressort en « null », donc en pause", () => {
    /* CONSTATE, PAS CORRIGE, PARCE QUE C EST LE FORMAT QUI LE VEUT.
       `JSON.stringify` rend « null » pour NaN et Infinity, et OMET
       les champs a `undefined`. Sur `finAt`, ou null veut dire
       « en pause », un NaN devient donc indiscernable d une pause —
       aucune verification cote lecture ne peut les separer. Les
       autres champs n ont pas ce probleme : null y est rejete. */
    expect(JSON.parse(JSON.stringify({ a: NaN, b: Infinity, c: undefined })))
      .toEqual({ a: null, b: null });
    poser(session({ finAt: NaN }));
    expect(aInstant(T, lireSession)?.finAt).toBeNull();
    poser(session({ ecritAt: NaN }));
    expect(aInstant(T, lireSession)).toBeNull();
    /* BALAYAGE : remplacer `Number.isFinite` par `!Number.isNaN`
       laisserait passer l infini — et cette mutation SURVIT, parce
       qu aucune session ne peut porter l infini : le format le change
       en null avant la lecture. Le predicat reste le juste, faute de
       pouvoir etre pris en defaut par cette porte-la. */
    poser(session({ ecritAt: Infinity, debutCycleAt: Infinity }));
    expect(aInstant(T, lireSession)).toBeNull();
  });

  it("oublierSession vide la clef sans se plaindre", () => {
    poser(session());
    oublierSession();
    expect(localStorage.getItem(CLE_SESSION)).toBeNull();
    expect(() => oublierSession()).not.toThrow();
  });
});

describe("restaurer : ce qu on retrouve en revenant", () => {
  const vide = {
    etat: AU_REPOS(25), finAt: null, debutCycleAt: 0, debutSessionISO: "", aCrediter: [],
  };

  it("rend une minuterie a l arret quand il n y a rien a reprendre", () => {
    expect(aInstant(T, () => restaurer(25, 5, 15))).toEqual(vide);
    poser(session({ ecritAt: T - 13 * 3600_000 }));
    expect(aInstant(T, () => restaurer(25, 5, 15))).toEqual(vide);
  });

  it("reprend une pause a l identique, sans rien crediter", () => {
    poser(session({ enPause: true, finAt: null, restant: 742, cycles: 2 }));
    const r = aInstant(T, () => restaurer(25, 5, 15));
    expect(r.etat).toEqual({
      phase: "work", secondsLeft: 742, totalPhase: 1500, cycles: 2, enPause: true,
    });
    expect(r.finAt).toBeNull();
    expect(r.aCrediter).toEqual([]);
  });

  it("tient pour une pause toute session sans heure de fin", () => {
    /* Le drapeau et l heure de fin peuvent se contredire ; c est
       l ABSENCE de fin qui tranche, parce qu elle seule dit que rien
       ne s ecoule. */
    poser(session({ enPause: false, finAt: null, restant: 300 }));
    expect(aInstant(T, () => restaurer(25, 5, 15)).etat.enPause).toBe(true);
  });

  it("reprend une phase en cours a la seconde pres, arrondie vers le haut", () => {
    poser(session({ finAt: T + 90_500, cycles: 1 }));
    const r = aInstant(T, () => restaurer(25, 5, 15));
    expect(r.etat).toEqual({
      phase: "work", secondsLeft: 91, totalPhase: 1500, cycles: 1, enPause: false,
    });
    expect(r.finAt).toBe(T + 90_500);
    expect(r.aCrediter).toEqual([]);
  });

  it("oublie tout passe deux heures apres la fin", () => {
    poser(session({ finAt: T - RETARD_MAX_MS - 1000 }));
    expect(aInstant(T, () => restaurer(25, 5, 15))).toEqual(vide);
    expect(localStorage.getItem(CLE_SESSION)).toBeNull();
  });

  it("rattrape la phase achevee juste avant le retour, et la credite", () => {
    poser(session({ finAt: T - MIN, debutCycleAt: T - MIN - 25 * MIN, ecritAt: T - MIN }));
    const r = aInstant(T, () => restaurer(25, 5, 15));
    expect(r.aCrediter).toEqual([
      { minutes: 25, debutISO: new Date(T - 26 * MIN).toISOString(), complet: true },
    ]);
    expect(r.etat).toMatchObject({ phase: "break", totalPhase: 300, cycles: 1, enPause: false });
    expect(r.etat.secondsLeft).toBe(240);
    expect(r.debutCycleAt).toBe(T - MIN);
  });

  it("rejoue les phases une a une, et la quatrieme ouvre la longue pause", () => {
    /* Quatre-vingt-dix minutes d absence : quatre cycles de travail
       franchis, quatre lignes creditees, et la pause qui suit le
       quatrieme est la longue. */
    const finAt = T - 90 * MIN;
    poser(session({ finAt, debutCycleAt: finAt - 25 * MIN, ecritAt: finAt }));
    const r = aInstant(T, () => restaurer(25, 5, 15));
    expect(r.aCrediter).toHaveLength(4);
    expect(r.aCrediter.map((c) => c.minutes)).toEqual([25, 25, 25, 25]);
    expect(r.aCrediter.every((c) => c.complet)).toBe(true);
    expect(r.etat).toMatchObject({ phase: "break", cycles: 4, totalPhase: 900 });
  });

  it("chaque cycle credite part de la fin du precedent", () => {
    const finAt = T - 90 * MIN;
    poser(session({ finAt, debutCycleAt: finAt - 25 * MIN, ecritAt: finAt }));
    const departs = aInstant(T, () => restaurer(25, 5, 15)).aCrediter.map((c) => c.debutISO);
    /* Le premier part du debut enregistre ; les suivants sont espaces
       d un cycle complet — vingt-cinq de travail plus cinq de pause. */
    expect(departs).toEqual([
      new Date(finAt - 25 * MIN).toISOString(),
      new Date(finAt + 5 * MIN).toISOString(),
      new Date(finAt + 35 * MIN).toISOString(),
      new Date(finAt + 65 * MIN).toISOString(),
    ]);
  });

  it("ne rejoue jamais plus de huit phases, mais garde ce qu elles valaient", () => {
    /* Avec des phases d une minute, une demi-heure d absence en
       demanderait trente. On s arrete a huit — et la session est
       oubliee, PARCE QU on ne sait plus ou elle en est. Les quatre
       cycles de travail deja franchis restent dus. */
    const finAt = T - 30 * MIN;
    poser(session({ finAt, debutCycleAt: finAt - MIN, ecritAt: finAt, totalPhase: 60 }));
    const r = aInstant(T, () => restaurer(1, 1, 1));
    expect(r.aCrediter).toHaveLength(AVANCES_MAX / 2);
    expect(r.etat).toEqual(AU_REPOS(1));
    expect(r.finAt).toBeNull();
    expect(localStorage.getItem(CLE_SESSION)).toBeNull();
  });

  it("arrondit la duree creditee au plus proche, et jamais sous la minute", () => {
    /* BALAYAGE : la premiere version de ce test mesurait trente
       secondes — or `round(0,5)` vaut 1, et le plancher comme
       l arrondi rendaient donc la meme chose. Deux mutations y
       survivaient. Il faut des durees qui separent vraiment les trois
       comportements. */
    const credite = (secondes: number) => {
      const finAt = T - 1000;
      poser(session({ finAt, debutCycleAt: finAt - secondes * 1000, ecritAt: finAt, totalPhase: secondes }));
      return aInstant(T, () => restaurer(25, 5, 15)).aCrediter[0].minutes;
    };
    expect(credite(20)).toBe(1);              /* 0,33 : releve au plancher */
    expect(credite(90)).toBe(2);              /* 1,5 monte, il ne descend pas */
    expect(credite(25 * 60 + 40)).toBe(26);   /* 25,67 monte a 26 */
    expect(credite(25 * 60 + 10)).toBe(25);   /* 25,17 reste a 25 */
  });

  it("a l instant EXACT de la fin, la phase est achevee et non en cours", () => {
    /* BALAYAGE : remplacer `maintenant < finAt` par `<=` survivait.
       La milliseconde de bascule est pourtant celle qui compte — le
       minuteur avance des que le restant tombe a zero, et une phase
       rendue « en cours avec zero seconde » ne crediterait rien. */
    poser(session({ finAt: T, debutCycleAt: T - 25 * MIN, ecritAt: T - 1000 }));
    const r = aInstant(T, () => restaurer(25, 5, 15));
    expect(r.etat.phase).toBe("break");
    expect(r.aCrediter).toHaveLength(1);
  });

  it("ne credite plus cinquante-six ans a une session forgee", () => {
    /* LE DEFAUT CORRIGE, MESURE DES DEUX COTES. Avant : une minute
       creditee de 29 803 432 minutes, commencant le 1er janvier 1970,
       ecrite en base et ajoutee au compteur des succes. Apres : la
       session n entre plus. */
    poser(session({ finAt: T - 1000, debutCycleAt: 0 }));
    const r = aInstant(T, () => restaurer(25, 5, 15));
    expect(r.aCrediter).toEqual([]);
    expect(r.etat).toEqual(AU_REPOS(25));
  });

  it("ne rend plus de secondes negatives a une pause forgee", () => {
    poser(session({ enPause: true, finAt: null, restant: -300 }));
    expect(aInstant(T, () => restaurer(25, 5, 15)).etat.secondsLeft).toBe(1500);
  });
});
