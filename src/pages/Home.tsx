import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PactTimeline } from "@/components/PactTimeline";
import { AchievementsWidget } from "@/components/achievements/AchievementsWidget";

import { Flame, ListTodo, BookOpen, ShoppingCart, Heart } from "lucide-react";
import { useTodoReminders } from "@/hooks/useTodoReminders";
import { useModuleLayout, ModuleSize } from "@/hooks/useModuleLayout";
import { ModuleCard } from "@/components/home/ModuleCard";
import { ModuleGrid } from "@/components/home/ModuleGrid";
import { ModuleManager } from "@/components/home/ModuleManager";
import { ProgressByDifficultyModule } from "@/components/home/ProgressByDifficultyModule";
import { CostTrackingModule } from "@/components/home/CostTrackingModule";
import { GettingStartedCard } from "@/components/home/GettingStartedCard";
import { ProgressOverviewModule } from "@/components/home/ProgressOverviewModule";
import { LockedModulesTeaser } from "@/components/home/LockedModulesTeaser";
import { ActionModuleCard } from "@/components/home/ActionModuleCard";
import { FocusGoalsModule } from "@/components/home/FocusGoalsModule";
import { HabitsModule } from "@/components/home/HabitsModule";
import { HeroSection } from "@/components/home/hero";
import { usePact } from "@/hooks/usePact";
import { useProfile } from "@/hooks/useProfile";
import { useGoals } from "@/hooks/useGoals";
import { useUserShop } from "@/hooks/useShop";
import { useFinanceSettings } from "@/hooks/useFinance";
import { useRankXP } from "@/hooks/useRankXP";

// User state types for adaptive dashboard
type UserState = "onboarding" | "active" | "advanced";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use React Query hooks
  const { data: pact, isLoading: pactLoading } = usePact(user?.id);
  const { data: profile } = useProfile(user?.id);
  const { data: allGoals = [], isLoading: goalsLoading } = useGoals(pact?.id);
  const { isModulePurchased, isLoading: shopLoading } = useUserShop(user?.id);
  const { data: financeSettings } = useFinanceSettings(user?.id);
  
  // Unified rank/XP data from hook
  const { data: rankData } = useRankXP(user?.id, pact?.id);

  // Initialize todo reminders
  useTodoReminders();

  const customDifficultyName = profile?.custom_difficulty_name || "";
  const customDifficultyColor = profile?.custom_difficulty_color || "#a855f7";

  const {
    modules,
    isEditMode,
    enterEditMode,
    exitEditMode,
    toggleModule,
    cycleModuleSize,
    toggleDisplayMode,
    getDisplayMode,
    reorderModules,
    validateLayout,
    resetToDefault,
    getAllModules,
  } = useModuleLayout();

  // === Split derived data into focused memos ===

  /** Goals separated by type */
  const { normalGoals, focusGoals, habitGoals } = useMemo(() => {
    const normal = allGoals.filter((g) => g.goal_type !== "habit");
    const habits = allGoals.filter((g) => g.goal_type === "habit");
    const focus = normal.filter((g) => g.is_focus && g.status !== "fully_completed");
    return { normalGoals: normal, focusGoals: focus, habitGoals: habits };
  }, [allGoals]);

  /** Dashboard metrics derived from goals + finance */
  const dashboardData = useMemo(() => {
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

    return {
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
    };
  }, [normalGoals, habitGoals, allGoals, financeSettings]);

  /** User state for adaptive dashboard */
  const userState = useMemo<UserState>(() => {
    const daysSincePactCreation = pact?.created_at
      ? Math.floor((Date.now() - new Date(pact.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    if (dashboardData.totalGoals <= 1 && daysSincePactCreation < 7) return "onboarding";
    if (dashboardData.goalsCompleted >= 5) return "advanced";
    return "active";
  }, [pact?.created_at, dashboardData.totalGoals, dashboardData.goalsCompleted]);

  /** Module ownership */
  const { ownedModules, lockedModules } = useMemo(() => {
    const moduleKeys = ["the-call", "finance", "todo-list", "journal", "track-health", "wishlist"] as const;
    const owned = Object.fromEntries(moduleKeys.map((key) => [key, isModulePurchased?.(key) ?? false])) as Record<
      (typeof moduleKeys)[number],
      boolean
    >;
    const locked = moduleKeys.filter((key) => !owned[key]);
    return { ownedModules: owned, lockedModules: locked as string[] };
  }, [isModulePurchased]);

  // Loading & Redirects - AFTER all hooks
  const loading = !user || pactLoading || (pact && goalsLoading) || shopLoading;

  if (!pactLoading && !pact && user) {
    navigate("/onboarding");
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your Pact...</p>
        </div>
      </div>
    );
  }

  if (!pact) {
    return null;
  }

  const sortedModules = getAllModules();

  const visibleModules = sortedModules.filter((m) => {
    if (m.category === "display") return m.enabled;
    const actionModuleKeys = ["the-call", "finance", "todo-list", "journal", "track-health", "wishlist"];
    if (actionModuleKeys.includes(m.id)) {
      return m.enabled && ownedModules[m.id as keyof typeof ownedModules];
    }
    return m.enabled;
  });

  const renderModule = (moduleId: string, size: ModuleSize) => {
    const displayMode = getDisplayMode(moduleId);
    const handleToggle = () => toggleDisplayMode(moduleId);

    switch (moduleId) {
      case "timeline":
        return (
          <PactTimeline
            projectStartDate={pact.project_start_date}
            projectEndDate={pact.project_end_date}
            displayMode={displayMode}
            onToggleDisplayMode={handleToggle}
          />
        );
      case "progress-overview":
        return (
          <ProgressOverviewModule data={dashboardData} displayMode={displayMode} onToggleDisplayMode={handleToggle} />
        );
      case "progress-difficulty":
        return (
          <ProgressByDifficultyModule
            difficultyProgress={dashboardData.difficultyProgress}
            customDifficultyName={customDifficultyName}
            customDifficultyColor={customDifficultyColor}
            displayMode={displayMode}
            onToggleDisplayMode={handleToggle}
          />
        );
      case "cost-tracking":
        return (
          <CostTrackingModule
            totalCostEngaged={dashboardData.totalCostEngaged}
            totalCostPaid={dashboardData.totalCostPaid}
            displayMode={displayMode}
            onToggleDisplayMode={handleToggle}
            isCustomMode={dashboardData.isCustomMode}
          />
        );
      case "focus-goals":
        return (
          <FocusGoalsModule
            goals={focusGoals}
            navigate={navigate}
            displayMode={displayMode}
            onToggleDisplayMode={handleToggle}
          />
        );
      case "habits":
        return (
          <HabitsModule
            habits={habitGoals}
            customDifficultyColor={customDifficultyColor}
            displayMode={displayMode}
            onToggleDisplayMode={handleToggle}
          />
        );
      case "the-call":
        return <TheCallModule navigate={navigate} size={size} />;
      case "finance":
        return <FinanceModule navigate={navigate} size={size} />;
      case "achievements":
        return <AchievementsWidget displayMode={displayMode} onToggleDisplayMode={handleToggle} />;
      case "todo-list":
        return <TodoListModuleCard navigate={navigate} size={size} />;
      case "journal":
        return <JournalModule navigate={navigate} size={size} />;
      case "track-health":
        return <HealthModule navigate={navigate} size={size} />;
      case "wishlist":
        return <WishlistModule navigate={navigate} size={size} />;
      default:
        return null;
    }
  };

  // Default rank data if not loaded yet
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Deep space background with radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 relative z-10">
        {/* ===== HERO SECTION ===== */}
        <HeroSection
          pact={pact}
          focusGoals={focusGoals}
          allGoals={allGoals}
          rankData={safeRankData}
          ownedModules={{
            todo: ownedModules["todo-list"],
            journal: ownedModules["journal"],
            health: ownedModules["track-health"],
          }}
        />

        {/* ===== USER-STATE ADAPTIVE SECTION ===== */}
        {userState === "onboarding" && (
          <GettingStartedCard
            hasGoals={dashboardData.totalGoals > 0}
            hasTimeline={!!pact.project_start_date || !!pact.project_end_date}
            hasPurchasedModules={Object.values(ownedModules).some((v) => v)}
          />
        )}

        {/* ===== MODULAR SECTION ===== */}
        <ModuleGrid modules={visibleModules} isEditMode={isEditMode} onReorder={reorderModules}>
          {visibleModules.map((module) => (
            <ModuleCard
              key={module.id}
              id={module.id}
              name={module.name}
              isEditMode={isEditMode}
              isEnabled={module.enabled}
              onToggle={() => toggleModule(module.id)}
              onCycleSize={() => cycleModuleSize(module.id)}
              size={module.size}
              category={module.category}
              allowedSizes={module.allowedSizes}
              isPlaceholder={module.isPlaceholder}
            >
              {renderModule(module.id, module.size)}
            </ModuleCard>
          ))}
        </ModuleGrid>

        {/* Locked Modules Teaser */}
        {lockedModules.length > 0 && !isEditMode && <LockedModulesTeaser lockedModules={lockedModules} />}
      </div>

      {/* Module Manager */}
      <ModuleManager
        isEditMode={isEditMode}
        onEnterEdit={enterEditMode}
        onValidate={validateLayout}
        onCancel={exitEditMode}
        onReset={resetToDefault}
      />
    </div>
  );
}

// ===== ACTION MODULE COMPONENTS =====

function TheCallModule({ navigate, size = "half" }: { navigate: (path: string) => void; size?: ModuleSize }) {
  return (
    <ActionModuleCard
      title="The Call"
      subtitle="Daily meditation & alignment"
      icon={Flame}
      onClick={() => navigate("/the-call")}
      size={size}
      accentColor="orange"
    />
  );
}

function FinanceModule({ navigate, size = "half" }: { navigate: (path: string) => void; size?: ModuleSize }) {
  return (
    <ActionModuleCard
      title="Track Finance"
      subtitle="Budget & projections"
      icon="💰"
      onClick={() => navigate("/finance")}
      size={size}
      accentColor="amber"
    />
  );
}

function JournalModule({ navigate, size = "half" }: { navigate: (path: string) => void; size?: ModuleSize }) {
  return (
    <ActionModuleCard
      title="Journal"
      subtitle="Your memory timeline"
      icon={BookOpen}
      onClick={() => navigate("/journal")}
      size={size}
      accentColor="indigo"
    />
  );
}

function TodoListModuleCard({ navigate, size = "half" }: { navigate: (path: string) => void; size?: ModuleSize }) {
  return (
    <ActionModuleCard
      title="To-Do List"
      subtitle="Tasks & productivity"
      icon={ListTodo}
      onClick={() => navigate("/todo")}
      size={size}
      accentColor="cyan"
    />
  );
}

function HealthModule({ navigate, size = "half" }: { navigate: (path: string) => void; size?: ModuleSize }) {
  return (
    <ActionModuleCard
      title="Track Health"
      subtitle="Balance & awareness"
      icon={Heart}
      onClick={() => navigate("/health")}
      size={size}
      accentColor="teal"
    />
  );
}

function WishlistModule({ navigate, size = "half" }: { navigate: (path: string) => void; size?: ModuleSize }) {
  return (
    <ActionModuleCard
      title="Wishlist"
      subtitle="Plan what you truly need"
      icon={ShoppingCart}
      onClick={() => navigate("/wishlist")}
      size={size}
      accentColor="primary"
    />
  );
}