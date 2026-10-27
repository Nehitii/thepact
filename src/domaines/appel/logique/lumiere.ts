/* LA LUMIERE DU COEUR.
 *
 * La toile peint en huit bits, et « lighter » sature : passe un certain
 * eclat, tout ce qui brille devient le meme blanc plat, et rien ne bave
 * autour. Une vraie optique ne fait pas ca : la lumiere forte deborde de
 * son objet — le halo —, les hautes lumieres se tassent au lieu de
 * casser net — l epaule —, et la pellicule a un grain.
 *
 * C est ce que fait la passe sur le processeur graphique, apres la
 * toile. Elle ne REPEINT rien : elle ajoute un halo aux seules lumieres
 * au-dessus d un seuil, plie ce qui depasse le blanc, et pose un grain.
 * A eclat nul et exposition un, elle rend l image telle quelle, a ses
 * blancs extremes pres — le noir que la table de montage a gagne reste
 * du noir.
 *
 * ELLE LIT LA MEME PARTITION. Le halo monte avec les actes et s ouvre
 * dans l acte critique ; l enflement surexpose, l effondrement aspire la
 * lumiere, le temps mort l eteint presque ; au souffle, le halo porte
 * les jets.
 *
 * Ce module ne dessine rien : il rend les reglages d une image.
 */
import { doux, lerp, type PhaseCoeur } from "./coeur";
import { DUREE_EFFONDREMENT, DUREE_ENFLEMENT } from "./sequence";

export interface ReglageDeLaLumiere {
  /** Ce par quoi la scene est multipliee avant l epaule. */
  exposition: number;
  /** La luminance a partir de laquelle une lumiere bave, de zero a un. */
  seuil: number;
  /** La douceur du seuil : en dessous de seuil - genou, rien ne bave. */
  genou: number;
  /** La force du halo ajoute. */
  eclat: number;
  /** L amplitude du grain, en part du blanc. */
  grain: number;
}

/* La montee, acte par acte. Le seuil descend a mesure que le noyau
   chauffe : au debut seul son coeur bave, a la fin tout le noyau. */
export const MONTEE: readonly { p: number; eclat: number; seuil: number }[] = [
  { p: 0, eclat: 0.25, seuil: 0.82 },
  { p: 0.25, eclat: 0.32, seuil: 0.8 },
  { p: 0.5, eclat: 0.4, seuil: 0.78 },
  { p: 0.75, eclat: 0.45, seuil: 0.77 },
  { p: 0.9, eclat: 0.48, seuil: 0.76 },
  { p: 1, eclat: 0.68, seuil: 0.7 },
];

export const GENOU = 0.12;
export const GRAIN = 0.032;
/** L insert de la fusion ouvre le halo d autant, au plus fort de la lutte. */
export const HALO_DE_LA_LUTTE = 0.2;

/* LE HALO NE DOIT PAS GRISER LE NOIR. Mesure au banc avec un halo
   etale sur six etages de poids egal : a l acte critique, la part
   d image noire tombait de 55 % a 33 %. Le halo est donc resserre —
   cinq etages, chacun pesant `POIDS_DE_LA_REMONTEE` de celui du dessus —
   et sa traine coupee sous `PLANCHER_DU_HALO`, en lineaire : c est la
   ou il ne faisait plus que voiler le fond. */
export const ETAGES_DU_HALO = 5;
export const POIDS_DE_LA_REMONTEE = 0.6;
export const PLANCHER_DU_HALO = 0.004;

export function reglageDeLaMontee(p: number): { eclat: number; seuil: number } {
  let i = 0;
  while (i < MONTEE.length - 2 && MONTEE[i + 1].p <= p) i++;
  const a = MONTEE[i], b = MONTEE[i + 1];
  const t = doux(a.p, b.p, p);
  return { eclat: lerp(a.eclat, b.eclat, t), seuil: lerp(a.seuil, b.seuil, t) };
}

/**
 * Les reglages d une image.
 * @param depuis depuis le debut de la phase, en secondes
 * @param focus a quel point la fusion commande, de zero a un
 */
export function reglageDeLaLumiere(
  p: number, phase: PhaseCoeur, depuis: number, focus: number,
): ReglageDeLaLumiere {
  const m = reglageDeLaMontee(p);
  const base: ReglageDeLaLumiere = {
    exposition: 1,
    seuil: m.seuil,
    genou: GENOU,
    eclat: m.eclat + HALO_DE_LA_LUTTE * focus,
    grain: GRAIN,
  };
  switch (phase) {
    case "enflement": {
      /* Il gonfle et se surexpose : la coquille brule le cadre. */
      const u = doux(0, DUREE_ENFLEMENT / 1000, depuis);
      return { ...base, exposition: lerp(1, 1.35, u), eclat: lerp(base.eclat, 0.95, u), seuil: lerp(base.seuil, 0.62, u) };
    }
    case "effondrement": {
      /* Il s effondre et aspire sa propre lumiere. */
      const u = doux(0, DUREE_EFFONDREMENT / 1000, depuis);
      return { ...base, exposition: lerp(1.35, 0.7, u), eclat: lerp(0.95, 0.25, u), seuil: 0.72 };
    }
    case "tempsMort":
      /* Le silence : presque plus de halo, et le grain seul vit encore. */
      return { ...base, exposition: 0.85, eclat: 0.12, seuil: 0.8, grain: GRAIN * 1.3 };
    case "projection":
      /* Le halo porte les jets. */
      return { ...base, exposition: 1, eclat: 0.78, seuil: 0.66 };
    case "verrouille":
      return { ...base, exposition: 1, eclat: 0.3, seuil: 0.8 };
    default:
      return base;
  }
}

/* L EPAULE. Jusqu au genou de la courbe, la valeur passe telle quelle —
   c est ce qui garde l image d avant intacte, a ses blancs extremes pres
   (au-dessus de 0,93 en sRGB). Au-dela, elle tend vers le blanc sans
   jamais l atteindre d un coup : la ou « lighter » cassait net, la
   lumiere se tasse. La meme formule vit dans le shader. */
export const GENOU_DE_L_EPAULE = 0.85;

export function epaule(x: number): number {
  if (x <= GENOU_DE_L_EPAULE) return x;
  const reste = 1 - GENOU_DE_L_EPAULE;
  return GENOU_DE_L_EPAULE + reste * (1 - Math.exp(-(x - GENOU_DE_L_EPAULE) / reste));
}

/* LE SEUIL DOUX. La part d une lumiere de luminance `l` qui bave : nulle
   sous seuil - genou, entiere loin au-dessus, une parabole entre les deux
   — un seuil franc ferait clignoter le halo des qu un trait passe. */
export function partQuiBave(l: number, seuil: number, genou: number): number {
  if (l <= 0) return 0;
  const doux2 = Math.min(Math.max(l - seuil + genou, 0), 2 * genou);
  const courbe = (doux2 * doux2) / (4 * genou + 1e-4);
  return Math.max(courbe, l - seuil) / Math.max(l, 1e-4);
}
