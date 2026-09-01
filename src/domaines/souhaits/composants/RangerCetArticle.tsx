import { useDraggable } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import { FolderInput, GripVertical } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/socle/ui/dropdown-menu";
import {
  HORS_LISTE, accepteLeDepot, type ArticleRangeable,
} from "@/domaines/souhaits/logique/rangementEntreListes";

interface Props {
  article: ArticleRangeable;
  listes: ReadonlyArray<{ id: string; name: string }>;
  onRanger: (itemId: string, cible: string) => void;
}

/**
 * PRENDRE UN ARTICLE — A LA MAIN, AU CLAVIER, OU SANS GESTE DU TOUT.
 *
 * UN DEPLACEMENT QUI N EXISTE QU A LA SOURIS N EXISTE PAS SUR MOBILE.
 * La poignee se glisse vers un onglet ; le menu fait exactement le
 * meme travail en deux appuis, et c est lui qui sert au telephone
 * tenu d une main, au clavier presse, et a qui ne voit pas ou lacher.
 * Ce ne sont pas un chemin et sa roue de secours : ce sont deux
 * chemins, et le second est le plus emprunte.
 *
 * UN ARTICLE DU PACTE NE MONTRE NI L UN NI L AUTRE. Il est finance par
 * un objectif et la table refuse de lui donner une liste ; offrir la
 * poignee reviendrait a promettre un geste qui finira en message
 * d erreur. Le composant ne rend rien du tout — pas un bouton grise,
 * qui poserait la question sans y repondre.
 */
export function RangerCetArticle({ article, listes, onRanger }: Props) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: article.id });

  /* Les destinations qui changeraient vraiment quelque chose : la
     liste ou l on est deja n en est pas une, et « Global » n y figure
     que si l on est range quelque part. */
  const destinations = [
    ...listes.map((l) => ({ cible: l.id, mot: l.name })),
    { cible: HORS_LISTE, mot: t("wishlist.ranger.horsListe", "Aucune liste") },
  ].filter((d) => accepteLeDepot(article, d.cible));

  if (!accepteLeDepot(article, HORS_LISTE) && destinations.length === 0) return null;

  return (
    <span className="wl-ranger">
      <button
        ref={setNodeRef}
        type="button"
        className="wl-outil wl-poignee"
        data-glisse={isDragging ? "1" : undefined}
        title={t("wishlist.ranger.saisir", "Déplacer vers une liste")}
        aria-label={t("wishlist.ranger.saisir", "Déplacer vers une liste")}
        {...listeners}
        {...attributes}
      >
        <GripVertical aria-hidden="true" />
      </button>

      {destinations.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="wl-outil"
              title={t("wishlist.ranger.menu", "Ranger dans…")}
              aria-label={t("wishlist.ranger.menu", "Ranger dans…")}
            >
              <FolderInput aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {destinations.map((d) => (
              <DropdownMenuItem key={d.cible} onClick={() => onRanger(article.id, d.cible)}>
                {d.mot}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </span>
  );
}
