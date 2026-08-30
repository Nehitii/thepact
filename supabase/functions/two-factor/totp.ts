/* LE CŒUR DU SECOND FACTEUR, SANS RIEN AUTOUR.
 *
 * Base32, HOTP, TOTP, et les quatre generateurs. Tout ce fichier est
 * PUR ou ne depend que de `crypto` : aucun import Deno, aucun acces
 * a la base, aucune variable d environnement. C est ce qui le rend
 * testable — et c est la seule raison pour laquelle il est separe de
 * `index.ts`, qui, lui, ne peut pas l etre.
 *
 * Ces fonctions decident si quelqu un entre. Un decalage d un cran
 * dans la fenetre TOTP, un alphabet base32 dans le mauvais ordre, un
 * compteur ecrit en petit-boutiste : dans les trois cas le code juste
 * est refuse ou le code faux est accepte, et rien ne le dit.
 */

/* L ALPHABET DE LA RFC 4648, DANS SON ORDRE EXACT. Le decaler d une
   lettre casserait tous les secrets deja enrolles, sans erreur : les
   applications d authentification liraient simplement un autre
   secret que le notre. */
export const ALPHABET_BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET_BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  /* LE RESTE EST COMPLETE A DROITE PAR DES ZEROS. Sans ce dernier
     caractere, les bits d un octet incomplet seraient perdus, et le
     secret encode ne se decoderait pas en lui-meme. */
  if (bits > 0) output += ALPHABET_BASE32[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Uint8Array {
  /* ON ACCEPTE LES MINUSCULES, LES ESPACES ET LE REMPLISSAGE : c est
     ce que les gens recopient depuis leur application. */
  const clean = input.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");

  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = ALPHABET_BASE32.indexOf(ch);
    /* UN CARACTERE HORS ALPHABET EST IGNORE, pas refuse : un secret
       colle avec un tiret reste lisible. */
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* LE COMPTEUR EST ECRIT EN GROS-BOUTISTE SUR HUIT OCTETS, comme
   l exige la RFC 4226. En petit-boutiste, chaque code serait faux —
   et faux de facon parfaitement plausible, puisqu il aurait quand
   meme six chiffres. */
export function toBigEndianCounter(counter: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  const hi = Math.floor(counter / 0x100000000);
  const lo = counter >>> 0;
  view.setUint32(0, hi);
  view.setUint32(4, lo);
  return new Uint8Array(buf);
}

export const CHIFFRES_DU_CODE = 6;

export async function hotp(
  secretB32: string,
  counter: number,
  digits = CHIFFRES_DU_CODE,
): Promise<string> {
  const keyBytes = base32Decode(secretB32);
  const keyBuf = new ArrayBuffer(keyBytes.length);
  new Uint8Array(keyBuf).set(keyBytes);

  const counterBytes = toBigEndianCounter(counter);
  const counterBuf = new ArrayBuffer(counterBytes.length);
  new Uint8Array(counterBuf).set(counterBytes);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, counterBuf);
  const hmac = new Uint8Array(sig);

  /* LA TRONCATURE DYNAMIQUE DE LA RFC 4226. Le dernier demi-octet du
     HMAC designe ou lire les quatre octets du code, et le bit de
     poids fort est masque pour que le nombre reste positif — sans ce
     masque, un HMAC sur deux donnerait un code negatif. */
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (binCode % 10 ** digits).toString().padStart(digits, "0");
}

/** Trente secondes par pas, un pas de tolerance de chaque cote. */
export const PAS_TOTP = 30;
export const FENETRE_TOTP = 1;

export async function totpVerify(
  secretB32: string,
  code: string,
  opts?: { step?: number; window?: number; maintenant?: number },
): Promise<boolean> {
  const step = opts?.step ?? PAS_TOTP;
  const window = opts?.window ?? FENETRE_TOTP;
  const normalized = code.replace(/\s+/g, "");
  /* SIX CHIFFRES, RIEN D AUTRE. Ce garde est ce qui empeche une
     chaine vide ou un code a rallonge d entrer dans la boucle. */
  if (!/^\d{6}$/.test(normalized)) return false;

  const maintenant = opts?.maintenant ?? Date.now();
  const counter = Math.floor(Math.floor(maintenant / 1000) / step);
  /* LA FENETRE VA DANS LES DEUX SENS : une horloge en avance est
     aussi frequente qu une horloge en retard. */
  for (let w = -window; w <= window; w++) {
    if ((await hotp(secretB32, counter + w, CHIFFRES_DU_CODE)) === normalized) return true;
  }
  return false;
}

/* L ALPHABET DES CODES DE SECOURS EXCLUT I, O, 0 ET 1 : ils se
   recopient a la main depuis un papier, et ces quatre-la se
   confondent deux a deux.
   TRENTE-DEUX CARACTERES, ET C EST CE QUI COMPTE : 256 est un
   multiple exact de 32, donc « octet % 32 » ne favorise aucune
   lettre. Un alphabet de trente-trois biaiserait le tirage. */
export const ALPHABET_SECOURS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODES_DE_SECOURS = 10;
export const OCTETS_PAR_CODE = 10;

export function formaterCodeDeSecours(brut: string): string {
  return `${brut.slice(0, 4)}-${brut.slice(4, 8)}-${brut.slice(8, 10)}`;
}

export function generateRecoveryCodes(count = CODES_DE_SECOURS): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(OCTETS_PAR_CODE));
    let raw = "";
    for (const b of bytes) raw += ALPHABET_SECOURS[b % ALPHABET_SECOURS.length];
    codes.push(formaterCodeDeSecours(raw));
  }
  return codes;
}

export const OCTETS_DU_JETON = 32;

export function generateDeviceToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(OCTETS_DU_JETON));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* UN CODE A SIX CHIFFRES TIRE SUR QUATRE OCTETS.
 *
 * « nombre % 1000000 » sur 2^32 valeurs N EST PAS UNIFORME : 2^32
 * vaut 4294 millions et des poussieres, donc les codes 000000 a
 * 967295 sortent une fois de plus que les autres. L ecart est d une
 * chance sur quatre mille deux cent quatre-vingt-quinze — negligeable
 * pour un code a usage unique valable cinq minutes, mais c est un
 * biais, et il vaut mieux qu il soit ecrit que suppose absent. */
export const CODES_POSSIBLES = 1000000;

export function generate6DigitCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return (num % CODES_POSSIBLES).toString().padStart(CHIFFRES_DU_CODE, "0");
}

/* ── CE QUI DECIDE SI UN CODE PAR COURRIEL PASSE ─────────────── */

/** Cinq essais, puis il faut demander un nouveau code. */
export const TENTATIVES_MAX = 5;

export function tropDeTentatives(tentatives: number): boolean {
  return tentatives >= TENTATIVES_MAX;
}

/** Un code par courriel vit cinq minutes. */
export const DUREE_DU_CODE_MS = 5 * 60 * 1000;

export function expirationDuCode(maintenant: number): string {
  return new Date(maintenant + DUREE_DU_CODE_MS).toISOString();
}

/* TROIS CONDITIONS, ET LES TROIS SONT NECESSAIRES : il faut qu un
   code soit en attente, que son empreinte corresponde, et qu il ne
   soit pas expire. Retirer la troisieme rendrait tout code deja
   utilise valable pour toujours. */
export function codeParCourrielValide(
  empreinteSaisie: string,
  empreinteEnAttente: string | null | undefined,
  expireLe: string | null | undefined,
  maintenant: number,
): boolean {
  if (!empreinteEnAttente) return false;
  if (empreinteSaisie !== empreinteEnAttente) return false;
  const expiration = expireLe ? new Date(expireLe).getTime() : 0;
  return expiration > maintenant;
}

/* ON NE PEUT REDEMANDER UN CODE QU UNE FOIS PAR MINUTE.
 *
 * L HEURE D ENVOI N EST PAS STOCKEE : elle se DEDUIT de l expiration
 * en lui retranchant la duree de vie du code. Ce calcul est donc
 * couple a DUREE_DU_CODE_MS — allonger la vie d un code sans passer
 * par ici ferait croire que le dernier envoi est plus ancien qu il
 * n est, et la limitation cesserait de limiter. La deduction est
 * ecrite une fois, ici, pour que ce couplage soit visible.
 */
export const DELAI_ENTRE_ENVOIS_MS = 60 * 1000;

export function envoyeLe(expireLe: string): number {
  return new Date(expireLe).getTime() - DUREE_DU_CODE_MS;
}

export function peutRedemanderUnCode(
  expireLe: string | null | undefined,
  maintenant: number,
): boolean {
  /* AUCUN CODE EN ATTENTE, AUCUNE ATTENTE : c est le premier envoi. */
  if (!expireLe) return true;
  return maintenant - envoyeLe(expireLe) >= DELAI_ENTRE_ENVOIS_MS;
}
