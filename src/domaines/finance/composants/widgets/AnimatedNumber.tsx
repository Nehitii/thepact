import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { formatCurrency } from '@/socle/outils/currency';
import { DUREE_MS, valeurALInstant, estArrivee } from '@/domaines/finance/logique/nombreAnime';

interface AnimatedNumberProps {
  value: number;
  currency: string;
  isPositive: boolean;
  className?: string;
  /** Un solde se signe, un montant non : « +14 062 € » ne veut rien dire. */
  showSign?: boolean;
}

/* LE NOMBRE MONTE EN HUIT CENTS MILLISECONDES, QUOI QU IL ARRIVE.
 *
 * Il montait en trente-trois secondes des que la page avait autre
 * chose a faire — et pendant ces trente-trois secondes, le solde du
 * mois affichait un chiffre qui n etait pas le sien. Pourquoi, et ce
 * que « piloter par le temps » veut dire : « logique/nombreAnime.ts ».
 *
 * Deux details valent d etre dits ici :
 *
 * ON REPART DE CE QUI EST AFFICHE, pas de la derniere cible. Changer
 * de mois pendant que le nombre monte encore est le geste le plus
 * courant — on parcourt la bande. L ancienne version notait la cible
 * comme point de depart des le premier tour : le nombre sautait
 * brutalement a la valeur precedente avant de repartir.
 *
 * ON RESPECTE « prefers-reduced-motion ». Un chiffre qui defile est
 * exactement ce que ce reglage demande d eviter, et un solde n a pas
 * besoin d etre anime pour etre lu.
 */
export function AnimatedNumber({ value, currency, isPositive, className, showSign = true }: AnimatedNumberProps) {
  /* Zero au depart : la montee d entree est voulue, c est elle qui
     donne a la page son arrivee. Ce qui ne l etait pas, c est qu elle
     dure trente-trois secondes. */
  const [displayValue, setDisplayValue] = useState(0);
  /* Ce qui est A L ECRAN, lu sans re-rendu : c est de la que repart la
     montee suivante. */
  const affiche = useRef(0);
  const sobre = useReducedMotion();

  useEffect(() => {
    const poser = () => {
      affiche.current = value;
      setDisplayValue(value);
    };

    /* ONGLET CACHE : ON POSE, ON N ANIME PAS. Le navigateur suspend
       « requestAnimationFrame » dans un onglet qu on ne regarde pas —
       et il le suspend pour de bon, pas au ralenti. Sans cette porte,
       le nombre resterait fige a zero jusqu au retour, ce qui serait
       pire que le defaut qu on repare. Une montee que personne ne
       regarde n a de toute facon rien a montrer. */
    if (sobre || document.hidden) {
      poser();
      return;
    }

    const depart = affiche.current;
    if (depart === value) return;

    const debut = performance.now();
    let image = 0;

    const dessiner = (maintenant: number) => {
      const ecoule = maintenant - debut;
      const v = valeurALInstant(depart, value, ecoule, DUREE_MS);
      affiche.current = v;
      setDisplayValue(v);
      if (!estArrivee(ecoule, DUREE_MS)) image = requestAnimationFrame(dessiner);
    };

    /* Et si l onglet part en cours de route, on termine tout de suite :
       au retour, le chiffre juste est deja la. */
    const siLOnCache = () => { if (document.hidden) { cancelAnimationFrame(image); poser(); } };
    document.addEventListener("visibilitychange", siLOnCache);

    image = requestAnimationFrame(dessiner);
    return () => {
      cancelAnimationFrame(image);
      document.removeEventListener("visibilitychange", siLOnCache);
    };
  }, [value, sobre]);

  return (
    <span className={className || `neu-hero-balance ${!isPositive ? 'negative' : ''}`}>
      {showSign && isPositive && value >= 0 ? '+' : ''}{formatCurrency(displayValue, currency)}
    </span>
  );
}
