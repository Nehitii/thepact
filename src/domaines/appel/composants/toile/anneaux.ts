/* LES ANNEAUX : DES ORBITES, PAS DES ELLIPSES QUI PIVOTENT.
 *
 * L angle d orbite servait d angle d ellipse : le dessin pivotait au lieu
 * de tourner, et tout etait peint avant le coeur, donc rien ne passait
 * jamais devant lui. Chaque anneau est maintenant une orbite projetee —
 * un plan incline, un noeud, une moitie arriere peinte avant le coeur et
 * une moitie avant apres lui — que parcourt un CORPS. Ce sont les corps
 * qu on regarde ; le fil ne fait que dire ou ils passent.
 */
import {
  NB_ANNEAUX, TAU, clamp01, geometrieDUnAnneau, lerp, rgba, vitesseDUnAnneau,
  type Anneau, type Couleur, type EtatDesAnneaux, type Rendu,
} from "@/domaines/appel/logique/coeur";
import type { EtatDuRecit } from "@/domaines/appel/logique/coeurRecit";
import {
  NOEUDS_BASE, PERSPECTIVE, POINTS_PAR_ORBITE, eclatSelonProfondeur, pointDOrbite, traitSelonProfondeur,
} from "@/domaines/appel/logique/espace";
import {
  DUREE_DU_CLAC, DUREE_DU_CLIQUET, aCoupDuVerrou, avancerLeVerrou, avancerLesPlans, plansNeufs, verrouNeuf,
} from "@/domaines/appel/logique/plans";
import { disque, type Contexte } from "./trace";

interface PointPeint { x: number; y: number; profondeur: number }

export interface Echantillon extends Anneau {
  aplati?: number;
  pts?: PointPeint[];
}

interface Passage { x: number; y: number; prof: number; k: number; t: number }

/* LE SILLAGE EST UN SOUVENIR, PAS UN CALCUL : l historique des positions
   reellement peintes, purge par l AGE. La longueur devient une
   consequence de la vitesse, et quand un plan encaisse le coup d une
   pulsation, la queue fouette — elle se souvient d ou le corps etait
   quand le plan etait ailleurs. La borne en points n est qu un
   garde-fou memoire. */
const PERSISTANCE = 450;
const MAX_POINTS_DU_SILLAGE = 120;
/* Le demi-anneau est peint en cinq bandes, une passe chacune : assez pour
   garder le degrade de profondeur, assez peu pour qu aucune jointure ne
   perle en fusion additive. */
const BANDES = 5;
/** La largeur du fil : le tiers de ce que valait le trait plein. */
const filDuTrait = (p: number) => 0.7 + p * 0.7;

export type Retenir = (x: number, y: number, chaud: boolean) => void;

export function creerLesAnneaux(ctx: Contexte) {
  const angles = Array.from({ length: NB_ANNEAUX }, (_, i) => (i / NB_ANNEAUX) * TAU);
  const sens = Array.from({ length: NB_ANNEAUX }, (_, i) => (i % 2 === 0 ? 1 : -1));
  const noeuds = [...NOEUDS_BASE];
  const plans = plansNeufs();
  const verrou = verrouNeuf();
  const sillages: Passage[][] = Array.from({ length: NB_ANNEAUX }, () => []);
  /* LES POINTS SE REECRIVENT, ILS NE SE RECREENT PAS : deux cent
     quarante-cinq objets jetes par image finissent par faire passer le
     ramasse-miettes, et quand il passe, ca se voit. */
  const tampons = Array.from({ length: NB_ANNEAUX }, () =>
    Array.from({ length: POINTS_PAR_ORBITE + 1 }, () => ({ x: 0, y: 0, profondeur: 0 })));

  function avancer(dt: number, p: number, recit: EtatDuRecit, immobile: boolean, maintenant: number) {
    const lent = immobile ? 0.15 : 1;
    for (let i = 0; i < NB_ANNEAUX; i++) angles[i] += dt * vitesseDUnAnneau(i, p, sens[i]) * lent;
    /* L inclinaison peinte n est pas celle du recit : la machine a etats
       garde la sienne, intacte et testee ; le dessin suit une version
       amortie de la meme consigne. */
    avancerLesPlans(plans, dt * lent, p, recit, noeuds);
    avancerLeVerrou(verrou, plans, recit.alignement, maintenant);
  }

  /* La geometrie des cinq anneaux, une fois par image : les deux passes
     lisent le meme echantillonnage. Le passage des corps se retient ICI,
     une seule fois — l enregistrer au trace doublerait l historique. */
  function echantillonner(
    etat: Omit<EtatDesAnneaux, "angles" | "inclinaisons">, horloge: number,
  ): Echantillon[] {
    const complet: EtatDesAnneaux = { ...etat, angles, inclinaisons: plans.incl };
    const echs: Echantillon[] = [];
    for (let i = 0; i < NB_ANNEAUX; i++) {
      const g: Echantillon = geometrieDUnAnneau(i, complet);
      echs.push(g);
      /* Un rayon nul — l echelle tombe presque a zero en fin de course —
         ne s echantillonne pas : la perspective divise par lui. */
      if (g.rx <= 0.01) continue;
      g.aplati = Math.min(0.999, Math.abs(g.ry / g.rx));
      g.pts = tampons[i];
      for (let s = 0; s <= POINTS_PAR_ORBITE; s++) {
        const q = pointDOrbite((s / POINTS_PAR_ORBITE) * TAU, g.rx, g.aplati, noeuds[i], PERSPECTIVE);
        const t = g.pts[s];
        t.x = g.ex + q.x; t.y = g.ey + q.y; t.profondeur = q.profondeur;
      }
      const c = pointDOrbite(angles[i], g.rx, g.aplati, noeuds[i], PERSPECTIVE);
      const s = sillages[i];
      s.push({ x: g.ex + c.x, y: g.ey + c.y, prof: c.profondeur, k: c.k, t: horloge });
      while (s.length && s[0].t < horloge - PERSISTANCE) s.shift();
      while (s.length > MAX_POINTS_DU_SILLAGE) s.shift();
    }
    return echs;
  }

  /* LA MOITIE DEMANDEE EST UN INTERVALLE, PAS UNE SELECTION. `profondeur`
     depasse un demi exactement sur u dans (0, pi) : la moitie avant est
     les indices 0 a N/2, l arriere N/2 a N — deux morceaux contigus qui
     se raccordent sans trou. */
  const moitie = (devant: boolean) => {
    const N = POINTS_PAR_ORBITE;
    return devant ? [0, N / 2] : [N / 2, N];
  };

  function cheminer(pts: PointPeint[], i0: number, i1: number) {
    ctx.beginPath();
    ctx.moveTo(pts[i0].x, pts[i0].y);
    for (let s = i0 + 1; s <= i1; s++) ctx.lineTo(pts[s].x, pts[s].y);
  }

  function tracer(
    devant: boolean, echs: Echantillon[], c: Couleur, p: number, rCoeur: number,
    cx: number, cy: number, r: Rendu, horloge: number, retenir: Retenir,
  ) {
    const portee = rCoeur * 2.6;
    const [debut, fin] = moitie(devant);
    const bande = (b: number) => [
      debut + Math.floor((b * (fin - debut)) / BANDES),
      debut + Math.ceil(((b + 1) * (fin - debut)) / BANDES),
    ];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    /* LE CREUSEMENT NE FAIT QUE POSER LA TRAJECTOIRE DEVANT : a peine plus
       large que le fil, plafonne a 0,22 — de quoi detacher la trajectoire
       de la lueur, pas de quoi la barrer. */
    if (devant) {
      ctx.globalCompositeOperation = "destination-out";
      for (const g of echs) {
        if (!g.pts) continue;
        for (let b = 0; b < BANDES; b++) {
          const [i0, i1] = bande(b);
          const m = g.pts[(i0 + i1) >> 1];
          const d = Math.hypot(m.x - cx, m.y - cy);
          if (d > portee) continue;
          cheminer(g.pts, i0, i1);
          ctx.strokeStyle = "rgba(0,0,0," + (0.22 * clamp01(1 - d / portee)).toFixed(3) + ")";
          ctx.lineWidth = filDuTrait(p) * 2.6 + 1;
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = r.fusion;
    }

    /* LE FIL. Un voile large et tres pale qui lui donne son assise, un fil
       fin par-dessus — et les deux au tiers de l eclat de l anneau. */
    for (const g of echs) {
      if (!g.pts) continue;
      for (let b = 0; b < BANDES; b++) {
        const [i0, i1] = bande(b);
        const prof = g.pts[(i0 + i1) >> 1].profondeur;
        const f = eclatSelonProfondeur(prof);
        const fil = filDuTrait(p) * traitSelonProfondeur(prof);
        cheminer(g.pts, i0, i1);
        ctx.strokeStyle = rgba(c, Math.max(0, g.alpha * f) * 0.13);
        ctx.lineWidth = fil * 3.4;
        ctx.stroke();
        cheminer(g.pts, i0, i1);
        ctx.strokeStyle = rgba(r.trait, Math.max(0, g.alpha * f) * 0.34);
        ctx.lineWidth = fil;
        ctx.stroke();
      }
    }

    tracerLesCorps(devant, echs, c, p, cx, cy, portee, r, horloge, retenir);
  }

  /* LES CORPS. Quatre choses leur donnent leur presence, et aucune n est
     la taille seule : un sillage qui dit d ou ils viennent, un halo
     colore, un noyau blanc surexpose, et — pour ceux qui passent devant —
     un vrai creusement du coeur : un corps devant la lueur doit la
     boucher. */
  function tracerLesCorps(
    devant: boolean, echs: Echantillon[], c: Couleur, p: number, cx: number, cy: number,
    portee: number, r: Rendu, horloge: number, retenir: Retenir,
  ) {
    for (let i = 0; i < NB_ANNEAUX; i++) {
      const g = echs[i];
      if (!g.pts) continue;
      const u = angles[i];
      const prof = (Math.sin(u) + 1) / 2;
      if ((prof > 0.5) !== devant) continue;
      const q = pointDOrbite(u, g.rx, g.aplati ?? 0, noeuds[i], PERSPECTIVE);
      const x = g.ex + q.x, y = g.ey + q.y;
      const taille = (2.6 + p * 4.2) * q.k;
      /* L eclat suit la profondeur, mais moins que le fil : un corps qui
         passe derriere doit rester un corps. */
      const vif = lerp(0.55, 1, prof) * clamp01(g.alpha * 4);
      if (vif <= 0.01) continue;

      /* Le sillage, du plus vieux au plus recent : chaque point garde la
         profondeur qu il avait quand il a ete traverse, et s eteint deux
         fois, par l age et par la profondeur. La tete, blanche et courte,
         donne la vitesse. */
      const s = sillages[i];
      for (let j = 0; j < s.length - 1; j++) {
        const a = s[j], b = s[j + 1];
        const reste = clamp01(1 - (horloge - b.t) / PERSISTANCE);
        if (reste <= 0.01) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = rgba(c, vif * reste * reste * lerp(0.45, 1, (a.prof + b.prof) / 2) * 0.6);
        ctx.lineWidth = Math.max(0.4, taille * 0.85 * reste);
        ctx.stroke();
      }
      for (let j = 0; j < s.length - 1; j++) {
        const a = s[j], b = s[j + 1];
        const reste = clamp01(1 - (horloge - b.t) / PERSISTANCE);
        if (reste <= 0.55) continue;
        const chaud = (reste - 0.55) / 0.45;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = rgba(r.trait, vif * chaud * chaud * 0.5);
        ctx.lineWidth = Math.max(0.3, taille * 0.42 * chaud);
        ctx.stroke();
      }

      if (devant && Math.hypot(x - cx, y - cy) < portee) {
        ctx.globalCompositeOperation = "destination-out";
        const trou = ctx.createRadialGradient(x, y, 0, x, y, taille * 2.1);
        trou.addColorStop(0, "rgba(0,0,0,0.92)");
        trou.addColorStop(0.6, "rgba(0,0,0,0.7)");
        trou.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = trou;
        disque(ctx, x, y, taille * 2.1);
        ctx.globalCompositeOperation = r.fusion;
      }

      /* LE REFLET SUR LE LIMBE. Quand un corps frole le bord de la
         coquille, un eclat court y repond, au meme angle : les deux
         systemes cessent d etre etrangers. Au FROLEMENT, pas au
         recouvrement — un corps au milieu du disque est devant, il ne
         reflete rien. */
      const rCoquille = portee / 2.6;
      if (devant && rCoquille > 1) {
        const frole = 1 - clamp01(Math.abs(Math.hypot(x - cx, y - cy) - rCoquille) / (rCoquille * 0.18));
        if (frole > 0.01) {
          const angle = Math.atan2(y - cy, x - cx);
          const large = 0.1 + 0.12 * frole;
          ctx.beginPath();
          ctx.arc(cx, cy, rCoquille, angle - large, angle + large);
          ctx.strokeStyle = rgba(r.trait, frole * frole * (0.22 + p * 0.4));
          ctx.lineWidth = 1.4 + p * 2.4;
          ctx.stroke();
        }
      }

      retenir(x, y, true);
      const halo = ctx.createRadialGradient(x, y, 0, x, y, taille * 4.2);
      halo.addColorStop(0, rgba(c, vif * 0.85));
      halo.addColorStop(0.3, rgba(c, vif * 0.4));
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      disque(ctx, x, y, taille * 4.2);

      const noyau = ctx.createRadialGradient(x, y, 0, x, y, taille * 1.35);
      noyau.addColorStop(0, rgba(r.trait, Math.min(1, vif * 1.1)));
      noyau.addColorStop(0.45, rgba(r.trait, vif * 0.6));
      noyau.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = noyau;
      disque(ctx, x, y, taille * 1.35);
    }
  }

  /* Un arc de rail, de la queue a la tete, peint en morceaux CONTIGUS :
     des segments separes perlent a chaque jointure. Les indices sortent
     du demi-anneau de la passe ? le morceau s arrete, l autre passe le
     reprend. */
  function tracerUnArcDeRail(
    pts: PointPeint[], queue: number, tete: number, debut: number, fin: number,
    vive: Couleur, intensite: number, largeur: number,
  ) {
    const N = POINTS_PAR_ORBITE;
    const longueur = Math.abs(tete - queue);
    const n = Math.max(1, Math.ceil(longueur));
    const pas = tete >= queue ? 1 : -1;
    let ouvert = false, premier: PointPeint | null = null, dernier: PointPeint | null = null;
    let kPremier = 0, kDernier = 0;
    const fermer = () => {
      if (ouvert && premier && dernier && premier !== dernier) {
        const g = ctx.createLinearGradient(premier.x, premier.y, dernier.x, dernier.y);
        g.addColorStop(0, rgba(vive, kPremier * intensite));
        g.addColorStop(1, rgba(vive, kDernier * intensite));
        ctx.strokeStyle = g;
        ctx.lineWidth = largeur;
        ctx.stroke();
      }
      ouvert = false;
    };
    for (let j = 0; j <= n; j++) {
      const f = queue + pas * Math.min(j, longueur);
      const indice = ((Math.round(f) % N) + N) % N;
      const k = j / n;
      if (indice < debut || indice > fin) { fermer(); continue; }
      const q = pts[indice];
      if (!ouvert) { ctx.beginPath(); ctx.moveTo(q.x, q.y); ouvert = true; premier = q; kPremier = k; }
      else ctx.lineTo(q.x, q.y);
      dernier = q; kDernier = k;
    }
    fermer();
  }

  /* LE CLIQUET ET LE CLAC. Le rail s allume d un seul trait, et une
     etincelle part du corps, dans son sens de rotation, pour en faire le
     tour en decelerant. En mouvement reduit, le rail s allume sans que
     rien ne coure dessus. */
  function tracerLeVerrou(devant: boolean, echs: Echantillon[], r: Rendu, maintenant: number, immobile: boolean) {
    const N = POINTS_PAR_ORBITE;
    const [debut, fin] = moitie(devant);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < NB_ANNEAUX; i++) {
      const g = echs[i];
      if (!g || !g.pts) continue;
      for (let source = 0; source < 2; source++) {
        const depart = source === 0 ? verrou.cliquets[i] : verrou.clac;
        const duree = source === 0 ? DUREE_DU_CLIQUET : DUREE_DU_CLAC;
        const force = source === 0 ? 0.8 : 1.25;
        if (depart < 0) continue;
        const age = (maintenant - depart) / duree;
        if (age >= 1 || age < 0) continue;
        const reste = (1 - age) * (1 - age);

        cheminer(g.pts, debut, fin);
        ctx.strokeStyle = rgba(r.trait, Math.min(1, reste * 0.55 * force));
        ctx.lineWidth = 1.2 + reste * 2.2 * force;
        ctx.stroke();

        if (immobile) continue;
        const depuisLeCorps = ((((angles[i] % TAU) + TAU) % TAU) / TAU) * N;
        const tete = depuisLeCorps + sens[i] * N * (1 - Math.pow(1 - age, 2.2));
        tracerUnArcDeRail(g.pts, tete - sens[i] * 9, tete, debut, fin, r.trait, Math.min(1, reste * force), 2.2 + 2 * force);
      }
    }
  }

  return {
    avancer,
    echantillonner,
    tracer,
    tracerLeVerrou,
    aCoup: (maintenant: number, immobile: boolean) => aCoupDuVerrou(verrou, maintenant, immobile),
  };
}
