import { useTranslation } from "react-i18next";
import { libelleNature, type NaturePost } from "@/domaines/social/logique/vocabulaire";

/* LA NATURE D UN POST — un point et un mot.
 *
 * L etiquette precedente empilait cinq signaux pour porter une seule
 * information : un emoji, un fond teinte, une bordure teintee, des
 * majuscules et du monospace. Elle pesait plus lourd, a l oeil, que
 * le nom de l auteur juste a cote.
 *
 * Il reste la couleur, qui distingue, et le mot, qui nomme. Le point
 * prend la teinte par currentColor ; c est le CSS qui l attribue
 * depuis data-nature, pour que la palette vive a un seul endroit.
 *
 * Les six libelles etaient ecrits en anglais dans la table de
 * configuration, donc affiches tels quels quelle que soit la langue. */

export function PostTypeTag({ type }: { type: NaturePost }) {
  const { t } = useTranslation();
  return (
    <span className="co-nature" data-nature={type}>
      {libelleNature(type, t)}
    </span>
  );
}
