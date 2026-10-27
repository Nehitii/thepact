/* LE NEXUS : UNE SPHERE, PAS UNE TACHE.
 *
 * CE QUI MANQUAIT A LA LUEUR N ETAIT PAS DE LA LUMIERE, C ETAIT UN BORD.
 * Un degrade maximal au centre et nul au bord peint une tache : l oeil
 * n a aucun moyen de decider si c est une sphere ou un trou dans le noir.
 * Ce qui fait lire une sphere, c est le LIMBE — le bord plus clair que le
 * milieu, parce qu on y traverse plus de matiere. Tout le reste, champ et
 * eclairs, ne tient que parce qu il y a une coquille pour le contenir.
 *
 * ET LA COQUILLE EST UNE, MEME DEDOUBLEE. A la scission on ne peint pas
 * deux coquilles qui se chevauchent — deux limbes et une lentille au
 * milieu — mais UNE : l enveloppe des deux lobes, pincee au milieu. Un
 * seul corps qu on etire, pas deux qui se touchent.
 */
import { TAU, clamp01, deplacementParGravite, doux, rgba, teinte, type Couleur, type Rendu } from "@/domaines/appel/logique/coeur";
import {
  PERSPECTIVE, cercleSurUnAxe, perpendiculaire, produitVectoriel, type Vecteur,
} from "@/domaines/appel/logique/espace";
import { teinteDuLobe } from "@/domaines/appel/logique/fusion";
import type { creerLeChamp } from "./champ";
import { disque, tracerLeCercle, type Contexte } from "./trace";

/* LE BUDGET D ECLAT. En fusion additive tout s ajoute, et comme chaque
   calque monte avec l avancement, la somme saturait bien avant la fin :
   il ne restait qu une boule blanche. L interieur REND ce que le limbe
   PREND — matiere au debut, contour a la fin. */
const RESERVE = 0.5;
/** L epaisseur du limbe, en part du rayon. */
const COQUILLE = 0.55;
/** La strie anamorphique : s il se remarque, c est qu il est trop fort. */
const STRIE = 0.45;
/* LA REFRACTION : une bille de verre RAMASSE le plan derriere elle. La
   grille est redessinee dans la coquille, chaque sommet ramene par
   `d -> R·d/(d + R·1,1)` — une compression plausible, pas une loi de
   Snell, mais c est la compression qui se lit. On s arrete a trois
   rayons et demi, ou tout est deja ecrase contre le limbe. */
const PORTEE_DE_LA_LENTILLE = 3.5;
/* LE LIMBE ETAIT LA SEULE CHOSE PARFAITE DE L IMAGE. Deux pour cent
   d irregularite, en trois harmoniques tres basses qui TOURNENT AVEC LES
   PARALLELES : l irregularite appartient au corps, pas a son dessin. */
const RELIEF_DE_LA_COQUILLE = [
  { k: 2, a: 0.013 },
  { k: 3, a: 0.008 },
  { k: 5, a: 0.0045 },
];
const AXE_VERTICAL: Vecteur = { x: 0, y: 0, z: 1 };
const AXE_X: Vecteur = { x: 1, y: 0, z: 0 };
const AXE_Y: Vecteur = { x: 0, y: 1, z: 0 };
const PARALLELES = [0.75, 1.35, 1.95];

/** Ce que la refraction doit savoir de la grille qu elle ramasse. */
export interface GrilleVue { cx: number; cy: number; base: number }

export function creerLeNexus(ctx: Contexte, champ: ReturnType<typeof creerLeChamp>) {
  let lacet = 0;
  const ondes: { vie: number; duree: number }[] = [];
  let impulsionPrecedente = 0;

  const relief = (angle: number) => {
    let f = 1;
    for (const h of RELIEF_DE_LA_COQUILLE) f += h.a * Math.sin(h.k * (angle - lacet));
    return f;
  };

  /* L enveloppe des deux lobes se calcule exactement : pour un rayon
     partant du milieu, l intersection la plus lointaine avec l un des deux
     cercles. Perpendiculairement a l axe elle vaut `racine(R² - d²)` :
     c est le pincement, et il sort du calcul, pas d un reglage. */
  function cheminDeLaCoquille(lx: number, ly: number, rc: number, sep: number, sens = 1) {
    const N = 72;
    for (let i = 0; i <= N; i++) {
      const a = ((sens > 0 ? i : N - i) / N) * TAU;
      const ux = Math.cos(a), uy = Math.sin(a);
      let t = rc;
      if (sep > 0.5) {
        t = 0;
        for (const d of [-sep, sep]) {
          const b = ux * d;
          const sous = b * b - d * d + rc * rc;
          if (sous > 0) t = Math.max(t, b + Math.sqrt(sous));
        }
      }
      t *= relief(a);
      if (i === 0) ctx.moveTo(lx + ux * t, ly + uy * t); else ctx.lineTo(lx + ux * t, ly + uy * t);
    }
    ctx.closePath();
  }

  function refracterLaGrille(lx: number, ly: number, rc: number, c: Couleur, p: number, g: GrilleVue) {
    const pas = 46 * 1.5;
    const portee = rc * PORTEE_DE_LA_LENTILLE;
    const deplacer = (x: number, y: number) => {
      const [gx, gy] = deplacementParGravite(x, y, g.cx, g.cy, g.base, p);
      const vx = gx - g.cx, vy = gy - g.cy;
      const k = (rc * 0.98) / ((Math.hypot(vx, vy) || 1e-6) + rc * 1.1);
      return [lx + vx * k, ly + vy * k];
    };
    ctx.beginPath();
    for (let x = -portee; x <= portee; x += pas) {
      for (let y = -portee; y <= portee; y += pas / 3) {
        const [px, py] = deplacer(g.cx + x, g.cy + y);
        if (y === -portee) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
    for (let y = -portee; y <= portee; y += pas) {
      for (let x = -portee; x <= portee; x += pas / 3) {
        const [px, py] = deplacer(g.cx + x, g.cy + y);
        if (x === -portee) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
    ctx.strokeStyle = rgba(c, 0.05 + p * 0.13);
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  /* L ONDE DE L APPUI part du pole qui nous fait face : le doigt a frappe
     de ce cote. L appui se detecte au SAUT, pas au niveau — `impulsion`
     retombe a 3,4 par seconde. */
  function avancerLaSurface(dt: number, impulsion: number) {
    if (impulsion > impulsionPrecedente + 0.4) {
      ondes.push({ vie: 0, duree: 620 });
      if (ondes.length > 4) ondes.shift();
    }
    impulsionPrecedente = impulsion;
    for (let i = ondes.length - 1; i >= 0; i--) {
      ondes[i].vie += dt * 1000;
      if (ondes[i].vie >= ondes[i].duree) ondes.splice(i, 1);
    }
  }

  /* `aura` : le poids que la table de montage donne a la portee de l aura ;
     `grille` : la grille a ramasser, ou rien sur un petit ecran. */
  function peindre(
    lx: number, ly: number, rc: number, c: Couleur, p: number, eclat: number, maintenant: number,
    r: Rendu, sep: number, grille: GrilleVue | null, aura: number, purete: number,
  ) {
    const interieur = 1 - RESERVE * p;
    const contour = 1 + RESERVE * p * 0.7;
    /* Le relief du limbe et les paralleles partagent le lacet : sinon le
       bord ondoierait dans son coin pendant que la surface tourne. */
    lacet = (maintenant / 1000) * (0.06 + p * 0.22);
    const vif = Math.min(1, (0.5 + p * 0.5) * eclat);

    /* 1. LE HALO EST UN ANNEAU, PAS UN DISQUE. Peint en disque, il
          pre-eclairait l interieur et tout partait au blanc. Sa portee se
          lit dans la table de montage : 2,8 rayons a un, 1,4 a zero. */
    const porteeAura = rc * (1.4 + 1.4 * aura);
    const halo = ctx.createRadialGradient(lx, ly, rc * 0.98, lx, ly, porteeAura);
    halo.addColorStop(0, rgba(c, Math.min(1, (0.3 + p * 0.28) * eclat)));
    halo.addColorStop(0.28, rgba(c, (0.11 + p * 0.18) * eclat));
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(lx, ly, porteeAura, 0, TAU);
    cheminDeLaCoquille(lx, ly, rc * 0.98, sep * 0.98, -1);
    ctx.fill();

    /* 2. L interieur, enferme dans la coquille : le `clip` fait la
          difference entre une matiere CONTENUE et un nuage. La refraction
          passe en premier — c est du fond ramasse, donc le plus loin. */
    ctx.save();
    ctx.beginPath(); cheminDeLaCoquille(lx, ly, rc, sep); ctx.clip();
    if (grille) refracterLaGrille(lx, ly, rc, c, p, grille);
    const cote = rc * 1.9;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = interieur;
    ctx.drawImage(champ.toile, lx - cote, ly - cote, cote * 2, cote * 2);
    ctx.globalAlpha = 1;

    /* 3. LES ECLAIRS, en trois passes par branche : une lueur large et
          coloree, une passe intermediaire, un fil blanc surexpose. Et ils
          BATTENT pendant qu ils vivent, puis cessent : un eclair ne
          s eteint pas en fondu. */
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const e of champ.eclairs) {
      const u = e.vie / e.duree;
      const bat = 0.45 + 0.55 * Math.abs(Math.sin(u * 17 + e.graine));
      const a = (1 - u) * bat * e.eclat * eclat * interieur;
      if (a <= 0.01) continue;
      const ep = e.epaisseur * (0.55 + p * 0.9);
      for (let branche = 0; branche < e.branches.length; branche++) {
        const pts = e.branches[branche];
        const part = branche === 0 ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(lx + pts[0].x * rc, ly + pts[0].y * rc);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(lx + pts[i].x * rc, ly + pts[i].y * rc);
        ctx.strokeStyle = rgba(c, a * 0.3 * part);
        ctx.lineWidth = ep * 6 * part;
        ctx.stroke();
        ctx.strokeStyle = rgba(c, a * 0.55 * part);
        ctx.lineWidth = ep * 2.4 * part;
        ctx.stroke();
        ctx.strokeStyle = rgba(r.trait, a * 0.95 * part);
        ctx.lineWidth = ep * part;
        ctx.stroke();
      }
      /* La coquille encaisse le point de chute : sans cette morsure,
         l eclair s arrete dans le vide. */
      const x = lx + Math.cos(e.chute) * rc, y = ly + Math.sin(e.chute) * rc;
      const morsure = ctx.createRadialGradient(x, y, 0, x, y, rc * 0.42);
      morsure.addColorStop(0, rgba(r.trait, a * 0.75));
      morsure.addColorStop(0.4, rgba(c, a * 0.35));
      morsure.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = morsure;
      disque(ctx, x, y, rc * 0.42);
    }

    /* 4. LE LIMBE, PEINT PAR L INTERIEUR, et sa couleur dit l epaisseur
          traversee : il prend la teinte un cran plus loin sur la rampe du
          recit — pas une couleur inventee, la suivante. */
    const limbe = ctx.createRadialGradient(lx, ly, 0, lx, ly, rc);
    limbe.addColorStop(0, "rgba(0,0,0,0)");
    limbe.addColorStop(Math.max(0.05, 1 - COQUILLE), "rgba(0,0,0,0)");
    limbe.addColorStop(0.72, rgba(c, Math.min(1, vif * 0.22 * contour)));
    limbe.addColorStop(0.93, rgba(teinte(clamp01(p + 0.15)), Math.min(1, vif * 0.55 * contour)));
    limbe.addColorStop(1, rgba(r.trait, Math.min(1, vif * 0.9 * contour)));
    ctx.fillStyle = limbe;
    ctx.beginPath(); cheminDeLaCoquille(lx, ly, rc, sep); ctx.fill();

    /* 4 bis. LES PARALLELES. La coquille ne tournait pas : deux ou trois
              cercles tres pales autour d un axe incline suffisent, et
              l oeil conclut. L equateur, plus dense que les poles, donne
              un AXE au volume. */
    const incl = 0.42;
    const axe = { x: Math.sin(incl) * Math.cos(lacet), y: Math.sin(incl) * Math.sin(lacet), z: Math.cos(incl) };
    const u1 = perpendiculaire(axe);
    const u2 = produitVectoriel(axe, u1);
    ctx.lineCap = "round";
    for (const theta of PARALLELES) {
      tracerLeCercle(ctx, cercleSurUnAxe(axe, u1, u2, theta), lx, ly, rc, PERSPECTIVE, 0.995);
      ctx.strokeStyle = rgba(c, (0.05 + p * 0.09) * interieur * eclat);
      ctx.lineWidth = 0.8 + p * 1.1;
      ctx.stroke();
    }
    const norme = Math.hypot(axe.x, axe.y) || 1;
    const ax = axe.x / norme, ay = axe.y / norme;
    const bande = ctx.createLinearGradient(lx - ax * rc, ly - ay * rc, lx + ax * rc, ly + ay * rc);
    bande.addColorStop(0, "rgba(0,0,0,0)");
    bande.addColorStop(0.5, rgba(c, (0.05 + p * 0.1) * interieur * eclat));
    bande.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bande;
    ctx.beginPath(); cheminDeLaCoquille(lx, ly, rc, sep); ctx.fill();

    /* 4 ter. L ONDE DE L APPUI court sur la sphere jusqu au limbe. */
    for (const o of ondes) {
      const u = o.vie / o.duree;
      const theta = doux(0, 1, u) * 1.55;
      tracerLeCercle(ctx, cercleSurUnAxe(AXE_VERTICAL, AXE_X, AXE_Y, theta), lx, ly, rc, PERSPECTIVE, 1.004);
      ctx.strokeStyle = rgba(r.trait, (1 - u) * (1 - u) * (0.5 + p * 0.4) * eclat);
      ctx.lineWidth = (1.4 + p * 2.2) * (1 - u * 0.5);
      ctx.stroke();
    }
    ctx.restore();

    /* 5. LE NOYAU EST PETIT — un tiers de rayon suffit a en faire le seul
          blanc franc de la scene. Dedouble, deux points chauds dans une
          seule coquille, et la couleur de chacun remonte vers son centre :
          a 0,45 du rayon, le blanc du coeur la couvrait. */
    for (const dx of sep > 0.5 ? [-sep, sep] : [0]) {
      const cote = Math.abs(Math.sign(dx));
      const large = rc * (sep > 0.5 ? 0.32 : 0.38);
      const noyau = ctx.createRadialGradient(lx + dx, ly, 0, lx + dx, ly, large);
      noyau.addColorStop(0, rgba(r.trait, Math.min(1, (0.62 + p * 0.2) * eclat * interieur)));
      noyau.addColorStop(0.45 - 0.2 * purete * cote, rgba(teinteDuLobe(c, Math.sign(dx), purete),
        Math.min(1, (0.24 + p * 0.3 + 0.25 * purete * cote) * eclat * interieur)));
      noyau.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = noyau;
      disque(ctx, lx + dx, ly, large);
    }

    /* 6. L arete : la coquille a un bord, pas un degrade qui s eteint. */
    ctx.beginPath(); cheminDeLaCoquille(lx, ly, rc, sep);
    ctx.strokeStyle = rgba(r.trait, vif * 0.75);
    ctx.lineWidth = 1 + p * 1.8;
    ctx.stroke();

    /* 7. La strie anamorphique, une seule, horizontale, tres pale. */
    const portee = rc * (3.4 + p * 4.5) * STRIE;
    const strie = ctx.createLinearGradient(lx - portee, ly, lx + portee, ly);
    strie.addColorStop(0, "rgba(0,0,0,0)");
    strie.addColorStop(0.5, rgba(c, Math.min(0.5, (0.1 + p * 0.22) * eclat)));
    strie.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = strie;
    ctx.fillRect(lx - portee, ly - rc * 0.09, portee * 2, rc * 0.18);
  }

  return { avancerLaSurface, peindre };
}
