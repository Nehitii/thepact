import { useTranslation } from "react-i18next";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, List, Zap, CheckCircle2, SearchX, X } from "lucide-react";
import { Button } from "@/socle/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { BarViewGoalCard } from "@/domaines/objectifs/composants/BarViewGoalCard";
import { GridViewGoalCard } from "@/domaines/objectifs/composants/GridViewGoalCard";
import { UnlockGoalModal } from "@/domaines/objectifs/composants/UnlockGoalModal";
import {
  SuperGoalCard,
  computeSuperGoalProgress,
  filterGoalsByRule,
  type SuperGoalRule,
} from "@/domaines/objectifs/composants/super";
import { GoalsPagination } from "@/domaines/objectifs/composants/GoalsPagination";
import { GoalsRegistre } from "@/domaines/objectifs/composants/GoalsRegistre";
import { FrontListe } from "@/domaines/objectifs/composants/FrontListe";
import { useEtapes, classerLeFront, estTriDeFront, type EtatFront } from "@/domaines/objectifs/hooks/useEtapes";
import { estFranchi, estPretAHonorer } from "@/domaines/objectifs/logique/superGoals";
import type { Goal } from "@/domaines/objectifs/hooks/useGoals";
import type { DisplayMode, GoalTab, SortDirection, SortOption } from "@/domaines/objectifs/hooks/useGoalFilters";

interface GoalsListProps {
  allGoals: Goal[];
  activeTab: GoalTab;
  handleTabChange: (tab: GoalTab) => void;
  buckets: { all: Goal[]; active: Goal[]; completed: Goal[] };
  paginated: Goal[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (tab: GoalTab, page: number) => void;
  displayMode: DisplayMode;
  sortBy: SortOption;
  sortDirection: SortDirection;
  customDifficultyName: string;
  customDifficultyColor: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toggleFocus: (goalId: string, currentFocus: boolean, e: React.MouseEvent) => void;
  unlockCode?: string;
}

/* JAMAIS D OPACITE DANS L ETAT INITIAL.
   Une animation d entree qui part de zero laisse la page vide si
   elle ne demarre pas — et elle ne demarre pas dans un onglet
   d arriere-plan, ou le navigateur suspend les images par seconde.
   Mesure sur cette page : huit cartes a opacite zero, quatorze
   animations en pause. La wishlist, dans le meme onglet et au meme
   moment, s affichait entierement : elle n a plus d animation
   d entree.
   L etat initial ne porte donc plus que le deplacement. Si
   l animation ne joue pas, le contenu est simplement la, en place. */
const containerVariants = {
  hidden: {},
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
};

const tabs: { id: GoalTab; cle: string; icon: typeof List }[] = [
  { id: "all", cle: "goals.filters.all", icon: List },
  { id: "active", cle: "goals.filters.active", icon: Zap },
  { id: "completed", cle: "goals.filters.completed", icon: CheckCircle2 },
];

/* Sous le front, les memes trois onglets comptent des etapes — et une
   etape n'a que deux etats. « En cours » est un mot d'objectif : une
   etape est faite ou elle ne l'est pas. Les onglets prennent donc le
   vocabulaire de ce qu'ils trient, un total et ses deux moities. */
const CLES_FRONT: Record<GoalTab, string> = {
  all: "front.allSteps",
  active: "front.todo",
  completed: "front.done",
};

function getGridClass(displayMode: DisplayMode) {
  if (displayMode === "grid") {
    // True responsive CSS grid: 2 cols on phones (avoids stretched giant cards),
    // 2 / 3 / 4 above. Tighter gaps on small screens.
    return "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 md:gap-6 w-full";
  }
  if (displayMode === "bookmark") return "flex flex-wrap justify-center gap-6";
  return "grid grid-cols-1 gap-4 w-full max-w-4xl mx-auto";
}

export function GoalsList({
  allGoals,
  activeTab,
  handleTabChange,
  buckets,
  paginated,
  currentPage,
  totalPages,
  setCurrentPage,
  displayMode,
  sortBy,
  sortDirection,
  customDifficultyName,
  customDifficultyColor,
  searchQuery,
  setSearchQuery,
  toggleFocus,
  unlockCode,
}: GoalsListProps) {
  const navigate = useNavigate();
  /* Les etapes de tout le lot filtre — avant pagination : le front les
     montre toutes, il ne se decoupe pas en pages.
     La requete porte sur « all » et non sur l'onglet courant : c'est la
     meme collection pour les trois, et c'est elle qui permet d'annoncer
     sur chaque onglet le nombre d'etapes qu'il recouvre. Changer
     d'onglet ne redemande donc plus rien a la base. */
  const { data: toutesEtapes = [], isLoading: chargementEtapes } =
    useEtapes(buckets.all, customDifficultyColor);

  /* SOUS LE FRONT, LES TROIS ONGLETS CLASSENT DES ETAPES.
   *
   * Ailleurs ils repartissent des objectifs — tous, engages, franchis.
   * Mais le front ne montre pas d'objectifs : compter des objectifs
   * au-dessus d'une liste d'etapes obligeait a traduire de tete, et le
   * nombre annonce n'etait celui de rien de ce qu'on avait sous les
   * yeux. Les memes trois mots s'appliquent donc a l'objet montre :
   * toutes les etapes, celles qui restent, celles qui sont faites.
   *
   * Et une etape n'a que deux etats : elle est faite, ou elle ne l'est
   * pas. Les trois onglets sont donc un total et ses deux moities —
   * 184 = 65 + 119, verifiable en base. C'est ce qui a fait tomber les
   * anciens reglages : une portee a trois valeurs dont « engages », que
   * personne ne pouvait deviner, et un icone d'oeil sans libelle qui
   * retirait vingt-six etapes du compte en silence. Un onglet
   * annoncait ainsi un nombre qui n'etait le total de rien.
   *
   * Reste un filtre, parce qu'il repond a une autre question :
   * « seulement mes trois objectifs ? ». Il vit ici et non dans le
   * front parce que les compteurs en dependent — un onglet ne doit
   * jamais pouvoir annoncer un nombre que la liste ne montrerait pas.
   */
  const [brigadeSeule, setBrigadeSeule] = useState(false);

  const aUneBrigade = toutesEtapes.some((e) => e.brigade);

  const { etapesOnglet, comptesEtapes } = useMemo(() => {
    const ETAT: Record<GoalTab, EtatFront> = {
      all: "toutes",
      active: "afaire",
      completed: "faites",
    };
    /* Le tri de la page peut etre un tri d'objectif — « date de
       creation », « groupes d'abord » — qui ne veut rien dire pour une
       etape. On retombe alors sur l'avancement plutot que de ne pas
       trier du tout. */
    const tri = estTriDeFront(sortBy) ? sortBy : undefined;
    const pour = (onglet: GoalTab) =>
      classerLeFront(toutesEtapes, { etat: ETAT[onglet], brigadeSeule, tri, sens: sortDirection });
    const listes = { all: pour("all"), active: pour("active"), completed: pour("completed") };
    return {
      etapesOnglet: listes[activeTab],
      comptesEtapes: {
        all: listes.all.length,
        active: listes.active.length,
        completed: listes.completed.length,
      } as Record<GoalTab, number>,
    };
  }, [toutesEtapes, brigadeSeule, activeTab, sortBy, sortDirection]);
  const { t } = useTranslation();
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null);

  const handleNavigate = (id: string) => {
    const goal = allGoals.find((g) => g.id === id);
    if (goal?.is_locked && unlockCode) {
      setPendingGoalId(id);
      setUnlockModalOpen(true);
    } else {
      navigate(`/goals/${id}`);
    }
  };

  const renderGoalCard = (goal: Goal) => {
    const isCompleted = estFranchi(goal);

    // Super Goal
    if (goal.goal_type === "super") {
      const childIds = goal.child_goal_ids || [];
      let childGoals = allGoals.filter((g) => childIds.includes(g.id));
      if (goal.is_dynamic_super && goal.super_goal_rule) {
        const eligible = allGoals.filter((g) => g.id !== goal.id && g.goal_type !== "super");
        childGoals = filterGoalsByRule(eligible, goal.super_goal_rule as SuperGoalRule);
      }
      const completedChildCount = childGoals.filter((g) => g.status === "fully_completed").length;

      return (
        <motion.div key={goal.id} variants={itemVariants}>
          <SuperGoalCard
            id={goal.id}
            name={goal.name}
            childCount={childGoals.length}
            completedCount={completedChildCount}
            honore={isCompleted}
            pret={estPretAHonorer(goal, allGoals)}
            isDynamic={goal.is_dynamic_super || false}
            rule={goal.super_goal_rule as SuperGoalRule | undefined}
            difficulty={goal.difficulty}
            onClick={(id) => handleNavigate(id)}
            customDifficultyName={customDifficultyName}
            customDifficultyColor={customDifficultyColor}
            displayMode={displayMode === "front" ? "bar" : displayMode}
            imageUrl={goal.image_url}
          />
        </motion.div>
      );
    }

    const cardProps = {
      goal,
      isCompleted,
      customDifficultyName,
      customDifficultyColor,
      onNavigate: handleNavigate,
      onToggleFocus: toggleFocus,
    };

    /* « bookmark » n arrive jamais ici : la branche de rendu l envoie
       vers GoalsRegistre bien avant. La carte qui lui etait associee
       — UIVerseGoalCard, 376 lignes — etait donc importee, choisie,
       et jamais montee. Elle est supprimee. */
    const CardComponent = displayMode === "grid" ? GridViewGoalCard : BarViewGoalCard;

    return (
      <motion.div key={goal.id} variants={itemVariants}>
        <CardComponent {...cardProps} />
      </motion.div>
    );
  };

  /* Etat vide — trois situations, et non deux.
   *
   * Une recherche sans correspondance affichait "Aucun objectif actif" :
   * le message accusait la collection alors que seule la requete etait en
   * cause, et il proposait de creer un objectif — la mauvaise action,
   * puisqu'il y en a peut-etre trente-huit dont aucun ne porte ce mot.
   * On dit ce qui est vrai, et on offre le geste utile : effacer la
   * recherche.
   *
   * Les textes des deux autres cas existaient deja traduits sous
   * goals.emptyStates.* et n'etaient pas lus. */
  const renderEmptyState = () => {
    const recherche = (searchQuery || "").trim();
    const estRecherche = recherche.length > 0;
    const estTermines = activeTab === "completed";
    const teinte = estRecherche
      ? "#ffab00"
      : estTermines
        ? "#00ff88"
        : "hsl(var(--primary))";

    return (
      <div className="cp-cadre">
        <div className="cp-fond gl-vide">
          <span className="cp-equerre cp-equerre-hg" />
          <span className="cp-equerre cp-equerre-bd" />
          <span className="gl-vide-marque" style={{ ["--t" as string]: teinte }}>
            {estRecherche
              ? <SearchX className="h-7 w-7" aria-hidden="true" />
              : estTermines
                ? <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                : <Plus className="h-7 w-7" aria-hidden="true" />}
          </span>

          <h3 className="gl-vide-titre font-orbitron">
            {estRecherche
              ? t("goals.emptyStates.noResults")
              : estTermines
                ? t("goals.emptyStates.noCompletedGoals")
                : t("goals.emptyStates.noActiveGoals")}
          </h3>

          <p className="gl-vide-texte ds-t-label">
            {estRecherche
              ? t("goals.emptyStates.noResultsDesc", { query: recherche })
              : estTermines
                ? t("goals.emptyStates.noCompletedGoalsDesc")
                : t("goals.emptyStates.noActiveGoalsDesc")}
          </p>

          {estRecherche ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="gl-btn gl-btn-primaire"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              {t("goals.emptyStates.clearSearch")}
            </button>
          ) : !estTermines ? (
            <button
              type="button"
              onClick={() => navigate("/goals/new")}
              className="gl-btn gl-btn-primaire"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("goals.createGoal")}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Onglets.
          Le layoutId de framer-motion a ete retire : sur le selecteur de
          periode des Statistiques, la meme animation partagee redemarrait
          de zero a chaque remontage et produisait un scintillement. L'etat
          actif est un fond CSS, il n'y a plus rien a animer. */}
      <nav className="gl-onglets" aria-label={t("goals.filters.all")}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const enFront = displayMode === "front";
          const count = enFront ? comptesEtapes[tab.id] : buckets[tab.id].length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              aria-pressed={isActive}
              className="gl-onglet cp-cadre"
              data-actif={isActive}
            >
              <span className="gl-onglet-in">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="gl-onglet-nom">{t(enFront ? CLES_FRONT[tab.id] : tab.cle)}</span>
                <span className="gl-onglet-nb">{count}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {paginated.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* La vue liste n'est plus une grille de cartes : c'est un
                  registre, une ligne par objectif. Le composant gere sa
                  propre disposition et sa bascule de regroupement. */}
              {/* Le front lit le meme ensemble filtre que les cartes,
                  mais avant la pagination : une etape n a pas de page,
                  et decouper le front en tranches de dix objectifs
                  n aurait aucun sens. */}
              {displayMode === "front" ? (
                <FrontListe
                  etapes={etapesOnglet}
                  onglet={activeTab}
                  aUneBrigade={aUneBrigade}
                  brigadeSeule={brigadeSeule}
                  onBrigadeSeule={setBrigadeSeule}
                  chargement={chargementEtapes}
                />
              ) : displayMode === "bookmark" ? (
                <GoalsRegistre
                  goals={paginated}
                  allGoals={allGoals}
                  customDifficultyName={customDifficultyName}
                  customDifficultyColor={customDifficultyColor}
                  onNavigate={handleNavigate}
                  onToggleFocus={toggleFocus}
                />
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className={getGridClass(displayMode)}
                >
                  {paginated.map((goal) => renderGoalCard(goal))}
                </motion.div>
              )}
              {displayMode !== "front" && (
                <GoalsPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(activeTab, page)}
                />
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {unlockCode && (
        <UnlockGoalModal
          open={unlockModalOpen}
          onClose={() => { setUnlockModalOpen(false); setPendingGoalId(null); }}
          onUnlock={() => {
            setUnlockModalOpen(false);
            if (pendingGoalId) navigate(`/goals/${pendingGoalId}`);
            setPendingGoalId(null);
          }}
          correctCode={unlockCode}
        />
      )}
    </div>
  );
}
