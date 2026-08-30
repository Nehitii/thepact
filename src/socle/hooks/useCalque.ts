import { type MouseEvent, type PointerEvent, type RefObject, useEffect, useRef } from "react";
import { PIEGEABLES, fermeAuFond, indiceDuPiege } from "@/socle/outils/calque";

/* ═══════════════════════════════════════════════════════════════
   UN CALQUE QUI SE DIT MODAL DOIT L ETRE

   Il porte `role="dialog"` et `aria-modal="true"` — une promesse que
   le balisage seul ne tient pas. Ce crochet en tient trois moities :

     ECHAP FERME, et le clic sur les marges aussi. Ce sont les deux
     sorties qu on essaie d instinct devant un calque, et leur absence
     donne le sentiment d etre coince.

     LE FOCUS NE S ECHAPPE PAS. Trois tabulations et l on pilotait la
     page de dessous, invisible. Pour un lecteur d ecran, `aria-modal`
     promettait exactement le contraire.

     LE FOCUS REVIENT D OU IL VENAIT. Revenir ailleurs qu au bouton
     qu on vient de quitter desoriente.

   ═══ CE QU IL NE FAIT PLUS, ET POURQUOI ═══

   IL NE COMPENSE PLUS LA BARRE DE DEFILEMENT. Le parcours du mois
   posait `padding-right` a hauteur de la barre, pour eviter le saut
   qu on observe quand `overflow: hidden` la fait disparaitre.

   ELLE NE DISPARAIT PLUS. `index.css` pose `html { overflow-y: scroll }`
   — la barre est permanente, et `overflow` sur `body` ne se propage
   plus au viewport. La compensation retrecissait donc la page de la
   largeur d une barre qui n etait jamais partie : MESURE LE 30/08/2026,
   l en-tete passait de 497 a 486 pixels a l ouverture du parcours. Le
   meme fichier neutralise deja cette compensation pour tous les
   calques Radix (`html body[data-scroll-locked]`), avec la meme
   mesure ; le parcours la reintroduisait a la main parce que ce
   selecteur ne l atteint pas.

   ET LE VERROU DE DEFILEMENT NE VERROUILLE RIEN. Pour la meme raison :
   `html` est le conteneur de defilement, un `overflow: hidden` sur
   `body` ne l arrete pas. MESURE LE MEME JOUR : le fond defile encore
   pendant que le calque est ouvert (scrollTop 0 → 120). On le garde
   quand meme — six calques de l application posent la meme ligne, et
   `index.css` assume ce compromis par ecrit : verrouiller `html` a la
   place preserverait le fond mais ramenerait le decalage. Ce qui
   change ici, c est qu on ne le croit plus.
   ═══════════════════════════════════════════════════════════════ */
export function useCalque(
  ouvert: boolean,
  onFermer: () => void,
  calque: RefObject<HTMLElement | null>,
) {
  const departSurLeFond = useRef(false);

  useEffect(() => {
    if (!ouvert) return;
    const rendreLeFocusA = document.activeElement as HTMLElement | null;

    const debordement = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onFermer(); return; }
      if (e.key !== "Tab" || !calque.current) return;
      const cibles = calque.current.querySelectorAll<HTMLElement>(PIEGEABLES);
      const ou = indiceDuPiege(
        cibles.length,
        [...cibles].indexOf(document.activeElement as HTMLElement),
        e.shiftKey,
      );
      if (ou === null) return;
      e.preventDefault();
      cibles[ou].focus();
    };
    document.addEventListener("keydown", auClavier, true);

    return () => {
      document.body.style.overflow = debordement;
      document.removeEventListener("keydown", auClavier, true);
      rendreLeFocusA?.focus?.();
    };
  }, [ouvert, onFermer, calque]);

  return {
    /** A poser sur le fond : il note si le geste y a COMMENCE. */
    auPointerDown: (e: PointerEvent) => {
      departSurLeFond.current = e.target === e.currentTarget;
    },
    /** A poser sur le fond : il ferme si le geste y a commence ET fini. */
    auClick: (e: MouseEvent) => {
      if (fermeAuFond(departSurLeFond.current, e.target === e.currentTarget)) onFermer();
    },
  };
}
