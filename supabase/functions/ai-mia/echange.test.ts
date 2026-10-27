import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  AVEU_SANS_TEXTE, TOURS_MAX, aveuDInterruption, citationsUniques, estLeDernierTour,
  metadonneesDuMessage, raisonDeLInterruption, type Action, type Citation,
} from "./echange.ts";

describe("combien de tours", () => {
  /* QUATRE TOURS D OUTILS, CINQ APPELS. Le premier appel se fait hors
     de la boucle ; les tours 0, 1 et 2 rappellent AVEC les outils, le
     tour 3 rappelle SANS. */
  it("retire les outils au quatrieme tour, pas avant", () => {
    expect(TOURS_MAX).toBe(4);
    expect([0, 1, 2].map((t) => estLeDernierTour(t))).toEqual([false, false, false]);
    expect(estLeDernierTour(3)).toBe(true);
  });

  /* Un tour au-dela du plafond reste « le dernier » : la boucle ne doit
     pas se remettre a offrir les outils si elle deborde. */
  it("ne rouvre pas les outils au-dela du plafond", () => {
    expect([4, 5, 40].map((t) => estLeDernierTour(t))).toEqual([true, true, true]);
  });

  /* UN PLAFOND D UN SEUL TOUR RETIRE LES OUTILS TOUT DE SUITE. C est le
     cas limite qui dit que la borne est bien « toursMax - 1 » et non
     « toursMax » : avec 1, le tour 0 est deja le dernier. */
  it("suit le plafond qu on lui donne", () => {
    expect(estLeDernierTour(0, 1)).toBe(true);
    expect(estLeDernierTour(0, 2)).toBe(false);
    expect(estLeDernierTour(1, 2)).toBe(true);
  });
});

describe("pourquoi l echange s est interrompu", () => {
  it("nomme le quota, le credit et la saturation", () => {
    expect(raisonDeLInterruption(429)).toContain("quota du modèle");
    expect(raisonDeLInterruption(402)).toContain("crédit du modèle");
    expect(raisonDeLInterruption(500)).toContain("saturés");
    expect(raisonDeLInterruption(503)).toContain("saturés");
    expect(raisonDeLInterruption(599)).toContain("saturés");
  });

  /* LE STATUT PART DANS LA PHRASE quand rien d autre ne le nomme : sans
     lui, « le modèle a refusé la suite » ne se diagnostique pas. */
  it("porte le statut dans le fourre-tout", () => {
    expect(raisonDeLInterruption(418)).toBe("le modèle a refusé la suite (418).");
    expect(raisonDeLInterruption(0)).toBe("le modèle a refusé la suite (0).");
  });

  /* La borne est 500 INCLUS : 499 n est pas une saturation. */
  it("place la saturation a cinq cents inclus", () => {
    expect(raisonDeLInterruption(499)).toContain("refusé la suite");
    expect(raisonDeLInterruption(500)).toContain("saturés");
  });
});

/* ═══════════════════════════════════════════════════════════════
   LES DEUX ECHELLES NE RECONNAISSENT PAS LES MEMES STATUTS.

   `upstreamErrorMessage` decide la phrase quand le PREMIER appel
   echoue — avant le flux, quand on peut encore rendre un code
   d erreur. `raisonDeLInterruption` decide la clause quand un tour
   ULTERIEUR echoue, une fois le flux ouvert.

   La difference de ton est voulue : l une ouvre une reponse, l autre
   s enchasse dedans. La difference de CLASSIFICATION ne l est pas, et
   ce test la tient : 401 et 403 sont diagnostiques la-bas, ranges au
   fourre-tout ici. Constate, non corrige — le corriger changerait ce
   que lit l utilisateur.
   ═══════════════════════════════════════════════════════════════ */
describe("les deux echelles de statut", () => {
  let amont: (statut: number) => string;

  beforeAll(async () => {
    /* `_shared/ai.ts` lit `Deno.env` des son chargement : sans ce
       leurre, l import jette avant d avoir rien compare. */
    vi.stubGlobal("Deno", { env: { get: () => undefined } });
    amont = (await import("../_shared/ai.ts")).upstreamErrorMessage;
  });

  it("s accordent sur le quota, le credit et la saturation", () => {
    /* Elles ne disent pas les memes mots — elles rangent au meme
       endroit, ce qui est le seul accord qui compte. */
    expect(amont(429)).not.toContain("Erreur du service IA");
    expect(raisonDeLInterruption(429)).not.toContain("refusé la suite");
    expect(amont(402)).toContain("Quota");
    expect(raisonDeLInterruption(402)).not.toContain("refusé la suite");
    expect(amont(500)).toContain("saturés");
    expect(raisonDeLInterruption(500)).toContain("saturés");
  });

  it("divergent sur la cle refusee et la cle revoquee", () => {
    /* 401 : la-bas on sait que la cle est revoquee. */
    expect(amont(401)).toContain("révoquée");
    expect(raisonDeLInterruption(401)).toBe("le modèle a refusé la suite (401).");

    /* 403 : la-bas on sait qu il faut verifier la cle du serveur. */
    expect(amont(403)).toContain("Vérifie la clé API");
    expect(raisonDeLInterruption(403)).toBe("le modèle a refusé la suite (403).");
  });

  it("ne promettent pas le meme delai apres un quota", () => {
    expect(amont(429)).toContain("dans un instant");
    expect(raisonDeLInterruption(429)).toContain("dans une minute");
  });
});

describe("l aveu", () => {
  /* SI DU TEXTE EST DEJA PARTI, on ne peut plus le reprendre : l aveu
     s ajoute a la suite, en italique. Sinon la reponse EST l aveu. */
  it("s ajoute a la suite quand quelque chose a deja ete dit", () => {
    expect(aveuDInterruption("bonjour", "raison")).toBe("\n\n_(interrompue : raison)_");
  });

  it("devient toute la reponse quand rien n a ete dit", () => {
    expect(aveuDInterruption("", "raison")).toBe("Je n'ai pas pu terminer : raison");
  });

  /* UNE ESPACE COMPTE COMME DU TEXTE. C est la chaine vide qui decide,
     pas son contenu apres nettoyage : un fragment d espace deja diffuse
     ne peut pas etre repris non plus. */
  it("traite une espace deja diffusee comme du texte", () => {
    expect(aveuDInterruption(" ", "raison")).toContain("interrompue");
    expect(aveuDInterruption("0", "raison")).toContain("interrompue");
  });

  it("dit le silence plutot que de laisser une bulle vide", () => {
    expect(AVEU_SANS_TEXTE.trim().length).toBeGreaterThan(0);
  });
});

describe("les citations gardees", () => {
  const c = (t: string, i: string, s = "x"): Citation => ({ source_type: t, source_id: i, snippet: s });

  /* LA PREMIERE GAGNE — pas la meilleure. Quatre outils d un meme tour
     peuvent rapporter la meme entree ; on garde l extrait de celui dont
     la reponse est arrivee la premiere. */
  it("garde la premiere et non la derniere", () => {
    const gardees = citationsUniques([c("journal", "1", "premier"), c("journal", "1", "second")]);
    expect(gardees).toHaveLength(1);
    expect(gardees[0].snippet).toBe("premier");
  });

  /* L IDENTITE EST LE COUPLE : deux extraits de la MEME entree n en
     font qu un, deux entrees de tables differentes en font deux. */
  it("distingue par le couple type et identifiant", () => {
    expect(citationsUniques([c("journal", "1"), c("goal", "1")])).toHaveLength(2);
    expect(citationsUniques([c("journal", "1"), c("journal", "2")])).toHaveLength(2);
    expect(citationsUniques([c("journal", "1"), c("journal", "1")])).toHaveLength(1);
  });

  /* LE DEUX-POINTS N EST PAS DECORATIF. Coller le type et
     l identifiant sans separateur confondrait « a » + « bc » avec
     « ab » + « c » : deux sources differentes n en feraient qu une, et
     la seconde disparaitrait de la reponse sans un mot. */
  it("ne confond pas deux couples qui se colleraient pareil", () => {
    expect(citationsUniques([c("a", "bc"), c("ab", "c")])).toHaveLength(2);
  });

  it("garde l ordre d arrivee", () => {
    const gardees = citationsUniques([c("a", "1"), c("b", "1"), c("a", "1"), c("c", "1")]);
    expect(gardees.map((x) => x.source_type)).toEqual(["a", "b", "c"]);
  });
});

describe("ce qu on range dans le message", () => {
  const c = (t: string, i: string): Citation => ({ source_type: t, source_id: i, snippet: "x" });
  const a = (tool: string): Action => ({ tool, status: "ok", label: tool });

  /* RIEN A DIRE VAUT NULL, PAS UN OBJET VIDE : la colonne porte alors
     NULL, et le client teste la presence de l objet. */
  it("rend null quand il n y a ni citation ni action", () => {
    expect(metadonneesDuMessage([], [])).toBeNull();
  });

  it("suffit d une action, ou d une citation", () => {
    expect(metadonneesDuMessage([], [a("x")])).toEqual({ citations: [], actions: [a("x")] });
    expect(metadonneesDuMessage([c("j", "1")], [])).toEqual({ citations: [c("j", "1")], actions: [] });
  });

  it("range les citations deja dedoublonnees", () => {
    const m = metadonneesDuMessage([c("j", "1"), c("j", "1"), c("g", "2")], [a("x")]);
    expect(m?.citations).toHaveLength(2);
    expect(m?.actions).toHaveLength(1);
  });
});
