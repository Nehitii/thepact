import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { DSPageShell } from "@/components/ds";
import { Skeleton } from "@/components/ui/skeleton";

// Components
import { GettingStartedCard } from "@/components/home/GettingStartedCard";
import { LockedModulesTeaser } from "@/components/home/LockedModulesTeaser";
import { NeuralBar } from "@/components/home/NeuralBar";
import { NexusHeroBanner, CLE_MESURE, type MesureProgression } from "@/components/home/NexusHeroBanner";
import { SpaceBackdrop } from "@/components/home/SpaceBackdrop";
import { QuickAccessPanel } from "@/components/home/QuickAccessPanel";
import { CountdownPanel } from "@/components/home/CountdownPanel";
import { MissionRandomizer } from "@/components/home/hero/MissionRandomizer";
import { PassageMia } from "@/domaines/mia";
import { MonitoringPanel } from "@/components/home/MonitoringPanel";
import { DailyQuestsPanel } from "@/components/quests/DailyQuestsPanel";
import { WeeklyReviewModal } from "@/components/WeeklyReviewModal";

// Hooks
import { useTodoReminders } from "@/domaines/taches";
import { usePact } from "@/hooks/usePact";
import { useProfile } from "@/hooks/useProfile";
import { useGoals } from "@/hooks/useGoals";
import { useUserShop } from "@/domaines/boutique";
import { useFinanceSettings } from "@/domaines/finance";
import { useRankXP } from "@/hooks/useRankXP";

type UserState = "onboarding" | "active" | "advanced";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);

  /* LE TIRAGE DE MISSION DEVIENT UN OUTIL QU ON OUVRE.

     Il tenait 380 px sous le pli, en permanence, pour un geste qu on
     fait quand on le decide — et tant qu on ne l a pas lance il ne
     montrait rien : un viseur gris, un compteur a zero, un bouton
     SCAN. Il rejoint la barre d acces rapide, ou il devient le
     septieme bouton. La mission EN COURS, elle, reste sur la page :
     c est un engagement date, pas un outil.

     L etat ne se retient pas d une session a l autre : un outil
     qu on ouvre se referme quand on a fini. */
  const [tirageOuvert, setTirageOuvert] = useState(false);
  const [tirageDisponible, setTirageDisponible] = useState(true);

  /* C est le tirage qui sait s il y a une mission en cours — lui seul
     interroge la table. Quand une mission est engagee, la fenetre se
     ferme d elle-meme : la carte de mission prend le relais dans la
     page, et il n y a plus rien a tirer. */
  const noterTirageDisponible = useCallback((disponible: boolean) => {
    setTirageDisponible(disponible);
    if (!disponible) setTirageOuvert(false);
  }, []);

  const { data: pact, isFetching: pactFetching, isSuccess: pactVu } = usePact(user?.id);
  const { data: profile } = useProfile(user?.id);
  const { data: allGoals = [], isLoading: goalsLoading } = useGoals(pact?.id);
  const { isModulePurchased, isLoading: shopLoading } = useUserShop(user?.id);
  const { data: financeSettings } = useFinanceSettings(user?.id);
  const { data: rankData } = useRankXP(user?.id, pact?.id);

  useTodoReminders();

  const customDifficultyName = profile?.custom_difficulty_name || "";
  const customDifficultyColor = profile?.custom_difficulty_color || "#a855f7";

  const { focusGoals, dashboardData, userState, ownedModules, lockedModules } = useMemo(() => {
    const habitGoals = allGoals.filter((g) => g.goal_type === "habit");
    const focusGoals = allGoals.filter((g) => g.goal_type !== "habit" && g.is_focus && g.status !== "fully_completed");

    /* Un objectif de type "habit" recopie ses habit_duration_days dans
       total_steps : 180 jours de suivi y deviennent 180 "etapes". Ces jours
       sont deja comptes plus bas en habitudes, donc les additionner aux
       etapes revient a les compter deux fois — et fausse tout ce qui se
       calcule en etapes. Un seul objectif du pacte est dans ce cas, mais il
       pesait a lui seul 180 des 364 etapes annoncees : le palier EXTREME
       s'affichait a 21 % d'avancement alors qu'il est a 85 %.
       Les habitudes restent comptees comme objectifs ; seules leurs
       pseudo-etapes sont exclues. */
    const goalsAvecEtapes = allGoals.filter((g) => g.goal_type !== "habit");

    const difficulties = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
    const difficultyProgress = difficulties.map((difficulty) => {
      const diffGoals = allGoals.filter((g) => g.difficulty === difficulty);
      const diffGoalsAvecEtapes = diffGoals.filter((g) => g.goal_type !== "habit");
      const completedGoals = diffGoals.filter((g) => g.status === "fully_completed").length;
      const totalGoals = diffGoals.length;
      const totalStepsForDiff = diffGoalsAvecEtapes.reduce((sum, g) => sum + (g.total_steps || 0), 0);
      const completedStepsForDiff = diffGoalsAvecEtapes.reduce((sum, g) => sum + (g.validated_steps || 0), 0);
      return {
        difficulty,
        completed: completedGoals,
        total: totalGoals,
        percentage: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
        totalSteps: totalStepsForDiff,
        completedSteps: completedStepsForDiff,
        remainingSteps: totalStepsForDiff - completedStepsForDiff,
      };
    });

    const totalSteps = goalsAvecEtapes.reduce((sum, g) => sum + (g.total_steps || 0), 0);
    const totalStepsCompleted = goalsAvecEtapes.reduce((sum, g) => sum + (g.validated_steps || 0), 0);
    const totalHabitChecks = habitGoals.reduce((sum, g) => sum + (g.habit_duration_days || 0), 0);
    const completedHabitChecks = habitGoals.reduce((sum, g) => sum + (g.habit_checks?.filter(Boolean).length || 0), 0);
    const goalsCompleted = allGoals.filter((g) => g.status === "fully_completed").length;
    const totalGoalsCount = allGoals.length;

    const statusCounts = {
      not_started: allGoals.filter((g) => g.status === "not_started").length,
      in_progress: allGoals.filter((g) => g.status === "in_progress").length,
      fully_completed: allGoals.filter((g) => g.status === "fully_completed" || g.status === "validated").length,
    };

    const customTarget = Number(financeSettings?.project_funding_target) || 0;
    const isCustomMode = customTarget > 0;
    const totalCostEngaged = isCustomMode
      ? customTarget
      : allGoals.reduce((sum, g) => sum + (Number(g.estimated_cost) || 0), 0);

    let totalCostPaid = 0;
    if (!isCustomMode) {
      const completedGoalsCost = allGoals
        .filter((g) => g.status === "completed" || g.status === "fully_completed" || g.status === "validated")
        .reduce((sum, g) => sum + (Number(g.estimated_cost) || 0), 0);
      const alreadyFunded = Number(financeSettings?.already_funded) || 0;
      totalCostPaid = Math.min(completedGoalsCost + alreadyFunded, totalCostEngaged);
    }

    const daysSincePactCreation = pact?.created_at
      ? Math.floor((Date.now() - new Date(pact.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    let userState: UserState = "active";
    if (totalGoalsCount <= 1 && daysSincePactCreation < 7) userState = "onboarding";
    else if (goalsCompleted >= 5) userState = "advanced";

    const moduleKeys = ["the-call", "finance", "todo-list", "journal", "track-health", "wishlist"];
    const ownedModules = {
      "the-call": isModulePurchased?.("the-call") ?? false,
      finance: isModulePurchased?.("finance") ?? false,
      "todo-list": isModulePurchased?.("todo-list") ?? false,
      journal: isModulePurchased?.("journal") ?? false,
      "track-health": isModulePurchased?.("track-health") ?? false,
      wishlist: isModulePurchased?.("wishlist") ?? false,
    };
    const lockedModules = moduleKeys.filter((key) => !ownedModules[key as keyof typeof ownedModules]);

    return {
      focusGoals,
      dashboardData: {
        difficultyProgress,
        totalStepsCompleted,
        totalSteps,
        totalHabitChecks,
        completedHabitChecks,
        totalCostEngaged,
        totalCostPaid,
        goalsCompleted,
        totalGoals: totalGoalsCount,
        statusCounts,
        isCustomMode,
      },
      userState,
      ownedModules,
      lockedModules,
    };
  }, [allGoals, financeSettings, pact?.created_at, isModulePurchased]);

  /* ON N'ENVOIE À L'ONBOARDING QUE SUR UNE RÉPONSE, JAMAIS SUR UN VIDE.
     « !pactLoading » ne suffit pas : une requête périmée sert sa donnée
     en cache avec isLoading à faux pendant qu'elle recharge. Après une
     élévation de session, cette donnée en cache est un null produit par
     les politiques RLS de la fenêtre précédente — et l'utilisateur
     partait fonder un pacte qu'il possède déjà.
     « isSuccess && !isFetching » attend la vraie réponse. */
  useEffect(() => {
    if (pactVu && !pactFetching && !pact && user) {
      navigate("/onboarding");
    }
  }, [pactVu, pactFetching, pact, user, navigate]);

  /* LA MESURE CHOISIE, RETENUE.

     En localStorage : c est un reglage de lecture sur une seule page,
     comme le fond de Focus. Il ne merite ni colonne ni aller-retour
     serveur.

     ET IL SE DECLARE AVANT LE RETOUR ANTICIPE ci-dessous. Pose plus
     bas — ou il etait — ces deux hooks disparaissaient le temps d une
     redirection vers l onboarding, et l ordre des hooks cassait au
     rendu suivant. Le typecheck ne dit rien la-dessus ; eslint si. */
  const [mesure, setMesure] = useState<MesureProgression>(() => {
    try {
      return localStorage.getItem(CLE_MESURE) === "steps" ? "steps" : "goals";
    } catch { return "goals"; }
  });
  useEffect(() => {
    try { localStorage.setItem(CLE_MESURE, mesure); } catch { /* stockage indisponible */ }
  }, [mesure]);

  /* Le retour anticipé suit la même condition que la redirection :
     s'ils divergent, on rend un écran vide sans jamais partir, ou
     l'inverse. */
  if (pactVu && !pactFetching && !pact && user) {
    return null;
  }

  // Progressive rendering: show shell + skeletons while pact loads
  const isGoalsReady = !!pact && !goalsLoading;
  const isShopReady = !shopLoading;

  const safeRankData = rankData || {
    ranks: [],
    currentRank: null,
    nextRank: null,
    currentXP: 0,
    totalMaxXP: 0,
    xpToNextRank: 0,
    progressInCurrentRank: 0,
    globalProgress: 0,
  };

  const level = (() => {
    if (!safeRankData.currentRank || !safeRankData.ranks.length) return 1;
    const idx = safeRankData.ranks.findIndex((r) => r.id === safeRankData.currentRank!.id);
    return idx >= 0 ? idx + 1 : 1;
  })();

  /* JOURS ACTIFS COMPTAIT DEPUIS LA MAUVAISE DATE.

     `created_at` est l instant ou la LIGNE a ete ecrite en base : le
     jour ou l on a saisi son pacte dans l application, pas le jour ou
     le pacte commence. Un pacte ouvert le 01 nov. 23 mais saisi ici en
     novembre 25 affichait 276 jours, alors que le monitoring, deux
     panneaux plus bas, disait « Jour 1029 / 2252 » — deux chiffres
     pour la meme duree, dans le meme ecran.

     LA DATE DECLAREE FAIT FOI. `created_at` ne sert plus que de repli
     pour un pacte sans date de debut, ou compter depuis la saisie est
     la seule chose possible. */
  const activeDays = (() => {
    const source = pact?.project_start_date || pact?.created_at;
    if (!source) return 1;
    const debut = new Date(source).getTime();
    if (Number.isNaN(debut)) return 1;
    return Math.max(1, Math.floor((Date.now() - debut) / 86_400_000));
  })();

  /* DEUX FACONS DE MESURER LA MEME AVANCEE.

     Par objectifs, un chiffre bouge quand une mission entiere tombe :
     c est juste, mais ca peut rester immobile des semaines pendant
     qu on travaille dur. Par etapes, il avance a chaque pas franchi —
     plus vivant, moins solennel.

     Aucune des deux n a raison contre l autre : elles repondent a des
     questions differentes, « ou j en suis » et « est-ce que j avance ».
     Le choix est donc a celui qui regarde — voir `mesure`, plus haut. */
  const progression = (() => {
    const [fait, total] =
      mesure === "steps"
        ? [dashboardData.totalStepsCompleted, dashboardData.totalSteps]
        : [dashboardData.goalsCompleted, dashboardData.totalGoals];
    return total > 0 ? (fait / total) * 100 : 0;
  })();

  return (
    <DSPageShell
      width="full"
      padding="tight"
      className="selection:bg-primary/20 !p-0"
      background={
        <>
          {/* L'espace, derriere l'ensemble des cartes et non dans le seul
              panneau du hub. En position fixed : il ne defile pas avec le
              contenu, et c'est precisement ce decalage qui donne la
              distance. Les deux degrades discrets qui occupaient cette
              place restaient a l'echelle d'un fond de page. */}
          <SpaceBackdrop />
          <div
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.022) 2px, rgba(0,0,0,0.022) 4px)",
            }}
          />
        </>
      }
    >
      {/* Neural Bar — sticky header, stays as first child */}
      {pact ? (
        <NeuralBar pact={pact} />
      ) : (
        <div className="sticky top-0 z-40 h-12 border-b border-[rgba(0,180,255,0.08)] bg-background/80 px-4 flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-4 w-20" />
        </div>
      )}

      {/* NOTE: Home volontairement sans DSPageHeader — NexusHeroBanner joue le rôle d'identité visuelle */}
      {/* Le desordre ne venait pas des panneaux mais de leur espacement :
          dix bandes pleine largeur separees toutes de la meme distance, donc
          aucun regroupement lisible. La page se lit maintenant en quatre
          temps — le c(oe)ur, agir, l'etat, explorer — separes de 2.5rem,
          chaque temps serrant ses propres elements a 0.5rem. Aucun titre de
          section ajoute : le vide suffit a dire ou commence quoi. */}
      <motion.div
        className="max-w-5xl mx-auto p-4 md:p-5 space-y-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* HERO BANNER */}
        {pact ? (
          <NexusHeroBanner
            progression={progression}
            enCours={dashboardData.statusCounts.in_progress}
            mesure={mesure}
            onChangerMesure={() => setMesure((m) => (m === "goals" ? "steps" : "goals"))}
            level={level}
            totalMissions={allGoals.length}
            activeDays={activeDays}
            pactName={pact.name}
            pactMantra={pact.mantra}
            pactSymbol={pact.symbol}
            titleFont={pact.title_font}
            titleEffect={pact.title_effect}
            rankName={safeRankData.currentRank?.name}
            nextRankName={safeRankData.nextRank?.name ?? null}
            rankProgress={safeRankData.progressInCurrentRank}
            rankXP={safeRankData.currentXP}
            rankXPTarget={safeRankData.nextRank?.min_points ?? 0}
          />
        ) : (
          <Skeleton className="h-48 w-full rounded-xl" />
        )}

        {/* AGIR — ce qui se fait maintenant. Les six accès et les quetes du
            jour forment un seul bloc : ce sont les deux seuls endroits de la
            page ou l'on declenche quelque chose. Serres a 0.5rem, ils se
            lisent comme une console d'action et non comme deux panneaux. */}
        <section className="space-y-2">
          {isShopReady ? (
            <QuickAccessPanel
              onMissionRandomizer={() => setTirageOuvert((v) => !v)}
              missionRandomizerOuvert={tirageOuvert}
              missionRandomizerDisponible={tirageDisponible}
              ownedModules={{
                "todo-list": ownedModules["todo-list"],
                journal: ownedModules["journal"],
                "track-health": ownedModules["track-health"],
              }}
              onWeeklyReview={() => setWeeklyReviewOpen(true)}
            />
          ) : (
            <Skeleton className="h-14 w-full rounded" />
          )}

          {/* Les quetes expirent a minuit : c'est le contenu le plus
              perissable de la page. Elles etaient repliees sous une
              etiquette de surveillance, donc jamais vues. */}
          <DailyQuestsPanel />
        </section>

        {/* L'ETAT — ou j'en suis. Le compte a rebours dit le temps qui
            reste, le monitoring dit le chemin parcouru : les deux repondent
            a la meme question et se lisent ensemble. Le monitoring sortait
            d'un repli "Advanced Monitoring" ou il etait invisible par
            defaut, alors qu'il porte l'avancement reel du pacte.

            LES DEUX PANNEAUX NE SE PARTAGENT PLUS LA RANGEE. Ils etaient
            cote a cote parce qu'ils etaient tous les deux hauts : 540 px
            et 439 px mesures. Le compte a rebours est devenu une regle de
            150 px — une duree tracee sur toute la largeur — et une regle
            de 150 px assise dans une rangee de 439 laisse 290 px de vide
            sous elle. Elle prend donc la largeur, ce qui est exactement
            ce qu'un segment de temps demande, et le monitoring recupere
            la sienne pour ses courbes. */}
        <section className="space-y-2">
          {pact ? (
            <CountdownPanel
              projectStartDate={pact.project_start_date}
              projectEndDate={pact.project_end_date}
            />
          ) : (
            <Skeleton className="h-[150px] w-full rounded" />
          )}

          {pact && isGoalsReady ? (
            <MonitoringPanel
              data={dashboardData}
              difficultyProgress={dashboardData.difficultyProgress}
              projectStartDate={pact.project_start_date}
              projectEndDate={pact.project_end_date}
              customDifficultyName={customDifficultyName}
              customDifficultyColor={customDifficultyColor}
            />
          ) : (
            <Skeleton className="h-40 w-full rounded-xl" />
          )}
        </section>

        <PassageMia />

        {/* EXPLORER — ce qu on ouvre quand on cherche. Le repli "Advanced
            Monitoring" est supprime : il ne contenait plus que le
            monitoring, qui a rejoint le compte a rebours. */}
        <section className="space-y-2">
          {/* Le tirage ne prend plus de place ici : il s ouvre en
              FENETRE depuis la barre d acces rapide. Ce qui reste dans
              la page, c est la MISSION EN COURS quand il y en a une —
              et c est le composant lui-meme qui tranche, puisque c est
              lui qui interroge la table.

              Il est monte sans attendre `isGoalsReady` : sinon le
              bouton d ouverture s allumerait sur une fenetre qui
              n existe pas encore. Le vivier vide se dit tout seul —
              le bouton du panneau affiche NO GOALS. */}
          <MissionRandomizer
            allGoals={focusGoals.length ? focusGoals : allGoals}
            ouvert={tirageOuvert}
            onFermer={() => setTirageOuvert(false)}
            onDisponible={noterTirageDisponible}
          />

          {pact && isGoalsReady && userState === "onboarding" && (
            <GettingStartedCard
              hasGoals={dashboardData.totalGoals > 0}
              hasTimeline={!!pact.project_start_date || !!pact.project_end_date}
              hasPurchasedModules={Object.values(ownedModules).some((v) => v)}
            />
          )}


          {/* LOCKED MODULES */}
          {isShopReady && lockedModules.length > 0 && (
            <div className="pt-6 border-t border-[rgba(0,180,255,0.06)]">
              <h3 className="ds-t-label font-orbitron uppercase tracking-[0.15em] text-[var(--nexus-text-dim)] mb-4">
                Available Modules
              </h3>
              <LockedModulesTeaser lockedModules={lockedModules} />
            </div>
          )}
        </section>

        <WeeklyReviewModal open={weeklyReviewOpen} onClose={() => setWeeklyReviewOpen(false)} />
      </motion.div>
    </DSPageShell>
  );
}
