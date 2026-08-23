import { useState } from "react";
import { Clock, Flame, SlidersHorizontal, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PostFilterType, PostSortOption } from "@/hooks/useCommunity";
import { NATURES, libelleNature } from "./vocabulaire";

/* LES FILTRES — rien ne sort du cadre.
 *
 * Trois formes successives, et deux defauts mesures en route.
 *
 * Au depart, deux rangees empilees : sept boutons de nature au-dessus,
 * deux boutons de tri en dessous precedes du mot « Sort: ». Neuf
 * commandes et un libelle pour une page dont le fil compte un post.
 * Chaque bouton portait ses six couleurs en dur, vingt-neuf valeurs
 * litterales pour sept boutons.
 *
 * Ensuite, une rangee unique qui defilait, le tri au bout. Mesure sur
 * la page : 687px de contenu pour 471px de cadre. « Besoin d aide »
 * etait coupe a quatre-vingts pixels, a moitie efface par le fondu et
 * colle au bouton de tri — illisible et difficile a viser.
 * « Encouragement » etait entierement dehors. Un fondu qui masque une
 * commande n est pas une affordance, c est un defaut.
 *
 * Ici, la barre ne porte que ce qui tient toujours : l etat du filtre
 * et le tri. Les six natures se deplient sur autant de lignes qu il
 * faut, quand on les demande. Rien ne peut plus etre coupe, quelle
 * que soit la largeur ou la longueur des libelles traduits. */

interface Props {
  activeFilter: PostFilterType;
  onFilterChange: (filter: PostFilterType) => void;
  activeSort: PostSortOption;
  onSortChange: (sort: PostSortOption) => void;
}

export function PostFilters({ activeFilter, onFilterChange, activeSort, onSortChange }: Props) {
  const { t } = useTranslation();
  const [deplie, setDeplie] = useState(false);
  const filtre = activeFilter !== "all" ? activeFilter : null;

  return (
    <div className="co-filtres">
      <button
        type="button"
        className="co-puce"
        aria-pressed={!filtre}
        onClick={() => { onFilterChange("all"); setDeplie(false); }}
      >
        {t("community.filters.all", "Tout")}
      </button>

      {/* Le filtre pose se montre entier, avec de quoi le retirer. */}
      {filtre && (
        <button
          type="button"
          className="co-puce"
          aria-pressed
          onClick={() => onFilterChange("all")}
        >
          <span className="co-nature" data-nature={filtre} style={{ gap: 0, fontSize: 0 }} aria-hidden="true" />
          {libelleNature(filtre, t)}
          <i className="co-puce-fermer" aria-hidden="true"><X /></i>
          <span className="sr-only">{t("community.filters.clear", "Retirer le filtre")}</span>
        </button>
      )}

      <button
        type="button"
        className="co-puce"
        aria-expanded={deplie}
        onClick={() => setDeplie((v) => !v)}
      >
        <SlidersHorizontal aria-hidden="true" />
        {t("community.filters.open", "Filtrer")}
      </button>

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

      {deplie && (
        <div className="co-filtres-tout" role="group" aria-label={t("community.filters.title", "Filtrer le fil")}>
          {NATURES.map((nature) => (
            <button
              key={nature}
              type="button"
              className="co-puce"
              aria-pressed={activeFilter === nature}
              onClick={() => { onFilterChange(nature); setDeplie(false); }}
            >
              <span className="co-nature" data-nature={nature} style={{ gap: 0, fontSize: 0 }} aria-hidden="true" />
              {libelleNature(nature, t)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
