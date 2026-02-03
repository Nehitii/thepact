import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PactVisual } from "@/components/PactVisual";
import { PactTimeline } from "@/components/PactTimeline";
import { AchievementsWidget } from "@/components/achievements/AchievementsWidget";

import { Button } from "@/components/ui/button";
import { TrendingUp, Flame, ListTodo, BookOpen, ShoppingCart, Heart, Target, Sparkles } from "lucide-react";
import { useTodoReminders } from "@/hooks/useTodoReminders";
import { useModuleLayout, ModuleSize } from "@/hooks/useModuleLayout";
import { ModuleCard } from "@/components/home/ModuleCard";
import { ModuleGrid } from "@/components/home/ModuleGrid";
import { ModuleManager } from "@/components/home/ModuleManager";
import { ProgressByDifficultyModule } from "@/components/home/ProgressByDifficultyModule";
import { CostTrackingModule } from "@/components/home/CostTrackingModule";
import { NextMilestoneCard } from "@/components/home/NextMilestoneCard";
import { TodaysFocusMessage } from "@/components/home/TodaysFocusMessage";
import { QuickActionsBar } from "@/components/home/QuickActionsBar";
import { GettingStartedCard } from "@/components/home/GettingStartedCard";
import { ProgressOverviewModule } from "@/components/home/ProgressOverviewModule";
import { LockedModulesTeaser } from "@/components/home/LockedModulesTeaser";
import { ActionModuleCard } from "@/components/home/ActionModuleCard";
import { FocusGoalsModule } from "@/components/home/FocusGoalsModule";
import { usePact, Pact } from "@/hooks/usePact";
import { useRanks, Rank } from "@/hooks/useRanks";
import { useProfile } from "@/hooks/useProfile";
import { useGoals, Goal } from "@/hooks/useGoals";
import { useUserShop } from "@/hooks/useShop";
import { useFinanceSettings } from "@/hooks/useFinance";
import { cn } from "@/lib/utils";

// User state types for adaptive dashboard
type UserState = "onboarding" | "active" | "advanced";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use React Query hooks
  const { data: pact, isLoading: pactLoading } = usePact(user?.id);
  const { data: ranks = [] } = useRanks(user?.id);
  const { data: profile } = useProfile(user?.id);
  const { data: allGoals = [], isLoading: goalsLoading } = useGoals(pact?.id);
  const { isModulePurchased, isLoading: shopLoading } = useUserShop(user?.id);
  const { data: financeSettings } = useFinanceSettings(user?.id);

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

  // Compute derived data
  const {
    focusGoals,
    totalPoints,
    currentRank,
    nextRank,
    level,
    dashboardData,
    userState,
    ownedModules,
    lockedModules,
  } = useMemo(() => {
    const focusGoals = allGoals.filter((g) => g.is_focus && g.status !== "fully_completed");

    const totalPoints = allGoals.reduce((sum, g) => {
      if (g.status === "validated" || g.status === "fully_completed") {
        return sum + (g.potential_score || 0);
      }
      return sum;
    }, 0);

    let currentRank: Rank | null = null;
    let nextRank: Rank | null = null;
    let level = 1;

    for (let i = 0; i < ranks.length; i++) {
      if (totalPoints >= ranks[i].min_points) {
        currentRank = ranks[i];
        level = i + 1;
        nextRank = i + 1 < ranks.length ? ranks[i + 1] : null;
      } else {
        if (!currentRank && i === 0) {
          nextRank = ranks[i];
        }
        break;
      }
    }

    const difficulties = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
    const difficultyProgress = difficulties.map((difficulty) => {
      const diffGoals = allGoals.filter((g) => g.difficulty === difficulty);
      const completedGoals = diffGoals.filter((g) => g.status === "fully_completed").length;
      const totalGoals = diffGoals.length;
      return {
        difficulty,
        completed: completedGoals,
        total: totalGoals,
        percentage: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
      };
    });

    const totalSteps = allGoals.reduce((sum, g) => sum + (g.total_steps || 0), 0);
    const totalStepsCompleted = allGoals.reduce((sum, g) => sum + (g.validated_steps || 0), 0);
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
    if (totalGoalsCount <= 1 && daysSincePactCreation < 7) {
      userState = "onboarding";
    } else if (goalsCompleted >= 5) {
      userState = "advanced";
    }

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
      totalPoints,
      currentRank,
      nextRank,
      level,
      dashboardData: {
        difficultyProgress,
        totalStepsCompleted,
        totalSteps,
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
  }, [allGoals, ranks, financeSettings, pact?.created_at, isModulePurchased]);

  // Rank progress - MUST be before any conditional returns
  const rankProgress = useMemo(() => {
    if (!nextRank) return 100;
    const min = currentRank ? currentRank.min_points : 0;
    const max = nextRank.min_points;
    const current = totalPoints;

    if (max - min === 0) return 0;

    const percent = ((current - min) / (max - min)) * 100;
    return Math.min(Math.max(percent, 0), 100);
  }, [currentRank, nextRank, totalPoints]);

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

  const progressPercentage = Number(pact.global_progress) || 0;
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Styles pour l'animation Organique & Fluide BLEUE */}
      <style>{`
        /* Flux d'énergie liquide */
        @keyframes fluid-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* Battement de cœur (Cercle qui pulse depuis le centre) */
        @keyframes heartbeat-circle {
          0% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 10px rgba(0, 212, 255, 0.6); }
          15% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 25px rgba(0, 212, 255, 0.9); }
          30% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 10px rgba(0, 212, 255, 0.6); }
          45% { transform: scale(1.1); opacity: 0.9; box-shadow: 0 0 15px rgba(0, 212, 255, 0.7); }
          60% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 10px rgba(0, 212, 255, 0.6); }
          100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 10px rgba(0, 212, 255, 0.6); }
        }

        /* Respiration de la barre (Glow BLEU qui pulse) */
        @keyframes breathe-blue {
          0%, 100% { box-shadow: 0 0 15px -2px rgba(0, 102, 255, 0.4); }
          50% { box-shadow: 0 0 30px -4px rgba(0, 212, 255, 0.7); }
        }

        .animate-fluid {
          animation: fluid-flow 4s ease-in-out infinite;
          background-size: 200% 200%;
        }

        .animate-heartbeat-circle {
          animation: heartbeat-circle 2s ease-in-out infinite;
        }

        .animate-breathe-blue {
          animation: breathe-blue 3s ease-in-out infinite;
        }
      `}</style>

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

      <div className="max-w-4xl mx-auto p-6 space-y-8 relative z-10">
        {/* ===== FIXED CORE SECTION (Non-modifiable) ===== */}
        <div className="text-center space-y-6 pt-8 animate-fade-in">
          {/* Level Core - Center */}
          <div className="flex justify-center relative overflow-visible">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
            <div className="relative overflow-visible">
              <PactVisual symbol={pact.symbol} progress={progressPercentage} size="lg" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-3 relative">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_hsl(var(--primary)/0.6)]">
              {pact.name}
            </h1>
            <p className="text-base text-primary/80 italic font-rajdhani tracking-wide">&ldquo;{pact.mantra}&rdquo;</p>

            {/* Today's Focus Message */}
            <div className="pt-2">
              <TodaysFocusMessage focusGoals={focusGoals} allGoals={allGoals} />
            </div>
          </div>

          {/* Next Milestone Card */}
          <NextMilestoneCard
            totalPoints={totalPoints}
            currentRank={currentRank}
            nextRank={nextRank}
            focusGoals={focusGoals}
            projectEndDate={pact.project_end_date}
            className="max-w-2xl mx-auto"
          />

          {/* Global XP Progress Bar - BLUE ENERGY + BIGGER HEART */}
          <div className="space-y-4 max-w-3xl mx-auto group">
            {/* Conditional Rendering for Max Rank */}
            {!nextRank && ranks.length > 0 ? (
              <div className="w-full max-w-3xl mx-auto p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center gap-2 animate-pulse">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span className="font-orbitron font-bold text-cyan-400 tracking-wider">MAX RANK REACHED</span>
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            ) : (
              <>
                {/* 1. Header Centré */}
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-[10px] text-blue-300/70 font-orbitron uppercase tracking-[0.2em]">
                    Current Resonance
                  </span>
                  <span className="text-xl font-bold text-cyan-300 font-orbitron tracking-wide drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]">
                    {nextRank?.name || "Next Rank"}
                  </span>
                  <span className="text-xs font-medium text-cyan-100 font-mono bg-blue-900/40 px-3 py-0.5 rounded-full border border-blue-500/30 mt-1">
                    {nextRank ? nextRank.min_points - totalPoints : 0} XP needed
                  </span>
                </div>

                {/* 2. Container de la barre (Wrapper) */}
                <div className="relative w-full h-8 flex items-center">
                  {/* Fond de la barre (Le tube inactif) - Hauteur fixe h-3 */}
                  <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-3 w-full bg-blue-950/60 backdrop-blur-xl rounded-full border border-blue-400/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] z-0" />

                  {/* La Barre de Progression (Le remplissage) - MASKÉE pour ne pas déborder */}
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden z-10 transition-all duration-1000 ease-out"
                    style={{ width: `${rankProgress}%` }}
                  >
                    <div
                      className="w-full h-full animate-fluid opacity-80"
                      style={{
                        background: `linear-gradient(90deg, #0044cc 0%, #0099ff 50%, #00ccff 100%)`,
                        backgroundSize: "200% 100%",
                      }}
                    />
                    {/* Bruit/Texture */}
                    <div
                      className="absolute inset-0 opacity-20 mix-blend-soft-light"
                      style={{
                        backgroundImage:
                          "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%221%22/%3E%3C/svg%3E')",
                      }}
                    />
                  </div>

                  {/* 3. L'Éclat "Cœur" (Rond flottant PAR DESSUS) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-1000 ease-out"
                    style={{ left: `${rankProgress}%` }}
                  >
                    {/* Le rond lui-même (plus gros que la barre h-7 vs h-3) */}
                    <div className="w-7 h-7 -ml-3.5 bg-cyan-50 rounded-full animate-heartbeat-circle shadow-[0_0_20px_rgba(0,212,255,1)] border-[3px] border-cyan-400 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full blur-[1px]" />
                    </div>
                  </div>
                </div>

                {/* Footer : Pourcentage */}
                <div className="flex justify-center items-center text-[10px] text-blue-300/40 font-orbitron uppercase tracking-widest px-2 pt-1">
                  <span>Synchronization: {Math.round(rankProgress)}%</span>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions Bar */}
          <QuickActionsBar
            ownedModules={{
              todo: ownedModules["todo-list"],
              journal: ownedModules["journal"],
              health: ownedModules["track-health"],
            }}
            className="pt-2"
          />
        </div>

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

// ===== ACTION MODULE COMPONENTS (Inchangés) =====

function TheCallModule({ navigate, size = "half" }: { navigate: any; size?: ModuleSize }) {
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
function FinanceModule({ navigate, size = "half" }: { navigate: any; size?: ModuleSize }) {
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
function JournalModule({ navigate, size = "half" }: { navigate: any; size?: ModuleSize }) {
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
function TodoListModuleCard({ navigate, size = "half" }: { navigate: any; size?: ModuleSize }) {
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
function HealthModule({ navigate, size = "half" }: { navigate: any; size?: ModuleSize }) {
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
function WishlistModule({ navigate, size = "half" }: { navigate: any; size?: ModuleSize }) {
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
