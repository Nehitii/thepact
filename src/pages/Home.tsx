import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { DSPageShell } from "@/components/ds";
import { Skeleton } from "@/components/ui/skeleton";

// Components
import { GettingStartedCard } from "@/components/home/GettingStartedCard";
import { LockedModulesTeaser } from "@/components/home/LockedModulesTeaser";
import { NeuralBar } from "@/components/home/NeuralBar";
import { NexusHeroBanner } from "@/components/home/NexusHeroBanner";
import { QuickAccessPanel } from "@/components/home/QuickAccessPanel";
import { CountdownPanel } from "@/components/home/CountdownPanel";
import { MissionRandomizer } from "@/components/home/hero/MissionRandomizer";
import { MonitoringGlobalPanel } from "@/components/home/MonitoringGlobalPanel";
import { DifficultyScalePanel } from "@/components/home/DifficultyScalePanel";
import { LifeAreasBalancePanel } from "@/components/home/LifeAreasBalancePanel";
import { DailyQuestsPanel } from "@/components/quests/DailyQuestsPanel";
import { WeeklyReviewModal } from "@/components/WeeklyReviewModal";

// Hooks
import { useTodoReminders } from "@/hooks/useTodoReminders";
import { usePact } from "@/hooks/usePact";
import { useProfile } from "@/hooks/useProfile";
import { useGoals } from "@/hooks/useGoals";
import { useUserShop } from "@/hooks/useShop";
import { useFinanceSettings } from "@/hooks/useFinance";
import { useRankXP } from "@/hooks/useRankXP";

type UserState = "onboarding" | "active" | "advanced";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState(false);

  const { data: pact, isLoading: pactLoading } = usePact(user?.id);
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

    const difficulties = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
    const difficultyProgress = difficulties.map((difficulty) => {
      const diffGoals = allGoals.filter((g) => g.difficulty === difficulty);
      const completedGoals = diffGoals.filter((g) => g.status === "fully_completed").length;
      const totalGoals = diffGoals.length;
      const totalStepsForDiff = diffGoals.reduce((sum, g) => sum + (g.total_steps || 0), 0);
      const completedStepsForDiff = diffGoals.reduce((sum, g) => sum + (g.validated_steps || 0), 0);
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

    const totalSteps = allGoals.reduce((sum, g) => sum + (g.total_steps || 0), 0);
    const totalStepsCompleted = allGoals.reduce((sum, g) => sum + (g.validated_steps || 0), 0);
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

  // Phase 4: Wrap navigation in useEffect to avoid render-time side effects
  useEffect(() => {
    if (!pactLoading && !pact && user) {
      navigate("/onboarding");
    }
  }, [pactLoading, pact, user, navigate]);

  if (!pactLoading && !pact && user) {
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

  const activeDays = pact?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(pact.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const progression = dashboardData.totalGoals > 0
    ? (dashboardData.goalsCompleted / dashboardData.totalGoals) * 100
    : 0;

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
          <div className="singularity-space" />
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
        <NeuralBar pact={pact} rankData={safeRankData} />
      ) : (
        <div className="sticky top-0 z-40 h-12 border-b border-[rgba(0,180,255,0.08)] bg-background/80 backdrop-blur px-4 flex items-center gap-3">
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
            level={level}
            totalMissions={allGoals.length}
            activeDays={activeDays}
            pactName={pact.name}
            pactMantra={pact.mantra}
            pactSymbol={pact.symbol}
            titleFont={pact.title_font}
            titleEffect={pact.title_effect}
            rankName={safeRankData.currentRank?.name}
            rankTier={safeRankData.nextRank ? `PROCHAIN · ${safeRankData.nextRank.name}` : "RANG MAXIMAL"}
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

        {/* L'ETAT — ou j'en suis. Le panneau de rang a rejoint le coin du
            bandeau : il occupait 355px pour repeter le niveau deja present
            dans les statistiques du hub, et son propre nom trois fois. Le
            compte a rebours reprend donc toute la largeur, ce qui lui rend
            sa disposition en trois colonnes. */}
        {pact ? (
          <CountdownPanel
            projectStartDate={pact.project_start_date}
            projectEndDate={pact.project_end_date}
            goalsCompleted={dashboardData.goalsCompleted}
            totalGoals={dashboardData.totalGoals}
            pactName={pact.name}
          />
        ) : (
          <Skeleton className="h-24 w-full rounded-xl" />
        )}

        {/* EXPLORER — ce qu'on ouvre quand on cherche. Le tirage de mission
            et les panneaux d'analyse partagent ce dernier temps : on n'y va
            pas tous les jours. */}
        <section className="space-y-2">
          {isGoalsReady ? (
            <MissionRandomizer allGoals={focusGoals.length ? focusGoals : allGoals} />
          ) : (
            <Skeleton className="h-32 w-full rounded-xl" />
          )}

          {pact && isGoalsReady && userState === "onboarding" && (
            <GettingStartedCard
              hasGoals={dashboardData.totalGoals > 0}
              hasTimeline={!!pact.project_start_date || !!pact.project_end_date}
              hasPurchasedModules={Object.values(ownedModules).some((v) => v)}
            />
          )}

        {/* ADVANCED PANELS — Collapsible */}
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer list-none select-none py-2 px-1">
            <span className="ds-t-label font-orbitron uppercase tracking-[0.15em] text-muted-foreground group-open:text-primary transition-colors">
              Advanced Monitoring
            </span>
            <span className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
            <span className="ds-t-label font-mono text-muted-foreground group-open:hidden">▸ EXPAND</span>
            <span className="ds-t-label font-mono text-primary/50 hidden group-open:inline">▾ COLLAPSE</span>
          </summary>
          <div className="space-y-4 pt-2">
            {pact && isGoalsReady ? (
              <MonitoringGlobalPanel
                data={dashboardData}
                projectStartDate={pact.project_start_date}
                projectEndDate={pact.project_end_date}
              />
            ) : (
              <Skeleton className="h-40 w-full rounded-xl" />
            )}
            {isGoalsReady ? (
              <DifficultyScalePanel
                difficultyProgress={dashboardData.difficultyProgress}
                customDifficultyName={customDifficultyName}
                customDifficultyColor={customDifficultyColor}
              />
            ) : (
              <Skeleton className="h-40 w-full rounded-xl" />
            )}
            <LifeAreasBalancePanel />
          </div>
          </details>

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
