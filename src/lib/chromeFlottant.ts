import { useCallback, useEffect, useState } from "react";
import { PREF } from "./preferencesAffichage";

/**
 * Les deux objets qui flottent au-dessus de l'application.
 *
 * ═══════════════════════════════════════════════════════════════
 * LA BARRE ⌘K ET LA VIGNETTE DE M.I.A SE POSENT SUR TOUTES LES PAGES.
 *
 * Ce sont les deux seuls éléments qui ne quittent jamais l'écran, et les
 * deux seuls qu'on puisse trouver de trop. Ils partagent donc un
 * réglage, dans le même panneau, parce qu'on ne les cherche pas
 * séparément — on cherche « comment enlever ce qui flotte ».
 *
 * CACHER LA BARRE NE DÉSARME PAS LE RACCOURCI. ⌘K ouvre la palette même
 * quand la barre est retirée : ce qu'on retire est un bouton, pas une
 * fonction. Quelqu'un qui connaît le raccourci n'a jamais eu besoin du
 * bouton, et c'est justement lui qui le retire.
 *
 * L'AVIS D'ÉVÈNEMENT N'EST PAS UN LUXE. Le réglage vit dans les options
 * et les objets vivent dans la charpente : deux arbres React sans
 * ancêtre commun. Sans cet avis, il faudrait recharger pour voir l'effet
 * d'un interrupteur — ce qui donne l'impression qu'il n'a rien fait.
 * ═══════════════════════════════════════════════════════════════
 */

const AVIS = "overwrite-chrome-flottant";

/* « barre » a disparu de cette liste avec la barre ⌘K flottante :
   la barre laterale porte maintenant sa propre recherche, et deux
   portes cote a cote pour la meme piece ne valent pas un reglage. Il
   ne reste qu un objet flottant, mais le mecanisme est garde tel
   quel — le jour ou un second reapparait, il se branche ici. */
type Objet = "mia";

const CLE: Record<Objet, string> = {
  mia: PREF.MIA_VIGNETTE,
};

/** Visible par défaut : on ne cache pas ce que personne n'a demandé de cacher. */
function lire(objet: Objet): boolean {
  try {
    return localStorage.getItem(CLE[objet]) !== "0";
  } catch {
    return true;
  }
}

export function useChromeFlottant(objet: Objet): [boolean, (v: boolean) => void] {
  const [visible, setVisible] = useState(() => lire(objet));

  const regler = useCallback(
    (v: boolean) => {
      try {
        localStorage.setItem(CLE[objet], v ? "1" : "0");
      } catch {
        /* navigation privée : le réglage ne tiendra que la session */
      }
      setVisible(v);
      window.dispatchEvent(new CustomEvent(AVIS, { detail: { objet, visible: v } }));
    },
    [objet],
  );

  useEffect(() => {
    const suivre = (e: Event) => {
      const d = (e as CustomEvent).detail as { objet: Objet; visible: boolean } | undefined;
      if (d?.objet === objet) setVisible(d.visible);
    };
    window.addEventListener(AVIS, suivre);
    return () => window.removeEventListener(AVIS, suivre);
  }, [objet]);

  return [visible, regler];
}
