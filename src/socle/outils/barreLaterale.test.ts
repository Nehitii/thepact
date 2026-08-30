import { describe, expect, it } from "vitest";
import {
  CLE_REPLI, DEPLIEE, debordDe, estRepliee, marqueDeRepli, memeDebord,
  PAGES_SOCIALES, pageSocialeOuverte, pastilleDe, REPLIEE, TOLERANCE_DEBORD,
} from "./barreLaterale";

describe("l etat replie, retenu en texte", () => {
  it("ne se replie que sur « oui »", () => {
    expect(estRepliee(REPLIEE)).toBe(true);
    expect(estRepliee(DEPLIEE)).toBe(false);
  });

  /* TOUT CE QUI N EST PAS EXACTEMENT « oui » VAUT DEPLIE : une valeur
     ecrite par une version anterieure — ou par une main — ne doit pas
     se lire de travers. */
  it.each([null, "", "true", "OUI", "1", "yes", " oui"])(
    "reste depliee pour %s",
    (retenu) => {
      expect(estRepliee(retenu as string | null)).toBe(false);
    },
  );

  it("ecrit l un ou l autre, jamais un booleen", () => {
    expect(marqueDeRepli(true)).toBe("oui");
    expect(marqueDeRepli(false)).toBe("non");
  });

  it("relit ce qu il vient d ecrire", () => {
    for (const v of [true, false]) {
      expect(estRepliee(marqueDeRepli(v))).toBe(v);
    }
  });

  it("garde la cle de rangement", () => {
    expect(CLE_REPLI).toBe("overwrite-barre-repliee");
  });
});

describe("pastilleDe — les quatre apports s additionnent", () => {
  const rien = { demandesAllies: 0, messagesNonLus: 0, boiteDeReception: 0, parModule: {} };
  const comptes = {
    demandesAllies: 3, messagesNonLus: 7, boiteDeReception: 5,
    parModule: { journal: 2, focus: 0 },
  };

  it("ne compte rien pour une entree sans pastille ni module", () => {
    expect(pastilleDe({}, comptes)).toBe(0);
  });

  it("porte les demandes d allies", () => {
    expect(pastilleDe({ badge: "friends" }, comptes)).toBe(3);
  });

  it("porte les messages non lus", () => {
    expect(pastilleDe({ badge: "messages" }, comptes)).toBe(7);
  });

  /* LA BOITE DE RECEPTION ADDITIONNE LES MESSAGES ET LE RESTE : c est
     ce qu elle contient. */
  it("additionne les messages et le reste pour la boite de reception", () => {
    expect(pastilleDe({ badge: "inbox" }, comptes)).toBe(12);
  });

  /* CE N EST PAS UN DOUBLE COMPTAGE : « messages » et « inbox » sont
     deux portes vers la meme chose, sur deux entrees distinctes. */
  it("montre les memes messages sur les deux portes", () => {
    expect(pastilleDe({ badge: "messages" }, comptes)).toBe(7);
    expect(pastilleDe({ badge: "inbox" }, comptes)).toBeGreaterThan(7);
  });

  it("porte le compte d un module", () => {
    expect(pastilleDe({ module: "journal" }, comptes)).toBe(2);
  });

  /* L ADDITION QUI COMPTE EST PASTILLE + MODULE : une entree peut
     porter les deux, et l ecrire en cascade ferait disparaitre le
     second compte sans que rien ne le dise. */
  it("additionne la pastille et le module sur la meme entree", () => {
    expect(pastilleDe({ badge: "friends", module: "journal" }, comptes)).toBe(5);
    expect(pastilleDe({ badge: "inbox", module: "journal" }, comptes)).toBe(14);
  });

  /* EN REVANCHE, LES TROIS BRANCHES DE PASTILLE SONT MUTUELLEMENT
     EXCLUSIVES : `badge` ne porte qu une valeur. Les mettre en
     cascade ne changerait donc rien — le balayage de mutations l a
     montre en laissant survivre exactement cette transformation.
     C est du code domine PAR LA FORME DE LA DONNEE, et ce test le
     fixe : si `badge` devenait une liste, la cascade cesserait
     d etre equivalente. */
  it("ne peut allumer qu une seule branche de pastille a la fois", () => {
    const enCascade = (e: { badge?: string; module?: string }) => {
      let n = 0;
      if (e.badge === "friends") n += comptes.demandesAllies;
      else if (e.badge === "messages") n += comptes.messagesNonLus;
      else if (e.badge === "inbox") n += comptes.messagesNonLus + comptes.boiteDeReception;
      if (e.module && comptes.parModule[e.module]) n += comptes.parModule[e.module];
      return n;
    };
    for (const badge of ["friends", "messages", "inbox", "chimere", undefined]) {
      for (const module of ["journal", "focus", undefined]) {
        expect(pastilleDe({ badge, module }, comptes)).toBe(enCascade({ badge, module }));
      }
    }
  });

  it("ignore un module a zero", () => {
    expect(pastilleDe({ module: "focus" }, comptes)).toBe(0);
  });

  it("ignore un module inconnu", () => {
    expect(pastilleDe({ module: "chimere" }, comptes)).toBe(0);
  });

  it("ignore une pastille inconnue", () => {
    expect(pastilleDe({ badge: "chimere" }, comptes)).toBe(0);
  });

  it("rend zero quand rien n est en attente", () => {
    for (const badge of ["friends", "messages", "inbox"]) {
      expect(pastilleDe({ badge }, rien)).toBe(0);
    }
  });
});

describe("pageSocialeOuverte — le defaut est de garder", () => {
  const tout = { community: true, friends: true, leaderboard: true };
  const rien = { community: false, friends: false, leaderboard: false };

  it.each(Object.keys(PAGES_SOCIALES))("coupe %s quand sa fonction est coupee", (chemin) => {
    expect(pageSocialeOuverte(chemin, tout)).toBe(true);
    expect(pageSocialeOuverte(chemin, rien)).toBe(false);
  });

  it("ne coupe qu une page a la fois", () => {
    const seuleCommunaute = { community: false, friends: true, leaderboard: true };
    expect(pageSocialeOuverte("/community", seuleCommunaute)).toBe(false);
    expect(pageSocialeOuverte("/friends", seuleCommunaute)).toBe(true);
    expect(pageSocialeOuverte("/leaderboard", seuleCommunaute)).toBe(true);
  });

  /* LE DEFAUT EST DE GARDER : une page sociale ajoutee plus tard
     apparaitra sans qu on ait a la declarer ici, ce qui vaut mieux
     que de la voir disparaitre en silence. */
  it.each(["/messages", "/guild/abc", "/", "/une-page-a-venir"])(
    "garde %s, qu aucune fonction ne gouverne",
    (chemin) => {
      expect(pageSocialeOuverte(chemin, rien)).toBe(true);
    },
  );

  it("ne gouverne que trois chemins", () => {
    expect(Object.keys(PAGES_SOCIALES).sort()).toEqual([
      "/community", "/friends", "/leaderboard",
    ]);
  });
});

describe("debordDe — deux pixels de tolerance, et ils servent", () => {
  it("n allume rien quand tout tient", () => {
    expect(debordDe(0, 300, 300)).toEqual({ haut: false, bas: false });
  });

  it("allume le bas quand il reste a descendre", () => {
    expect(debordDe(0, 900, 300)).toEqual({ haut: false, bas: true });
  });

  it("allume le haut quand on a descendu", () => {
    expect(debordDe(600, 900, 300)).toEqual({ haut: true, bas: false });
  });

  it("allume les deux au milieu", () => {
    expect(debordDe(300, 900, 300)).toEqual({ haut: true, bas: true });
  });

  /* UN DEFILEMENT N ATTEINT PRESQUE JAMAIS ZERO NI LE FOND
     EXACTEMENT : les navigateurs rendent des hauteurs
     fractionnaires, et un demi-pixel de reste ferait clignoter
     l ombre du bas en permanence sur un contenu qui tient pourtant. */
  it("ignore un reste sous la tolerance", () => {
    expect(debordDe(0, 301.5, 300).bas).toBe(false);
    expect(debordDe(1.5, 300, 300).haut).toBe(false);
  });

  it("allume juste au-dela de la tolerance", () => {
    expect(TOLERANCE_DEBORD).toBe(2);
    expect(debordDe(0, 302, 300).bas).toBe(false);
    expect(debordDe(0, 302.5, 300).bas).toBe(true);
    expect(debordDe(2, 900, 300).haut).toBe(false);
    expect(debordDe(2.5, 900, 300).haut).toBe(true);
  });

  /* UN DEFILEMENT ELASTIQUE — celui des navigateurs mobiles — donne
     un scrollTop NEGATIF ou un reste negatif. Ni l un ni l autre ne
     doit allumer une ombre. */
  it("n allume rien sur un defilement elastique", () => {
    expect(debordDe(-40, 900, 300).haut).toBe(false);
    expect(debordDe(700, 900, 300).bas).toBe(false);
  });
});

describe("memeDebord", () => {
  it("reconnait deux etats identiques", () => {
    expect(memeDebord({ haut: true, bas: false }, { haut: true, bas: false })).toBe(true);
  });

  it("distingue un changement de l un ou de l autre", () => {
    expect(memeDebord({ haut: true, bas: false }, { haut: false, bas: false })).toBe(false);
    expect(memeDebord({ haut: true, bas: false }, { haut: true, bas: true })).toBe(false);
  });

  /* CE LECTEUR TOURNE A CHAQUE PIXEL DE DEFILEMENT : rendre un objet
     neuf a chaque fois redessinerait la barre entiere mille fois par
     glissement. */
  it("reconnait l egalite sans dependre de l identite de l objet", () => {
    const a = { haut: false, bas: true };
    expect(memeDebord(a, { ...a })).toBe(true);
  });
});
