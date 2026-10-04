/* LES GESTES DE TRACE QUE PLUSIEURS CALQUES PARTAGENT.
 *
 * Rien ici ne decide d une couleur ni d une taille : ce sont des chemins,
 * poses sur le contexte, que chaque calque remplit ou trace a sa facon.
 */
import { TAU } from "@/domaines/appel/logique/coeur";
import type { Vecteur } from "@/domaines/appel/logique/espace";

export type Contexte = CanvasRenderingContext2D;

/** Un disque plein, dans le style courant. */
export function disque(ctx: Contexte, x: number, y: number, rayon: number): void {
  ctx.beginPath();
  ctx.arc(x, y, rayon, 0, TAU);
  ctx.fill();
}

/* UN CERCLE SUR LA SPHERE, VU DE FACE. On ne trace que la part tournee
   vers nous : sans ce test, le cercle se referme par-dessus la sphere et
   l onde a l air de flotter autour d elle au lieu de courir dessus.
   `hausse` pousse le trace un peu au-dessus de la coquille. */
export function tracerLeCercle(
  ctx: Contexte, pts: Vecteur[], cx: number, cy: number, rc: number, persp: number, hausse: number,
): void {
  let ouvert = false;
  ctx.beginPath();
  for (const v of pts) {
    if (v.z <= 0.02) { ouvert = false; continue; }
    const k = 1 / (1 - v.z * persp);
    const x = cx + v.x * rc * hausse * k, y = cy + v.y * rc * hausse * k;
    if (!ouvert) { ctx.moveTo(x, y); ouvert = true; } else ctx.lineTo(x, y);
  }
}

/* LE TRACE LISSE NE COUTE PAS UN ECHANTILLON DE PLUS. Les segments
   droits se voyaient au pied des jets, la ou la courbure est la plus
   forte apres projection — et la ou on regarde. La quadratique prend
   chaque echantillon comme point de controle et passe par les milieux :
   meme boucle, meme nombre de points, plus d angles. */
export function tracerLisse(ctx: Contexte, xs: Float64Array, ys: Float64Array, n: number, ouvrir: boolean): void {
  if (ouvrir) ctx.moveTo(xs[0], ys[0]); else ctx.lineTo(xs[0], ys[0]);
  for (let i = 1; i < n - 1; i++) {
    ctx.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2);
  }
  ctx.lineTo(xs[n - 1], ys[n - 1]);
}

export function tracerLisseAlEnvers(ctx: Contexte, xs: Float64Array, ys: Float64Array, n: number): void {
  ctx.lineTo(xs[n - 1], ys[n - 1]);
  for (let i = n - 2; i > 0; i--) {
    ctx.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i - 1]) / 2, (ys[i] + ys[i - 1]) / 2);
  }
  ctx.lineTo(xs[0], ys[0]);
}
