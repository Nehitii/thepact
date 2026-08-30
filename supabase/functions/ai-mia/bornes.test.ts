import { describe, expect, it } from "vitest";
import {
  BORNES, ilYAJours, LIMITE_MAX, LIMITE_MIN, jourDe, joursEcoules, joursRestants, limiteDemandee,
  LONGUEUR_EXTRAIT_JOURNAL, LONGUEUR_EXTRAIT_MEMOIRE, LONGUEUR_NOM, MS_PAR_JOUR,
  nombreBorne, nomBorne, texteBorne,
} from "./bornes";

describe("nombreBorne — ce que le modele demande, ecrete", () => {
  const b = { defaut: 7, min: 1, max: 90 };

  it("laisse passer une valeur dans l intervalle", () => {
    expect(nombreBorne(30, b)).toBe(30);
  });

  it("ecrete par le haut et par le bas", () => {
    expect(nombreBorne(1000, b)).toBe(90);
    expect(nombreBorne(-5, b)).toBe(1);
  });

  it("prend le defaut quand rien n est demande", () => {
    expect(nombreBorne(undefined, b)).toBe(7);
    expect(nombreBorne(null, b)).toBe(7);
  });

  /* LE MODELE PEUT RENDRE UN NOMBRE EN CHAINE : « 30 » doit valoir
     trente, pas NaN. */
  it("lit un nombre ecrit en chaine", () => {
    expect(nombreBorne("30", b)).toBe(30);
    expect(nombreBorne("1000", b)).toBe(90);
  });

  /* UN NOMBRE ILLISIBLE RETOMBE SUR LE DEFAUT, pas sur zero ni sur
     NaN : un NaN traverserait jusqu a la requete. */
  it.each(["vingt", "abc", {}, [1, 2], NaN])("retombe sur le defaut pour %s", (brut) => {
    expect(nombreBorne(brut, b)).toBe(7);
  });

  /* MAIS UNE CHAINE VIDE N EST PAS ILLISIBLE : Number("") vaut ZERO,
     et zero est fini. Elle est donc ECRETEE AU MINIMUM, pas ramenee
     au defaut — et un tableau vide fait pareil, pour la meme raison.
     Ce test le constate ; il ne l approuve pas. C est la troisieme
     fois de cette campagne que Number("") vaut zero la ou on
     attendait un refus. */
  it.each(["", [], false])("ecrete au minimum, et non au defaut, pour %s", (brut) => {
    expect(Number(brut)).toBe(0);
    expect(nombreBorne(brut, b)).toBe(b.min);
  });

  it("rend toujours un nombre fini", () => {
    for (const brut of ["vingt", "", [], {}, NaN, Infinity, null, undefined]) {
      expect(Number.isFinite(nombreBorne(brut, b))).toBe(true);
    }
  });

  it("ecrete l infini aux bornes", () => {
    expect(nombreBorne(Infinity, b)).toBe(7);
    expect(nombreBorne(-Infinity, b)).toBe(7);
  });

  it("rend toujours une valeur dans l intervalle", () => {
    for (const brut of [-1e9, 0, 1, 45, 90, 91, 1e9, "x", null, NaN]) {
      const r = nombreBorne(brut, b);
      expect(r).toBeGreaterThanOrEqual(b.min);
      expect(r).toBeLessThanOrEqual(b.max);
    }
  });
});

describe("BORNES — les sept jeux, cote a cote", () => {
  /* LES VOIR ENSEMBLE EST LE SEUL MOYEN DE REMARQUER QU UNE MANQUE. */
  it("porte exactement les sept arguments bornes", () => {
    expect(Object.keys(BORNES).sort()).toEqual([
      "days_ahead", "days_back", "focus_days", "habit_duration_days",
      "health_days", "months", "total_steps",
    ]);
  });

  /* CHAQUE DEFAUT EST DANS SES PROPRES BORNES. Un defaut hors
     intervalle serait ecrete au premier appel, et la valeur annoncee
     au modele dans le schema ne serait pas celle appliquee. */
  it.each(Object.entries(BORNES))("le defaut de %s tient dans ses bornes", (_nom, b) => {
    expect(b.min).toBeLessThanOrEqual(b.defaut);
    expect(b.defaut).toBeLessThanOrEqual(b.max);
  });

  it.each(Object.entries(BORNES))("les bornes de %s sont dans l ordre", (_nom, b) => {
    expect(b.min).toBeLessThan(b.max);
  });

  it("garde les valeurs qui etaient en clair dans le fichier", () => {
    expect(BORNES.total_steps).toEqual({ defaut: 1, min: 1, max: 50 });
    expect(BORNES.habit_duration_days).toEqual({ defaut: 21, min: 7, max: 365 });
    expect(BORNES.focus_days).toEqual({ defaut: 7, min: 1, max: 90 });
    expect(BORNES.health_days).toEqual({ defaut: 14, min: 1, max: 120 });
    expect(BORNES.days_back).toEqual({ defaut: 0, min: 0, max: 90 });
    expect(BORNES.days_ahead).toEqual({ defaut: 14, min: 1, max: 180 });
    expect(BORNES.months).toEqual({ defaut: 3, min: 1, max: 12 });
  });
});

/* ═══════════════════════════════════════════════════════════════
   CINQ OUTILS LAISSENT LE MODELE CHOISIR SANS AUCUNE BORNE.

   Ces tests constatent le trou, ils ne l approuvent pas.
   ═══════════════════════════════════════════════════════════════ */
describe("limiteDemandee — le dernier argument a avoir ete borne", () => {
  /* CE BLOC EPINGLAIT LE TROU ; il epingle maintenant sa fermeture.

     Il tenait quatre faits, tous vrais jusqu au 30/08/2026 : aucun
     plafond, aucun plancher, NaN qui partait dans l URL, et l ecart
     avec `nombreBorne` qui bornait tous les AUTRES arguments du
     fichier. Les quatre sont tombes le jour ou la limite a ete
     bornee — c est ce qu on attend d un test qui epingle un defaut.

     Le detail des regles vit dans listes.test.ts, a cote de la sonde
     qui dit si la liste est coupee. Ici on garde ce qui compte pour
     ce fichier-ci : la limite se comporte enfin comme ses voisines. */
  it("prend le defaut quand rien n est demande", () => {
    expect(limiteDemandee(undefined, 20)).toBe(20);
    expect(limiteDemandee(null, 20)).toBe(20);
  });

  it("lit un nombre ecrit en chaine", () => {
    expect(limiteDemandee("15", 20)).toBe(15);
  });

  /* ELLE SE COMPORTE DESORMAIS COMME `nombreBorne` : le meme brut,
     borne des deux cotes. C est la comparaison qui comptait, et elle
     ne montre plus d ecart. */
  it("borne comme nombreBorne borne les autres", () => {
    const b = { defaut: 20, min: LIMITE_MIN, max: LIMITE_MAX };
    for (const brut of [100000, 1e9, -1, 0, 7, 200, 201]) {
      expect(limiteDemandee(brut, 20), String(brut)).toBe(nombreBorne(brut, b));
    }
  });

  /* SAUF SUR UN POINT, ET C EST VOULU : `nombreBorne` ecrete une
     valeur illisible au defaut lui aussi, mais la limite refuse en
     plus les objets et la chaine vide, que `Number` lirait comme
     zero — donc comme UNE ligne. */
  it("refuse ce que Number lirait comme zero", () => {
    expect(limiteDemandee("", 20)).toBe(20);
    expect(limiteDemandee([], 20)).toBe(20);
    expect(Number("")).toBe(0);
  });
});

describe("texteBorne et nomBorne — deux normalisations pour la meme chose", () => {
  it("coupe a deux cents caracteres", () => {
    expect(LONGUEUR_NOM).toBe(200);
    expect(texteBorne("x".repeat(500))).toHaveLength(200);
    expect(nomBorne("x".repeat(500))).toHaveLength(200);
  });

  it("rend une chaine vide pour une absence", () => {
    expect(texteBorne(undefined)).toBe("");
    expect(nomBorne(null)).toBe("");
  });

  it("convertit ce qui n est pas une chaine", () => {
    expect(texteBorne(42)).toBe("42");
  });

  /* CINQ CREATIONS COUPENT LES BLANCS, DEUX NON — l ajout d une
     ETAPE et la creation d un EVENEMENT. Un titre avec une espace de
     tete part donc en base tel quel pour ces deux-la. Constate, non
     corrige. */
  it("diverge exactement sur les blancs autour", () => {
    expect(nomBorne("  Gammes  ")).toBe("Gammes");
    expect(texteBorne("  Gammes  ")).toBe("  Gammes  ");
  });

  /* LA COUPE SE FAIT APRES LE TRIM POUR L UN, AVANT POUR L AUTRE :
     deux cents caracteres precedes de blancs donnent deux cents
     caracteres d un cote, et cent quatre-vingt-dix-huit de l autre. */
  it("ne coupe pas au meme endroit quand des blancs precedent", () => {
    const saisie = "  " + "x".repeat(300);
    expect(nomBorne(saisie)).toBe("x".repeat(200));
    expect(texteBorne(saisie)).toBe("  " + "x".repeat(198));
  });

  it("porte deux longueurs d extrait distinctes", () => {
    expect(LONGUEUR_EXTRAIT_JOURNAL).toBe(400);
    expect(LONGUEUR_EXTRAIT_MEMOIRE).toBe(220);
    expect(texteBorne("y".repeat(999), LONGUEUR_EXTRAIT_JOURNAL)).toHaveLength(400);
    expect(texteBorne("y".repeat(999), LONGUEUR_EXTRAIT_MEMOIRE)).toHaveLength(220);
  });
});

describe("les jours", () => {
  const JOUR = MS_PAR_JOUR;
  const T = Date.UTC(2026, 7, 30, 12, 0, 0);

  it("compte un jour en millisecondes", () => {
    expect(MS_PAR_JOUR).toBe(86_400_000);
  });

  /* L ECOULE SE TRONQUE, LE RESTANT S ARRONDIT AU-DESSUS : un jour
     commence n est pas un jour ECOULE, mais il est un jour qu il
     RESTE. */
  it("tronque l ecoule et arrondit le restant au-dessus", () => {
    expect(joursEcoules(T - JOUR * 2.7, T)).toBe(2);
    expect(joursRestants(T + JOUR * 2.3, T)).toBe(3);
  });

  it("ne rend jamais un nombre negatif", () => {
    expect(joursEcoules(T + JOUR, T)).toBe(0);
    expect(joursRestants(T - JOUR, T)).toBe(0);
  });

  it("rend zero le jour meme", () => {
    expect(joursEcoules(T, T)).toBe(0);
    expect(joursRestants(T, T)).toBe(0);
  });

  /* PRENDRE LES DEUX DANS LE MEME SENS FERAIT PERDRE OU GAGNER UNE
     JOURNEE AU PACTE SELON L HEURE A LAQUELLE ON REGARDE. */
  it("garde la somme stable sur une journee partielle", () => {
    const debut = T - JOUR * 2.5;
    const fin = T + JOUR * 2.5;
    expect(joursEcoules(debut, T) + joursRestants(fin, T)).toBe(5);
  });

  it("garde le jour civil, sans l heure", () => {
    expect(jourDe("2026-08-30T23:59:59.999Z")).toBe("2026-08-30");
    expect(jourDe("2026-01-01")).toBe("2026-01-01");
  });

  it("remonte de N jours en gardant un jour civil", () => {
    expect(ilYAJours(0, T)).toBe("2026-08-30");
    expect(ilYAJours(1, T)).toBe("2026-08-29");
    expect(ilYAJours(30, T)).toBe("2026-07-31");
  });

  it("traverse un changement d annee", () => {
    expect(ilYAJours(1, Date.UTC(2026, 0, 1, 12))).toBe("2025-12-31");
  });
});

/* ═══════════════════════════════════════════════════════════════
   L ORDRE DES DEUX ECRETAGES EST INOBSERVABLE, ET C EST GARANTI.

   Le balayage de mutations a laisse survivre l inversion de
   `Math.min(max, Math.max(min, n))` en `Math.max(min, Math.min(max,
   n))`. Les deux donnent le meme resultat POUR TOUT n — mais
   seulement TANT QUE min <= max. Le test « les bornes de %s sont dans
   l ordre » plus haut est exactement ce qui rend cette domination
   vraie : le jour ou un jeu de bornes serait inverse, il rougirait le
   premier, et l ordre des ecretages redeviendrait un vrai choix.
   ═══════════════════════════════════════════════════════════════ */
describe("l ordre des ecretages, domine par min <= max", () => {
  const dansLAutreSens = (brut: unknown, b: { defaut: number; min: number; max: number }) => {
    const n = Number(brut ?? b.defaut);
    if (!Number.isFinite(n)) return b.defaut;
    return Math.max(b.min, Math.min(b.max, n));
  };

  it.each(Object.entries(BORNES))("donne la meme chose dans les deux sens pour %s", (_nom, b) => {
    for (const brut of [-1e9, -1, 0, 1, 5, 20, 100, 400, 1e9, "x", null, undefined, NaN]) {
      expect(nombreBorne(brut, b)).toBe(dansLAutreSens(brut, b));
    }
  });

  /* ET VOICI CE QUI ARRIVERAIT SI L ORDRE CESSAIT D ETRE GARANTI :
     avec des bornes inversees, les deux sens divergent. */
  it("diverge des que les bornes sont inversees", () => {
    const inversees = { defaut: 5, min: 90, max: 1 };
    expect(nombreBorne(50, inversees)).toBe(1);
    expect(dansLAutreSens(50, inversees)).toBe(90);
  });
});
