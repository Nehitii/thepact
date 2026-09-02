import { useMemo } from "react";
import { sigilDuPacte } from "@/domaines/onboarding/logique/sigil";

interface Props {
  nomDuPacte: string;
  valeurs: readonly string[];
  /** La teinte du pacte, en couleur CSS resolue. */
  teinte: string;
}

/* Trois anneaux concentriques, et vingt-quatre graduations. */
const ANNEAUX = [0.94, 0.78, 0.58];
const GRADUATIONS = 24;

/**
 * LE CERCLE DE SCELLEMENT.
 *
 * Pas un pentagramme : un HUD circulaire. Trois anneaux, des
 * graduations, des glyphes, le symbole au centre — futuriste par la
 * geometrie, arcanique par la lenteur.
 *
 * LES GLYPHES NE SONT PAS DE LA DECORATION. Ils se deduisent du pacte
 * lui-meme, et le meme pacte donne toujours le meme sigil ; les
 * valeurs viennent s accrocher a l anneau externe, et la corde les
 * relie dans leur ordre de rang. Voir « logique/sigil.ts ».
 *
 * Le repere est le cercle unite centre en zero, ce que « viewBox »
 * transpose : les traits de l alphabet vivent dans une boite [0,1]²
 * qu on translate et fait pivoter a leur angle.
 */
export function CercleDeScellement({ nomDuPacte, valeurs, teinte }: Props) {
  const sigil = useMemo(() => sigilDuPacte(nomDuPacte, valeurs), [nomDuPacte, valeurs]);

  /* Le rayon ou se posent les glyphes : entre le deuxieme et le
     troisieme anneau, la ou il reste de la place. */
  const rayonDesTraits = 0.68;
  const tailleDuTrait = 0.13;

  return (
    <svg
      className="ob-cercle"
      viewBox="-1.1 -1.1 2.2 2.2"
      style={{ color: teinte }}
      role="img"
      aria-hidden="true"
    >
      {ANNEAUX.map((r) => (
        <circle key={r} className="ob-cercle-anneau" cx="0" cy="0" r={r} strokeWidth="0.006" />
      ))}

      {Array.from({ length: GRADUATIONS }, (_, i) => {
        const a = (i / GRADUATIONS) * Math.PI * 2;
        const longue = i % 6 === 0;
        const r1 = longue ? 0.86 : 0.9;
        return (
          <line
            key={i}
            className="ob-cercle-grad"
            x1={Math.cos(a) * r1} y1={Math.sin(a) * r1}
            x2={Math.cos(a) * 0.94} y2={Math.sin(a) * 0.94}
            strokeWidth={longue ? 0.009 : 0.004}
          />
        );
      })}

      {/* LA CORDE DES VALEURS, dans l ordre de rang. */}
      {sigil.polygone.length > 1 && (
        <polygon
          className="ob-cercle-corde"
          points={sigil.polygone.map((p) => `${p.x * 0.94},${p.y * 0.94}`).join(" ")}
        />
      )}
      {sigil.ancres.map((a) => (
        <circle
          key={a.valeur}
          className="ob-cercle-ancre"
          cx={Math.cos(a.angle) * 0.94}
          cy={Math.sin(a.angle) * 0.94}
          r="0.022"
        />
      ))}

      {/* LES GLYPHES DU NOM. Chaque trait est dessine dans sa boite
          unitaire, ramene a sa taille, puis pose a son angle. */}
      {sigil.traits.map((trait, i) => {
        const x = Math.cos(trait.angle) * rayonDesTraits;
        const y = Math.sin(trait.angle) * rayonDesTraits;
        const rotation = (trait.angle * 180) / Math.PI + 90;
        return (
          <g
            key={i}
            transform={`translate(${x} ${y}) rotate(${rotation}) scale(${tailleDuTrait}) translate(-0.5 -0.5)`}
          >
            <path className="ob-cercle-trait" d={trait.d} vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
    </svg>
  );
}
