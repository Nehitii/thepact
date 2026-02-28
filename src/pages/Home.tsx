import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

// Components
import { GettingStartedCard } from "@/components/home/GettingStartedCard";
import { LockedModulesTeaser } from "@/components/home/LockedModulesTeaser";
import { NeuralBar } from "@/components/home/NeuralBar";
import { NexusHeroBanner } from "@/components/home/NexusHeroBanner";
import { RankPanel } from "@/components/home/RankPanel";
import { QuickAccessPanel } from "@/components/home/QuickAccessPanel";
import { CountdownPanel } from "@/components/home/CountdownPanel";
import { MissionRandomizer } from "@/components/home/hero/MissionRandomizer";
import { MonitoringGlobalPanel } from "@/components/home/MonitoringGlobalPanel";
import { DifficultyScalePanel } from "@/components/home/DifficultyScalePanel";

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
    const normalGoals = allGoals.filter((g) => g.goal_type !== "habit");
    const habitGoals = allGoals.filter((g) => g.goal_type === "habit");
    const focusGoals = normalGoals.filter((g) => g.is_focus && g.status !== "fully_completed");

    const difficulties = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
    const difficultyProgress = difficulties.map((difficulty) => {
      const diffGoals = normalGoals.filter((g) => g.difficulty === difficulty);
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

    const totalSteps = normalGoals.reduce((sum, g) => sum + (g.total_steps || 0), 0);
    const totalStepsCompleted = normalGoals.reduce((sum, g) => sum + (g.validated_steps || 0), 0);
    const totalHabitChecks = habitGoals.reduce((sum, g) => sum + (g.habit_duration_days || 0), 0);
    const completedHabitChecks = habitGoals.reduce((sum, g) => sum + (g.habit_checks?.filter(Boolean).length || 0), 0);
    const goalsCompleted = normalGoals.filter((g) => g.status === "fully_completed").length;
    const totalGoalsCount = normalGoals.length;

    const statusCounts = {
      not_started: normalGoals.filter((g) => g.status === "not_started").length,
      in_progress: normalGoals.filter((g) => g.status === "in_progress").length,
      fully_completed: normalGoals.filter((g) => g.status === "fully_completed" || g.status === "validated").length,
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

  const loading = !user || pactLoading || (pact && goalsLoading) || shopLoading;

  if (!pactLoading && !pact && user) {
    navigate("/onboarding");
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-[rgba(160,210,255,0.4)] text-[10px] font-orbitron uppercase tracking-[0.3em]">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  if (!pact) return null;

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

  const activeDays = pact.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(pact.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const progression = dashboardData.totalGoals > 0
    ? (dashboardData.goalsCompleted / dashboardData.totalGoals) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/20">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 60% at 50% -5%, rgba(0,80,180,0.07), transparent 65%),
              radial-gradient(ellipse 50% 40% at 85% 70%, rgba(139,0,255,0.03), transparent 50%)
            `,
          }}
        />
      </div>

      {/* Global scanline */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.022) 2px, rgba(0,0,0,0.022) 4px)",
        }}
      />

      {/* Neural Bar */}
      <NeuralBar pact={pact} rankData={safeRankData} />

      <motion.div
        className="max-w-5xl mx-auto p-4 md:p-5 space-y-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* HERO BANNER */}
        <NexusHeroBanner
          progression={progression}
          level={level}
          totalMissions={allGoals.length}
          activeDays={activeDays}
        />

        {/* RANK + QUICK ACCESS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <RankPanel rankData={safeRankData} className="md:col-span-7" />
          <QuickAccessPanel
            ownedModules={{
              "todo-list": ownedModules["todo-list"],
              journal: ownedModules["journal"],
              "track-health": ownedModules["track-health"],
            }}
            className="md:col-span-5"
          />
        </div>

        {/* COUNTDOWN */}
        <CountdownPanel
          projectStartDate={pact.project_start_date}
          projectEndDate={pact.project_end_date}
          goalsCompleted={dashboardData.goalsCompleted}
          totalGoals={dashboardData.totalGoals}
        />

        {/* MISSION RANDOMIZER */}
        <MissionRandomizer allGoals={focusGoals.length ? focusGoals : allGoals} />

        {/* ONBOARDING */}
        {userState === "onboarding" && (
          <GettingStartedCard
            hasGoals={dashboardData.totalGoals > 0}
            hasTimeline={!!pact.project_start_date || !!pact.project_end_date}
            hasPurchasedModules={Object.values(ownedModules).some((v) => v)}
          />
        )}

        {/* MONITORING GLOBAL */}
        <MonitoringGlobalPanel
          data={dashboardData}
          projectStartDate={pact.project_start_date}
          projectEndDate={pact.project_end_date}
        />

        {/* DIFFICULTY SCALE */}
        <DifficultyScalePanel
          difficultyProgress={dashboardData.difficultyProgress}
          customDifficultyName={customDifficultyName}
          customDifficultyColor={customDifficultyColor}
        />

        {/* LOCKED MODULES */}
        {lockedModules.length > 0 && (
          <section className="pt-6 border-t border-[rgba(0,180,255,0.06)]">
            <h3 className="text-[10px] font-orbitron uppercase tracking-[0.15em] text-[rgba(160,210,255,0.35)] mb-4">
              Available Modules
            </h3>
            <LockedModulesTeaser lockedModules={lockedModules} />
          </section>
        )}
      </motion.div>
    </div>
  );
}
