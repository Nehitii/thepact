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
    let filet = 0;

    /* Poser le curseur SUR une entree donnee. Separe de « placer »
       parce qu au clic on connait la destination avant que la barre
       ne la sache. */
    const poserSur = (entree: HTMLElement) => {
      const e = entree.getBoundingClientRect();
      const cadre = nav.getBoundingClientRect();
      barre.style.height = e.height + "px";
      /* Les rectangles sont donnes dans le repere de l ecran ; le
         curseur, lui, est place dans celui de la mise en page. D ou
         le defilement rajoute. */
      barre.style.transform = "translateY(" + (e.top - cadre.top + nav.scrollTop) + "px)";
      barre.dataset.vu = "oui";
    };

    const placer = () => {
      const actif = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!actif) {
        barre.dataset.vu = "non";
        return;
      }
      poserSur(actif);
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

    /* ═══ LE CURSEUR PART AU CLIC, PAS APRES LA NAVIGATION ═══
     *
     * Mesure : cent quarante-quatre millisecondes entre le clic et le
     * premier mouvement. Le curseur attendait que le routeur navigue,
     * que la page de destination se rende, et que NavLink pose enfin
     * « aria-current » — seulement la l observateur le reveillait. On
     * cliquait, et pendant un sixieme de seconde il ne se passait
     * rien : c est cela qu on lit comme « pas fluide », pas les
     * images, qui tiennent leurs soixante par seconde.
     *
     * Or la destination est connue des l appui. On pose donc le
     * curseur tout de suite, et le placement ordinaire reprend la
     * main quand la barre sait ou elle en est.
     *
     * ET SI LA NAVIGATION N ABOUTIT PAS ? Le curseur serait pose sur
     * une entree qui n est pas devenue active, et rien ne le
     * corrigerait — « aria-current » n ayant pas change, aucune
     * mutation ne survient. Le filet ci-dessous le ramene sur le vrai
     * actif si la barre ne l a pas suivi. */
    const auClic = (e: Event) => {
      const cible = (e.target as HTMLElement | null)?.closest<HTMLElement>("a[href]");
      if (!cible || !nav.contains(cible) || cible.getAttribute("aria-current") === "page") return;
      cancelAnimationFrame(attente);
      poserSur(cible);
      clearTimeout(filet);
      filet = window.setTimeout(placer, 700);
    };
    nav.addEventListener("pointerdown", auClic);

    /* rAF NE TOURNE PAS DANS UN ONGLET CACHE, et le navigateur le
       suspend pour de bon. Un curseur place pendant que l onglet
       dormait garderait sa position d alors ; on replace donc au
       retour. Le meme piege que le solde du mois, repare pareil. */
    const auRetour = () => { if (!document.hidden) differer(); };
    document.addEventListener("visibilitychange", auRetour);

    /* PAS DE LISTENER DE DEFILEMENT. Le curseur est ancre dans la
       zone qui defile : il suit le contenu tout seul, et sa position
       de mise en page ne bouge pas quand on defile. Recalculer a
       chaque tour de molette ne changeait rien — sinon de refaire le
       meme calcul, faux ou juste, soixante fois par seconde. Le voile
       de debordement, lui, garde le sien : il regarde justement ce
       que le defilement change. */
    return () => {
      cancelAnimationFrame(attente);
      clearTimeout(filet);
      nav.removeEventListener("pointerdown", auClic);
      document.removeEventListener("visibilitychange", auRetour);
      oeil.disconnect();
      taille.disconnect();
    };
  }, [zone, curseur, categories, mini]);
}
