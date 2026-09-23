import { useEffect, useRef, useState } from "react";

/**
 * Un nombre qui roule jusqu a sa valeur au lieu d y sauter.
 *
 * Il part de la valeur precedente, pas de zero : un solde qui passe de
 * 1 240 a 1 260 compte vingt, il ne recompte pas mille. Sous mouvement
 * reduit, il saute — c est exactement ce qu on a demande.
 *
 * Il vivait dans les refontes du tableau de bord ; l enseigne en
 * service s en sert pour passer d une mesure a l autre, et un composant
 * en service n importe pas une serie de banc.
 */
export function useCompteur(valeur: number, duree = 700, depart?: number): number {
  /* `depart` : d ou partir au premier rendu. Absent, le nombre est la
     tout de suite ; a zero, il se compte sous les yeux — c est l entree
     du serment, et elle ne se rejoue pas. */
  const [affiche, setAffiche] = useState(depart ?? valeur);
  const depuis = useRef(depart ?? valeur);

  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || document.documentElement.getAttribute("data-reduce-motion") === "true";
    const debut = depuis.current;
    if (reduit || debut === valeur) {
      depuis.current = valeur;
      setAffiche(valeur);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const pas = (t: number) => {
      const p = Math.min(1, (t - t0) / duree);
      const e = 1 - Math.pow(1 - p, 4);
      setAffiche(debut + (valeur - debut) * e);
      if (p < 1) raf = requestAnimationFrame(pas);
      else depuis.current = valeur;
    };
    raf = requestAnimationFrame(pas);
    return () => {
      cancelAnimationFrame(raf);
      depuis.current = valeur;
    };
  }, [valeur, duree]);

  return affiche;
}
