/* LES JETS POLAIRES : UN RAYON D ENERGIE, PAS UN TRAIT.
 *
 * La geometrie vit dans `logique/nervure.ts` : l axe, le virage, la
 * gerbe, la force. Ici ne reste que la lumiere, en cinq couches — une
 * brume qui baigne, des brins parcourus d un motif qui file, un coeur
 * sature qui ne suit pas le pavillon, des paquets qui remontent, et une
 * bouche qui brule.
 *
 * Le jet qui vient vers nous se peint apres le coeur, l autre avant : ils
 * passent derriere la sphere dans la meme passe que les anneaux.
 */
import { TAU, doux, rgba, type Couleur, type Rendu } from "@/domaines/appel/logique/coeur";
import {
  BRINS, BRINS_DU_JET, NOEUDS_DU_JET, POINTS_DU_BRIN, POINTS_DU_JET,
  largeurDuJet, longueurDuJet, pointDuJet, rayonDeLaGorge, repereDuJet, versLeFroid,
  type Nervure, type PointDuJet, type RepereDuJet,
} from "@/domaines/appel/logique/nervure";
import { tracerLisse, tracerLisseAlEnvers, type Contexte } from "./trace";

/* LE MOTIF EST LE MEME POUR TOUS LES BRINS, SEULE SA PHASE CHANGE : trois
   degrades de neuf arrets suffisent a defaire l alignement, et l eclat
   propre de chaque brin passe par `globalAlpha`, qui n analyse aucune
   couleur. Onze degrades de deux arrets faisaient vingt-deux analyses par
   jet et par image pour un motif qui n existait pas. */
const GROUPES = 3;
const ARRETS = 9;

const encreDe = (c: Couleur) => "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ",";

export function creerLesJets(ctx: Contexte) {
  /* LES ARDOISES. Construits en objets, onze brins d une trentaine de
     points et deux bords chacun feraient sept cents allocations par image
     et par jet. Les tableaux sont tires une fois et reecrits en place. */
  const ardoise = () => new Float64Array(POINTS_DU_JET + 1);
  const brinX = ardoise(), brinY = ardoise(), brinK = ardoise();
  const bordHX = ardoise(), bordHY = ardoise(), bordBX = ardoise(), bordBY = ardoise();
  const nerf: PointDuJet[] = Array.from({ length: POINTS_DU_JET + 1 }, () => ({ x: 0, y: 0, k: 0, z: 0 }));
  const nx = ardoise(), ny = ardoise();
  const oup: PointDuJet = { x: 0, y: 0, k: 0, z: 0 };
  const reperes: Record<1 | -1, RepereDuJet> = { [1]: repereDuJet(1), [-1]: repereDuJet(-1) };

  /* `regime` : la projection, ou les jets sont le sujet et le reste de la
     scene est noir. */
  function tracer(
    devant: boolean, cx: number, cy: number, base: number, rc: number, c: Couleur, p: number,
    r: Rendu, maintenant: number, force: number, regime = false,
  ) {
    if (force <= 0.01) return;
    const temps = maintenant / 1000;
    const nervure: Nervure = {
      cx, cy, base, pied: rayonDeLaGorge(rc, base, regime) * 0.88, longueur: longueurDuJet(base, force, regime),
    };
    const rGorge = rayonDeLaGorge(rc, base, regime);
    /* Plein regime : la moitie en plus, et le reste est noir, donc ce
       surplus ne se dispute avec rien. */
    const eclatJet = force * (0.5 + p * 0.5) * (regime ? 1.5 : 1);
    const brume = versLeFroid(c, 0.85);
    const gaine = versLeFroid(c, 0.6);
    const chair = versLeFroid(c, 0.3);
    const largeur = (t: number) => largeurDuJet(t, base, force);
    const N = POINTS_DU_JET + 1;

    for (const sens of [1, -1] as const) {
      const rep = reperes[sens];
      if ((rep.a.z > 0) !== devant) continue;

      /* La nervure echantillonnee, et ses normales a l ecran : la brume
         s appuie dessus, la bouche lui emprunte sa tangente. */
      for (let i = 0; i < N; i++) pointDuJet(rep, nervure, i / (N - 1), 0, 0, 1, nerf[i]);
      for (let i = 0; i < N; i++) {
        const av = nerf[Math.max(0, i - 1)], ap = nerf[Math.min(N - 1, i + 1)];
        const dx = ap.x - av.x, dy = ap.y - av.y;
        const n = Math.hypot(dx, dy) || 1;
        nx[i] = -dy / n; ny[i] = dx / n;
      }
      const leLong = () => ctx.createLinearGradient(nerf[0].x, nerf[0].y, nerf[N - 1].x, nerf[N - 1].y);

      /* 1. LA BRUME ne dessine plus la forme — les brins s en chargent —,
            elle les baigne. Pale : une nappe opaque redonnerait le bord
            franc qu on vient de defaire. */
      for (let i = 0; i < N; i++) {
        const w = largeur(i / (N - 1)) * nerf[i].k * 2.6;
        bordHX[i] = nerf[i].x + nx[i] * w; bordHY[i] = nerf[i].y + ny[i] * w;
        bordBX[i] = nerf[i].x - nx[i] * w; bordBY[i] = nerf[i].y - ny[i] * w;
      }
      ctx.beginPath();
      tracerLisse(ctx, bordHX, bordHY, N, true);
      tracerLisseAlEnvers(ctx, bordBX, bordBY, N);
      ctx.closePath();
      const nappe = leLong();
      nappe.addColorStop(0, rgba(brume, eclatJet * 0.14));
      nappe.addColorStop(0.45, rgba(brume, eclatJet * 0.08));
      nappe.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nappe;
      ctx.fill();

      /* 2. LES BRINS, ET LE MOTIF QUI FILE — la vraie fluidite. Un brin
            etait un trait FIXE : un faisceau dont la silhouette ne bouge
            pas a l air peint. Chaque brin est maintenant parcouru d une
            alternance de pleins et de creux qui remonte vers le bout et s y
            etire, la phase avancant en t^0,6. Et le brin s amincit : ce qui
            est ejecte part epais et se defait. */
      const encreVive = encreDe(r.trait);
      const encreFroide = encreDe(chair);
      const flux = (2.3 + p * 2.1) * (regime ? 1.7 : 1);
      const nappes: CanvasGradient[] = [];
      for (let g = 0; g < GROUPES; g++) {
        const grad = leLong();
        for (let k = 0; k <= ARRETS; k++) {
          const t = k / ARRETS;
          const motif = 0.66 + 0.34 * Math.sin(Math.pow(t, 0.6) * 10 - temps * flux + g * 2.1);
          grad.addColorStop(t, (t < 0.3 ? encreVive : encreFroide) + (Math.pow(1 - t, 0.85) * motif).toFixed(3) + ")");
        }
        nappes.push(grad);
      }
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (let n = 0; n < BRINS_DU_JET; n++) {
        const brin = BRINS[n];
        const ca = Math.cos(brin.azimut), sa = Math.sin(brin.azimut);
        const M = Math.max(6, Math.round(POINTS_DU_BRIN * brin.fin));
        let derriere = false;
        for (let i = 0; i <= M; i++) {
          const t = (i / M) * brin.fin;
          const l = largeur(t) * brin.ecart * (1 + 0.2 * Math.sin(t * 5.5 + temps * 1.7 + brin.depart));
          const q = pointDuJet(rep, nervure, t, l * ca, l * sa, brin.cambre, oup);
          brinX[i] = q.x; brinY[i] = q.y; brinK[i] = q.k;
          /* La profondeur se compare au meme t, pas au meme indice : le
             brin et la nervure ne sont pas echantillonnes au meme pas. */
          if (i === M >> 1) derriere = q.z < nerf[Math.round(t * (N - 1))].z;
        }
        for (let i = 0; i <= M; i++) {
          const av = Math.max(0, i - 1), ap = Math.min(M, i + 1);
          const dx = brinX[ap] - brinX[av], dy = brinY[ap] - brinY[av];
          const norme = Math.hypot(dx, dy) || 1;
          const w = (1.5 + p * 1.7) * (1 - (i / M) * 0.8) * Math.min(1.7, brinK[i]);
          bordHX[i] = brinX[i] - (dy / norme) * w; bordHY[i] = brinY[i] + (dx / norme) * w;
          bordBX[i] = brinX[i] + (dy / norme) * w; bordBY[i] = brinY[i] - (dx / norme) * w;
        }
        ctx.beginPath();
        tracerLisse(ctx, bordHX, bordHY, M + 1, true);
        tracerLisseAlEnvers(ctx, bordBX, bordBY, M + 1);
        ctx.closePath();
        /* Le brin qui passe DERRIERE la nervure perd la moitie de son
           eclat : c est le seul indice de volume dont dispose un trait. */
        ctx.globalAlpha = Math.min(1, eclatJet * brin.eclat * (derriere ? 0.45 : 1));
        ctx.fillStyle = nappes[n % GROUPES];
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* 3. LE COEUR NE SUIT PAS LE PAVILLON. Il longe la nervure : au pied
            il se confond avec les brins, au bout un fil sature traverse une
            gerbe ouverte. C est cet ecart entre une loi lineaire et une loi
            exponentielle qui dit « quantite condensee ». Son motif est deux
            fois plus serre et deux fois moins creuse : un fil sous
            pression, pas un chapelet. */
      const gradCoeur = leLong();
      for (let k = 0; k <= ARRETS; k++) {
        const t = k / ARRETS;
        const motif = 0.78 + 0.22 * Math.sin(Math.pow(t, 0.6) * 19 - temps * flux * 1.3);
        gradCoeur.addColorStop(t, encreVive + (Math.min(1, eclatJet * 1.35) * Math.pow(1 - t, 0.8) * motif).toFixed(3) + ")");
      }
      for (let i = 0; i < N; i++) { bordHX[i] = nerf[i].x; bordHY[i] = nerf[i].y; }
      ctx.beginPath();
      tracerLisse(ctx, bordHX, bordHY, N, true);
      ctx.strokeStyle = gradCoeur;
      ctx.lineWidth = 1.8 + p * 2.4;
      ctx.stroke();

      /* 4. CE QUI FILE DANS LES BRINS : des paquets courts, un par brin
            tire, decales dans le temps. Ils partent de la gorge presque
            immobiles et se detendent en s eloignant, d ou la course en
            t^0,55. */
      for (let j = 0; j < NOEUDS_DU_JET; j++) {
        const brin = BRINS[(j * 4 + 1) % BRINS_DU_JET];
        const marche = (temps * (0.5 + p * 0.8) * (regime ? 1.9 : 1) + j / NOEUDS_DU_JET) % 1;
        const tete = Math.pow(marche, 0.55) * brin.fin;
        const reste = 1 - doux(0.72 * brin.fin, brin.fin, tete);
        if (reste <= 0.02) continue;
        const ca = Math.cos(brin.azimut), sa = Math.sin(brin.azimut);
        ctx.beginPath();
        for (let k = 0; k <= 5; k++) {
          const t = Math.max(0, tete - (k / 5) * (0.04 + tete * 0.12));
          const l = largeur(t) * brin.ecart;
          const q = pointDuJet(rep, nervure, t, l * ca, l * sa, brin.cambre, oup);
          if (k === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
        }
        ctx.strokeStyle = rgba(gaine, eclatJet * reste * 0.5);
        ctx.lineWidth = 5 + p * 4;
        ctx.stroke();
        ctx.strokeStyle = rgba(r.trait, eclatJet * reste * 0.9);
        ctx.lineWidth = 1.8 + p * 1.4;
        ctx.stroke();
      }

      /* 5. LA BOUCHE BRULE, ET ELLE EBLOUIT. Toute la puissance passe par
            un col de trois centiemes de rayon : c est la que ca doit etre
            le plus blanc. La trainee anamorphique, perpendiculaire au
            depart du faisceau, est ce qu une optique fait d une source trop
            intense : l oeil la lit comme de la puissance, sans qu on ait
            ajoute un lumen. */
      const p0 = nerf[0];
      const large = rGorge * 0.42 * p0.k;
      const socle = ctx.createRadialGradient(p0.x, p0.y, 0, p0.x, p0.y, large);
      socle.addColorStop(0, rgba(r.trait, Math.min(1, eclatJet * 1.4)));
      socle.addColorStop(0.25, rgba(r.trait, eclatJet * 0.6));
      socle.addColorStop(0.6, rgba(gaine, eclatJet * 0.34));
      socle.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = socle;
      ctx.beginPath(); ctx.arc(p0.x, p0.y, large, 0, TAU); ctx.fill();

      ctx.save();
      ctx.translate(p0.x, p0.y);
      ctx.rotate(Math.atan2(ny[0], nx[0]));
      ctx.scale(1, 0.11);
      const portee = large * 3.6;
      const trainee = ctx.createRadialGradient(0, 0, 0, 0, 0, portee);
      trainee.addColorStop(0, rgba(r.trait, Math.min(1, eclatJet * 0.85)));
      trainee.addColorStop(0.35, rgba(gaine, eclatJet * 0.26));
      trainee.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = trainee;
      ctx.beginPath(); ctx.arc(0, 0, portee, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  return { tracer };
}
