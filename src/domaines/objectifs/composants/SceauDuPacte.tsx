import { useMemo } from "react";
import { sigilDuPacte } from "@/domaines/objectifs/logique/sigil";

interface Props {
  /** Le nom du pacte : c est lui qui donne les glyphes. */
  nom: string;
  /** Les valeurs du porteur, dans leur ordre de rang. Facultatives. */
  valeurs?: readonly string[];
  /** Cote du carre, en pixels. */
  taille?: number;
  /**
   * La version d alphabet sous laquelle ce pacte a ete scelle —
   * « pacts.sigil_version ». Un sceau jure sous une version anterieure
   * garde son dessin d alors.
   */
  version?: number;
  /** Ce que le sceau dit aux lecteurs d ecran. Vide par defaut. */
  alt?: string;
  className?: string;
}

/**
 * LE SCEAU D UN PACTE.
 *
 * Les glyphes se DEDUISENT du pacte : meme nom, meme dessin, partout
 * et pour toujours. C est ce qui separe un rituel d une animation —
 * il produit un objet qui lui survit.
 *
 * IL VIT DANS LE DOMAINE DU PACTE, PAS DANS CELUI DU RITE. Le rite le
 * fait naitre, mais le sceau appartient au pacte : la carte
 * d identite, le pantheon et la guilde n ont aucune raison d importer
 * quoi que ce soit d un ecran d inscription qu ils ne montrent jamais.
 *
 * C est la forme BREVE, celle qui se pose a cote d un nom : les
 * glyphes, la corde des valeurs, un anneau. Le cercle complet du
 * scellement — trois anneaux, graduations, symbole au centre — reste
 * au rite, parce qu il n a de sens qu a l instant ou l on signe.
 */
export function SceauDuPacte({
  nom, valeurs = [], taille = 40, version, alt = "", className,
}: Props) {
  const sigil = useMemo(() => sigilDuPacte(nom, valeurs, version), [nom, valeurs, version]);

  /* Rien a dessiner tant que le nom ne donne aucun trait — pendant la
     frappe, par exemple. Un cadre vide vaut mieux qu un anneau seul
     qui ressemblerait a un sceau qu on n a pas. */
  if (sigil.traits.length === 0) return null;

  const rayonDesTraits = 0.66;
  const tailleDuTrait = 0.16;

  return (
    <svg
      className={className}
      width={taille}
      height={taille}
      viewBox="-1.05 -1.05 2.1 2.1"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <circle
        cx="0" cy="0" r="0.96"
        fill="none" stroke="currentColor" strokeWidth="0.018" opacity="0.28"
      />

      {/* LA CORDE DES VALEURS, dans leur ordre de rang. Deux porteurs
          qui ont choisi les memes valeurs dans un ordre different n ont
          pas le meme sceau. */}
      {sigil.polygone.length > 1 && (
        <polygon
          points={sigil.polygone.map((p) => `${p.x * 0.96},${p.y * 0.96}`).join(" ")}
          fill="none" stroke="currentColor" strokeWidth="0.014" opacity="0.5"
        />
      )}

      {sigil.traits.map((trait, i) => (
        <g
          key={i}
          transform={
            `translate(${Math.cos(trait.angle) * rayonDesTraits} ${Math.sin(trait.angle) * rayonDesTraits})`
            + ` rotate(${(trait.angle * 180) / Math.PI + 90})`
            + ` scale(${tailleDuTrait}) translate(-0.5 -0.5)`
          }
        >
          <path
            d={trait.d}
            fill="none" stroke="currentColor" strokeLinecap="round"
            strokeWidth="0.09" vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  );
}
