import { describe, expect, it } from "vitest";
import {
  ALPHABET_BASE32, base32Decode, base32Encode, CHIFFRES_DU_CODE,
  FENETRE_TOTP, hotp, PAS_TOTP, sha256Hex, toBigEndianCounter, totpVerify,
} from "./totp";

const texte = (s: string) => new TextEncoder().encode(s);

describe("base32 — l alphabet de la RFC 4648", () => {
  /* LE DECALER D UNE LETTRE CASSERAIT TOUS LES SECRETS DEJA ENROLLES,
     sans erreur : les applications d authentification liraient
     simplement un autre secret que le notre. */
  it("porte les trente-deux caracteres dans l ordre exact", () => {
    expect(ALPHABET_BASE32).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567");
    expect(ALPHABET_BASE32).toHaveLength(32);
  });

  /* LES VECTEURS DE LA RFC 4648, SECTION 10. */
  it.each([
    ["", ""],
    ["f", "MY"],
    ["fo", "MZXQ"],
    ["foo", "MZXW6"],
    ["foob", "MZXW6YQ"],
    ["fooba", "MZXW6YTB"],
    ["foobar", "MZXW6YTBOI"],
  ])("encode « %s » en « %s »", (clair, encode) => {
    expect(base32Encode(texte(clair))).toBe(encode);
  });

  it("decode ce qu il a encode, pour toute longueur", () => {
    for (let n = 0; n <= 20; n++) {
      const octets = new Uint8Array([...Array(n).keys()].map((i) => (i * 37 + 11) % 256));
      expect([...base32Decode(base32Encode(octets))]).toEqual([...octets]);
    }
  });

  /* ON ACCEPTE CE QUE LES GENS RECOPIENT : minuscules, espaces,
     remplissage, et meme un tiret colle au milieu. */
  it.each(["MZXW6YTBOI", "mzxw6ytboi", "MZXW 6YTB OI", "MZXW6YTBOI======", "MZXW-6YTB-OI"])(
    "decode « %s » comme foobar",
    (saisie) => {
      expect(new TextDecoder().decode(base32Decode(saisie))).toBe("foobar");
    },
  );

  it("rend zero octet pour une saisie sans aucun caractere valide", () => {
    expect(base32Decode("!!!!").length).toBe(0);
  });
});

describe("toBigEndianCounter — gros-boutiste, huit octets", () => {
  /* EN PETIT-BOUTISTE, CHAQUE CODE SERAIT FAUX — et faux de facon
     parfaitement plausible, puisqu il aurait quand meme six
     chiffres. */
  it("ecrit l octet de poids fort en premier", () => {
    expect([...toBigEndianCounter(1)]).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
    expect([...toBigEndianCounter(256)]).toEqual([0, 0, 0, 0, 0, 0, 1, 0]);
  });

  it("fait toujours huit octets", () => {
    for (const c of [0, 1, 4294967295, 4294967296, 1e12]) {
      expect(toBigEndianCounter(c)).toHaveLength(8);
    }
  });

  /* AU-DELA DE QUATRE MILLIARDS, la moitie haute doit se remplir :
     un compteur TOTP y arrive vers l an 6000, mais un compteur HOTP
     y arrive quand on veut. */
  it("passe dans la moitie haute au-dela de 2^32", () => {
    expect([...toBigEndianCounter(0x100000000)]).toEqual([0, 0, 0, 1, 0, 0, 0, 0]);
    expect([...toBigEndianCounter(0xffffffff)]).toEqual([0, 0, 0, 0, 255, 255, 255, 255]);
  });
});

/* ═══════════════════════════════════════════════════════════════
   LES VECTEURS OFFICIELS DE LA RFC 4226, ANNEXE D.

   Le secret est la chaine ASCII « 12345678901234567890 », soit
   GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ en base32. Ces dix codes sont
   publies dans la norme : s ils sortent, notre HOTP est le bon, pas
   seulement « le meme qu avant ».
   ═══════════════════════════════════════════════════════════════ */
const SECRET_RFC = base32Encode(texte("12345678901234567890"));

describe("hotp — les vecteurs de la RFC 4226", () => {
  it("encode le secret de la norme comme la norme", () => {
    expect(SECRET_RFC).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  });

  it.each([
    [0, "755224"], [1, "287082"], [2, "359152"], [3, "969429"], [4, "338314"],
    [5, "254676"], [6, "287922"], [7, "162583"], [8, "399871"], [9, "520489"],
  ])("compteur %i donne %s", async (compteur, attendu) => {
    expect(await hotp(SECRET_RFC, compteur)).toBe(attendu);
  });

  it("rend toujours six chiffres, zeros de tete compris", async () => {
    for (let c = 0; c < 40; c++) {
      expect(await hotp(SECRET_RFC, c)).toMatch(/^\d{6}$/);
    }
  });

  it("rend un autre code pour un autre secret", async () => {
    const autre = base32Encode(texte("09876543210987654321"));
    expect(await hotp(autre, 0)).not.toBe("755224");
  });
});

describe("totpVerify — la fenetre de tolerance", () => {
  const PAS_MS = PAS_TOTP * 1000;
  /* Un instant choisi pour que le compteur tombe rond. */
  const T0 = 59_000_000 * 1000;

  const codeAu = (decalage: number) =>
    hotp(SECRET_RFC, Math.floor(Math.floor((T0 + decalage * PAS_MS) / 1000) / PAS_TOTP));

  it("accepte le code du pas courant", async () => {
    expect(await totpVerify(SECRET_RFC, await codeAu(0), { maintenant: T0 })).toBe(true);
  });

  /* LA FENETRE VA DANS LES DEUX SENS : une horloge en avance est
     aussi frequente qu une horloge en retard. */
  it.each([-1, 1])("accepte le code du pas %i", async (decalage) => {
    expect(await totpVerify(SECRET_RFC, await codeAu(decalage), { maintenant: T0 })).toBe(true);
  });

  it.each([-2, 2, 5])("refuse le code du pas %i", async (decalage) => {
    expect(await totpVerify(SECRET_RFC, await codeAu(decalage), { maintenant: T0 })).toBe(false);
  });

  it("respecte une fenetre plus large quand on la lui donne", async () => {
    expect(await totpVerify(SECRET_RFC, await codeAu(2), { maintenant: T0, window: 2 })).toBe(true);
  });

  it("n accepte plus que le pas courant avec une fenetre nulle", async () => {
    expect(await totpVerify(SECRET_RFC, await codeAu(0), { maintenant: T0, window: 0 })).toBe(true);
    expect(await totpVerify(SECRET_RFC, await codeAu(1), { maintenant: T0, window: 0 })).toBe(false);
  });

  /* SIX CHIFFRES, RIEN D AUTRE. Ce garde est ce qui empeche une
     chaine vide ou un code a rallonge d entrer dans la boucle. */
  it.each(["", "12345", "1234567", "abcdef", "12 34 5", "123456 "])(
    "refuse « %s » sans meme calculer",
    async (saisie) => {
      expect(await totpVerify(SECRET_RFC, saisie, { maintenant: T0 })).toBe(false);
    },
  );

  /* LES ESPACES SONT RETIRES : les applications affichent souvent
     « 123 456 ». */
  it("accepte un code espace au milieu", async () => {
    const code = await codeAu(0);
    const espace = `${code.slice(0, 3)} ${code.slice(3)}`;
    expect(await totpVerify(SECRET_RFC, espace, { maintenant: T0 })).toBe(true);
  });

  it("refuse un code a six chiffres qui n est pas le bon", async () => {
    const code = await codeAu(0);
    const faux = code === "000000" ? "111111" : "000000";
    expect(await totpVerify(SECRET_RFC, faux, { maintenant: T0 })).toBe(false);
  });

  it("garde un pas de trente secondes", () => {
    expect(PAS_TOTP).toBe(30);
    expect(FENETRE_TOTP).toBe(1);
  });
});

describe("sha256Hex", () => {
  /* Le vecteur le plus connu de SHA-256. */
  it("rend l empreinte de la chaine vide", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("rend soixante-quatre caracteres hexadecimaux", async () => {
    expect(await sha256Hex("abc")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("distingue deux entrees voisines", async () => {
    expect(await sha256Hex("123456")).not.toBe(await sha256Hex("123457"));
  });
});
