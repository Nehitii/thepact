/**
 * LA JAUGE EN CELLULES.
 *
 * Une barre lisse ne se compte pas : on lit « a peu pres la
 * moitie ». Quarante cellules se denombrent d un regard, et un
 * article coche en allume une — le geste a une consequence visible
 * au lieu de deplacer un bord de deux pixels.
 *
 * C est aussi la seule chose que cette page emprunte a la langue
 * des machines, et elle la porte partout : bandeau, objectifs.
 */
interface WishlistRailProps {
  /** Entre 0 et 1. */
  part: number;
  cellules?: number;
  ton?: "acquis" | "encre";
  className?: string;
}

export function WishlistRail({ part, cellules = 40, ton = "acquis", className }: WishlistRailProps) {
  const sur = Number.isFinite(part) ? Math.max(0, Math.min(1, part)) : 0;
  /* On arrondit vers le haut des qu il y a quelque chose : une part
     non nulle ne doit jamais s afficher comme zero allumee. */
  const allumees = sur === 0 ? 0 : Math.max(1, Math.round(sur * cellules));

  return (
    <span className={className} aria-hidden="true">
      {Array.from({ length: cellules }, (_, i) => (
        <i key={i} data-on={i < allumees ? "1" : "0"} data-part={ton} />
      ))}
    </span>
  );
}
