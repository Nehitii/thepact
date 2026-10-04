/* LES PROTUBERANCES : CE QUE LES EMANATIONS DEVAIENT ETRE.
 *
 * C etaient des segments DROITS, sur un angle d ECRAN, peints avant le
 * coeur : des piquets plantes dans une bille. Trois defauts, et le
 * premier est geometrique — elles n etaient pas sur la sphere. Une
 * protuberance ancree sur le globe est raccourcie quand elle pointe vers
 * nous et deployee de profil : c est ce raccourci qui dit qu il y a un
 * volume dessous. Elles s incurvent, parce que ce qui sort d un astre
 * subit encore ce qui le retient. Et elles passent devant ou derriere,
 * dans les deux memes passes que les anneaux.
 *
 * CE QUI SE LIT COMME UN FLUIDE N EST PAS UN CONTOUR, C EST DU TRANSPORT :
 * plusieurs brins fins qui se tressent, et de la lumiere qui les REMONTE.
 * Rien n est immobile une seule image.
 */
import { TAU, clamp01, doux, lerp, rgba, type Couleur, type Rendu } from "@/domaines/appel/logique/coeur";
import {
  PERSPECTIVE, cercleSurUnAxe, directionSurLaSphere, perpendiculaire, produitVectoriel, type Vecteur,
} from "@/domaines/appel/logique/espace";
import { tracerLeCercle, type Contexte } from "./trace";

const MAX_PLUMES = 9;
const POINTS_DE_PLUME = 14;
const cadenceDesPlumes = (p: number) => 1000 / lerp(0.35, 5.5, p * p);
/** Les brins n existent pas avant que la calotte cede. */
const RETARD_DE_LA_RUPTURE = 0.11;
const BRINS_PAR_PLUME = 7;
const PAQUETS_PAR_BRIN = 4;

interface BrinDePlume {
  ecart: number; ecart2: number; freq: number; phase: number; roulis: number;
  retard: number; vitesse: number; eclat: number;
}

interface Plume {
  dir: Vecteur; lateral: Vecteur; lateral2: Vecteur;
  vie: number; duree: number; hauteur: number; courbure: number; graine: number; derive: number;
  brins: BrinDePlume[];
}

/* L enveloppe de vie : jaillissement rapide, retrait long. Un sinus monte
   et descend a la meme vitesse, et rien de ce qui jaillit ne fait ca. */
const vieDeLaPlume = (u: number) => doux(0, 0.15, u) * (1 - doux(0.45, 1, u));

function allumerUnePlume(p: number): Plume {
  const dir = directionSurLaSphere();
  const t1 = perpendiculaire(dir);
  const t2 = produitVectoriel(dir, t1);
  const melange = Math.random() * TAU;
  /* Deux axes perpendiculaires au pied, pas un seul : avec un seul, les
     brins se tressent dans un plan et la gerbe reste plate. */
  const lateral = {
    x: t1.x * Math.cos(melange) + t2.x * Math.sin(melange),
    y: t1.y * Math.cos(melange) + t2.y * Math.sin(melange),
    z: t1.z * Math.cos(melange) + t2.z * Math.sin(melange),
  };
  return {
    dir, lateral, lateral2: produitVectoriel(dir, lateral),
    vie: 0,
    /* Des gerbes qui se chevauchent respirent, des gerbes qui se
       succedent clignotent. */
    duree: lerp(2600, 900, p) * (0.7 + Math.random() * 0.7),
    hauteur: 0.75 + Math.random() * (0.9 + p * 1.1),
    courbure: (Math.random() - 0.5) * 1.1,
    graine: Math.random() * 100,
    derive: (Math.random() - 0.5) * 0.5,
    brins: Array.from({ length: BRINS_PAR_PLUME }, () => ({
      ecart: (Math.random() - 0.5) * 0.3,
      ecart2: (Math.random() - 0.5) * 0.24,
      freq: 1.4 + Math.random() * 2.6,
      phase: Math.random() * TAU,
      roulis: 0.5 + Math.random() * 1.3,
      /* Chaque brin nait et meurt a son heure : la gerbe s effiloche au
         lieu de s eteindre d un bloc. */
      retard: Math.random() * 0.3,
      vitesse: 0.55 + Math.random() * 0.9,
      eclat: 0.5 + Math.random() * 0.6,
    })),
  };
}

export function creerLesPlumes(ctx: Contexte) {
  const plumes: Plume[] = [];
  let dernierePlume = 0;
  let prochainePlume = 900;
  /* Le point courant d un brin, reecrit a chaque appel et consomme
     aussitot par le trace. */
  const pointDuBrin = { x: 0, y: 0 };

  /* LES PROTUBERANCES N EXISTENT PAS AVANT LEUR SEUIL (`ouverte`). La
     sphere s eclaire des le depart ; elle ne CRACHE qu une fois poussee
     assez loin — sinon le plus spectaculaire des calques est la vingt
     secondes avant la fin, et il ne reste rien a donner ensuite. */
  function avancer(dt: number, p: number, maintenant: number, ouverte: boolean, immobile: boolean) {
    if (!ouverte) dernierePlume = maintenant;
    if (ouverte && !immobile && maintenant - dernierePlume > prochainePlume) {
      dernierePlume = maintenant;
      prochainePlume = cadenceDesPlumes(p) * (0.6 + Math.random() * 0.9);
      plumes.push(allumerUnePlume(p));
      if (plumes.length > MAX_PLUMES) plumes.shift();
    }
    for (let i = plumes.length - 1; i >= 0; i--) {
      const f = plumes[i];
      f.vie += dt * 1000;
      if (f.vie >= f.duree) { plumes.splice(i, 1); continue; }
      /* Le pied glisse sur la sphere : la protuberance reste accrochee a
         la meme matiere. */
      const a = dt * f.derive * (0.3 + p * 1.1);
      const { x, y } = f.dir;
      f.dir.x = x * Math.cos(a) - y * Math.sin(a);
      f.dir.y = x * Math.sin(a) + y * Math.cos(a);
    }
  }

  function tracer(devant: boolean, cx: number, cy: number, rc: number, c: Couleur, p: number, r: Rendu, maintenant: number) {
    const temps = maintenant / 1000;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const f of plumes) {
      if ((f.dir.z > 0) !== devant) continue;
      const u = f.vie / f.duree;
      const env = vieDeLaPlume(u);
      if (env <= 0.01) continue;
      /* La gerbe ne se fige pas apres son deploiement : sa hauteur respire
         et sa courbure derive, sous les mouvements rapides des brins. */
      const haut = f.hauteur * (0.3 + 0.7 * doux(0, 0.35, u)) * (1 + Math.sin(temps * 0.9 + f.graine) * 0.16);
      const vire = f.courbure + Math.sin(temps * 0.55 + f.graine * 0.7) * 0.28;
      /* Les brins partent SOUS la coquille : ils la traversent. */
      const surLeBrin = (b: BrinDePlume, t: number) => {
        const rayon = 0.86 + haut * t;
        const cote = vire * t * t + b.ecart * Math.sin(t * b.freq + b.phase + temps * b.roulis) * t;
        const cote2 = b.ecart2 * Math.cos(t * b.freq * 0.7 + b.phase * 1.7 + temps * b.roulis * 0.8) * t;
        const vx = f.dir.x * rayon + f.lateral.x * cote + f.lateral2.x * cote2;
        const vy = f.dir.y * rayon + f.lateral.y * cote + f.lateral2.y * cote2;
        const vz = f.dir.z * rayon + f.lateral.z * cote + f.lateral2.z * cote2;
        const k = 1 / (1 - vz * PERSPECTIVE);
        pointDuBrin.x = cx + vx * rc * k;
        pointDuBrin.y = cy + vy * rc * k;
        return pointDuBrin;
      };

      for (const b of f.brins) {
        const depart = RETARD_DE_LA_RUPTURE + b.retard;
        const envBrin = vieDeLaPlume(clamp01((u - depart) / (1 - depart)));
        if (envBrin <= 0.01) continue;
        const a = env * envBrin * b.eclat * (0.95 + p * 1.05);
        /* 1. Le brin, tres pale : il ne fait qu indiquer ou la lumiere va
              passer. */
        ctx.beginPath();
        for (let s = 0; s <= POINTS_DE_PLUME; s++) {
          const q = surLeBrin(b, s / POINTS_DE_PLUME);
          if (s === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
        }
        ctx.strokeStyle = rgba(c, a * 0.2);
        ctx.lineWidth = 0.7 + p * 0.7;
        ctx.stroke();
        /* 2. LES PAQUETS QUI LE REMONTENT — c est tout l effet. Ils
              s eteignent en approchant du bout : la matiere se disperse au
              lieu de buter. Trois epaisseurs sur le meme trace : l air
              chaud, le canal, le filet. */
        for (let j = 0; j < PAQUETS_PAR_BRIN; j++) {
          const tete = (temps * b.vitesse + j / PAQUETS_PAR_BRIN + b.phase * 0.16) % 1;
          const survie = 1 - doux(0.72, 1, tete);
          if (survie <= 0.02) continue;
          const longueur = 0.16 + p * 0.1;
          ctx.beginPath();
          for (let s = 0; s <= 4; s++) {
            const q = surLeBrin(b, clamp01(tete - (s / 4) * longueur));
            if (s === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
          }
          const chaud = a * survie * (0.55 + 0.45 * Math.sin(tete * 6.2 + b.phase));
          ctx.strokeStyle = rgba(c, chaud * 0.3);
          ctx.lineWidth = 5.5 + p * 6;
          ctx.stroke();
          ctx.strokeStyle = rgba(c, chaud * 0.85);
          ctx.lineWidth = 2.2 + p * 2.6;
          ctx.stroke();
          ctx.strokeStyle = rgba(r.trait, chaud * 0.95);
          ctx.lineWidth = 0.6 + p;
          ctx.stroke();
        }
      }
      tracerLaBase(f, u, env, cx, cy, rc, c, p, r, temps);
    }
  }

  /* LA BASE : GONFLER, CEDER, PROPAGER. Le jet sortait de nulle part.
     Avant la rupture la coquille ENFLE a cet endroit — c est elle qui dit
     ou ca va ceder ; puis la calotte cede, un eclat bref ; puis une onde
     s ecarte du point de rupture EN SUIVANT LA SPHERE, s aplatit au limbe
     et passe derriere. C est ce calque qui integre : il n existe que parce
     qu il y a un volume dessous. */
  function tracerLaBase(
    f: Plume, u: number, env: number, cx: number, cy: number, rc: number, c: Couleur, p: number, r: Rendu, temps: number,
  ) {
    const cercle = (theta: number) => cercleSurUnAxe(f.dir, f.lateral, f.lateral2, theta);
    const kPied = 1 / (1 - f.dir.z * PERSPECTIVE);
    const xPied = cx + f.dir.x * rc * kPied, yPied = cy + f.dir.y * rc * kPied;
    /* Une calotte vue de face occupe un disque, vue de profil une lame :
       tout ce qu on pose sur le pied s aplatit d autant. */
    const aplatir = lerp(0.3, 1, Math.max(0.12, Math.abs(f.dir.z)));
    const tache = (large: number, degrade: CanvasGradient) => {
      ctx.save();
      ctx.translate(xPied, yPied);
      ctx.scale(1, aplatir);
      ctx.translate(-xPied, -yPied);
      ctx.fillStyle = degrade;
      ctx.beginPath(); ctx.arc(xPied, yPied, large, 0, TAU); ctx.fill();
      ctx.restore();
    };

    const bombe = doux(0, 0.09, u) * (1 - doux(0.1, 0.2, u));
    if (bombe > 0.01) {
      const large = rc * 0.34 * kPied;
      const dome = ctx.createRadialGradient(xPied, yPied, 0, xPied, yPied, large);
      dome.addColorStop(0, rgba(r.trait, bombe * (0.4 + p * 0.35)));
      dome.addColorStop(0.45, rgba(c, bombe * 0.3));
      dome.addColorStop(1, "rgba(0,0,0,0)");
      tache(large, dome);
      /* La calotte se souleve : un lisere clair a son bord. */
      tracerLeCercle(ctx, cercle(0.34), cx, cy, rc, PERSPECTIVE, 1 + bombe * 0.05);
      ctx.strokeStyle = rgba(r.trait, bombe * 0.4);
      ctx.lineWidth = 1 + p * 1.4;
      ctx.stroke();
    }

    const rupture = doux(0.08, 0.13, u) * (1 - doux(0.13, 0.26, u));
    if (rupture > 0.01) {
      const eclat = rc * 0.5 * kPied;
      const g = ctx.createRadialGradient(xPied, yPied, 0, xPied, yPied, eclat);
      g.addColorStop(0, rgba(r.trait, rupture * 0.85));
      g.addColorStop(0.35, rgba(c, rupture * 0.45));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(xPied, yPied, eclat, 0, TAU); ctx.fill();
    }

    /* Deux fronts decales, le second plus lent : un ebranlement, pas un
       rond. */
    for (let n = 0; n < 2; n++) {
      const av = clamp01((u - 0.09 - n * 0.05) / (0.34 + n * 0.16));
      if (av <= 0 || av >= 1) continue;
      tracerLeCercle(ctx, cercle(doux(0, 1, av) * (0.5 + 0.75 * f.hauteur)), cx, cy, rc, PERSPECTIVE, 1.005);
      ctx.strokeStyle = rgba(n === 0 ? r.trait : c, ((1 - av) * (1 - av) * env * (0.45 + p * 0.5)) / (1 + n));
      ctx.lineWidth = (1 + p * 1.8) * (1 - av * 0.55);
      ctx.stroke();
    }

    /* LE SOCLE, tant que le jet dure : la bouche reste ouverte et bat au
       rythme des paquets qui la quittent. */
    const battement = 0.6 + 0.4 * Math.sin(temps * 3.4 + f.graine);
    const ouvert = env * battement;
    tracerLeCercle(ctx, cercle(0.15 + 0.03 * battement), cx, cy, rc, PERSPECTIVE, 1.002);
    ctx.strokeStyle = rgba(r.trait, ouvert * (0.3 + p * 0.3));
    ctx.lineWidth = 1.4 + p * 2;
    ctx.stroke();
    const large = rc * 0.2 * kPied;
    const bouche = ctx.createRadialGradient(xPied, yPied, 0, xPied, yPied, large);
    bouche.addColorStop(0, rgba(r.trait, ouvert * (0.24 + p * 0.3)));
    bouche.addColorStop(0.5, rgba(c, ouvert * 0.2));
    bouche.addColorStop(1, "rgba(0,0,0,0)");
    tache(large, bouche);
  }

  return {
    avancer,
    tracer,
    vider() {
      plumes.length = 0;
    },
  };
}
