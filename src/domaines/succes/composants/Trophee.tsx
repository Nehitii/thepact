/* LE TROPHEE D UNE CATEGORIE : ce qu on a obtenu sur ce qu il y a.
 *
 * Quarante lignes sorties de `pages/Achievements.tsx`. Il rejoint la
 * carte de succes et le moment de gloire, extraits le meme jour — la
 * page ne garde que ce qui assemble.
 */

import { Trophy } from "lucide-react";

export function Trophee({
  obtenus, total, complet, actif, onChoisir, libelle, bonds,
}: {
  obtenus: number; total: number; complet: boolean;
  actif: boolean; onChoisir: () => void; libelle: string;
  bonds?: number;
}) {
  const part = total > 0 ? obtenus / total : 0;
  const R = 25;
  const tour = 2 * Math.PI * R;

  return (
    <button
      type="button"
      className="su-trophee"
      data-complet={complet ? "" : undefined}
      aria-pressed={actif}
      onClick={onChoisir}
    >
      <span className="su-trophee-anneau">
        <svg viewBox="0 0 56 56" aria-hidden="true">
          <circle className="su-trophee-fond" cx="28" cy="28" r={R} />
          <circle
            className="su-trophee-part"
            cx="28" cy="28" r={R}
            strokeDasharray={tour}
            strokeDashoffset={tour * (1 - part)}
          />
        </svg>
        <span className="su-trophee-signe" aria-hidden="true">
          {complet ? <Trophy /> : <span className="su-trophee-chiffre">{obtenus}</span>}
        </span>
      </span>
      <span className="su-trophee-nom">{libelle}</span>
      {/* Une categorie franchie ne montre plus son compte — il est
          plein — mais ce qu elle a rapporte. */}
      <span className="su-trophee-compte">
        {complet && bonds ? `+${bonds}` : `${obtenus}/${total}`}
      </span>
    </button>
  );
}
