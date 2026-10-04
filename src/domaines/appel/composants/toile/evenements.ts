/* LES EVENEMENTS DES ACTES : L UNION ET LA DECHIRURE.
 *
 * La table de montage dit QUI regarder ; elle ne dit pas QUAND il se
 * passe quelque chose. L oeil ne voit pas un etat changer, il voit un
 * evenement arriver. Chacun est declenche par la mecanique qui existait
 * deja — l horloge de la fusion, le seuil du decentrage — et chacun garde
 * son instant de depart : le son se calera dessus.
 */
import { TAU, lerp, rgba, type Couleur, type Rendu } from "@/domaines/appel/logique/coeur";
import type { Faille } from "@/domaines/appel/logique/faille";
import { RAYONS, RAYONS_DE_L_UNION } from "@/domaines/appel/logique/fusion";
import { disque, type Contexte } from "./trace";

/* LE COL EST L ENDROIT OU CA SE PASSE. Deux noyaux qui se rapprochent
   sans que rien ne chauffe entre eux glissent l un vers l autre ; ce qui
   dit « fusion », c est un point brulant a mi-chemin, d autant plus vif
   qu ils sont proches et que la lutte dure. */
export function tracerLeCol(ctx: Contexte, cx: number, cy: number, rc: number, puissance: number, c: Couleur, r: Rendu) {
  const pont = rc * (0.55 + puissance * 0.5);
  const col = ctx.createRadialGradient(cx, cy, 0, cx, cy, pont);
  const vif = Math.min(1, puissance * 1.5);
  col.addColorStop(0, rgba(r.trait, vif));
  col.addColorStop(0.3, rgba(r.trait, vif * 0.45));
  col.addColorStop(0.65, rgba(c, vif * 0.22));
  col.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = col;
  disque(ctx, cx, cy, pont);
}

/* LA PROMESSE : CE QUI CONVERGE. Rien n annonce mieux une detonation que
   de la matiere aspiree vers un point — l oeil lit une convergence comme
   une charge. Leur position vient du TEMPS, pas du hasard : un trait tire
   au sort a chaque image est du bruit, le meme trait qui se rapproche
   d une image a l autre est une aspiration. Un seul degrade radial pour
   tous : centre sur le coeur, il vaut dans toutes les directions. */
export function tracerLaPromesse(
  ctx: Contexte, cx: number, cy: number, rc: number, base: number, puissance: number,
  maintenant: number, c: Couleur, r: Rendu,
) {
  const loin = rc + base * 2.6;
  const chute = ctx.createRadialGradient(cx, cy, rc * 0.9, cx, cy, loin);
  chute.addColorStop(0, rgba(r.trait, Math.min(1, puissance * 0.95)));
  chute.addColorStop(0.3, rgba(c, puissance * 0.5));
  chute.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = chute;
  ctx.lineWidth = 1 + puissance * 1.8;
  ctx.beginPath();
  const combien = Math.round(4 + puissance * 16);
  for (let k = 0; k < combien; k++) {
    const rayon = RAYONS[(k * 5) % RAYONS_DE_L_UNION];
    const marche = ((maintenant / 1000) * (0.7 + puissance * 2.6) + k / combien) % 1;
    const d = rc + (1 - marche) * (loin - rc) * rayon.portee;
    const queue = Math.max(rc, d - base * (0.12 + marche * 0.3));
    const ca = Math.cos(rayon.angle), sa = Math.sin(rayon.angle);
    ctx.moveTo(cx + ca * queue, cy + sa * queue);
    ctx.lineTo(cx + ca * d, cy + sa * d);
  }
  ctx.stroke();
}

/* LA DETONATION DE L UNION : trois choses au meme instant, et il en faut
   trois. L eclair dit « maintenant », les anneaux « et ca se propage », la
   radiation « et ca vient d ICI ». L eclair seul est un clignotement ; les
   anneaux seuls, une onde de plus ; la radiation seule, un soleil. */
export function tracerLaDetonation(
  ctx: Contexte, cx: number, cy: number, rc: number, t: number,
  largeur: number, hauteur: number, ox: number, oy: number, c: Couleur, r: Rendu,
) {
  const portee = Math.max(largeur, hauteur) * 0.55;
  /* 1. L eclair : quatre-vingts millisecondes, et il ne couvre pas tout a
        fait le cadre — une surexposition qui vient du centre, pas un
        coup de flash. */
  if (t < 0.07) {
    const vif = (1 - t / 0.07) * 0.8;
    const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, portee * 1.3);
    flash.addColorStop(0, rgba(r.trait, Math.min(1, vif)));
    flash.addColorStop(0.45, rgba(r.trait, vif * 0.55));
    flash.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = flash;
    ctx.fillRect(-ox, -oy, largeur, hauteur);
  }
  /* 2. Trois fronts decales, le premier blanc et epais : c est
        l echelonnement qui fait la profondeur. */
  for (let k = 0; k < 3; k++) {
    const tk = (t - k * 0.075) / (1 - k * 0.075);
    if (tk <= 0) continue;
    ctx.beginPath();
    ctx.arc(cx, cy, rc + Math.pow(tk, 0.5) * portee, 0, TAU);
    ctx.strokeStyle = rgba(k === 0 ? r.trait : c, (1 - tk) * (1 - tk) * (k === 0 ? 0.95 : 0.4));
    ctx.lineWidth = 1 + (1 - tk) * (k === 0 ? 24 : 11);
    ctx.stroke();
  }
  /* 3. La radiation s allonge en t^0,45 — vite au debut, puis elle tient.
        Deux passes, fines et epaisses, sur un degrade partage. */
  const avance = Math.pow(t, 0.45);
  const eteint = Math.pow(1 - t, 1.6);
  const gerbe = ctx.createRadialGradient(cx, cy, rc * 0.7, cx, cy, rc + portee);
  gerbe.addColorStop(0, rgba(r.trait, Math.min(1, eteint * 1.2)));
  gerbe.addColorStop(0.22, rgba(r.trait, eteint * 0.7));
  gerbe.addColorStop(0.6, rgba(c, eteint * 0.35));
  gerbe.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = gerbe;
  for (const epais of [false, true]) {
    ctx.lineWidth = epais ? 5 + (1 - t) * 7 : 1.4 + (1 - t) * 1.6;
    ctx.beginPath();
    for (const rayon of RAYONS) {
      if (rayon.epais !== epais) continue;
      const bout = rc + portee * rayon.portee * avance;
      const pied = rc * 0.85 + (bout - rc) * 0.12;
      const ca = Math.cos(rayon.angle), sa = Math.sin(rayon.angle);
      ctx.moveTo(cx + ca * pied, cy + sa * pied);
      ctx.lineTo(cx + ca * bout, cy + sa * bout);
    }
    ctx.stroke();
  }
}

/* LA FENTE, en deux passes — une nappe large et pale, une ame fine et
   blanche —, seulement sur ce que la fissure a deja parcouru. Un seul
   degrade radial centre sur le noyau : elle brule au centre et s eteint
   vers ses pointes. Elle flambe a l ouverture, puis couve, et s efface
   quand les jets naissent — c est eux qu elle annoncait. */
export function tracerLaFaille(
  ctx: Contexte, f: Faille, cx: number, cy: number, c: Couleur, r: Rendu, maintenant: number, forceDesJets: number,
) {
  if (f.ouverture <= 0.01 || f.n < 2) return;
  const age = f.debut >= 0 ? (maintenant - f.debut) / 1000 : 10;
  const t = maintenant / 1000;
  const braise = 0.8 + 0.2 * Math.sin(t * 23) * Math.sin(t * 7.3);
  const eclat = (0.45 + 0.55 * Math.exp(-age * 3.2)) * braise * f.ouverture * (1 - forceDesJets);
  if (eclat <= 0.01) return;

  let rayonMax = 1;
  for (let i = 0; i < f.n; i++) {
    if (Math.abs(f.u[i]) <= f.propagation) rayonMax = Math.max(rayonMax, Math.hypot(f.x[i] - cx, f.y[i] - cy));
  }
  /* Le parcours devoile, avec ses deux pointes interpolees : la fissure
     avance, elle ne saute pas de sommet en sommet. */
  ctx.beginPath();
  let premier = true;
  for (let i = 0; i < f.n; i++) {
    const u = f.u[i];
    if (Math.abs(u) <= f.propagation) {
      if (premier && i > 0) {
        const u0 = f.u[i - 1];
        const k = (Math.sign(u0) * f.propagation - u0) / (u - u0);
        ctx.moveTo(lerp(f.x[i - 1], f.x[i], k), lerp(f.y[i - 1], f.y[i], k));
        ctx.lineTo(f.x[i], f.y[i]);
      } else if (premier) ctx.moveTo(f.x[i], f.y[i]);
      else ctx.lineTo(f.x[i], f.y[i]);
      premier = false;
    } else if (!premier) {
      const u0 = f.u[i - 1];
      const k = (Math.sign(u) * f.propagation - u0) / (u - u0);
      ctx.lineTo(lerp(f.x[i - 1], f.x[i], k), lerp(f.y[i - 1], f.y[i], k));
      break;
    }
  }
  if (premier) return;
  const lueur = ctx.createRadialGradient(cx, cy, 0, cx, cy, rayonMax * 1.05);
  lueur.addColorStop(0, rgba(r.trait, Math.min(1, eclat)));
  lueur.addColorStop(0.35, rgba(c, eclat * 0.7));
  lueur.addColorStop(1, "rgba(0,0,0,0)");
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = lueur;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
