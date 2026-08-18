import { useEffect, useRef } from "react";

/**
 * Le fond spatial du tableau de bord.
 *
 * La premiere version empilait deux degrades radiaux et des etoiles
 * posees une a une. Un degrade radial ne fait pas un nuage : il fait une
 * tache, et l'oeil le lit comme un fond de gabarit.
 *
 * Ici les nebuleuses viennent de feTurbulence, qui genere du bruit
 * fractal — la meme famille de bruit qui sert a dessiner les nuages et
 * la fumee. Deux octaves donnent la structure, une matrice de couleur
 * la teinte, un masque radial la confine. C'est calcule une seule fois
 * au rendu : aucun cout par image, contrairement a un canvas anime.
 *
 * La profondeur vient de la parallaxe. Quatre couches se decalent au
 * defilement a des vitesses differentes : la poussiere lointaine bouge
 * a peine, les etoiles proches suivent presque le contenu. C'est ce
 * differentiel, et lui seul, qui fait la distance — un fond fixe reste
 * un decor, un fond qui se decale devient un lieu.
 */
export function SpaceBackdrop() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Facteurs de parallaxe, du plus lointain au plus proche.
    const facteurs = [0.06, 0.14, 0.26, 0.42];
    let brut = 0;
    let enAttente = false;

    const appliquer = () => {
      enAttente = false;
      refs.current.forEach((el, i) => {
        if (el) el.style.transform = `translate3d(0, ${(-brut * facteurs[i]).toFixed(1)}px, 0)`;
      });
    };

    const auDefilement = () => {
      brut = window.scrollY;
      // Une seule ecriture par image : sans ce garde-fou, un defilement
      // rapide declenche des dizaines de recalculs de composition.
      if (!enAttente) {
        enAttente = true;
        requestAnimationFrame(appliquer);
      }
    };

    window.addEventListener("scroll", auDefilement, { passive: true });
    appliquer();
    return () => window.removeEventListener("scroll", auDefilement);
  }, []);

  return (
    <div className="space-backdrop" aria-hidden="true">
      {/* Le vide. Trois teintes plutot qu'une : un noir uni lit comme
          une absence de fond, pas comme de l'espace. */}
      <div className="space-void" />

      {/* Nebuleuses fractales. La couche est en opacity plutot qu'en
          alpha de couleur pour rester composable par le GPU. */}
      <svg className="space-nebula" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 600">
        <defs>
          <filter id="neb-a" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.0035" numOctaves="3" seed="7" result="bruit" />
            <feColorMatrix
              in="bruit"
              type="matrix"
              values="0 0 0 0 0.10
                      0 0 0 0 0.42
                      0 0 0 0 0.85
                      0.9 0.5 0 0 -0.28"
            />
          </filter>
          <filter id="neb-b" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0031 0.0018" numOctaves="4" seed="23" result="bruit" />
            <feColorMatrix
              in="bruit"
              type="matrix"
              values="0 0 0 0 0.42
                      0 0 0 0 0.10
                      0 0 0 0 0.72
                      0.8 0.4 0 0 -0.34"
            />
          </filter>
          <radialGradient id="conf-a" cx="26%" cy="18%" r="62%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="conf-b" cx="80%" cy="72%" r="55%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="masque-a"><rect width="800" height="600" fill="url(#conf-a)" /></mask>
          <mask id="masque-b"><rect width="800" height="600" fill="url(#conf-b)" /></mask>
        </defs>
        <rect width="800" height="600" filter="url(#neb-a)" mask="url(#masque-a)" opacity="0.55" />
        <rect width="800" height="600" filter="url(#neb-b)" mask="url(#masque-b)" opacity="0.42" />
      </svg>

      {/* Bande galactique : une trainee dense en diagonale. C'est elle
          qui donne une orientation au ciel — sans elle, un champ
          d'etoiles uniforme n'a ni haut ni bas. */}
      <div className="space-band" />

      {/* Quatre couches d'etoiles, de la poussiere lointaine aux
          etoiles proches. Chacune se decale a sa propre vitesse. */}
      <div className="space-layer space-dust"  ref={(el) => (refs.current[0] = el)} />
      <div className="space-layer space-far"   ref={(el) => (refs.current[1] = el)} />
      <div className="space-layer space-mid"   ref={(el) => (refs.current[2] = el)} />
      <div className="space-layer space-near"  ref={(el) => (refs.current[3] = el)} />

      {/* Vignette : referme les bords pour que le champ n'ait pas de fin
          visible. */}
      <div className="space-vignette" />
    </div>
  );
}
