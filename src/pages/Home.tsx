import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, Variants } from "framer-motion";

// Components
import { PactTimeline } from "@/components/PactTimeline";
import { AchievementsWidget } from "@/components/achievements/AchievementsWidget";
import { ModuleCard } from "@/components/home/ModuleCard";
import { ModuleGrid } from "@/components/home/ModuleGrid";
import { ModuleManager } from "@/components/home/ModuleManager";
import { ProgressByDifficultyModule } from "@/components/home/ProgressByDifficultyModule";
import { CostTrackingModule } from "@/components/home/CostTrackingModule";
import { GettingStartedCard } from "@/components/home/GettingStartedCard";
import { ProgressOverviewModule } from "@/components/home/ProgressOverviewModule";
import { LockedModulesTeaser } from "@/components/home/LockedModulesTeaser";
import { NeuralPanel } from "@/components/home/NeuralPanel";
import { NeuralBar } from "@/components/home/NeuralBar";
import { FocusGoalsModule } from "@/components/home/FocusGoalsModule";
import { HabitsModule } from "@/components/home/HabitsModule";
import { HeroSection } from "@/components/home/hero";

// Icons
import { Flame, ListTodo, BookOpen, ShoppingCart, Heart, Activity } from "lucide-react";

// Hooks
import { useTodoReminders } from "@/hooks/useTodoReminders";
import { useModuleLayout, ModuleSize } from "@/hooks/useModuleLayout";
import { usePact } from "@/hooks/usePact";
import { useProfile } from "@/hooks/useProfile";
import { useGoals } from "@/hooks/useGoals";
import { useUserShop } from "@/hooks/useShop";
import { useFinanceSettings } from "@/hooks/useFinance";
import { useRankXP } from "@/hooks/useRankXP";

type UserState = "onboarding" | "active" | "advanced";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

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

  const { focusGoals, habitGoals, dashboardData, userState, ownedModules, lockedModules } = useMemo(() => {
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
      habitGoals,
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

  const sortedModules = getAllModules();
  const visibleModules = sortedModules.filter((m) => {
    if (m.category === "display") return m.enabled;
    const actionModuleKeys = ["the-call", "finance", "todo-list", "journal", "track-health", "wishlist"];
    if (actionModuleKeys.includes(m.id)) return m.enabled && ownedModules[m.id as keyof typeof ownedModules];
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
        return <ProgressOverviewModule data={dashboardData} displayMode={displayMode} onToggleDisplayMode={handleToggle} />;
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
        return <FocusGoalsModule goals={focusGoals} navigate={navigate} displayMode={displayMode} onToggleDisplayMode={handleToggle} />;
      case "habits":
        return <HabitsModule habits={habitGoals} customDifficultyColor={customDifficultyColor} displayMode={displayMode} onToggleDisplayMode={handleToggle} />;
      case "the-call":
        return <ActionModule title="The Call" icon={Flame} iconColor="text-orange-400" onClick={() => navigate("/the-call")} />;
      case "finance":
      case "todo-list":
      case "journal":
      case "track-health":
      case "wishlist":
        return null;
      default:
        return null;
    }
  };

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
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/20">
      {/* Two-gradient background system */}
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

      {/* Neural Bar - sticky top status */}
      <NeuralBar pact={pact} rankData={safeRankData} />

      <motion.div
        className="max-w-5xl mx-auto p-4 md:p-5 space-y-4 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* HERO */}
        <motion.div variants={itemVariants}>
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
        </motion.div>

        {/* ONBOARDING */}
        {userState === "onboarding" && (
          <motion.div variants={itemVariants}>
            <GettingStartedCard
              hasGoals={dashboardData.totalGoals > 0}
              hasTimeline={!!pact.project_start_date || !!pact.project_end_date}
              hasPurchasedModules={Object.values(ownedModules).some((v) => v)}
            />
          </motion.div>
        )}

        {/* GRID */}
        <motion.div variants={itemVariants}>
          {isEditMode && (
            <div className="mb-4 flex items-center justify-between bg-[rgba(0,180,255,0.05)] border border-[rgba(0,180,255,0.15)] p-3 rounded-[4px]">
              <span className="text-primary font-orbitron text-[10px] uppercase tracking-[0.15em] flex items-center gap-2">
                <Activity className="w-4 h-4" /> Edit Mode Active
              </span>
            </div>
          )}

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
                <div className="h-full w-full">{renderModule(module.id, module.size)}</div>
              </ModuleCard>
            ))}
          </ModuleGrid>
        </motion.div>

        {/* LOCKED */}
        {lockedModules.length > 0 && !isEditMode && (
          <motion.div variants={itemVariants} className="pt-6 border-t border-[rgba(0,180,255,0.06)]">
            <h3 className="text-[10px] font-orbitron uppercase tracking-[0.15em] text-[rgba(160,210,255,0.35)] mb-4">
              Available Modules
            </h3>
            <LockedModulesTeaser lockedModules={lockedModules} />
          </motion.div>
        )}
      </motion.div>

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

// Simplified Action Module using NeuralPanel
function ActionModule({
  title,
  icon: Icon,
  iconColor,
  onClick,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative h-full w-full flex items-center justify-center rounded-[4px] overflow-hidden transition-all duration-300 bg-[rgba(6,11,22,0.92)] backdrop-blur-xl border border-[rgba(0,180,255,0.08)] hover:border-[rgba(0,210,255,0.25)] shadow-[0_8px_48px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(0,212,255,0.06)] min-h-[120px] cursor-pointer"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,210,255,0.12)] to-transparent" />
      <div className="flex flex-col items-center gap-2.5">
        <Icon className={`w-6 h-6 ${iconColor || 'text-primary/60'}`} />
        <span className="text-[10px] font-orbitron uppercase tracking-[0.15em] text-[rgba(160,210,255,0.6)] group-hover:text-[rgba(160,210,255,0.85)] transition-colors">
          {title}
        </span>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(160,210,255,0.1)] group-hover:text-[rgba(160,210,255,0.3)] transition-all">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}
