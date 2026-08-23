import { HandHeart, Medal, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { REPLI_REACTION, type TypeReaction } from "./vocabulaire";

/* LES TROIS REACTIONS.
 *
 * Support, Respect, Inspire : le vocabulaire d engagement propre a
 * Vowpact, la ou les autres reseaux n ont qu un like. On le garde.
 *
 * Ce qui change, c est ce qui le porte. Trois emoji — 💪 🫡 ⚡ —
 * tenaient lieu d icones : ils sont dessines differemment sur chaque
 * systeme, ne s alignent pas sur la ligne de base du texte, et ne
 * peuvent ni prendre la couleur du texte ni s epaissir. Trois icones
 * dessinees les remplacent, meme graisse, meme taille.
 *
 * Chaque bouton etait aussi une pastille bordee et remplie, en
 * permanence. Au repos, une reaction n est plus qu une icone grise
 * et un chiffre ; la couleur n arrive que lorsqu on la pose — c est
 * alors le seul moment anime de la page. */

const ICONES = { support: HandHeart, respect: Medal, inspired: Zap } as const;

interface Props {
  type: TypeReaction;
  count: number;
  isActive: boolean;
  onToggle: () => void;
  /** Sur la scene video, l icone grossit et le libelle disparait. */
  variante?: "fil" | "scene";
}

export function ReactionButton({ type, count, isActive, onToggle, variante = "fil" }: Props) {
  const { t } = useTranslation();
  const Icone = ICONES[type];
  const libelle = t(`community.reactions.${type}`, REPLI_REACTION[type]);

  return (
    <button
      type="button"
      className="co-action"
      data-reaction={type}
      aria-pressed={isActive}
      aria-label={`${libelle} · ${count}`}
      title={libelle}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <i className="co-action-rond"><Icone aria-hidden="true" /></i>
      <span>{count > 0 ? count : ""}</span>
      {variante === "scene" && <em style={{ fontStyle: "normal", fontSize: 11 }}>{libelle}</em>}
    </button>
  );
}
