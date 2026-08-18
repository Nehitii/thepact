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
      {/* Le vide, et le c(oe)ur de galaxie qui l eclaire de biais. */}
      <div className="space-void" />
      <div className="space-galaxy" />

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
