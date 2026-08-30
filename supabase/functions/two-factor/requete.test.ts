import { describe, expect, it } from "vitest";
import {
  DUREE_DE_CONFIANCE_MS,
  JOURS_DE_CONFIANCE,
  LONGUEUR_ETIQUETTE,
  MS_PAR_JOUR,
  appareilEncoreValide,
  etiquetteDuCorps,
  expirationDeLAppareil,
  texteCoupeDuCorps,
  texteDuCorps,
} from "./requete.ts";

describe("texteDuCorps — ce qui arrive du client", () => {
  it("laisse passer une chaine telle quelle", () => {
    expect(texteDuCorps("123456")).toBe("123456");
  });

  it("NE COUPE PAS les blancs : c est le chemin qui trime plus tard", () => {
    expect(texteDuCorps(" 123456 ")).toBe(" 123456 ");
    expect(texteDuCorps("\n123456\t")).toBe("\n123456\t");
  });

  it("rend la chaine vide pour un champ absent", () => {
    expect(texteDuCorps(undefined)).toBe("");
    expect(texteDuCorps(null)).toBe("");
  });

  /* UN CODE ENVOYE COMME NOMBRE EST PERDU, PAS CONVERTI.
     `JSON.parse('{"code":123456}')` rend un nombre, et ce nombre
     devient la chaine vide — donc un refus, pas une comparaison sur
     « 123456 ». C est volontaire : convertir ferait entrer des formes
     qu on n a jamais voulu accepter (`true`, un tableau d un element,
     un objet avec un `toString`). Le prix est qu un client qui
     enverrait un nombre echouerait sans comprendre pourquoi. */
  it("refuse un nombre plutot que de le convertir", () => {
    expect(texteDuCorps(123456)).toBe("");
    expect(texteDuCorps(0)).toBe("");
  });

  it("refuse tout ce qui n est pas une chaine", () => {
    expect(texteDuCorps(true)).toBe("");
    expect(texteDuCorps(["123456"])).toBe("");
    expect(texteDuCorps({ toString: () => "123456" })).toBe("");
  });

  /* LA CHAINE VIDE TRAVERSE SANS RIEN CASSER. C est la raison du
     defaut : les gardes en aval hachent, comparent et mesurent — et
     `undefined` les ferait lever au lieu de refuser. */
  it("rend une valeur que l on peut hacher et mesurer", () => {
    const v = texteDuCorps(undefined);
    expect(typeof v).toBe("string");
    expect(v.length).toBe(0);
  });
});

describe("texteCoupeDuCorps — la lecture qui coupe", () => {
  it("coupe les blancs des deux cotes", () => {
    expect(texteCoupeDuCorps(" 123456 ")).toBe("123456");
    expect(texteCoupeDuCorps("\n\t123456  ")).toBe("123456");
  });

  it("ne coupe pas ce qu il y a au milieu", () => {
    expect(texteCoupeDuCorps(" 123 456 ")).toBe("123 456");
  });

  it("rend la chaine vide pour un champ fait de blancs", () => {
    expect(texteCoupeDuCorps("   ")).toBe("");
  });

  it("refuse un non-texte comme l autre lecture", () => {
    expect(texteCoupeDuCorps(undefined)).toBe("");
    expect(texteCoupeDuCorps(123456)).toBe("");
  });

  /* LES DEUX LECTURES NE S ACCORDENT PAS, ET C EST LE FAIT QU ON
     EPINGLE. `verify` lit `body.code` sans couper puis trime au moment
     de hacher ; `confirm_email_2fa` coupe des la lecture. Les deux
     finissent par accepter le meme code colle avec une espace — mais
     par deux chemins differents, et retirer le trim de l un ne
     casserait que celui-la. */
  it("diverge de texteDuCorps sur un code colle avec une espace", () => {
    const colle = " 123456 ";
    expect(texteDuCorps(colle)).not.toBe(texteCoupeDuCorps(colle));
    expect(texteDuCorps(colle).trim()).toBe(texteCoupeDuCorps(colle));
  });
});

describe("etiquetteDuCorps — le nom d un appareil", () => {
  it("garde une etiquette courte telle quelle", () => {
    expect(etiquetteDuCorps("Portable du bureau")).toBe("Portable du bureau");
  });

  it("coupe a deux cents caracteres", () => {
    const long = "x".repeat(LONGUEUR_ETIQUETTE + 50);
    expect(etiquetteDuCorps(long)).toHaveLength(LONGUEUR_ETIQUETTE);
  });

  it("laisse intacte une etiquette de exactement deux cents", () => {
    const pile = "y".repeat(LONGUEUR_ETIQUETTE);
    expect(etiquetteDuCorps(pile)).toBe(pile);
  });

  it("rend null quand le champ n est pas un texte", () => {
    expect(etiquetteDuCorps(undefined)).toBeNull();
    expect(etiquetteDuCorps(null)).toBeNull();
    expect(etiquetteDuCorps(42)).toBeNull();
  });

  /* L ASYMETRIE EST REELLE : un champ ABSENT vaut `null`, un champ
     PRESENT MAIS VIDE vaut la chaine vide. La colonne accepte les
     deux, et l ecran montrera un appareil sans nom dans un cas, un
     appareil nomme « rien » dans l autre. */
  it("distingue un champ absent d un champ vide", () => {
    expect(etiquetteDuCorps(undefined)).toBeNull();
    expect(etiquetteDuCorps("")).toBe("");
  });

  it("ne coupe pas les blancs de l etiquette", () => {
    expect(etiquetteDuCorps("  Mon PC  ")).toBe("  Mon PC  ");
  });

  /* DEUX CENTS EST UNE DECISION, PAS UNE CONTRAINTE.
     La colonne `device_label` est un `text` sans borne : la base
     accepterait dix mille caracteres sans broncher, et rien hors de ce
     fichier ne remarquerait le passage a 100 ou a 500. Le balayage de
     mutations l a montre — changer le nombre ne faisait tomber aucun
     test tant qu ils ne parlaient qu en `LONGUEUR_ETIQUETTE`. Le
     chiffre est donc epingle ici pour qu on le change expres. */
  it("coupe a deux cents, un nombre que la base n impose pas", () => {
    expect(LONGUEUR_ETIQUETTE).toBe(200);
    expect(etiquetteDuCorps("z".repeat(10_000))).toHaveLength(200);
  });
});

describe("expirationDeLAppareil — trente jours", () => {
  it("pose l expiration trente jours plus loin", () => {
    const t = Date.UTC(2026, 5, 1, 12, 0, 0);
    expect(expirationDeLAppareil(t).getTime() - t).toBe(DUREE_DE_CONFIANCE_MS);
  });

  it("compte bien trente jours de millisecondes", () => {
    expect(DUREE_DE_CONFIANCE_MS).toBe(JOURS_DE_CONFIANCE * MS_PAR_JOUR);
    expect(DUREE_DE_CONFIANCE_MS).toBe(2_592_000_000);
  });

  it("rend une date, que l appelant met en ISO", () => {
    const d = expirationDeLAppareil(Date.UTC(2026, 0, 1));
    expect(d.toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });

  /* TRENTE JOURS DE MILLISECONDES NE FONT PAS TOUJOURS TRENTE JOURS DE
     CALENDRIER. A Paris, un appareil de confiance pose le 10 octobre a
     12 h expire le 9 novembre a 11 h — une heure trop tot — et un pose
     le 10 mars a 12 h expire le 9 avril a 13 h. L ecart est d une
     heure, il est sans consequence ici, et il est ecrit pour qu on ne
     le prenne pas un jour pour un bogue. */
  it("glisse d une heure au changement d heure", () => {
    const heureDeParis = (t: number | Date) =>
      new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit" })
        .format(t).replace(/[^0-9]/g, "");
    const automne = Date.parse("2026-10-10T12:00:00+02:00");
    const printemps = Date.parse("2026-03-10T12:00:00+01:00");
    expect(heureDeParis(automne)).toBe("12");
    expect(heureDeParis(expirationDeLAppareil(automne))).toBe("11");
    expect(heureDeParis(printemps)).toBe("12");
    expect(heureDeParis(expirationDeLAppareil(printemps))).toBe("13");
  });
});

describe("appareilEncoreValide — trois conditions", () => {
  const maintenant = Date.UTC(2026, 5, 1, 12, 0, 0);
  const plusTard = new Date(maintenant + 1000).toISOString();
  const plusTot = new Date(maintenant - 1000).toISOString();

  it("accepte une ligne complete et encore fraiche", () => {
    expect(appareilEncoreValide({ id: "abc", expires_at: plusTard }, maintenant)).toBe(true);
  });

  it("refuse une ligne absente", () => {
    expect(appareilEncoreValide(null, maintenant)).toBe(false);
    expect(appareilEncoreValide(undefined, maintenant)).toBe(false);
  });

  /* SANS IDENTIFIANT, RIEN A METTRE A JOUR. L appelant enchaine sur un
     `update().eq("id", data.id)` : accepter ici sans identifiant
     ferait un appareil reconnu que l on ne saurait plus dater. */
  it("refuse une ligne sans identifiant", () => {
    expect(appareilEncoreValide({ expires_at: plusTard }, maintenant)).toBe(false);
    expect(appareilEncoreValide({ id: null, expires_at: plusTard }, maintenant)).toBe(false);
    expect(appareilEncoreValide({ id: "", expires_at: plusTard }, maintenant)).toBe(false);
  });

  it("refuse une ligne sans expiration", () => {
    expect(appareilEncoreValide({ id: "abc" }, maintenant)).toBe(false);
    expect(appareilEncoreValide({ id: "abc", expires_at: null }, maintenant)).toBe(false);
  });

  it("refuse une ligne expiree", () => {
    expect(appareilEncoreValide({ id: "abc", expires_at: plusTot }, maintenant)).toBe(false);
  });

  /* LA COMPARAISON EST STRICTE : a la milliseconde exacte de
     l expiration, l appareil n est deja plus de confiance. */
  it("refuse une ligne qui expire a la milliseconde presente", () => {
    const pile = new Date(maintenant).toISOString();
    expect(appareilEncoreValide({ id: "abc", expires_at: pile }, maintenant)).toBe(false);
  });

  /* UNE DATE ILLISIBLE FAIT TOMBER DU BON COTE. `new Date("n importe
     quoi").getTime()` vaut NaN, et toute comparaison avec NaN est
     fausse : l appareil redemande un second facteur au lieu d ouvrir. */
  it("refuse une expiration illisible", () => {
    expect(appareilEncoreValide({ id: "abc", expires_at: "pas une date" }, maintenant)).toBe(false);
    expect(appareilEncoreValide({ id: "abc", expires_at: "" }, maintenant)).toBe(false);
  });

  it("suit le temps qui passe", () => {
    const expire = new Date(maintenant + 60_000).toISOString();
    expect(appareilEncoreValide({ id: "abc", expires_at: expire }, maintenant)).toBe(true);
    expect(appareilEncoreValide({ id: "abc", expires_at: expire }, maintenant + 59_999)).toBe(true);
    expect(appareilEncoreValide({ id: "abc", expires_at: expire }, maintenant + 60_000)).toBe(false);
  });

  /* LA DEUXIEME GARDE NE CHANGE RIEN, ET ON LA GARDE QUAND MEME.
   *
   * Le balayage de mutations a survecu a la suppression de
   * `if (!ligne.expires_at) return false;`. Ce n est pas un trou dans
   * les tests : c est du code DOMINE par l arithmetique qui suit.
   * `new Date(undefined).getTime()` vaut NaN et `new Date(null)
   * .getTime()` vaut 0 — et ni NaN ni 0 ne sont strictement superieurs
   * a un instant reel. La garde dit l intention ; elle ne decide rien.
   *
   * CE QUI LA RENDRAIT VIVANTE : un instant negatif, c est-a-dire une
   * horloge posee avant 1970, ou `0 > maintenant` deviendrait vrai et
   * une ligne sans expiration passerait. Aucun appelant ne fait cela —
   * l unique appel passe `Date.now()`. Le test ci-dessous prouve
   * l equivalence sur tout le reste, et montre le seul point ou elle
   * cesse de tenir. */
  it("a une deuxieme garde que l arithmetique rend inutile", () => {
    const sansLaGarde = (ligne: { id?: string | null; expires_at?: string | null } | null, t: number) => {
      if (!ligne?.id) return false;
      return new Date(ligne.expires_at as string).getTime() > t;
    };
    const lignes = [
      { id: "abc", expires_at: null },
      { id: "abc", expires_at: "" },
      { id: "abc" },
      { id: "abc", expires_at: plusTard },
      { id: "abc", expires_at: plusTot },
    ];
    for (const ligne of lignes) {
      expect(appareilEncoreValide(ligne, maintenant)).toBe(sansLaGarde(ligne, maintenant));
    }
    /* Le seul ecart, et il demande une horloge d avant 1970. */
    expect(appareilEncoreValide({ id: "abc", expires_at: null }, -1)).toBe(false);
    expect(sansLaGarde({ id: "abc", expires_at: null }, -1)).toBe(true);
  });

  /* CE QUE POSE `expirationDeLAppareil` EST ACCEPTE PAR
     `appareilEncoreValide` PENDANT TRENTE JOURS, ET PAS UNE
     MILLISECONDE DE PLUS. Les deux moities du meme accord. */
  it("s accorde avec l expiration qu on vient de poser", () => {
    const pose = expirationDeLAppareil(maintenant).toISOString();
    const ligne = { id: "abc", expires_at: pose };
    expect(appareilEncoreValide(ligne, maintenant)).toBe(true);
    expect(appareilEncoreValide(ligne, maintenant + DUREE_DE_CONFIANCE_MS - 1)).toBe(true);
    expect(appareilEncoreValide(ligne, maintenant + DUREE_DE_CONFIANCE_MS)).toBe(false);
  });
});
