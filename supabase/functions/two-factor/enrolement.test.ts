import { describe, expect, it } from "vitest";
import {
  ALGORITHME, EMETTEUR, OCTETS_DU_SECRET, libelleDuCompte, uriDInscription,
} from "./enrolement.ts";
import {
  CHIFFRES_DU_CODE, FENETRE_TOTP, PAS_TOTP, base32Encode, hotp, totpVerify,
} from "./totp.ts";

/** Un secret fixe : vingt octets, comme en produit `begin_enroll`. */
const SECRET = base32Encode(new Uint8Array(Array.from({ length: OCTETS_DU_SECRET }, (_, i) => i + 1)));

const parametres = (uri: string) => {
  const [avant, apres] = uri.split("?");
  return {
    schema: avant.split("//")[0],
    type: avant.split("//")[1].split("/")[0],
    etiquette: avant.split("/").pop() as string,
    ...Object.fromEntries(apres.split("&").map((p) => p.split("="))),
  };
};

describe("l adresse d inscription", () => {
  const uri = uriDInscription(SECRET, "qui@exemple.fr");

  it("porte la forme que les applications savent lire", () => {
    const p = parametres(uri);
    expect(p.schema).toBe("otpauth:");
    expect(p.type).toBe("totp");
    expect(p.secret).toBe(SECRET);
    expect(p.issuer).toBe(EMETTEUR);
  });

  /* L ETIQUETTE ENCODE LE DEUX-POINTS. La convention d origine le
     laisse nu ; les deux formes sont lues, parce que le separateur est
     cherche APRES decodage — et parce que l emetteur est repete en
     parametre `issuer`. */
  it("encode l etiquette entiere, deux-points compris", () => {
    expect(parametres(uri).etiquette).toBe("Pacte%3Aqui%40exemple.fr");
    expect(decodeURIComponent(parametres(uri).etiquette)).toBe("Pacte:qui@exemple.fr");
  });

  it("repete l emetteur en parametre, comme la convention le demande", () => {
    expect(uri).toContain(`issuer=${EMETTEUR}`);
    expect(parametres(uri).etiquette.startsWith(encodeURIComponent(EMETTEUR))).toBe(true);
  });

  /* ═══ L EMPREINTE DE LA COUPE ═══
     Cette chaine est celle que produisait le code d avant, ecrit en
     clair dans `begin_enroll`. L ordre des parametres en fait partie :
     certaines applications lisent la chaine telle quelle plutot que de
     l analyser, et la reordonner serait un changement invisible ici
     mais visible chez elles. */
  it("rend mot pour mot ce que rendait le code d avant", () => {
    expect(uriDInscription("ABCDEFGHIJKLMNOP", "qui@exemple.fr")).toBe(
      "otpauth://totp/Pacte%3Aqui%40exemple.fr?secret=ABCDEFGHIJKLMNOP" +
      "&issuer=Pacte&algorithm=SHA1&digits=6&period=30",
    );
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUE L ADRESSE ANNONCE EST CE QUE LE SERVEUR IMPLEMENTE.

   C est le seul test qui compte vraiment ici. L adresse dit a
   l application quels codes fabriquer ; le serveur, lui, en verifie
   d autres s ils divergent. Un desaccord ne casse RIEN tout de suite :
   les inscriptions deja posees continuent, et seule la personne
   suivante se retrouve avec une application qui produit des codes
   refuses.
   ═══════════════════════════════════════════════════════════════ */
describe("l accord entre ce qui est annonce et ce qui est verifie", () => {
  const p = parametres(uriDInscription(SECRET, "qui@exemple.fr"));

  /* REECRIRE « 6 » ET « 30 » EN CLAIR DANS L ADRESSE SURVIT AU
   * BALAYAGE, ET C EST ATTENDU : aux valeurs d aujourd hui, un six
   * ecrit et un six lu sont le meme caractere, et aucun test ne peut
   * les distinguer.
   *
   * CE QUI EPINGLE LE LIEN, CE SONT LES QUATRE MUTATIONS VOISINES,
   * toutes attrapees : deplacer `PAS_TOTP` a soixante, `CHIFFRES_DU_CODE`
   * a huit, `FENETRE_TOTP` a zero ou deux, ou le hachage a SHA-256. Ce
   * sont exactement les pannes que ce module existe pour empecher — une
   * application qui fabriquerait des codes que le serveur refuse. */
  it("annonce le nombre de chiffres que le code porte", () => {
    expect(p.digits).toBe(String(CHIFFRES_DU_CODE));
    expect(CHIFFRES_DU_CODE).toBe(6);
  });

  it("annonce la periode que le verificateur utilise", () => {
    expect(p.period).toBe(String(PAS_TOTP));
    expect(PAS_TOTP).toBe(30);
  });

  /* L ALGORITHME ANNONCE DOIT ETRE CELUI QUE `hotp` CALCULE. On ne
     peut pas lire le nom depuis la fonction : on le prouve par un
     vecteur officiel de la RFC 4226, qui n est juste qu en HMAC-SHA1.
     Si la cle etait importee avec un autre hachage, ce code changerait
     et le test tomberait. */
  it("annonce l algorithme que le calcul emploie", async () => {
    expect(ALGORITHME).toBe("SHA1");
    const secretRfc = base32Encode(new TextEncoder().encode("12345678901234567890"));
    expect(await hotp(secretRfc, 0)).toBe("755224");
    expect(await hotp(secretRfc, 6)).toBe("287922");
  });

  /* LA BOUCLE ENTIERE : on fabrique le code comme le ferait
     l application qui a lu cette adresse — meme secret, meme periode,
     meme nombre de chiffres — et on le presente au verificateur. */
  it("fabrique un code que le verificateur accepte", async () => {
    const maintenant = Date.UTC(2026, 8, 15, 12, 0, 0);
    const compteur = Math.floor(maintenant / 1000 / Number(p.period));
    const code = await hotp(p.secret, compteur, Number(p.digits));
    expect(code).toMatch(/^[0-9]{6}$/);
    expect(await totpVerify(SECRET, code, { maintenant })).toBe(true);
  });

  /* LA TOLERANCE EST D UN PAS DE CHAQUE COTE — trente secondes avant,
     trente apres. Un code d il y a une minute est refuse. */
  it("accepte le pas d avant et celui d apres, pas au-dela", async () => {
    const maintenant = Date.UTC(2026, 8, 15, 12, 0, 0);
    const compteur = Math.floor(maintenant / 1000 / PAS_TOTP);
    expect(FENETRE_TOTP).toBe(1);
    for (const decalage of [-1, 0, 1]) {
      const code = await hotp(SECRET, compteur + decalage);
      expect(await totpVerify(SECRET, code, { maintenant })).toBe(true);
    }
    for (const decalage of [-2, 2]) {
      const code = await hotp(SECRET, compteur + decalage);
      expect(await totpVerify(SECRET, code, { maintenant })).toBe(false);
    }
  });
});

describe("le secret", () => {
  /* VINGT OCTETS, SOIT CENT SOIXANTE BITS : la longueur de cle que la
     RFC 4226 recommande pour HMAC-SHA1. */
  it("fait cent soixante bits", () => {
    expect(OCTETS_DU_SECRET).toBe(20);
    expect(OCTETS_DU_SECRET * 8).toBe(160);
  });

  /* EN BASE32, VINGT OCTETS FONT TRENTE-DEUX CARACTERES, sans
     remplissage : 160 bits divises par 5 tombent juste. C est ce qui
     evite les « = » de fin, que certaines applications refusent. */
  it("s ecrit en trente-deux caracteres sans remplissage", () => {
    expect(SECRET).toHaveLength(32);
    expect(SECRET).not.toContain("=");
    expect(SECRET).toMatch(/^[A-Z2-7]+$/);
  });
});

describe("le libelle du compte", () => {
  it("prend l adresse quand il y en a une", () => {
    expect(libelleDuCompte("qui@exemple.fr", "id-1")).toBe("qui@exemple.fr");
  });

  it("retombe sur l identifiant quand il n y en a pas", () => {
    expect(libelleDuCompte(null, "id-1")).toBe("id-1");
    expect(libelleDuCompte(undefined, "id-1")).toBe("id-1");
  });

  /* UNE ADRESSE VIDE N EST PAS UNE ABSENCE : `??` ne retient que null
     et undefined. Le libelle serait alors « Pacte: » tout court, et
     deux comptes deviendraient indistinguables dans l application.
     Constate, non corrige — aucun appelant ne passe la chaine vide,
     `user.email` venant d un jeton verifie. */
  it("garde une adresse vide, qui donnerait une etiquette nue", () => {
    expect(libelleDuCompte("", "id-1")).toBe("");
    expect(parametres(uriDInscription(SECRET, "")).etiquette).toBe("Pacte%3A");
  });
});
