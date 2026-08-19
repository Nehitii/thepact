import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/* LA LARGEUR SE LIT AU PREMIER RENDU, PAS APRES
 *
 * L etat partait de « indefini » et n etait renseigne que dans un effet,
 * c est-a-dire APRES le premier rendu. Le crochet repondait donc « non »
 * a tout le monde une fois, et tout etat initialise a partir de lui
 * naissait faux — puis ne se refaisait jamais.
 *
 * Le calendrier en etait le cas d ecole : useState(isMobile ? "agenda" :
 * "month") ouvrait la grille du mois sur un telephone, avec des cases de
 * trente-deux pixels de large.
 *
 * Il n y a pas de rendu serveur ici : lire la fenetre des le depart ne
 * desynchronise rien.
 */
function mesurer() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(mesurer);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
