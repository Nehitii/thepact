import { describe, expect, it } from "vitest";
import { etatDeLHabitude } from "./basculesDuDossier";
import { statutDUnAvancement, statutDeLaReprise, statutDuRetour } from "./statutDuGeste";

describe("le statut qu un avancement dicte", () => {
  it("rend les trois issues", () => {
    expect(statutDUnAvancement(0, false)).toBe("not_started");
    expect(statutDUnAvancement(1, false)).toBe("in_progress");
    expect(statutDUnAvancement(7, true)).toBe("fully_completed");
  });

  /* « ACHEVE » PASSE AVANT LE COMPTE. Une habitude d un seul jour est
     achevee des le premier coche : si le compte decidait en premier,
     elle resterait « en cours » a jamais. */
  it("laisse « acheve » decider avant le compte", () => {
    expect(statutDUnAvancement(1, true)).toBe("fully_completed");
    expect(statutDUnAvancement(0, true)).toBe("fully_completed");
  });
});

describe("la reprise", () => {
  it("ne connait que deux issues", () => {
    expect(statutDeLaReprise(0)).toBe("not_started");
    expect(statutDeLaReprise(1)).toBe("in_progress");
    expect(statutDeLaReprise(999)).toBe("in_progress");
  });

  /* Une colonne vide vaut zero tenu, pas « on ne sait pas ». */
  it("lit une colonne vide comme un depart", () => {
    expect(statutDeLaReprise(null)).toBe("not_started");
    expect(statutDeLaReprise(undefined)).toBe("not_started");
  });

  /* Un compte negatif n existe pas en base ; s il arrivait, il vaut
     zero et non « en cours ».

     LE BALAYAGE DE MUTATIONS LAISSE UNE SURVIVANTE ICI, ET C EST
     NORMAL : remplacer « ?? 0 » par « ?? -1 » ne change aucun mot
     rendu, puisque la regle ne demande que « plus grand que zero ».
     Toute absence remplacee par un nombre negatif ou nul est
     indiscernable. Mutation equivalente, pas trou de test — et ce
     serait un mauvais echange que d exposer le compte pour l attraper. */
  it("ne prend pas un compte negatif pour un debut de parcours", () => {
    expect(statutDeLaReprise(-3)).toBe("not_started");
    expect(statutDeLaReprise(-1)).toBe(statutDeLaReprise(0));
  });

  /* ═══ REPRENDRE NE REND JAMAIS L HONNEUR ═══
   *
   * Meme avec toutes les etapes tenues, la reprise rend « en cours ».
   * L ecran ne le demande jamais : « Reprendre » ne parait que pour un
   * objectif EN PAUSE, et « arretable » (DossierBandeau) interdit de
   * mettre en pause un objectif deja honore.
   *
   * La branche manquante est donc hors d atteinte PAR UNE CONDITION
   * ECRITE DANS UN AUTRE FICHIER. Ce test est la pour que sa
   * disparition se voie ici. */
  it("rend « en cours » un objectif dont tout est tenu", () => {
    expect(statutDeLaReprise(7)).toBe("in_progress");
    expect(statutDeLaReprise(7)).not.toBe("fully_completed");
  });

  /* LA MEME REGLE, MOINS UNE ISSUE. L habitude et la reprise partagent
     `statutDUnAvancement` : elles s accordent partout ou l habitude
     n est pas achevee, et divergent exactement la ou elle l est. */
  it("s accorde avec la bascule d habitude partout sauf sur l acheve", () => {
    for (let tenus = 0; tenus <= 4; tenus++) {
      const coches = Array.from({ length: 4 }, (_, i) => i < tenus);
      /* duree = 5 : jamais achevee, les deux doivent dire pareil. */
      const enCours = etatDeLHabitude(coches, 4, false, 5);
      expect(enCours.statut).toBe(statutDeLaReprise(enCours.tenus));
    }
    /* duree = 2, deux jours coches : l habitude conclut, la reprise non. */
    const achevee = etatDeLHabitude([true, false], 1, true, 2);
    expect(achevee.statut).toBe("fully_completed");
    expect(statutDeLaReprise(achevee.tenus)).toBe("in_progress");
  });
});

describe("le retour en arriere", () => {
  it("rend le statut d avant tel quel", () => {
    expect(statutDuRetour("in_progress")).toBe("in_progress");
    expect(statutDuRetour("paused")).toBe("paused");
    expect(statutDuRetour("fully_completed")).toBe("fully_completed");
  });

  /* CE REPLI N EST PAS ATTEINT AUJOURD HUI — aucune des 38 lignes du
     compte ne porte de statut nul, mesure le 30/08/2026 — mais la
     colonne `goals.status` est NULLABLE : ce n est pas du code mort.
     La pause et l archivage repondent autrement au meme trou : ils
     n offrent pas de retour du tout. */
  it("choisit « non commence » quand on ne sait plus d ou l on vient", () => {
    expect(statutDuRetour(null)).toBe("not_started");
    expect(statutDuRetour(undefined)).toBe("not_started");
  });

  /* IL NE TRADUIT PAS : un statut herite — `active`, `completed`,
     `cancelled`, les trois etiquettes d avant que l enum porte encore
     et dont la premiere est le DEFAUT DE LA COLONNE — revient tel
     quel. Constate, non corrige : y toucher demande une migration. */
  it("rend un statut herite sans le convertir", () => {
    expect(statutDuRetour("active")).toBe("active");
    expect(statutDuRetour("cancelled")).toBe("cancelled");
  });
});
