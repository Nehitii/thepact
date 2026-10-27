/* LA NERVURE DES JETS.
 *
 * Deux faisceaux sortent des poles du nexus, sur la normale au plan
 * d accretion. Ce module en porte la geometrie — l axe, le virage, la
 * gerbe de brins, la force — et rien du dessin. La dechirure de l acte IV
 * s en sert aussi : elle suit le trace exact que les jets prendront.
 *
 * LA NERVURE SE CAMBRE. Partis droits, les deux jets formaient UNE
 * DROITE en travers de l ecran : une lame, pas deux jets. Ils sortent le
 * long de l axe puis s incurvent de plus en plus — l ecart lateral croit
 * en t², donc la tangente tourne sans jamais casser au depart.
 *
 * ET LA SYMETRIE EST UNE ROTATION, PAS UN MIROIR. Le second jet prend
 * l oppose de l axe ET l oppose de la laterale : les deux moities se
 * deduisent l une de l autre par un demi-tour, comme les bras d un
 * moulinet. Avec la meme laterale pour les deux, on obtiendrait un « C » —
 * ce qu aucun ecoulement ne fait et que l oeil refuse aussitot.
 */
import { SEUILS, TAU, clamp01, doux, lerp, type Couleur, type PhaseCoeur } from "./coeur";
import {
  PERSPECTIVE, axeDesJets, graine, perpendiculaire, produitVectoriel, type Vecteur,
} from "./espace";
import { DUREE_EFFONDREMENT, DUREE_ENFLEMENT } from "./sequence";

/* LE FAISCEAU A SA PROPRE ETAGERE DE COULEURS. A la fin du rituel,
   `teinte(p)` vaut presque blanc : applique au jet, cela peignait le
   halo, la nappe, la gaine et le coeur de la meme couleur. Un rayon
   d energie se lit a son ETAGEMENT : un coeur sature, cerne de froid, qui
   se refroidit encore en s eloignant. Les couches exterieures sont donc
   ramenees vers le bleu ; le coeur garde le blanc. C est la seule entorse
   du calque a la palette, et au repos, ou la teinte est deja cyan, elle
   ne change rien. */
export const FROID: Couleur = [10, 150, 235];

export function versLeFroid(c: Couleur, t: number): Couleur {
  return [lerp(c[0], FROID[0], t), lerp(c[1], FROID[1], t), lerp(c[2], FROID[2], t)];
}

/* LA PERSPECTIVE DES JETS N EST PAS CELLE DES ORBITES. Celle des orbites
   rapporte `z` au rayon, ce qui est juste a rayon constant. Un jet
   s eloigne : il faut une vraie distance de camera, sinon le raccourci
   serait le meme au pied et a huit rayons de la. */
export const DISTANCE_CAMERA = 6;
/** De combien la nervure vire : a 1,2, la gerbe du croquis. */
export const CAMBRURE = 1.2;
export const POINTS_DU_JET = 34;
/* Les brins sont traces en quadratiques : seize points donnent une
   courbe aussi propre que trente-quatre en segments droits. */
export const POINTS_DU_BRIN = 16;
export const BRINS_DU_JET = 11;
/** Les paquets qui remontent la gerbe, un par brin tire. */
export const NOEUDS_DU_JET = 5;

export interface BrinDuJet {
  azimut: number;
  ecart: number;
  fin: number;
  cambre: number;
  eclat: number;
  depart: number;
}

/* LES LONGUEURS INEGALES SONT LE POINT IMPORTANT. Un faisceau dont tous
   les brins finissent au meme endroit a un BORD, donc une silhouette,
   donc l air d une forme. Des brins qui s arretent chacun ou il veut
   n ont pas de bord : ils se defont. Et chacun se cambre a sa facon :
   avec une cambrure commune, ils ne se CROISENT jamais, et une gerbe
   dont les brins ne se croisent pas est un peigne. */
export const BRINS: BrinDuJet[] = (() => {
  const alea = graine(70415);
  return Array.from({ length: BRINS_DU_JET }, (_, i) => ({
    azimut: (i / BRINS_DU_JET) * TAU + (alea() - 0.5) * 0.55,
    ecart: 0.55 + alea() * 2.3,
    fin: 0.58 + alea() * 0.42,
    cambre: 0.72 + alea() * 0.6,
    eclat: 0.42 + alea() * 0.58,
    depart: alea() * TAU,
  }));
})();

/* LE PAVILLON EST EXPONENTIEL, PAS POLYNOMIAL. La gorge reste presque
   parallele, puis l ecart s ouvre de plus en plus vite : c est cette
   ACCELERATION qui donne la trompette. Il ne dessine pas une paroi mais
   l ecartement des brins : ils sortent groupes et se defont. */
export const GORGE = 0.035;
export const EVASEMENT = 3.9;

export function largeurDuJet(t: number, base: number, force: number): number {
  return base * GORGE * Math.exp(EVASEMENT * t) * (0.55 + force * 0.85);
}

/* EN REGIME, LE FAISCEAU SORT DU CADRE — allonge d un cinquieme : assez
   pour que ses bouts sortent, pas assez pour que le pavillon sorte avec
   eux. A une fois et demie, tout l evasement passait hors champ et il ne
   restait qu une lame droite en travers de l ecran. */
export function longueurDuJet(base: number, force: number, regime: boolean): number {
  return base * (3.2 + force * 6.5) * (regime ? 1.2 : 1);
}

/* Le rayon dont depend le pied : celui du coeur, sauf quand il n est
   plus qu un point et que les jets sont le sujet. */
export function rayonDeLaGorge(rc: number, base: number, regime: boolean): number {
  return regime ? Math.max(rc, base * 0.19) : rc;
}

/* LA FORCE DES JETS. Au fil des vingt secondes, elle se negocie contre
   le dernier seuil : les jets naissent a deux secondes de la fin. Dans
   les quatre temps elle raconte quelque chose : ils enflent avec la
   coquille, sont ravales par l effondrement — c est ce retrait qui rend
   le silence credible —, se taisent, et repartent a plein sans jamais
   en redescendre. */
export const SEUIL_DES_JETS = SEUILS[3];

export function forceDesJets(phase: PhaseCoeur, depuis: number, p: number): number {
  if (phase === "enflement") return lerp(0.42, 0.72, clamp01(depuis / (DUREE_ENFLEMENT / 1000)));
  if (phase === "effondrement") {
    return 0.72 * Math.pow(1 - clamp01(depuis / (DUREE_EFFONDREMENT / 1000)), 1.6);
  }
  if (phase === "tempsMort") return 0;
  if (phase === "projection") return 1;
  return clamp01(doux(SEUIL_DES_JETS, SEUIL_DES_JETS + 0.06, p));
}

/* LE REPERE D UN JET : son axe, la laterale de son virage, et la
   troisieme direction qui ferme le repere. C est autour de celle-ci et
   de la laterale que les brins s ecartent — donc en volume, et pas en
   eventail plat. */
export interface RepereDuJet {
  a: Vecteur;
  b: Vecteur;
  c: Vecteur;
}

export function repereDuJet(sens: 1 | -1): RepereDuJet {
  const axe = axeDesJets();
  const lat = perpendiculaire(axe);
  const a = { x: axe.x * sens, y: axe.y * sens, z: axe.z * sens };
  const b = { x: lat.x * sens, y: lat.y * sens, z: lat.z * sens };
  return { a, b, c: produitVectoriel(a, b) };
}

export interface PointDuJet {
  x: number;
  y: number;
  k: number;
  z: number;
}

export interface Nervure {
  cx: number;
  cy: number;
  base: number;
  pied: number;
  longueur: number;
}

/* Un point du faisceau : `t` le long de la nervure, un ecart donne dans
   le repere (b, c), et la cambrure propre du brin. Tout se calcule en
   trois dimensions PUIS se projette : un ecart calcule apres projection
   ferait un eventail plat qui ne tournerait pas avec l axe. Le point est
   ecrit dans `cible`, qui est rendue : les brins reecrivent la meme
   ardoise des centaines de fois par image. */
export function pointDuJet(
  rep: RepereDuJet, n: Nervure, t: number, eb: number, ec: number, cambre: number, cible: PointDuJet,
): PointDuJet {
  const d = n.pied + n.longueur * t;
  const l = n.longueur * CAMBRURE * cambre * t * t + eb;
  const x3 = rep.a.x * d + rep.b.x * l + rep.c.x * ec;
  const y3 = rep.a.y * d + rep.b.y * l + rep.c.y * ec;
  const z3 = rep.a.z * d + rep.b.z * l + rep.c.z * ec;
  const D = n.base * DISTANCE_CAMERA;
  const k = D / Math.max(D * 0.25, D - z3 * PERSPECTIVE * 2.4);
  cible.x = n.cx + x3 * k;
  cible.y = n.cy + y3 * k;
  cible.k = k;
  cible.z = z3;
  return cible;
}
