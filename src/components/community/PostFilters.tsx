import { Clock, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PostFilterType, PostSortOption } from "@/hooks/useCommunity";
import { NATURES, libelleNature } from "./vocabulaire";

/* LES FILTRES — une seule rangee, qui defile.
 *
 * Il y en avait deux, empilees : sept boutons de nature au-dessus,
 * deux boutons de tri en dessous, precedes du mot « Sort: ». Neuf
 * commandes et un libelle pour une barre de filtres, dans une page
 * dont le fil compte un post.
 *
 * Chaque bouton portait aussi ses six couleurs en dur — fond,
 * bordure, texte, pastille, et leurs variantes actives — soit
 * vingt-neuf valeurs litterales pour sept boutons. Les couleurs de
 * nature vivent maintenant dans community.css, au meme endroit que
 * celles des etiquettes de post : une nature a une teinte, pas deux.
 *
 * L etat actif ne se signale plus par un fond teinte mais par
 * l inversion — texte sur fond plein. C est lisible sans couleur,
 * donc lisible aussi pour qui ne les distingue pas. */

interface Props {
  activeFilter: PostFilterType;
  onFilterChange: (filter: PostFilterType) => void;
  activeSort: PostSortOption;
  onSortChange: (sort: PostSortOption) => void;
}

export function PostFilters({ activeFilter, onFilterChange, activeSort, onSortChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="co-filtres">
      <div className="co-filtres-defile" role="group" aria-label={t("community.filters.title", "Filtrer le fil")}>
        <button
          type="button"
          className="co-puce"
          aria-pressed={activeFilter === "all"}
          onClick={() => onFilterChange("all")}
        >
          {t("community.filters.all", "Tout")}
        </button>

        {NATURES.map((nature) => (
          <button
            key={nature}
            type="button"
            className="co-puce"
            aria-pressed={activeFilter === nature}
            onClick={() => onFilterChange(nature)}
          >
            <span className="co-nature" data-nature={nature} style={{ gap: 0, fontSize: 0 }} aria-hidden="true" />
            {libelleNature(nature, t)}
          </button>
        ))}
      </div>

      {/* Le tri bascule entre deux etats : un seul bouton suffit, et
          il ne quitte jamais le cadre. */}
      <button
        type="button"
        className="co-puce co-tri"
        aria-label={t("community.sort.label", "Trier le fil")}
        onClick={() => onSortChange(activeSort === "recent" ? "popular" : "recent")}
      >
        {activeSort === "recent" ? <Clock aria-hidden="true" /> : <Flame aria-hidden="true" />}
        {activeSort === "recent"
          ? t("community.sort.recent", "Récents")
          : t("community.sort.popular", "Populaires")}
      </button>
    </div>
  );
}
