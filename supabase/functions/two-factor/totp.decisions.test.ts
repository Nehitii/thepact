import { describe, expect, it } from "vitest";
import {
  ALPHABET_BASE32, ALPHABET_SECOURS, base32Decode, base32Encode,
  CHIFFRES_DU_CODE, CODES_DE_SECOURS, CODES_POSSIBLES, codeParCourrielValide,
  DELAI_ENTRE_ENVOIS_MS, DUREE_DU_CODE_MS, envoyeLe, expirationDuCode,
  formaterCodeDeSecours, generate6DigitCode, generateDeviceToken,
  generateRecoveryCodes, hotp, OCTETS_DU_JETON, peutRedemanderUnCode,
  TENTATIVES_MAX, tropDeTentatives,
} from "./totp";

describe("les codes de secours", () => {
  /* L ALPHABET EXCLUT I, O, 0 ET 1 : ils se recopient a la main
     depuis un papier, et ces quatre-la se confondent deux a deux. */
  it("ecarte les quatre caracteres ambigus", () => {
    for (const c of ["I", "O", "0", "1"]) expect(ALPHABET_SECOURS).not.toContain(c);
  });

  /* TRENTE-DEUX CARACTERES, ET C EST CE QUI COMPTE : 256 est un
     multiple exact de 32, donc « octet % 32 » ne favorise aucune
     lettre. Un alphabet de trente-trois biaiserait le tirage. */
  it("compte trente-deux caracteres, ce qui divise 256 sans reste", () => {
    expect(ALPHABET_SECOURS).toHaveLength(32);
    expect(256 % ALPHABET_SECOURS.length).toBe(0);
  });

  it("formate en quatre-quatre-deux", () => {
    expect(formaterCodeDeSecours("ABCDEFGHJK")).toBe("ABCD-EFGH-JK");
  });

  it("en rend dix par defaut, tous au bon format", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(CODES_DE_SECOURS);
    for (const c of codes) expect(c).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{2}$/);
  });

  it("en rend autant qu on demande", () => {
    expect(generateRecoveryCodes(3)).toHaveLength(3);
    expect(generateRecoveryCodes(0)).toHaveLength(0);
  });

  it("n en rend pas deux fois le meme", () => {
    const codes = generateRecoveryCodes(50);
    expect(new Set(codes).size).toBe(50);
  });
});

describe("le jeton d appareil", () => {
  it("fait soixante-quatre caracteres hexadecimaux, soit trente-deux octets", () => {
    expect(OCTETS_DU_JETON).toBe(32);
    expect(generateDeviceToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("n en rend pas deux fois le meme", () => {
    const jetons = [...Array(20)].map(generateDeviceToken);
    expect(new Set(jetons).size).toBe(20);
  });
});

describe("le code a six chiffres par courriel", () => {
  it("fait toujours six chiffres, zeros de tete compris", () => {
    for (let i = 0; i < 200; i++) expect(generate6DigitCode()).toMatch(/^\d{6}$/);
  });

  it("reste dans le million de codes possibles", () => {
    expect(CODES_POSSIBLES).toBe(1000000);
    for (let i = 0; i < 200; i++) {
      expect(Number(generate6DigitCode())).toBeLessThan(CODES_POSSIBLES);
    }
  });

  /* LE BIAIS DU MODULO EST REEL, ET IL EST ECRIT ICI PLUTOT QUE
     SUPPOSE ABSENT : 2^32 n est pas un multiple d un million, donc
     les codes 000000 a 967295 sortent une fois de plus que les
     autres. Une chance sur quatre mille deux cent quatre-vingt-quinze
     — negligeable pour un code a usage unique valable cinq minutes,
     mais ce test dit qu on le sait. */
  it("porte un biais de modulo connu, d une part sur 4295", () => {
    const restes = 2 ** 32 % CODES_POSSIBLES;
    expect(restes).not.toBe(0);
    expect(Math.floor(2 ** 32 / CODES_POSSIBLES)).toBe(4294);
  });
});

describe("ce qui decide si un code par courriel passe", () => {
  const MAINTENANT = 1_700_000_000_000;
  const dansCinqMinutes = new Date(MAINTENANT + DUREE_DU_CODE_MS).toISOString();

  it("accepte un code en attente, correspondant et non expire", () => {
    expect(codeParCourrielValide("abc", "abc", dansCinqMinutes, MAINTENANT)).toBe(true);
  });

  /* TROIS CONDITIONS, ET LES TROIS SONT NECESSAIRES. */
  it("refuse quand aucun code n est en attente", () => {
    expect(codeParCourrielValide("abc", null, dansCinqMinutes, MAINTENANT)).toBe(false);
    expect(codeParCourrielValide("abc", "", dansCinqMinutes, MAINTENANT)).toBe(false);
  });

  it("refuse quand l empreinte ne correspond pas", () => {
    expect(codeParCourrielValide("abc", "def", dansCinqMinutes, MAINTENANT)).toBe(false);
  });

  /* RETIRER CETTE CONDITION RENDRAIT TOUT CODE DEJA UTILISE VALABLE
     POUR TOUJOURS. */
  it("refuse un code expire", () => {
    const ilYAUneMinute = new Date(MAINTENANT - 60_000).toISOString();
    expect(codeParCourrielValide("abc", "abc", ilYAUneMinute, MAINTENANT)).toBe(false);
  });

  it("refuse a la seconde exacte de l expiration", () => {
    const pile = new Date(MAINTENANT).toISOString();
    expect(codeParCourrielValide("abc", "abc", pile, MAINTENANT)).toBe(false);
  });

  it("refuse quand aucune expiration n est posee", () => {
    expect(codeParCourrielValide("abc", "abc", null, MAINTENANT)).toBe(false);
  });

  it("pose une expiration a cinq minutes", () => {
    expect(DUREE_DU_CODE_MS).toBe(5 * 60 * 1000);
    expect(new Date(expirationDuCode(MAINTENANT)).getTime() - MAINTENANT).toBe(DUREE_DU_CODE_MS);
  });
});

describe("tropDeTentatives", () => {
  it("laisse passer les quatre premieres", () => {
    for (let n = 0; n < TENTATIVES_MAX; n++) expect(tropDeTentatives(n)).toBe(false);
  });

  it("bloque a la cinquieme, borne comprise", () => {
    expect(TENTATIVES_MAX).toBe(5);
    expect(tropDeTentatives(5)).toBe(true);
    expect(tropDeTentatives(6)).toBe(true);
  });
});

describe("les six chiffres sont les memes partout", () => {
  it("vaut six pour le code TOTP comme pour le code par courriel", () => {
    expect(CHIFFRES_DU_CODE).toBe(6);
  });
});

describe("peutRedemanderUnCode — un code par minute", () => {
  const MAINTENANT = 1_700_000_000_000;
  const expireDansCinqMinutes = new Date(MAINTENANT + DUREE_DU_CODE_MS).toISOString();

  /* AUCUN CODE EN ATTENTE, AUCUNE ATTENTE : c est le premier envoi. */
  it.each([null, undefined, ""])("laisse passer le premier envoi (%s)", (expire) => {
    expect(peutRedemanderUnCode(expire as string, MAINTENANT)).toBe(true);
  });

  it("refuse dans la minute qui suit un envoi", () => {
    expect(peutRedemanderUnCode(expireDansCinqMinutes, MAINTENANT)).toBe(false);
    expect(peutRedemanderUnCode(expireDansCinqMinutes, MAINTENANT + 59_000)).toBe(false);
  });

  it("laisse passer a la minute exacte", () => {
    expect(peutRedemanderUnCode(expireDansCinqMinutes, MAINTENANT + DELAI_ENTRE_ENVOIS_MS)).toBe(true);
  });

  it("garde un delai d une minute", () => {
    expect(DELAI_ENTRE_ENVOIS_MS).toBe(60_000);
  });

  /* L HEURE D ENVOI SE DEDUIT DE L EXPIRATION en lui retranchant la
     duree de vie du code : elle n est pas stockee. Ce test rend le
     couplage visible — allonger DUREE_DU_CODE_MS sans y penser
     ferait croire que le dernier envoi est plus ancien qu il n est,
     et la limitation cesserait de limiter. */
  it("deduit l heure d envoi de l expiration, moins la duree de vie", () => {
    expect(envoyeLe(expireDansCinqMinutes)).toBe(MAINTENANT);
  });

  it("laisse passer un code deja expire depuis longtemps", () => {
    const vieux = new Date(MAINTENANT - 3_600_000).toISOString();
    expect(peutRedemanderUnCode(vieux, MAINTENANT)).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUE LE BALAYAGE DE MUTATIONS A LAISSE PASSER, ET POURQUOI.

   Six mutations ont survecu au premier balayage. UNE seule etait un
   trou dans les tests ; les cinq autres sont du code domine — des
   gardes qui ne peuvent rien attraper que la ligne suivante
   n attrape deja. Les tests ci-dessous etablissent chaque
   equivalence, pour qu elle reste vraie.
   ═══════════════════════════════════════════════════════════════ */
describe("ce qui est domine, et ce qui ne l est pas", () => {
  const texteB = (s: string) => new TextEncoder().encode(s);

  /* TROU — pour la troisieme fois de cette campagne, un test
     comparait une constante A ELLE-MEME : « dix codes » etait ecrit
     « autant que CODES_DE_SECOURS ». Passer a neuf ne cassait rien. */
  it("rend DIX codes de secours, ecrit en clair", () => {
    expect(CODES_DE_SECOURS).toBe(10);
    expect(generateRecoveryCodes()).toHaveLength(10);
  });

  /* DOMINE — le seuil de la boucle d encodage ne change QUE le
     moment ou les bits sortent, pas lesquels. A cinq bits ils
     sortent tout de suite ; a six, ils attendent l octet suivant et
     ressortent au meme rang, parce que `value` a ete decale d autant.
     La sortie est identique caractere pour caractere. */
  it("encode pareil que le seuil de boucle soit cinq ou six bits", () => {
    const aSix = (bytes: Uint8Array) => {
      let bits = 0, value = 0, out = "";
      for (const b of bytes) {
        value = (value << 8) | b;
        bits += 8;
        while (bits >= 6) { out += ALPHABET_BASE32[(value >>> (bits - 5)) & 31]; bits -= 5; }
      }
      if (bits > 0) out += ALPHABET_BASE32[(value << (5 - bits)) & 31];
      return out;
    };
    for (let n = 0; n <= 24; n++) {
      const octets = new Uint8Array([...Array(n).keys()].map((i) => (i * 53 + 7) % 256));
      expect(base32Encode(octets)).toBe(aSix(octets));
    }
  });

  /* DOMINE — retirer les espaces avant la boucle ne sert a rien :
     l espace n est pas dans l alphabet, donc `indexOf` rend -1 et la
     boucle le saute deja. Le « replace » est du confort de lecture,
     pas une garde. */
  it("ignore les espaces meme sans les retirer d avance", () => {
    const sansNettoyage = (input: string) => {
      let bits = 0, value = 0;
      const out: number[] = [];
      for (const ch of input.toUpperCase()) {
        const idx = ALPHABET_BASE32.indexOf(ch);
        if (idx === -1) continue;
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
      }
      return new Uint8Array(out);
    };
    for (const s of ["MZXW 6YTB OI", "mzxw6ytboi", "MZXW6YTBOI======"]) {
      expect([...base32Decode(s)]).toEqual([...sansNettoyage(s)]);
    }
  });

  /* DOMINE POUR LE RESULTAT, PAS POUR LE COUT — et c est la nuance
     qui compte. Le garde `/^\d{6}$/` ne peut REFUSER que des chaines
     qu aucun HOTP ne peut egaler, puisqu un HOTP fait toujours six
     chiffres : le retirer ne laisse donc entrer personne. Mais sans
     lui, chaque saisie invalide declenche TROIS calculs HMAC au lieu
     de zero. Ce n est pas une garde de justesse, c est une garde de
     cout, et c est pour cela qu on la garde. */
  it("ne peut de toute facon jamais egaler un code non conforme", async () => {
    const secret = base32Encode(texteB("12345678901234567890"));
    for (let c = 0; c < 60; c++) {
      const code = await hotp(secret, c);
      expect(code).toMatch(/^\d{6}$/);
      expect(code).not.toBe("");
      expect(code).not.toHaveLength(5);
    }
  });

  /* DOMINE — « pas de code en attente » est deja attrape par la
     comparaison qui suit : une empreinte SHA-256 fait soixante-quatre
     caracteres et n egale jamais null, undefined ni la chaine vide.
     Le premier garde dit l intention ; il n ajoute pas de refus. */
  it("refuse une empreinte absente meme sans le premier garde", () => {
    const sansPremierGarde = (
      saisie: string,
      attente: string | null | undefined,
      expire: string | null | undefined,
      maintenant: number,
    ) => {
      if (saisie !== attente) return false;
      const expiration = expire ? new Date(expire).getTime() : 0;
      return expiration > maintenant;
    };
    const T = 1_700_000_000_000;
    const futur = new Date(T + 60_000).toISOString();
    for (const attente of [null, undefined, ""]) {
      expect(codeParCourrielValide("abc", attente, futur, T))
        .toBe(sansPremierGarde("abc", attente, futur, T));
    }
  });
});
