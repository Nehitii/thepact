/* LA MATIERE : CE QU UN PUITS FAIT A CE QUI L ENTOURE.
 *
 * C etaient vingt-deux segments de deux points rapproches du centre image
 * par image, une aurore conique sur tout l ecran et des arcs vers nulle
 * part. Un trait qui raccourcit n est pas de la matiere happee, c est un
 * trait qui raccourcit.
 *
 * Ce qu un puits fait a la matiere, lui, est connu. Elle ne tombe pas
 * droit : elle spirale, s aplatit dans un plan, tourne plus vite en
 * dedans qu en dehors, chauffe en descendant, et finit consommee. Chacun
 * de ces cinq faits est un calque, et aucun ne coute cher. Le disque n est
 * qu un paquet d orbites dans un meme plan, donc il passe derriere la
 * sphere dans la meme passe que les anneaux, sans rien ecrire de plus.
 */
import { TAU, clamp01, lerp, rgba, type Couleur, type Rendu } from "@/domaines/appel/logique/coeur";
import { PERSPECTIVE, PLAN_DE_MATIERE, graine, pointDOrbite } from "@/domaines/appel/logique/espace";
import type { Retenir } from "./anneaux";
import { disque, type Contexte } from "./trace";

const NB_ORBITES_DU_DISQUE = 22;
const NB_GRAINS = 26;
const POINTS_DU_DISQUE = 22;

/* LA ROTATION EST KEPLERIENNE ICI, ET SEULEMENT ICI. Les anneaux du
   recit tournent a l envers d une orbite — c est une machine qui
   s emballe. La matiere n est pas une machine : elle tombe, en r^-1,5,
   et c est ce cisaillement qui fait lire un disque plutot qu une roue. */
const vitesseOrbitale = (rayon: number, p: number) =>
  (0.55 + p * 2.6) / Math.pow(Math.max(0.45, rayon), 1.5);

/** La chaleur d un grain : nulle au bord, totale a l entree. */
const chaleurDuGrain = (rayon: number, rCoeurRelatif: number) =>
  clamp01(1 - (rayon - rCoeurRelatif) / 2.2);

interface Grain { rayon: number; angle: number; aplati: number; noeud: number; chute: number; taille: number }
interface Impact { angle: number; aplati: number; noeud: number; vie: number; duree: number }

export function creerLaMatiere(ctx: Contexte) {
  const disqueDeMatiere = (() => {
    const alea = graine(4071981);
    return Array.from({ length: NB_ORBITES_DU_DISQUE }, (_, i) => ({
      rayon: 1.25 + (i / NB_ORBITES_DU_DISQUE) * 2.5 + (alea() - 0.5) * 0.09,
      angle: alea() * TAU,
      /* Un disque parfaitement plan est une cible ; une epaisseur, meme
         d un vingtieme, en fait un volume. */
      aplati: clamp01(PLAN_DE_MATIERE.aplati + (alea() - 0.5) * 0.07),
      noeud: PLAN_DE_MATIERE.noeud + (alea() - 0.5) * 0.14,
      eclat: 0.35 + alea() * 0.65,
    }));
  })();
  const grains: Grain[] = (() => {
    const alea = graine(1120250);
    return Array.from({ length: NB_GRAINS }, () => ({
      rayon: 1.4 + alea() * 2.4,
      angle: alea() * TAU,
      aplati: clamp01(PLAN_DE_MATIERE.aplati + (alea() - 0.5) * 0.45),
      noeud: PLAN_DE_MATIERE.noeud + (alea() - 0.5) * 0.9,
      chute: 0.5 + alea() * 0.9,
      taille: 0.7 + alea() * 1.1,
    }));
  })();
  const impacts: Impact[] = [];

  function avancer(dt: number, p: number, rCoeurRelatif: number) {
    for (const o of disqueDeMatiere) o.angle += dt * vitesseOrbitale(o.rayon, p) * 0.6;
    for (const g of grains) {
      g.angle += dt * vitesseOrbitale(g.rayon, p);
      /* La chute s accelere en descendant : le grain passe le plus clair
         de sa vie loin, et disparait vite a la fin. */
      g.rayon -= dt * g.chute * (0.1 + p * 0.85) * (1 + 1.4 / Math.max(0.5, g.rayon));
      if (g.rayon <= rCoeurRelatif) {
        impacts.push({ angle: g.angle, aplati: g.aplati, noeud: g.noeud, vie: 0, duree: 260 });
        if (impacts.length > 14) impacts.shift();
        g.rayon = 3.1 + Math.random() * 1.3;
        g.angle = Math.random() * TAU;
        g.aplati = clamp01(PLAN_DE_MATIERE.aplati + (Math.random() - 0.5) * 0.45);
        g.noeud = PLAN_DE_MATIERE.noeud + (Math.random() - 0.5) * 0.9;
      }
    }
    for (let i = impacts.length - 1; i >= 0; i--) {
      impacts[i].vie += dt * 1000;
      if (impacts[i].vie >= impacts[i].duree) impacts.splice(i, 1);
    }
  }

  function tracer(
    devant: boolean, cx: number, cy: number, base: number, echelle: number,
    c: Couleur, p: number, rc: number, r: Rendu, retenir: Retenir,
  ) {
    const cote = (prof: number) => (prof > 0.5) === devant;

    /* 1. LE DISQUE, chaque orbite en une passe par moitie. UN FILET LARGE
          N EST PAS UN TRAIT LARGE : une passe large et pale pour la nappe,
          une passe etroite et nette pour l ame. La lumiere n augmente que
          de moitie, mais etalee sur trois fois la largeur : ca se lit
          comme plus epais, pas comme plus clair. */
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const o of disqueDeMatiere) {
      const rayon = o.rayon * base * echelle;
      if (rayon <= 1) continue;
      const debut = devant ? 0 : POINTS_DU_DISQUE / 2;
      const fin = devant ? POINTS_DU_DISQUE / 2 : POINTS_DU_DISQUE;
      ctx.beginPath();
      let prof = 0;
      for (let s = debut; s <= fin; s++) {
        const q = pointDOrbite(o.angle + (s / POINTS_DU_DISQUE) * TAU, rayon, o.aplati, o.noeud, PERSPECTIVE);
        prof += q.profondeur;
        if (s === debut) ctx.moveTo(cx + q.x, cy + q.y); else ctx.lineTo(cx + q.x, cy + q.y);
      }
      prof /= fin - debut + 1;
      /* Le disque s eteint vers l exterieur : la matiere lointaine est
         froide et rare. */
      const bord = clamp01(1 - (o.rayon - 1.25) / 2.8);
      const a = (0.02 + p * 0.075) * o.eclat * bord * lerp(0.35, 1, prof);
      const filet = (0.55 + p * 0.85) * lerp(0.7, 1.3, prof);
      ctx.strokeStyle = rgba(c, Math.max(0, a * 0.3));
      ctx.lineWidth = filet * 2.8;
      ctx.stroke();
      ctx.strokeStyle = rgba(c, Math.max(0, a * 0.75));
      ctx.lineWidth = filet;
      ctx.stroke();
    }

    /* 2. LES GRAINS, et leur trainee : un arc d orbite en arriere, pas un
          segment droit — ce qui tombe en spirale ne laisse pas une trace
          rectiligne. */
    for (const g of grains) {
      const rayon = g.rayon * base * echelle;
      if (rayon <= 1) continue;
      const q = pointDOrbite(g.angle, rayon, g.aplati, g.noeud, PERSPECTIVE);
      if (!cote(q.profondeur)) continue;
      const chaleur = chaleurDuGrain(g.rayon, rc / (base * echelle || 1));
      const teinteDuGrain: Couleur = [
        lerp(c[0], r.trait[0], chaleur), lerp(c[1], r.trait[1], chaleur), lerp(c[2], r.trait[2], chaleur),
      ];
      const vif = (0.18 + p * 0.5) * lerp(0.4, 1, q.profondeur) * (0.35 + chaleur * 0.85);
      if (vif <= 0.01) continue;

      const queue = -0.13 * (1 + p * 1.6);
      ctx.beginPath();
      for (let s = 0; s <= 6; s++) {
        const t = s / 6;
        const w = pointDOrbite(g.angle + queue * t, rayon * (1 + t * 0.045), g.aplati, g.noeud, PERSPECTIVE);
        if (s === 0) ctx.moveTo(cx + w.x, cy + w.y); else ctx.lineTo(cx + w.x, cy + w.y);
      }
      const queueLarge = g.taille * (0.5 + p * 0.7) * q.k;
      ctx.strokeStyle = rgba(teinteDuGrain, vif * 0.22);
      ctx.lineWidth = queueLarge * 2.4;
      ctx.stroke();
      ctx.strokeStyle = rgba(teinteDuGrain, vif * 0.45);
      ctx.lineWidth = queueLarge;
      ctx.stroke();

      const x = cx + q.x, y = cy + q.y;
      const t = g.taille * (1.1 + p * 1.5) * q.k;
      retenir(x, y, chaleur > 0.5);
      const tete = ctx.createRadialGradient(x, y, 0, x, y, t * 2.6);
      tete.addColorStop(0, rgba(r.trait, Math.min(1, vif * 1.6)));
      tete.addColorStop(0.35, rgba(teinteDuGrain, vif * 0.7));
      tete.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = tete;
      disque(ctx, x, y, t * 2.6);
    }

    /* 3. LES IMPACTS. Un grain consomme laisse une morsure sur la coquille
          — sans quoi il disparait, et rien ne dit qu il a ete avale plutot
          qu efface. */
    for (const im of impacts) {
      const u = im.vie / im.duree;
      const q = pointDOrbite(im.angle, rc, im.aplati, im.noeud, PERSPECTIVE);
      if (!cote(q.profondeur)) continue;
      const x = cx + q.x, y = cy + q.y;
      const portee = rc * (0.2 + u * 0.7);
      const a = (1 - u) * (1 - u) * (0.5 + p * 0.5);
      const flash = ctx.createRadialGradient(x, y, 0, x, y, portee);
      flash.addColorStop(0, rgba(r.trait, a * 0.85));
      flash.addColorStop(0.45, rgba(c, a * 0.35));
      flash.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = flash;
      disque(ctx, x, y, portee);
    }
  }

  return { avancer, tracer };
}
