import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/* LA BOUCLE D UN FOND VIVANT.
 *
 * Tous les fonds animes du banc partagent les memes obligations, et
 * c est ici qu elles sont tenues une fois :
 *
 *   - RIEN NE TOURNE DANS UN ONGLET CACHE. `document.hidden` arrete la
 *     boucle ; elle reprend au retour.
 *   - LE MOUVEMENT REDUIT EST UNE IMAGE FIXE, pas un fond vide : une
 *     image est dessinee, puis plus rien — sauf au redimensionnement,
 *     au defilement ou quand un reglage change.
 *   - LA CADENCE EST PLAFONNEE. Une nebuleuse qui se replie en deux
 *     minutes n a pas besoin de 60 images par seconde ; a 30, l oeil ne
 *     voit pas la difference et la batterie, si.
 *   - LE TAMPON EST PLUS PETIT QUE L ECRAN quand le rendu est flou par
 *     nature : un nuage calcule a demi-resolution puis etire ne perd
 *     rien, et coute quatre fois moins.
 *
 * Le moteur ne connait ni React ni le DOM : il recoit un etat par image
 * et dessine. C est ce qui permet a un meme crochet de porter un shader
 * plein ecran, soixante mille points ou une gravure en Canvas 2D.
 */

export interface EtatDuRendu {
  /** Secondes ecoulees ; figees quand le mouvement est coupe. */
  t: number;
  largeur: number;
  hauteur: number;
  /** Pixels du tampon par pixel CSS. */
  echelle: number;
  /** Position lissee du pointeur, de -1 a 1 sur chaque axe, y vers le haut. */
  souris: [number, number];
  /** Defilement de la page, en pixels CSS. */
  defilement: number;
  /** Vitesse lissee du defilement, en pixels CSS par seconde. */
  vitesse: number;
}

export interface Moteur {
  redimensionner(largeur: number, hauteur: number, echelle: number): void;
  dessiner(etat: EtatDuRendu): void;
  liberer(): void;
}

export interface MesureDuRendu {
  /** Images par seconde ; 0 quand l image est fixe. */
  fps: number;
  /** Temps processeur moyen passe a preparer une image, en ms. */
  ms: number;
  largeur: number;
  hauteur: number;
}

interface Options {
  /** Pixels du tampon par pixel CSS, avant le plafond de densite. */
  echelle: number;
  cadence: number;
  mouvement: boolean;
  surMesure?: (m: MesureDuRendu) => void;
}

/** Le temps montre quand le mouvement est coupe : un instant choisi, pas t = 0. */
const INSTANT_FIGE = 38;

export function useRenduDuFond(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  fabriquer: (canvas: HTMLCanvasElement) => Moteur | null,
  { echelle, cadence, mouvement, surMesure }: Options,
): { redessiner: () => void; indisponible: boolean } {
  const [indisponible, setIndisponible] = useState(false);
  const relance = useRef<() => void>(() => {});
  const reglages = useRef({ mouvement, cadence, surMesure });
  reglages.current = { mouvement, cadence, surMesure };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let moteur: Moteur | null = null;
    try {
      moteur = fabriquer(canvas);
    } catch (e) {
      console.error("Fond indisponible :", e);
    }
    if (!moteur) {
      setIndisponible(true);
      return;
    }
    const m = moteur;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
    const etat: EtatDuRendu = {
      t: INSTANT_FIGE, largeur: 1, hauteur: 1, echelle: 1,
      souris: [0, 0], defilement: window.scrollY, vitesse: 0,
    };
    const cible = { x: 0, y: 0 };
    let brute = 0;
    let dernierDefilement = window.scrollY;
    let dernierInstantDefilement = performance.now();
    const debut = performance.now();
    let raf = 0;
    let derniereImage = 0;
    let images = 0;
    let cumul = 0;
    let fenetre = performance.now();

    const anime = () => reglages.current.mouvement && !reduit.matches;

    const dimensionner = () => {
      const densite = Math.min(window.devicePixelRatio || 1, 2);
      const k = Math.min(echelle * densite, 2);
      const l = Math.max(1, Math.round(canvas.clientWidth * k));
      const h = Math.max(1, Math.round(canvas.clientHeight * k));
      if (canvas.width !== l) canvas.width = l;
      if (canvas.height !== h) canvas.height = h;
      etat.largeur = l;
      etat.hauteur = h;
      etat.echelle = k;
      m.redimensionner(l, h, k);
    };

    /* `force` sert a la toute premiere image : elle est dessinee meme
       dans un onglet cache, pour que le fond soit deja la au retour, au
       lieu d un rectangle noir le temps d une image. Une seule : la
       boucle, elle, attend que l onglet revienne. */
    const image = (maintenant: number, force = false) => {
      raf = 0;
      if (document.hidden && !force) return;
      const vivant = anime();
      const pas = 1000 / Math.max(1, reglages.current.cadence);
      if (vivant && maintenant - derniereImage < pas - 2) {
        raf = requestAnimationFrame(image);
        return;
      }
      derniereImage = maintenant;
      etat.souris[0] += (cible.x - etat.souris[0]) * 0.05;
      etat.souris[1] += (cible.y - etat.souris[1]) * 0.05;
      brute *= 0.9;
      etat.vitesse += (brute - etat.vitesse) * 0.12;
      etat.defilement = window.scrollY;
      etat.t = vivant ? (maintenant - debut) / 1000 + INSTANT_FIGE : INSTANT_FIGE;
      const avant = performance.now();
      m.dessiner(etat);
      cumul += performance.now() - avant;
      images += 1;
      if (maintenant - fenetre >= 500) {
        reglages.current.surMesure?.({
          fps: vivant ? (images * 1000) / (maintenant - fenetre) : 0,
          ms: cumul / images,
          largeur: etat.largeur,
          hauteur: etat.hauteur,
        });
        images = 0;
        cumul = 0;
        fenetre = maintenant;
      }
      if (vivant && !document.hidden) raf = requestAnimationFrame((t) => image(t));
    };

    const relancer = () => {
      if (!raf) raf = requestAnimationFrame(image);
    };
    relance.current = relancer;

    const auPointeur = (e: PointerEvent) => {
      cible.x = (e.clientX / window.innerWidth) * 2 - 1;
      cible.y = 1 - (e.clientY / window.innerHeight) * 2;
      if (!anime()) return;
      relancer();
    };
    const auDefilement = () => {
      const maintenant = performance.now();
      const dt = Math.max(16, maintenant - dernierInstantDefilement);
      brute = ((window.scrollY - dernierDefilement) / dt) * 1000;
      dernierDefilement = window.scrollY;
      dernierInstantDefilement = maintenant;
      relancer();
    };
    const auRetour = () => {
      if (!document.hidden) relancer();
    };
    /* Un pilote qui redemarre, une carte qui sature : le contexte peut
       etre retire sans prevenir. Le composant retombe alors sur le fond
       CSS plutot que de laisser un rectangle noir. */
    const auContextePerdu = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
      setIndisponible(true);
    };

    const observateur = new ResizeObserver(() => {
      dimensionner();
      relancer();
    });
    observateur.observe(canvas);
    window.addEventListener("pointermove", auPointeur, { passive: true });
    window.addEventListener("scroll", auDefilement, { passive: true });
    document.addEventListener("visibilitychange", auRetour);
    reduit.addEventListener("change", relancer);
    canvas.addEventListener("webglcontextlost", auContextePerdu);

    dimensionner();
    // La premiere image part tout de suite : un fond ne doit jamais
    // attendre la prochaine image pour exister.
    image(performance.now(), true);

    return () => {
      cancelAnimationFrame(raf);
      observateur.disconnect();
      window.removeEventListener("pointermove", auPointeur);
      window.removeEventListener("scroll", auDefilement);
      document.removeEventListener("visibilitychange", auRetour);
      reduit.removeEventListener("change", relancer);
      // Retire AVANT de liberer : liberer perd le contexte expres.
      canvas.removeEventListener("webglcontextlost", auContextePerdu);
      relance.current = () => {};
      m.liberer();
    };
  }, [canvasRef, fabriquer, echelle]);

  useEffect(() => {
    relance.current();
  }, [mouvement, cadence]);

  const redessiner = useCallback(() => relance.current(), []);
  return { redessiner, indisponible };
}
