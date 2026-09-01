import { useEffect, type RefObject } from "react";

/**
 * LE CURSEUR QUI SUIT L ENTREE ACTIVE.
 *
 * On ne lit pas « useLocation() » : cela redessinerait la barre
 * entiere a chaque navigation, precisement ce qu on veut eviter.
 * NavLink pose lui-meme « aria-current » ; il suffit de regarder cet
 * attribut changer, et de deplacer un seul element.
 *
 * Sorti de « AppSidebar.tsx » : la barre dessine seize entrees, elle
 * n a pas en plus a tenir un observateur, un rectangle et une image
 * animee. Le cliquet de taille l a signale au premier ajout.
 *
 * TROIS DEFAUTS CORRIGES ICI, dans l ordre ou ils se voyaient :
 *
 * 1. Le curseur etait ancre HORS de la zone qui defile — « .sb-nav »
 *    n etait pas positionnee, l ancrage remontait donc au conteneur
 *    exterieur. On mesurait une position dans un repere, on la posait
 *    dans un autre : des que la barre defilait, l ecart valait le
 *    defilement. Le remede est dans « styles/sidebar.css », une seule
 *    ligne — « position: relative » sur le nav.
 *
 * 2. La mesure etait a l entier. « offsetTop » et « offsetHeight »
 *    sont arrondis ; barre repliee, ou la hauteur d une entree est
 *    fractionnaire, le curseur se posait un pixel trop bas et deux
 *    pixels trop court. Les rectangles gardent leurs decimales.
 *
 * 3. On n observait que les attributs. Au premier rendu les entrees
 *    n existent pas encore : le calcul ne trouvait aucun actif, se
 *    declarait non pose, et RIEN ne le rappelait — le nav est en
 *    « flex: 1 », sa taille lui vient du parent et ne bouge pas quand
 *    il se remplit, donc le « ResizeObserver » ne rattrapait rien. Le
 *    curseur restait invisible au hasard de l ordre d arrivee.
 */
export function useCurseurDeNav(
  zone: RefObject<HTMLElement>,
  curseur: RefObject<HTMLSpanElement>,
  categories: unknown,
  mini: boolean,
) {
  useEffect(() => {
    const nav = zone.current;
    const barre = curseur.current;
    if (!nav || !barre) return;
    let attente = 0;

    const placer = () => {
      const actif = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!actif) {
        barre.dataset.vu = "non";
        return;
      }
      const e = actif.getBoundingClientRect();
      const cadre = nav.getBoundingClientRect();
      barre.style.height = e.height + "px";
      /* Les rectangles sont donnes dans le repere de l ecran ; le
         curseur, lui, est place dans celui de la mise en page. D ou
         le defilement rajoute. */
      barre.style.transform = "translateY(" + (e.top - cadre.top + nav.scrollTop) + "px)";
      barre.dataset.vu = "oui";
    };

    const differer = () => {
      cancelAnimationFrame(attente);
      attente = requestAnimationFrame(placer);
    };

    differer();
    const oeil = new MutationObserver(differer);
    oeil.observe(nav, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-current", "class"],
    });
    const taille = new ResizeObserver(differer);
    taille.observe(nav);

    /* PAS DE LISTENER DE DEFILEMENT. Le curseur est ancre dans la
       zone qui defile : il suit le contenu tout seul, et sa position
       de mise en page ne bouge pas quand on defile. Recalculer a
       chaque tour de molette ne changeait rien — sinon de refaire le
       meme calcul, faux ou juste, soixante fois par seconde. Le voile
       de debordement, lui, garde le sien : il regarde justement ce
       que le defilement change. */
    return () => {
      cancelAnimationFrame(attente);
      oeil.disconnect();
      taille.disconnect();
    };
  }, [zone, curseur, categories, mini]);
}
