/* LA FIN : CE QUE LE SOUFFLE EMPORTE.
 *
 * Le souffle part UNE FOIS, au premier instant de la projection, et ce
 * sont les jets qui tiennent apres lui. Il se compte depuis son propre
 * depart, pas depuis la phase : la projection ne finit jamais, et sans
 * verrou il repartirait a chaque fois qu il a fini de decroitre.
 *
 * ET IL EMPORTE QUELQUE CHOSE. Une onde qui traverse un ecran vide ne
 * vaporise rien. Les positions des corps en orbite et des grains de
 * matiere sont retenues d une image a l autre ; a l instant du souffle,
 * elles deviennent des eclats projetes. Ce qui tournait autour est ce qui
 * part en morceaux.
 *
 * UN ANNEAU PLUS GROS NE FAIT PAS UNE CONFLAGRATION. Une detonation BOUT
 * — son front est creve d instabilites —, REFROIDIT — blanc, la teinte,
 * un magenta sourd, rien —, a PLUSIEURS FRONTS, et POUSSE ce qu il y a
 * autour. Et elle a de la profondeur, comme le reste de la piece : des
 * grands cercles sur la sphere en expansion, et des eclats dont certains
 * foncent vers nous pendant que d autres s eloignent.
 */
import {
  PORTEE_DE_L_ERADICATION, TAU, clamp01, doux, dureeDeLEradication, lerp, rayonDuSouffle, rgba, teinte,
  type Couleur, type Rendu,
} from "@/domaines/appel/logique/coeur";
import {
  PERSPECTIVE, cercleSurUnAxe, directionSurLaSphere, perpendiculaire, produitVectoriel, type Vecteur,
} from "@/domaines/appel/logique/espace";
import { disque, type Contexte } from "./trace";

interface Eclat { x: number; y: number; vx: number; vy: number; vz: number; vie: number; duree: number; taille: number; chaud: boolean }
interface Secondaire { angle: number; dist: number; retard: number; duree: number; taille: number }
interface Meridien { axe: Vecteur; u1: Vecteur; u2: Vecteur; retard: number; eclat: number }
interface Doigt { angle: number; long: number; retard: number; epais: number }

export interface Souffle { actif: boolean; u: number; rr: number; depuis: number }

const HARMONIQUES_DU_FEU = [
  { k: 4, a: 0.085, w: 1.7 },
  { k: 7, a: 0.055, w: -2.4 },
  { k: 11, a: 0.032, w: 3.1 },
  { k: 17, a: 0.018, w: -4.2 },
];

/* Le front, creve de quatre harmoniques dont l amplitude CROIT avec
   l avancement : la boule est nette a la detonation et se defait. */
function rayonDuFeu(angle: number, rr: number, u: number, graine: number): number {
  let f = 1;
  const agite = 0.35 + u * 1.5;
  for (const h of HARMONIQUES_DU_FEU) f += h.a * agite * Math.sin(h.k * angle + graine + u * h.w * 3);
  return rr * f;
}

/* Le refroidissement : blanc au coeur du temps, la teinte, puis un
   magenta sourd qui s eteint. Une explosion qui garde sa couleur est un
   effet ; une explosion qui refroidit est un evenement. */
function teinteDuFeu(c: Couleur, u: number, r: Rendu): Couleur {
  const chaud = 1 - doux(0, 0.3, u);
  const froid = doux(0.45, 1, u);
  return [
    lerp(lerp(c[0], r.trait[0], chaud), c[0] * 0.45, froid),
    lerp(lerp(c[1], r.trait[1], chaud), c[1] * 0.2, froid),
    lerp(lerp(c[2], r.trait[2], chaud), c[2] * 0.45, froid),
  ];
}

export function creerLaFin(ctx: Contexte) {
  const memoire: { x: number; y: number; chaud: boolean }[] = [];
  const eclats: Eclat[] = [];
  const secondaires: Secondaire[] = [];
  const meridiens: Meridien[] = [];
  const doigts: Doigt[] = [];
  let debut = -1;
  let tire = false;

  function cheminDuFeu(cx: number, cy: number, rr: number, u: number, graine: number, echelle: number) {
    const N = 84;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * TAU;
      const d = rayonDuFeu(a, rr * echelle, u, graine);
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
      else ctx.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
    }
    ctx.closePath();
  }

  /* Ce qui existait devient un eclat, avec sa direction propre ; le reste
     part du point lui-meme, tire SUR LA SPHERE — un angle plat envoyait
     tout dans le plan de la toile, une etoile de mer. */
  function vaporiser(cx: number, cy: number, p: number, immobile: boolean) {
    eclats.length = 0;
    meridiens.length = 0;
    for (let i = 0; i < 5; i++) {
      const axe = directionSurLaSphere();
      const u1 = perpendiculaire(axe);
      meridiens.push({ axe, u1, u2: produitVectoriel(axe, u1), retard: i * 0.045, eclat: 0.55 + Math.random() * 0.5 });
    }
    /* LES DOIGTS DU FRONT : un gaz leger qui pousse un gaz lourd ne reste
       pas lisse, il se perce de pointes — c est a elles qu on reconnait
       une explosion sur une photographie. */
    doigts.length = 0;
    for (let i = 0; i < 30; i++) {
      doigts.push({
        angle: (i / 30) * TAU + (Math.random() - 0.5) * 0.16,
        long: 0.1 + Math.random() * 0.28, retard: Math.random() * 0.2, epais: 0.4 + Math.random() * 1.1,
      });
    }
    /* LA CHAINE DE DETONATIONS : c est le decalage qui fait la chaine,
       pas leur nombre. */
    secondaires.length = 0;
    for (let i = 0; i < (immobile ? 4 : 8); i++) {
      secondaires.push({
        angle: Math.random() * TAU, dist: 0.2 + Math.random() * 0.62, retard: 0.03 + Math.random() * 0.42,
        duree: 0.16 + Math.random() * 0.3, taille: 0.07 + Math.random() * 0.13,
      });
    }
    const portee = 1 + p * 0.6;
    for (const l of memoire) {
      const dx = l.x - cx, dy = l.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const v = (620 + Math.random() * 900) * portee;
      eclats.push({
        x: l.x, y: l.y, vx: (dx / d) * v, vy: (dy / d) * v, vz: (Math.random() - 0.5) * v * 1.2,
        vie: 0, duree: 420 + Math.random() * 520, taille: 1.4 + Math.random() * 2.2, chaud: l.chaud,
      });
    }
    for (let i = 0; i < (immobile ? 120 : 320); i++) {
      const dir = directionSurLaSphere();
      const v = (900 + Math.random() * 3600) * portee;
      eclats.push({
        x: cx, y: cy, vx: dir.x * v, vy: dir.y * v, vz: dir.z * v,
        vie: 0, duree: 520 + Math.random() * 1400, taille: 0.8 + Math.random() * 4.5, chaud: Math.random() < 0.35,
      });
    }
  }

  /* Tire le souffle s il ne l a pas deja ete depuis le dernier
     desarmement, puis dit ou il en est. */
  function souffle(
    tirer: boolean, maintenant: number, cx: number, cy: number, p: number,
    largeur: number, hauteur: number, immobile: boolean,
  ): Souffle {
    if (tirer && debut < 0 && !tire) {
      debut = maintenant;
      tire = true;
      vaporiser(cx, cy, p, immobile);
    }
    const s: Souffle = { actif: false, u: 0, rr: 0, depuis: 0 };
    if (debut >= 0) {
      s.depuis = (maintenant - debut) / 1000;
      const duree = dureeDeLEradication(immobile);
      if (s.depuis > duree * 2.6) { debut = -1; eclats.length = 0; }
      else {
        s.actif = true;
        s.u = clamp01(s.depuis / duree);
        s.rr = rayonDuSouffle(s.u, Math.hypot(largeur, hauteur) * PORTEE_DE_L_ERADICATION, immobile);
      }
    }
    /* LA MEMOIRE SE VIDE APRES LA DETONATION, PAS AVANT : videe en tete
       d image, elle l etait toujours au moment d etre lue, et la moitie de
       l effet manquait sans que rien ne le signale. */
    memoire.length = 0;
    return s;
  }

  function tracer(
    cx: number, cy: number, largeur: number, hauteur: number, c: Couleur, p: number,
    r: Rendu, depuis: number, dt: number, immobile: boolean,
  ) {
    for (const e of eclats) e.vie += dt * 1000;
    const duree = dureeDeLEradication(immobile);
    const u = clamp01(depuis / duree);
    const portee = Math.hypot(largeur, hauteur) * PORTEE_DE_L_ERADICATION;

    /* L IMAGE BLANCHE NE SE FOND PAS, ELLE BAT : elle sature, tient, et
       lache par a-coups — trois battements sur seize centiemes. */
    if (!immobile && depuis < 0.17) {
      const bat = [1, 0.62, 0.34];
      const i = Math.min(bat.length - 1, Math.floor(depuis / 0.057));
      const dans = (depuis % 0.057) / 0.057;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = rgba(r.trait, clamp01(bat[i] * (dans < 0.55 ? 1 : 1 - (dans - 0.55) / 0.45)));
      /* Trois fois le cadre : la camera secoue, zoome et penche — un
         blanc qui laisserait voir un coin de noir n est plus un blanc. */
      ctx.fillRect(-largeur, -hauteur, largeur * 3, hauteur * 3);
      ctx.globalCompositeOperation = r.fusion;
    }
    const rr = rayonDuSouffle(u, portee, immobile);
    const feu = teinteDuFeu(c, u, r);
    const froidure = teinte(clamp01(p - 0.22));
    const chaleur = teinte(clamp01(p + 0.22));

    /* 0. LE BALAYAGE, ET C EST LUI QUI ERADIQUE. Ajouter de la lumiere ne
          detruit rien : ici on RETIRE, et derriere le choc il ne reste
          plus rien du tout — pas un fond sombre, rien. */
    const vide = doux(0.04, 0.4, u);
    ctx.globalCompositeOperation = "destination-out";
    if (vide > 0.01) {
      const balai = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, rr * 0.98));
      balai.addColorStop(0, "rgba(0,0,0," + vide.toFixed(3) + ")");
      balai.addColorStop(0.82, "rgba(0,0,0," + vide.toFixed(3) + ")");
      balai.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = balai;
      disque(ctx, cx, cy, Math.max(1, rr * 0.98));
    }
    /* 1. LA COMPRESSION, un lisere creuse juste devant le choc : le fond y
          est chasse avant d etre atteint. Au-dela de 0,3, ce serait un trou. */
    cheminDuFeu(cx, cy, rr, u, 3.1, 1.1);
    ctx.strokeStyle = "rgba(0,0,0," + (0.3 * (1 - u)).toFixed(3) + ")";
    ctx.lineWidth = 6 + (1 - u) * 20;
    ctx.stroke();
    ctx.globalCompositeOperation = r.fusion;

    /* 2. LA BOULE DE FEU : trois enveloppes creuses decalees — c est leur
          decalage qui fait bouillir le front. */
    for (let n = 0; n < 3; n++) {
      const ech = 1 - n * 0.17;
      const av = clamp01(u + n * 0.05);
      cheminDuFeu(cx, cy, rr, av, 1.7 + n * 2.3, ech);
      const g = ctx.createRadialGradient(cx, cy, rr * ech * 0.35, cx, cy, rr * ech * 1.05);
      g.addColorStop(0, rgba(feu, (1 - av) * (0.1 + n * 0.05)));
      g.addColorStop(0.72, rgba(feu, (1 - av) * (0.24 - n * 0.05)));
      g.addColorStop(1, rgba(n === 0 ? r.trait : feu, (1 - av) * (0.6 - n * 0.16)));
      ctx.fillStyle = g;
      ctx.fill();
    }

    /* 3. LE CHOC, mince et DISPERSE : deux liseres decales d un pour cent,
          un cran en arriere et un cran en avant de la rampe du recit. Le
          bord se frange, comme au travers d un prisme. */
    for (const [ech, couleur, a, l0, l1] of [
      [0.985, froidure, 0.5, 2, 12], [1.015, chaleur, 0.5, 2, 12], [1, r.trait, 0.95, 3, 26],
    ] as [number, Couleur, number, number, number][]) {
      cheminDuFeu(cx, cy, rr * ech, u, 3.1, 1);
      ctx.strokeStyle = rgba(couleur, (1 - u) * a);
      ctx.lineWidth = l0 + (1 - u) * l1;
      ctx.stroke();
    }

    /* 3 bis. LES DOIGTS partent de la boule et la depassent, chacun a son
              rythme : c est cette inegalite qui fait la dechirure. */
    ctx.lineCap = "round";
    for (const dg of doigts) {
      const ud = clamp01((u - dg.retard) / (1 - dg.retard));
      if (ud <= 0) continue;
      const dedans = rr * (0.72 + 0.1 * ud);
      const dehors = rr * (1 + dg.long * doux(0, 0.6, ud));
      const co = Math.cos(dg.angle), si = Math.sin(dg.angle);
      const g = ctx.createLinearGradient(cx + co * dedans, cy + si * dedans, cx + co * dehors, cy + si * dehors);
      const af = (1 - u) * (1 - u) * 0.65;
      g.addColorStop(0, rgba(chaleur, af));
      g.addColorStop(0.55, rgba(r.trait, af * 0.7));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.moveTo(cx + co * dedans, cy + si * dedans);
      ctx.lineTo(cx + co * dehors, cy + si * dehors);
      ctx.strokeStyle = g;
      ctx.lineWidth = dg.epais * (1 + (1 - u) * 5);
      ctx.stroke();
    }

    /* 3 ter. LA GERBE : l aveu de l instrument, une barre horizontale tres
              large et tres breve. C est pour ca qu il rend l image
              credible. */
    const gerbe = 1 - doux(0, 0.22, u);
    if (gerbe > 0.01) {
      const long = portee * (0.5 + gerbe * 1.1);
      const haut = rr * 0.055 + 3;
      const barre = ctx.createLinearGradient(cx - long, cy, cx + long, cy);
      barre.addColorStop(0, "rgba(0,0,0,0)");
      barre.addColorStop(0.42, rgba(chaleur, gerbe * 0.3));
      barre.addColorStop(0.5, rgba(r.trait, gerbe * 0.85));
      barre.addColorStop(0.58, rgba(chaleur, gerbe * 0.3));
      barre.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = barre;
      ctx.fillRect(cx - long, cy - haut, long * 2, haut * 2);
    }

    /* 3 quater. LES MERIDIENS : cinq grands cercles de la sphere en
                 expansion, dont la moitie arriere reste visible — une onde
                 de choc est CREUSE. C est ce calque qui donne le volume. */
    for (const m of meridiens) {
      const um = clamp01((u - m.retard) / (1 - m.retard));
      if (um <= 0 || um >= 1) continue;
      const rayon = rayonDuSouffle(um, portee, immobile);
      const teinteM = teinteDuFeu(c, um, r);
      const a = (1 - um) * (1 - um) * 0.5 * m.eclat;
      const epaisseur = 1.5 + (1 - um) * 7;
      const pts = cercleSurUnAxe(m.axe, m.u1, m.u2, Math.PI / 2);
      for (let i = 0; i < pts.length - 1; i++) {
        const v0 = pts[i], v1 = pts[i + 1];
        const prof = ((v0.z + v1.z) / 2 + 1) / 2;
        const k0 = 1 / (1 - v0.z * PERSPECTIVE), k1 = 1 / (1 - v1.z * PERSPECTIVE);
        ctx.beginPath();
        ctx.moveTo(cx + v0.x * rayon * k0, cy + v0.y * rayon * k0);
        ctx.lineTo(cx + v1.x * rayon * k1, cy + v1.y * rayon * k1);
        ctx.strokeStyle = rgba(prof > 0.5 ? r.trait : teinteM, a * lerp(0.2, 1, prof));
        ctx.lineWidth = epaisseur * lerp(0.45, 1.3, prof);
        ctx.stroke();
      }
    }

    /* 4. LE NOYAU QUI TRANSPARAIT, plus lent a s eteindre que le front :
          c est ce decalage qui creuse l image. Puis la masse dense, qui
          suit le choc et s en detache — quatre fronts plus lents, plus
          larges, plus froids. */
    const braise = ctx.createRadialGradient(cx, cy, 0, cx, cy, portee * 0.26);
    braise.addColorStop(0, rgba(r.trait, Math.pow(1 - u, 1.5) * 0.8));
    braise.addColorStop(0.3, rgba(chaleur, Math.pow(1 - u, 1.6) * 0.45));
    braise.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = braise;
    disque(ctx, cx, cy, portee * 0.26);
    for (let k = 1; k <= 4; k++) {
      const ur = clamp01(u - k * 0.075);
      if (ur <= 0) continue;
      cheminDuFeu(cx, cy, rayonDuSouffle(ur, portee, false), ur, 5.4 + k, 1);
      ctx.strokeStyle = rgba(teinteDuFeu(c, ur, r), ((1 - ur) * 0.3) / k);
      ctx.lineWidth = 4 + ((1 - ur) * 44) / k;
      ctx.stroke();
    }

    /* 5. LES DETONATIONS SECONDAIRES : un pop est unique, une
          conflagration est une CHAINE. */
    for (const s of secondaires) {
      const us = clamp01((depuis - s.retard) / s.duree);
      if (us <= 0 || us >= 1) continue;
      const x = cx + Math.cos(s.angle) * rr * s.dist, y = cy + Math.sin(s.angle) * rr * s.dist;
      const large = portee * s.taille * (0.25 + us * 0.9);
      const a = (1 - us) * (1 - us);
      const g = ctx.createRadialGradient(x, y, 0, x, y, large);
      g.addColorStop(0, rgba(r.trait, a * 0.8));
      g.addColorStop(0.3, rgba(teinteDuFeu(c, us, r), a * 0.45));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      disque(ctx, x, y, large);
    }

    /* LES ECLATS partent plus vite que le front et se font rattraper. Chacun
       porte un `z` : la distance de camera change la vitesse vers nous en
       GROSSISSEMENT — un eclat qui fonce arrive gros, court et bref. */
    const camera = portee * 0.85;
    for (const e of eclats) {
      const v = e.vie / e.duree;
      if (v >= 1) continue;
      const reste = 1 - v;
      const t = (e.vie / 1000) * (1 - v * 0.45);
      const z = e.vz * t;
      if (z >= camera * 0.92) continue;
      const k = camera / (camera - z);
      const x = cx + (e.x - cx + e.vx * t) * k;
      const y = cy + (e.y - cy + e.vy * t) * k;
      const tr = 0.05 * reste;
      ctx.beginPath();
      ctx.moveTo(x - e.vx * tr * k, y - e.vy * tr * k);
      ctx.lineTo(x, y);
      ctx.strokeStyle = rgba(e.chaud ? r.trait : c, reste * reste * 0.85 * clamp01(k * 0.75));
      ctx.lineWidth = Math.max(0.4, e.taille * reste * k);
      ctx.stroke();
    }

    /* LA POUSSIERE QUI RESTE : sans elle, l ecran passe du blanc au noir
       en une image, et le rituel se termine par une coupure. */
    const cendre = clamp01((depuis - duree * 0.5) / (duree * 2.2));
    if (cendre > 0 && cendre < 1) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, portee * 0.85);
      g.addColorStop(0, rgba(c, (1 - cendre) * 0.16));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, largeur, hauteur);
    }
  }

  return {
    retenir(x: number, y: number, chaud: boolean) {
      if (memoire.length < 64) memoire.push({ x, y, chaud });
    },
    souffle,
    tracer,
    /** Hors de la projection, rien n est verrouille : la prochaine pourra tirer. */
    desarmer() {
      tire = false;
    },
    /** Quitter l ecran de la projection coupe le souffle net. */
    arreter() {
      debut = -1;
      eclats.length = 0;
    },
  };
}
