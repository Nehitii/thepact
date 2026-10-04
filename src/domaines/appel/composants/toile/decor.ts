/* LE DECOR : LE FOND, LA GRILLE COURBEE, LES ONDULATIONS.
 *
 * Ce sont les trois calques qui couvrent le cadre, donc ceux que la table
 * de montage dose le plus : c est en eux que le noir se gagne.
 */
import {
  MAX_ONDES, TAU, cadenceDesOndes, deplacementParGravite, lerp, rgba, type Couleur,
} from "@/domaines/appel/logique/coeur";
import { deplacerParLaFaille, type Faille } from "@/domaines/appel/logique/faille";
import type { Souffle } from "./fin";
import { disque, type Contexte } from "./trace";

/* LE HALO SE RESSERRE AU LIEU DE S ETEINDRE. A portee un, les huit
   dixiemes du grand cote — tout le cadre ; a zero, trois rayons de base.
   Une source dans le noir, pas un voile. Et c est un DISQUE, pas le
   cadre : hors de son rayon le degrade est transparent, et le remplir
   etait la surface la plus large de la scene, peinte pour rien. Le
   plancher a sept dixiemes est dose lui aussi — c est lui qui voilait
   tout le cadre a la fin. */
export function tracerLeFond(
  ctx: Contexte, cx: number, cy: number, base: number, largeur: number, hauteur: number,
  c: Couleur, p: number, intensite: number, fond: number, portee: number,
) {
  const origine = Math.max(largeur, hauteur) * 0.8;
  const rayon = lerp(Math.min(base * 3.2, origine), origine, portee);
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, rayon);
  halo.addColorStop(0, rgba(c, intensite));
  halo.addColorStop(0.28, rgba(c, intensite * 0.6));
  halo.addColorStop(0.7, rgba(c, (0.02 + p * 0.07) * fond));
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  disque(ctx, cx, cy, rayon);
}

/* LA GRILLE COURBEE, ET CE QUI LA DEFORME EN PLUS DE LA GRAVITE.
 *
 * LA FAILLE la fend : une ligne dont deux points consecutifs tombent de
 * part et d autre d une fente ouverte ne les relie pas — le trait
 * traverserait la fente, et une dechirure recousue n en est plus une.
 *
 * LE SOUFFLE la chasse devant lui : une gaussienne centree sur le front,
 * qui passe, emporte et relache. Un decor qui reste en place pendant
 * qu une onde le traverse dit qu il ne s est rien passe.
 *
 * LA POUSSEE REECRIT LE POINT, ELLE N EN REND PAS UN AUTRE : quinze cents
 * points par image, chacun passait par deux tableaux jetables. */
export function tracerLaGrille(
  ctx: Contexte, cx: number, cy: number, base: number, largeur: number, hauteur: number,
  c: Couleur, p: number, dose: number, faille: Faille, souffle: Souffle,
) {
  const pas = 46;
  const failleOuverte = faille.ouverture > 0.001;
  const deplacer = (x: number, y: number) => {
    const point = deplacementParGravite(x, y, cx, cy, base, p);
    if (failleOuverte) deplacerParLaFaille(faille, point);
    if (!souffle.actif) return point;
    const dx = point[0] - cx, dy = point[1] - cy;
    const d = Math.hypot(dx, dy) || 1;
    const large = souffle.rr * 0.42 + 40;
    const force = Math.exp(-Math.pow((d - souffle.rr) / large, 2)) * (1 - souffle.u) * souffle.rr * 0.3;
    point[0] += (dx / d) * force;
    point[1] += (dy / d) * force;
    return point;
  };
  ctx.strokeStyle = rgba(c, (0.05 + p * 0.16) * (souffle.actif ? 1 - souffle.u * 0.5 : 1) * dose);
  ctx.lineWidth = 1;
  ctx.beginPath();
  const ligne = (fixe: number, debut: number, fin: number, verticale: boolean) => {
    let coteAvant = 0;
    for (let v = debut; v <= fin; v += pas / 3) {
      const [px, py] = verticale ? deplacer(fixe, v) : deplacer(v, fixe);
      const rompu = failleOuverte && coteAvant !== 0 && faille.cote !== coteAvant && faille.devoile > 0.05;
      if (v === debut || rompu) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      coteAvant = failleOuverte ? faille.cote : 0;
    }
  };
  for (let x = -pas; x <= largeur + pas; x += pas) ligne(x, -pas, hauteur + pas, true);
  for (let y = -pas; y <= hauteur + pas; y += pas) ligne(y, -pas, largeur + pas, false);
  ctx.stroke();
}

interface Onde { r: number; force: number; sens: number }

export function creerLesOndes(ctx: Contexte) {
  const ondes: Onde[] = [];
  let derniereOnde = 0;

  return {
    /** L onde d un seuil franchi : plus forte, et hors de la table de montage. */
    seuil() {
      ondes.push({ r: 0, force: 1.6, sens: 1 });
    },
    vider() {
      ondes.length = 0;
    },
    avancerEtTracer(
      dt: number, maintenant: number, cx: number, cy: number, echelle: number,
      largeur: number, hauteur: number, c: Couleur, p: number, immobile: boolean, dose: number,
    ) {
      if (!immobile && p > 0 && maintenant - derniereOnde > cadenceDesOndes(p)) {
        derniereOnde = maintenant;
        ondes.push({ r: 0, force: 0.35 + p * 0.65, sens: 1 });
        if (ondes.length > MAX_ONDES) ondes.shift();
      }
      const portee = Math.max(largeur, hauteur) * 0.62;
      for (let i = ondes.length - 1; i >= 0; i--) {
        const w = ondes[i];
        w.r += dt * lerp(90, 520, p) * w.sens;
        const reste = 1 - w.r / portee;
        if (reste <= 0 || w.r < 0) { ondes.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(cx, cy, w.r * echelle, 0, TAU);
        ctx.strokeStyle = rgba(c, reste * reste * 0.5 * w.force * (w.force > 1 ? 1 : dose));
        ctx.lineWidth = 1 + reste * 2.5;
        ctx.stroke();
      }
    },
  };
}
