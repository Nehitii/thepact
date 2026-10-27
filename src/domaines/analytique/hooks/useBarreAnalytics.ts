import { useCallback, useEffect, useState } from "react";

/**
 * LA BARRE DE NAVIGATION DES STATISTIQUES.
 *
 * ═══════════════════════════════════════════════════════════════
 * POURQUOI CE N'EST PAS UN « position: sticky »
 *
 * La page fait entre 1,9 et 2,6 écrans selon la vue, et la bascule de
 * vue comme le sélecteur de période vivaient tout en haut, en flux
 * normal. Descendus de sept cents pixels, on ne pouvait plus ni
 * changer de vue ni changer de période sans remonter toute la page.
 * C'est exactement le reproche : naviguer à l'intérieur n'est pas
 * intuitif.
 *
 * La correction évidente — « position: sticky; top: 0 » — NE MARCHE
 * PAS ICI, et il a fallu le mesurer pour le croire : posée sur la
 * barre, elle laissait l'élément descendre à -682 px au lieu de le
 * retenir à 0.
 *
 * La raison tient à la chaîne des ancêtres. Un élément collant se
 * cale sur son plus proche ancêtre DÉFILANT. Or entre cette barre et
 * le document il y en a trois qui déclarent un débordement :
 * DSPageShell (« overflow-hidden », pour rogner le fond étoilé), le
 * conteneur d'AppLayout (« overflow-hidden »), et son « main »
 * (« overflow-y-auto »). Le premier l'emporte — et comme il ne défile
 * jamais, la barre reste simplement où elle est.
 *
 * Et « main » ne défile pas non plus : la racine d'AppLayout porte
 * « min-h-screen » et non « h-screen », donc elle grandit avec son
 * contenu, « main » avec elle, et c'est le DOCUMENT qui défile.
 * Mesuré : document 2368 px pour 900 px de fenêtre, et « main » aussi
 * haut que son contenu.
 *
 * Rendre « sticky » utilisable demanderait de contraindre la hauteur
 * de la mise en page de TOUTE l'application. C'est un changement de
 * comportement global — restauration du défilement, unités de
 * fenêtre mobiles, chaque page — qu'on ne fait pas en passant, pour
 * réparer un écran. La barre se pose donc en « fixed », et se
 * recale sur la colonne de contenu, qu'on mesure.
 *
 * ═══ DES RÉFÉRENCES-FONCTIONS, ET NON DES useRef ═══
 *
 * La page rend un squelette tant que les données n'arrivent pas. Avec
 * des useRef et un effet à dépendances vides, les observateurs se
 * posaient PENDANT le squelette — sur des nœuds qui n'existaient pas
 * encore — et ne se reposaient jamais ensuite. Mesuré : la barre ne
 * se collait à aucun moment du défilement. Une référence-fonction
 * range le nœud dans un état, donc l'effet se rejoue quand il paraît.
 * ═══════════════════════════════════════════════════════════════
 */
export function useBarreCollee() {
  /* La sentinelle est un pixel posé juste avant la barre : quand elle
     sort du haut, c'est que la barre allait sortir aussi. */
  const [sentinelle, setSentinelle] = useState<HTMLDivElement | null>(null);
  /** La colonne de contenu, dont la barre reprend gauche et largeur. */
  const [colonne, setColonne] = useState<HTMLDivElement | null>(null);
  /** La barre elle-même : on retient sa hauteur naturelle. */
  const [barre, setBarre] = useState<HTMLElement | null>(null);

  const [collee, setCollee] = useState(false);
  const [geo, setGeo] = useState({ gauche: 0, largeur: 0 });
  const [hauteur, setHauteur] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!sentinelle) return;
    const io = new IntersectionObserver(([e]) => setCollee(!e.isIntersecting), { threshold: 0 });
    io.observe(sentinelle);
    return () => io.disconnect();
  }, [sentinelle]);

  useEffect(() => {
    if (!colonne) return;
    const mesurer = () => {
      const r = colonne.getBoundingClientRect();
      setGeo((p) =>
        /* On ne repose l'état que si la mesure a bougé : sans ce test,
           un ResizeObserver qui se déclenche sur son propre rendu
           bouclerait. */
        Math.round(r.left) === p.gauche && Math.round(r.width) === p.largeur
          ? p
          : { gauche: Math.round(r.left), largeur: Math.round(r.width) },
      );
    };
    mesurer();
    /* La colonne bouge quand la fenêtre change ET quand on replie la
       barre latérale — ce que le ResizeObserver voit, puisque la
       largeur suit. */
    const ro = new ResizeObserver(mesurer);
    ro.observe(colonne);
    window.addEventListener("resize", mesurer);
    return () => { ro.disconnect(); window.removeEventListener("resize", mesurer); };
  }, [colonne]);

  /* LA PLACE EST RÉSERVÉE AVANT QUE LA BARRE LA QUITTE. Une fois posée
     en « fixed », elle sort du flux : sans cette hauteur retenue, la
     page remonterait d'un coup au moment exact où l'on descend, et le
     saut relancerait la sentinelle — un clignotement sans fin. On
     mesure donc tant qu'elle est encore en place. */
  useEffect(() => {
    if (collee || !barre) return;
    const mesurer = () => setHauteur(Math.round(barre.getBoundingClientRect().height));
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(barre);
    return () => ro.disconnect();
  }, [collee, barre]);

  return {
    sentinelle: setSentinelle,
    colonne: setColonne,
    barre: setBarre,
    collee,
    geo,
    hauteur,
  };
}

/* Un défilement animé reste un mouvement : qui l'a refusé dans son
   système ne veut pas non plus de celui-là. */
export const glisse = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

export interface EntreeSommaire { id: string; nom: string }

/**
 * LE SOMMAIRE DE LA VUE COURANTE.
 *
 * Chaque vue empile de sept à dix panneaux, aux titres volontairement
 * parlants — « Les jours qui portent », « Ce qui tombe à date ». Beaux
 * à lire, impossibles à deviner : arrivé sur la vue, on ne sait pas ce
 * qu'il y a plus bas, donc on fait défiler pour voir.
 *
 * La liste n'est pas tenue à la main. Elle est LUE dans le rendu :
 * chaque panneau porte « data-panneau » avec son titre, et le sommaire
 * s'en déduit. Une liste recopiée aurait dérivé au premier panneau
 * ajouté ; celle-ci ne peut pas.
 */
export function useSommaire(vue: string, pret: boolean) {
  const [entrees, setEntrees] = useState<EntreeSommaire[]>([]);
  const [actif, setActif] = useState<string | null>(null);

  useEffect(() => {
    if (!pret) return;
    const noeuds = [...document.querySelectorAll<HTMLElement>("[data-panneau]")];
    setEntrees(noeuds.map((n) => ({ id: n.id, nom: n.dataset.panneau ?? "" })));
    setActif(noeuds[0]?.id ?? null);
    if (!noeuds.length) return;

    /* Le panneau « courant » est celui qui occupe la bande haute de la
       fenêtre, sous la barre. La marge basse à -60 % évite qu'un
       panneau situé en bas d'écran vole la vedette à celui qu'on lit. */
    const io = new IntersectionObserver(
      (evts) => {
        const visibles = evts
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibles.length) setActif((visibles[0].target as HTMLElement).id);
      },
      { rootMargin: "-92px 0px -60% 0px", threshold: 0 },
    );
    noeuds.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [vue, pret]);

  /** Amène un panneau sous la barre, sans le coller au bord. */
  const aller = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const haut = el.getBoundingClientRect().top + window.scrollY - 104;
    window.scrollTo({ top: Math.max(0, haut), behavior: glisse() });
  }, []);

  return { entrees, actif, aller };
}
