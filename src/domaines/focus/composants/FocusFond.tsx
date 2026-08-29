import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/* LE FOND VIVANT
 *
 * Quatre fonds, un seul canevas. La couche precedente empilait dix-neuf
 * animations DOM perpetuelles ; ici il n y a qu une surface a repeindre,
 * et le cout se mesure : entre 0,06 et 0,50 ms par image selon la
 * variante, sur une image qui en dure 16,7.
 *
 * Le fond s allume a l apposition du sceau — un eveil de deux secondes —
 * et son intensite suit l avancement de la clause. Au repos il ne tourne
 * pas du tout : la boucle n est meme pas lancee.
 */

import type { VarianteFond } from "@/domaines/focus/logique/variantesFond";
import { peindreMycelium, peindreMaillage, peindreMaree, peindreAurores, jetonEnRvb, initMycelium, initMaree } from "@/domaines/focus/logique/peintures";
import { palette } from "@/domaines/focus/logique/peintures";
import type { Etat } from "@/domaines/focus/types";
export type { VarianteFond };

interface FocusFondProps {
  variante: VarianteFond;
  actif: boolean;
  progress: number;
  isBreak?: boolean;
  /** Apercu : la scene tourne quoi qu il arrive, dans son propre cadre. */
  apercu?: boolean;
}


/* ── LE SOL DE LA SCENE, DANS LES DEUX THEMES ──

   Il etait peint en dur : #04060a, la nuit. C est le seul endroit de
   l application ou le fond est dessine en JavaScript — aucune feuille
   de style ne pouvait l atteindre, et la page restait donc noire quel
   que soit le theme.

   Les valeurs SOMBRES sont inchangees, au caractere pres. On ajoute
   une seconde palette, on ne modifie pas la premiere.

   La dissipation garde son alpha : c est elle qui fait respirer le
   trace. Seule la couleur qu elle depose change — la nuit efface en
   noir, le jour efface en papier. */

/* ═══ A — MYCELIUM ═══

   CE N ETAIT PAS DU MYCELIUM, C ETAIT UNE PELOTE.

   Chaque pointe virait de (bruit - 0.5) * 0.42 radian A CHAQUE IMAGE.
   Soit jusqu a douze degres, sur soixante images par seconde : une
   pointe faisait un tour complet en une demi-seconde. Le canevas se
   couvrait donc de BOUCLES qui se recouvraient, toutes de la meme
   epaisseur, piquees de pastilles dorees tirees au sort — un
   enchevetrement sature, pas un reseau.

   Trois choses font qu un mycelium ressemble a un mycelium :

     IL VA QUELQUE PART. Une hyphe garde sa direction et ne la corrige
     que tres peu. Le virage tombe a 0.055 radian — sept fois moins —
     et suit un champ de bruit lent, donc les voisines s incurvent
     ensemble au lieu de partir chacune de son cote.

     IL S AMINCIT EN S ELOIGNANT. L epaisseur vient de la GENERATION,
     pas de l age : le tronc issu du germe est net, ses branches plus
     fines, leurs branches plus fines encore. C est cette hierarchie
     qu on lit comme « vivant » ; sans elle, tout se vaut et rien ne
     se distingue.

     IL PART D UN POINT. Les germes etaient poses sur les BORDS et
     visaient le centre : la matiere arrivait de partout a la fois. Ici
     une colonie s ouvre en eventail depuis son germe, et quand elle
     s epuise une autre s installe ailleurs — a distance des
     precedentes.

   Les pastilles dorees ne sont plus des confettis : elles marquent les
   NOEUDS, la ou une hyphe se divise. Elles disent donc quelque chose.

   Ce qui ne change pas : le trace s accumule, on ne repeint jamais ce
   qui existe deja. C est ce qui rend ce fond huit fois moins cher que
   les autres, et le seul dont l ecran garde une memoire de la seance. */

/* ═══ B — AURORES ═══ */
function initAurores(e: Etat) {
  e.ctx.fillStyle = palette().fond;
  e.ctx.fillRect(0, 0, e.w, e.h);
  e.parts = [];
  for (let i = 0; i < 620; i++) {
    e.parts.push({ x: Math.random() * e.w, y: Math.random() * e.h, vie: Math.random() * 260 });
  }
  e.temps = 0;
}

/* ═══ C — MAILLAGE ═══ */
function initMaillage(e: Etat) { e.temps = 0; e.impulsion = 0; }

const SCENES: Record<Exclude<VarianteFond, "aucun">, {
  init: (e: Etat) => void;
  peindre: (e: Etat, dt: number, eveil: number, prog: number) => void;
}> = {
  mycelium: { init: initMycelium, peindre: peindreMycelium },
  aurores: { init: initAurores, peindre: peindreAurores },
  maillage: { init: initMaillage, peindre: peindreMaillage },
  maree: { init: initMaree, peindre: peindreMaree },
};

export function FocusFond({ variante, actif, progress, isBreak = false, apercu = false }: FocusFondProps) {
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const mouvementReduit = useReducedMotion();

  // Lues par la boucle, jamais par le rendu : sans refs, chaque seconde
  // relancerait l animation depuis zero.
  const progRef = useRef(progress);
  progRef.current = progress;
  const actifRef = useRef(actif);
  actifRef.current = actif;
  const teinteRef = useRef(isBreak);
  teinteRef.current = isBreak;
  const relireRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv || variante === "aucun") return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    const scene = SCENES[variante];
    const etat: Etat = {
      w: 0, h: 0, dpr: 1, ctx,
      teinte: [92, 182, 255], or: [252, 238, 10],
      temps: 0, dissipe: 0, impulsion: 0,
    };

    const relireCouleurs = () => {
      etat.teinte = jetonEnRvb(teinteRef.current ? "--accent" : "--primary", [92, 182, 255]);
      /* L or a #fcee0a ne se voit pas sur du papier : meme teinte,
         descendue jusqu a porter. */
      etat.or = palette().or;
    };
    relireRef.current = relireCouleurs;

    /* Redimensionner un canevas VIDE sa memoire. Le mycelium, dont tout
       l interet est d accumuler, repartait donc de zero a chaque
       changement de taille — et passer en plein ecran en est un. C est ce
       qui « relancait l animation ».
       On recopie donc l image avant de redimensionner, et on la repose
       ensuite, etiree a la nouvelle taille. */
    const dimensionne = (preserver = false) => {
      const avant = preserver && cv.width > 0 && cv.height > 0
        ? (() => {
            const t = document.createElement("canvas");
            t.width = cv.width; t.height = cv.height;
            t.getContext("2d")?.drawImage(cv, 0, 0);
            return t;
          })()
        : null;

      // Au-dela de 1,5 la densite ne se voit pas sur un fond, et le cout
      // double. Ce n est pas une image, c est une ambiance.
      etat.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const r = cv.getBoundingClientRect();
      etat.w = Math.max(1, Math.round(r.width));
      etat.h = Math.max(1, Math.round(r.height));
      cv.width = Math.round(etat.w * etat.dpr);
      cv.height = Math.round(etat.h * etat.dpr);
      ctx.setTransform(etat.dpr, 0, 0, etat.dpr, 0, 0);
      relireCouleurs();

      if (avant) {
        ctx.drawImage(avant, 0, 0, etat.w, etat.h);
      } else {
        scene.init(etat);
      }
    };
    dimensionne();

    /* Mouvement reduit : une seule image, puis plus rien. Le fond garde
       sa presence sans jamais bouger. */
    if (mouvementReduit) {
      for (let i = 0; i < 220; i++) scene.peindre(etat, 16.7, 1, progRef.current);
      let m = 0;
      const surResize = () => {
        clearTimeout(m);
        m = window.setTimeout(() => {
          dimensionne();
          for (let i = 0; i < 220; i++) scene.peindre(etat, 16.7, 1, progRef.current);
        }, 120);
      };
      window.addEventListener("resize", surResize);
      return () => { clearTimeout(m); window.removeEventListener("resize", surResize); };
    }

    let eveil = 0;
    let brut = 0;
    cv.style.opacity = "1";
    let tPrec = performance.now();
    let boucleId = 0;
    let vivant = true;

    const image = (now: number) => {
      if (!vivant) return;
      boucleId = requestAnimationFrame(image);
      const dt = Math.min(50, now - tPrec);
      tPrec = now;

      const cible = apercu || actifRef.current ? 1 : 0;
      eveil += (cible - eveil) * Math.min(1, dt / 2000) * (cible ? 1.6 : 3);

      /* Le trace deja pose sur la toile ne s eteint pas avec l eveil : il
         restait entier jusqu au fillRect final qui le supprimait d un
         coup. On fait fondre la toile elle-meme — c est une opacite, donc
         du compositeur — et on ne l efface qu une fois invisible. */
      const opacite = cible ? 1 : Math.max(0, Math.min(1, eveil * 1.6));
      cv.style.opacity = String(opacite);

      if (!cible && opacite <= 0.005) {
        if (brut > 0) { ctx.fillStyle = palette().fond; ctx.fillRect(0, 0, etat.w, etat.h); brut = 0; }
        return;
      }
      brut = 1;
      scene.peindre(etat, dt, eveil, progRef.current);
    };
    boucleId = requestAnimationFrame(image);

    const surVisibilite = () => {
      // Un onglet cache ne doit rien peindre du tout. Le navigateur bride
      // deja rAF, mais le dire explicitement evite la rafale de
      // rattrapage au retour.
      if (document.visibilityState === "hidden") { vivant = false; cancelAnimationFrame(boucleId); }
      else if (!vivant) { vivant = true; tPrec = performance.now(); boucleId = requestAnimationFrame(image); }
    };
    document.addEventListener("visibilitychange", surVisibilite);
    let minuterie = 0;
    const surResize = () => {
      clearTimeout(minuterie);
      minuterie = window.setTimeout(() => dimensionne(true), 120);
    };
    window.addEventListener("resize", surResize);

    return () => {
      vivant = false;
      relireRef.current = null;
      clearTimeout(minuterie);
      cancelAnimationFrame(boucleId);
      document.removeEventListener("visibilitychange", surVisibilite);
      window.removeEventListener("resize", surResize);
    };
  }, [variante, mouvementReduit, apercu]);

  // La teinte suit la phase sans relancer la scene : relancer effacerait
  // la pousse du mycelium, qui est justement sa raison detre.
  useEffect(() => { relireRef.current?.(); }, [isBreak]);

  /* LE THEME AUSSI CHANGE LES COULEURS, ET SANS PREVENIR.

     Basculer clair/sombre ne passe par aucune prop : sans ce
     guetteur, la scene garderait son sol de nuit jusqu au prochain
     redimensionnement. On relit les couleurs ET on repeint le fond,
     puisque c est lui qui a change — le trace accumule, lui, est
     conserve : il se lira sur le nouveau sol. */
  useEffect(() => {
    const racine = document.documentElement;
    const suivre = () => relireRef.current?.();
    const guetteur = new MutationObserver(suivre);
    guetteur.observe(racine, { attributes: true, attributeFilter: ["class"] });
    return () => guetteur.disconnect();
  }, []);

  if (variante === "aucun") return null;

  return (
    <canvas
      ref={cvRef}
      className={apercu ? "sc-apercu-toile" : "fixed inset-0 w-full h-full pointer-events-none"}
      style={apercu ? undefined : { zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

export default FocusFond;
