import {
  COUPS, avancerLeTrauma, bandesVoulues, cadrageVoulu, champVisible, hauteurDesBandes, plancherDuTrauma,
  remonteeDuSujet, reponseDuZoom, secousseDe, suivre, zoomVoulu, type Prise, type Vue,
} from "@/domaines/appel/logique/camera";
import type { PhaseCoeur } from "@/domaines/appel/logique/coeur";
import type { Contexte } from "./trace";

/* LA CAMERA, POSEE SUR LA TOILE.
 *
 * Elle garde ce qui a une inertie — le zoom, le cadrage, les bandes, le
 * trauma — et lit chaque image ce qui vient d arriver. Les chocs sont des
 * FRONTS : un verrou qui claque, une faille qui s ouvre, une union, un
 * souffle comptent une fois, a l image ou ils commencent, et pas a
 * chacune de celles ou ils durent.
 *
 * LE DOIGT SE LIT A L AVANCEMENT : il croit tant qu on tient, il
 * redescend des qu on lache. La toile n a pas besoin d autre signal.
 *
 * Sans mouvement, la camera reste au repos : ni zoom, ni cadrage, ni
 * secousse. Les bandes, elles, ne sont pas un mouvement — elles se
 * posent d un coup. */

export interface ImageDeLaCamera {
  dt: number;
  /** L horloge de la toile, en millisecondes. */
  maintenant: number;
  p: number;
  phase: PhaseCoeur;
  /** Depuis le debut de la phase, en secondes. */
  depuis: number;
  cx: number;
  cy: number;
  hauteur: number;
  tactile: boolean;
  immobile: boolean;
  /** Un seuil vient d etre franchi, a cette image. */
  seuil: boolean;
  /** L a-coup du verrou des anneaux, en pixels — il dure un cinquieme de seconde. */
  aCoup: number;
  failleOuverte: boolean;
  union: boolean;
  souffle: boolean;
  puissanceDeLaFusion: number;
  excentrique: number;
}

type Front = "verrou" | "faille" | "union" | "souffle" | "effondrement";

export function creerLaCamera() {
  let zoom = 1, cadrage = 0, bandes = 0, trauma = 0, pAvant = 0;
  const vus: Record<Front, boolean> = { verrou: false, faille: false, union: false, souffle: false, effondrement: false };
  const prise: Prise = { cx: 0, cy: 0, sx: 0, sy: 0, z: 1, roulis: 0 };

  const front = (cle: Front, actif: boolean) => {
    const neuf = actif && !vus[cle];
    vus[cle] = actif;
    return neuf;
  };

  return {
    avancer(e: ImageDeLaCamera): Prise {
      const tient = e.p > pAvant + 1e-6;
      pAvant = e.p;

      let coups = e.seuil ? COUPS.seuil : 0;
      if (front("verrou", e.aCoup > 0)) coups += COUPS.verrou;
      if (front("faille", e.failleOuverte)) coups += COUPS.faille;
      if (front("union", e.union)) coups += COUPS.union;
      if (front("souffle", e.souffle)) coups += COUPS.souffle;
      if (front("effondrement", e.phase === "effondrement")) coups += COUPS.effondrement;
      /* Le temps mort est un vrai silence : le trauma y tombe a zero. */
      trauma = e.immobile || e.phase === "tempsMort"
        ? 0
        : avancerLeTrauma(trauma, e.dt, coups, plancherDuTrauma(e.p, e.puissanceDeLaFusion, e.excentrique));

      const cible = bandesVoulues(e.phase, e.p);
      if (e.immobile) {
        zoom = 1;
        cadrage = 0;
        bandes = cible;
      } else {
        zoom = suivre(zoom, zoomVoulu(e.p, e.phase, e.depuis), e.dt, reponseDuZoom(e.phase));
        cadrage = suivre(cadrage, cadrageVoulu(e.tactile, e.phase, tient), e.dt, 0.6);
        bandes = suivre(bandes, cible, e.dt, cible > bandes ? 0.45 : 0.8);
      }

      const s = secousseDe(trauma, e.maintenant / 1000);
      prise.cx = e.cx;
      prise.cy = e.cy;
      prise.sx = e.cx + s.x;
      prise.sy = e.cy + remonteeDuSujet(e.cy, e.hauteur, cadrage) + s.y + e.aCoup;
      prise.z = zoom;
      prise.roulis = s.roulis;
      return prise;
    },

    /** Pose l oeil sur le contexte : apres l echelle des pixels, avant tout calque. */
    appliquer(ctx: Contexte) {
      ctx.translate(prise.sx, prise.sy);
      if (prise.roulis !== 0) ctx.rotate(prise.roulis);
      ctx.scale(prise.z, prise.z);
      ctx.translate(-prise.cx, -prise.cy);
    },

    /** Le champ que voit l oeil, en coordonnees de scene. */
    vue: (largeur: number, hauteur: number): Vue => champVisible(prise, largeur, hauteur),

    /* Les bandes se peignent en dernier, a l ecran, hors de la camera :
       elles ne tremblent pas. En theme clair, ou le fond est blanc, elles
       ne sont pas peintes — une bande noire y serait un trou. */
    tracerLesBandes(ctx: Contexte, largeur: number, hauteur: number, sombre: boolean) {
      if (!sombre || bandes < 0.002) return;
      const h = hauteurDesBandes(largeur, hauteur) * bandes;
      if (h < 0.5) return;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, largeur, h);
      ctx.fillRect(0, hauteur - h, largeur, h);
    },
  };
}
