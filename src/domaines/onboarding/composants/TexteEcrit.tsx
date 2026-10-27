import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface Props {
  texte: string;
  /** Millisecondes par lettre. */
  cadence?: number;
  /** Attendre avant de commencer a ecrire. */
  retard?: number;
  className?: string;
  onFini?: () => void;
}

/**
 * LE SYSTEME S ECRIT, IL NE S AFFICHE PAS.
 *
 * Une lettre a la fois, en Orbitron : c est ce qui fait que la fenetre
 * a l air de PARLER plutot que d avoir ete posee la. La frappe est le
 * seul effet du rite qui coute quelque chose a la lecture — d ou la
 * cadence courte, et la sortie ci-dessous.
 *
 * SOUS « prefers-reduced-motion », LE TEXTE EST LA D UN COUP. Le rite
 * garde ses ecrans, ses mots et sa signature ; il perd la gravure
 * lettre a lettre. Un texte qui se refuse a etre lu vite est une
 * barriere, pas une mise en scene.
 *
 * Le texte complet est toujours dans le document — « aria-label » le
 * porte des la premiere image : un lecteur d ecran n a pas a suivre
 * une machine a ecrire.
 */
export function TexteEcrit({ texte, cadence = 22, retard = 0, className, onFini }: Props) {
  const sobre = useReducedMotion();
  const [ecrit, setEcrit] = useState(() => (sobre ? texte.length : 0));

  useEffect(() => {
    if (sobre) {
      setEcrit(texte.length);
      onFini?.();
      return;
    }
    setEcrit(0);
    let lettre = 0;
    let minuteur = 0;
    const debut = window.setTimeout(function frapper() {
      lettre += 1;
      setEcrit(lettre);
      if (lettre >= texte.length) return onFini?.();
      minuteur = window.setTimeout(frapper, cadence);
    }, retard);
    return () => { window.clearTimeout(debut); window.clearTimeout(minuteur); };
    /* « onFini » n entre pas dans les dependances : un appelant qui le
       recree a chaque rendu relancerait la frappe depuis le debut, en
       boucle. Ce que la frappe doit suivre, c est le TEXTE. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texte, cadence, retard, sobre]);

  return (
    <span className={className} aria-label={texte}>
      <span aria-hidden="true">{texte.slice(0, ecrit)}</span>
    </span>
  );
}
