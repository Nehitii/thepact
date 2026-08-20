import { useCallback, useLayoutEffect, useState } from "react";

/* LE DIALOGUE DE LA CONSOLE
 *
 * Deux comportements que Radix ne peut pas connaitre :
 *
 * 1. Un dialogue se centre sur la fenetre — donc, quand une barre de
 *    navigation occupe la gauche, il est decale vers elle par rapport a
 *    la page qu on regarde. On mesure la zone de contenu et on rattrape
 *    l ecart. La reference est « documentElement.clientWidth » et non
 *    « innerWidth » : une boite en position fixe se place dans la zone
 *    d affichage SANS la barre de defilement.
 *
 * 2. Le degrade du bas ne sert que s il reste quelque chose a lire. Un
 *    observateur de taille ne suffit pas : la boite garde sa hauteur
 *    maximale pendant que son contenu grandit, et un formulaire montre
 *    ou cache des champs sans que la boite bouge — d ou l observateur
 *    d arbre.
 *
 * La boite est suivie par une ref de RAPPEL : Radix ne monte le contenu
 * du portail qu au commit suivant, si bien qu une ref ordinaire est
 * encore vide quand l effet passe, et la mesure n arrivait jamais.
 */
export function useDialogueConsole(ouvert: boolean) {
  const [decalage, setDecalage] = useState(0);
  const [entier, setEntier] = useState(true);
  const [corps, setCorps] = useState<HTMLDivElement | null>(null);

  const corpsRef = useCallback((node: HTMLDivElement | null) => setCorps(node), []);

  useLayoutEffect(() => {
    if (!ouvert) return;
    const zone = document.querySelector("main");
    if (!zone) return;
    const mesurer = () => {
      const r = zone.getBoundingClientRect();
      const vue = document.documentElement.clientWidth;
      const brut = r.left + r.width / 2 - vue / 2;
      /* Recentrer ne doit jamais sortir la boite de l ecran : sur un
         telephone, la zone de contenu peut etre etroite au point que
         son centre n en soit plus un. On borne le rattrapage a ce que
         la largeur maximale du dialogue autorise. */
      const largeur = Math.min(448, vue - 32);
      const borne = Math.max(0, (vue - largeur) / 2 - 8);
      setDecalage(Math.round(Math.max(-borne, Math.min(borne, brut))));
    };
    mesurer();
    const obs = new ResizeObserver(mesurer);
    obs.observe(zone);
    window.addEventListener("resize", mesurer);
    return () => { obs.disconnect(); window.removeEventListener("resize", mesurer); };
  }, [ouvert]);

  useLayoutEffect(() => {
    if (!ouvert || !corps) return;

    const mesurer = () => setEntier(corps.scrollHeight - corps.clientHeight - corps.scrollTop <= 1);
    const taille = new ResizeObserver(mesurer);
    const suivre = () => {
      taille.disconnect();
      taille.observe(corps);
      for (const enfant of Array.from(corps.children)) taille.observe(enfant);
      mesurer();
    };
    const arbre = new MutationObserver(suivre);

    suivre();
    const image = requestAnimationFrame(mesurer);
    arbre.observe(corps, { childList: true, subtree: true });
    corps.addEventListener("scroll", mesurer, { passive: true });

    return () => {
      cancelAnimationFrame(image);
      taille.disconnect();
      arbre.disconnect();
      corps.removeEventListener("scroll", mesurer);
    };
  }, [ouvert, corps]);

  return { decalage, entier, corpsRef };
}
