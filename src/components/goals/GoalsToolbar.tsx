import { useTranslation } from "react-i18next";
import {
  LayoutGrid,
  LayoutList,
  Bookmark,
  Search,
  X,
  ChevronRight,
  Eye,
  EyeOff,
  Crosshair,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { estTriDeFront } from "@/hooks/useEtapes";
import type {
  SortOption,
  SortDirection,
  DisplayMode,
} from "@/hooks/useGoalFilters";

/* BARRE D'OUTILS
 *
 * Deux corrections de fond.
 *
 * Le style : rounded-xl + bg-card/60 + backdrop-blur-sm, soit exactement
 * l'habillage retire partout ailleurs — et le backdrop-blur moyennait le
 * champ d'etoiles en gris. La barre suit desormais le chanfrein a 45
 * degres et le fond opaque du reste de l'application.
 *
 * La langue : tous les libelles etaient ecrits en anglais dans le code
 * alors que les cles existaient deja dans les deux locales, traduites.
 * "Trier par", "Difficulté", "Par page" etaient disponibles et jamais
 * lus. Tout passe par t().
 */

interface GoalsToolbarProps {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  sortDirection: SortDirection;
  toggleSortDirection: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  hideSuperGoals: boolean;
  setHideSuperGoals: (v: boolean) => void;
  hasSuperGoals: boolean;
  itemsPerPage: number;
  handleItemsPerPageChange: (v: string) => void;
}

const MODES: { mode: DisplayMode; icon: typeof LayoutList; cle: string; apart?: boolean }[] = [
  { mode: "bar", icon: LayoutList, cle: "goals.views.bar" },
  { mode: "grid", icon: LayoutGrid, cle: "goals.views.grid" },
  { mode: "bookmark", icon: Bookmark, cle: "goals.views.list" },
  /* Le front ne montre pas des objectifs mais leurs etapes : la meme
     page, lue par ce qui reste a faire. Il est mis a l'ecart dans la
     reglette parce qu'il ne change pas seulement la forme des cartes —
     il change l'objet compte, et les trois onglets de la page avec
     lui. Le decalage dit cette difference avant qu'on ait clique. */
  { mode: "front", icon: Crosshair, cle: "goals.views.front", apart: true },
];

const TRIS: { valeur: SortOption; cle: string; defaut: string }[] = [
  { valeur: "difficulty", cle: "goals.sort.difficulty", defaut: "Difficulté" },
  { valeur: "points", cle: "goals.sort.points", defaut: "Points" },
  { valeur: "created", cle: "goals.sort.created", defaut: "Date de création" },
  { valeur: "name", cle: "goals.sort.name", defaut: "Nom" },
  { valeur: "status", cle: "goals.sort.status", defaut: "Statut" },
  { valeur: "start", cle: "goals.sort.start", defaut: "Date de début" },
  { valeur: "progression", cle: "goals.sort.progress", defaut: "Progression" },
  { valeur: "super", cle: "goals.sort.super", defaut: "Constellation" },
];

/* Sous le front, on ne trie plus des objectifs.
   Sur les dix tris ci-dessus, la moitie ne porte sur rien qu'une etape
   possede : elle n'a ni date de creation, ni date de debut, ni statut a
   trois valeurs, et elle n'appartient a aucun groupe. Proposer
   « Super en dernier » au-dessus d'une liste d'etapes, c'etait offrir un
   bouton qui ne fait rien. Il en reste trois, qui portent chacun sur
   quelque chose de reel — l'avancement et le palier viennent de
   l'objectif d'ou l'etape sort, le titre est le sien. */
const TRIS_DU_FRONT: { valeur: SortOption; cle: string; defaut: string }[] = [
  { valeur: "progression", cle: "front.sortProgress", defaut: "Avancement" },
  { valeur: "difficulty", cle: "front.sortTier", defaut: "Palier" },
  { valeur: "name", cle: "front.sortTitle", defaut: "Titre" },
];

export function GoalsToolbar({
  displayMode,
  setDisplayMode,
  sortBy,
  setSortBy,
  sortDirection,
  toggleSortDirection,
  searchQuery,
  setSearchQuery,
  hideSuperGoals,
  setHideSuperGoals,
  hasSuperGoals,
  itemsPerPage,
  handleItemsPerPageChange,
}: GoalsToolbarProps) {
  const { t } = useTranslation();

  /* Le front change les regles d'affichage : ce qui ne s'y applique
     pas ne s'y montre pas. */
  const enFront = displayMode === "front";
  const tris = enFront ? TRIS_DU_FRONT : TRIS;
  /* Un tri d'objectif retenu de la vue precedente n'a pas d'equivalent
     ici : le classement retombe sur l'avancement, et le menu doit dire
     ce qui est reellement applique. */
  const triAffiche = enFront && !estTriDeFront(sortBy) ? "progression" : sortBy;

  return (
    <div className="cp-cadre">
      <div className="cp-fond gl-barre">
        {/* Mode d'affichage — segments usines, comme le selecteur de periode */}
        <div className="cp-periode" role="group" aria-label={t("goals.views.grid")}>
          {MODES.map(({ mode, icon: Icon, cle, apart }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDisplayMode(mode)}
              className={`cp-periode-seg gl-seg-icone${apart ? " gl-seg-apart" : ""}`}
              data-actif={displayMode === mode}
              aria-pressed={displayMode === mode}
              title={t(cle)}
              aria-label={t(cle)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </button>
          ))}
        </div>

        <span className="gl-sep" />

        {/* Tri */}
        <div className="gl-groupe">
          <span className="gl-etiquette ds-t-label">{t("goals.sort.label")}</span>
          <Select value={triAffiche} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="gl-select w-[142px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tris.map((o) => (
                <SelectItem key={o.valeur} value={o.valeur}>
                  {t(o.cle, o.defaut)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={toggleSortDirection}
            className="gl-btn gl-btn-icone"
            aria-label={sortDirection === "asc" ? "Ordre croissant" : "Ordre décroissant"}
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform duration-200 ${
                sortDirection === "asc" ? "-rotate-90" : "rotate-90"
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        <span className="gl-sep" />

        {/* Recherche */}
        <div className="gl-recherche">
          <Search className="gl-recherche-icone h-4 w-4" aria-hidden="true" />
          <Input
            type="text"
            placeholder={t("goals.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="light"
            className="gl-champ"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="gl-effacer"
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {hasSuperGoals && !enFront && (
          <>
            <span className="gl-sep" />
            {/* Interrupteur, et non case a cocher : une case generique
                detonnait dans une barre qui n'a que des chanfreins, et son
                etat se lisait a un carre de 20px. Ici la position du bloc
                dit l'etat avant meme la couleur, et le libelle change avec
                lui — "masques" quand ils le sont. role="switch" plutot que
                checkbox : c'est bien une bascule a deux etats, pas une
                selection dans un ensemble. */}
            <button
              type="button"
              role="switch"
              aria-checked={hideSuperGoals}
              onClick={() => setHideSuperGoals(!hideSuperGoals)}
              className="gl-bascule"
              data-actif={hideSuperGoals}
            >
              <span className="gl-bascule-piste" aria-hidden="true">
                <span className="gl-bascule-bloc" />
              </span>
              <span className="gl-bascule-txt ds-t-label">
                {hideSuperGoals ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                                : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                {t("goals.hideSuperGoals")}
              </span>
            </button>
          </>
        )}

        <span className="gl-pousse" />

        {/* Densite de page — le front ne se pagine pas : il montre toutes
            ses etapes d'un coup, une etape n'ayant pas de page. Le
            reglage ne pilotait donc rien de visible. */}
        {!enFront && (
          <div className="gl-groupe">
            <span className="gl-etiquette ds-t-label">{t("goals.perPage")}</span>
            <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="gl-select w-[74px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["5", "10", "20", "50", "100", "200"].map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
