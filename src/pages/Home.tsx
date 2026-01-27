import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PactVisual } from "@/components/PactVisual";
import { PactTimeline } from "@/components/PactTimeline";
import { AchievementsWidget } from "@/components/achievements/AchievementsWidget";

import { Button } from "@/components/ui/button";
import { TrendingUp, Flame, ListTodo, BookOpen, Lock, ShoppingCart, Heart, Target } from "lucide-react";
import { useTodoList } from "@/hooks/useTodoList";
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
import { usePact, Pact } from "@/hooks/usePact";
import { useRanks, Rank } from "@/hooks/useRanks";
import { useProfile } from "@/hooks/useProfile";
import { useGoals, Goal } from "@/hooks/useGoals";
import { useUserShop } from "@/hooks/useShop";
import { useFinanceSettings } from "@/hooks/useFinance";
import { cn } from "@/lib/utils";

// User state types for adaptive dashboard
type UserState = 'onboarding' | 'active' | 'advanced';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use React Query hooks - these run in parallel automatically
  const { data: pact, isLoading: pactLoading } = usePact(user?.id);
  const { data: ranks = [] } = useRanks(user?.id);
  const { data: profile } = useProfile(user?.id);
  const { data: allGoals = [], isLoading: goalsLoading } = useGoals(pact?.id);
  const { isModulePurchased, isLoading: shopLoading } = useUserShop(user?.id);
  const { data: financeSettings } = useFinanceSettings(user?.id);

  // Initialize todo reminders - runs reminder check on Home load
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
    reorderModules,
    validateLayout,
    resetToDefault,
    getAllModules,
  } = useModuleLayout();

  // Compute derived data from React Query results
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
    const focusGoals = allGoals.filter(g => 
      g.is_focus && g.status !== 'fully_completed'
    );

    const totalPoints = allGoals.reduce((sum, g) => {
      if (g.status === 'validated' || g.status === 'fully_completed') {
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

    // Goals-based difficulty progress (count goals, not steps)
    const difficulties = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
    const difficultyProgress = difficulties.map((difficulty) => {
      const diffGoals = allGoals.filter((g) => g.difficulty === difficulty);
      const completedGoals = diffGoals.filter(g => g.status === 'fully_completed').length;
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
    const goalsCompleted = allGoals.filter(g => g.status === 'fully_completed').length;
    const totalGoalsCount = allGoals.length;

    const statusCounts = {
      not_started: allGoals.filter(g => g.status === 'not_started').length,
      in_progress: allGoals.filter(g => g.status === 'in_progress').length,
      fully_completed: allGoals.filter(g => g.status === 'fully_completed' || g.status === 'validated').length,
    };

    // Determine if custom mode is active
    const customTarget = Number(financeSettings?.project_funding_target) || 0;
    const isCustomMode = customTarget > 0;
    
    // In linked mode: use goals total; in custom mode: use custom target
    const totalCostEngaged = isCustomMode 
      ? customTarget 
      : allGoals.reduce((sum, g) => sum + (Number(g.estimated_cost) || 0), 0);
    
    // In custom mode: Financed is always 0 (not linked to goals)
    // In linked mode: Financed = completed goals cost + already funded
    let totalCostPaid = 0;
    if (!isCustomMode) {
      const completedGoalsCost = allGoals
        .filter(g => g.status === 'completed' || g.status === 'fully_completed' || g.status === 'validated')
        .reduce((sum, g) => sum + (Number(g.estimated_cost) || 0), 0);
      
      const alreadyFunded = Number(financeSettings?.already_funded) || 0;
      totalCostPaid = Math.min(completedGoalsCost + alreadyFunded, totalCostEngaged);
    }

    // Calculate user state for adaptive dashboard
    const daysSincePactCreation = pact?.created_at 
      ? Math.floor((Date.now() - new Date(pact.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    let userState: UserState = 'active';
    if (totalGoalsCount <= 1 && daysSincePactCreation < 7) {
      userState = 'onboarding';
    } else if (goalsCompleted >= 5) {
      userState = 'advanced';
    }

    // Track owned/locked modules
    const moduleKeys = ['the-call', 'finance', 'todo-list', 'journal', 'track-health', 'wishlist'];
    const ownedModules = {
      'the-call': isModulePurchased?.('the-call') ?? false,
      'finance': isModulePurchased?.('finance') ?? false,
      'todo-list': isModulePurchased?.('todo-list') ?? false,
      'journal': isModulePurchased?.('journal') ?? false,
      'track-health': isModulePurchased?.('track-health') ?? false,
      'wishlist': isModulePurchased?.('wishlist') ?? false,
    };
    
    const lockedModules = moduleKeys.filter(key => !ownedModules[key as keyof typeof ownedModules]);

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

  // Redirect to onboarding if no pact (after loading)
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
  
  // Filter modules based on new logic:
  // - Hide locked modules from main grid (they go to LockedModulesTeaser)
  // - Show only enabled modules
  const visibleModules = sortedModules.filter((m) => {
    // Always show display modules
    if (m.category === 'display') return m.enabled;
    
    // For action modules: only show if purchased
    const actionModuleKeys = ['the-call', 'finance', 'todo-list', 'journal', 'track-health', 'wishlist'];
    if (actionModuleKeys.includes(m.id)) {
      return m.enabled && ownedModules[m.id as keyof typeof ownedModules];
    }
    
    return m.enabled;
  });

  // Module rendering map with compact support
  const renderModule = (moduleId: string, size: ModuleSize) => {
    const compact = size !== 'full';
    switch (moduleId) {
      case 'timeline':
        return (
          <PactTimeline 
            projectStartDate={pact.project_start_date} 
            projectEndDate={pact.project_end_date}
            hideBackgroundLines={true}
          />
        );
      case 'progress-overview':
        return <ProgressOverviewModule data={dashboardData} compact={compact} />;
      case 'progress-difficulty':
        return (
          <ProgressByDifficultyModule
            difficultyProgress={dashboardData.difficultyProgress}
            customDifficultyName={customDifficultyName}
            customDifficultyColor={customDifficultyColor}
            compact={compact}
            hideBackgroundLines={true}
          />
        );
      case 'cost-tracking':
        return (
          <CostTrackingModule
            totalCostEngaged={dashboardData.totalCostEngaged}
            totalCostPaid={dashboardData.totalCostPaid}
            compact={compact}
            isCustomMode={dashboardData.isCustomMode}
          />
        );
      case 'focus-goals':
        return <FocusGoalsModule goals={focusGoals} navigate={navigate} compact={compact} />;
      case 'the-call':
        return <TheCallModule navigate={navigate} size={size} />;
      case 'finance':
        return <FinanceModule navigate={navigate} size={size} />;
      case 'achievements':
        return <AchievementsWidget />;
      case 'todo-list':
        return <TodoListModuleCard navigate={navigate} size={size} />;
      case 'journal':
        return <JournalModule navigate={navigate} size={size} />;
      case 'track-health':
        return <HealthModule navigate={navigate} size={size} />;
      case 'wishlist':
        return <WishlistModule navigate={navigate} size={size} />;
      default:
        return null;
    }
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
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8 relative z-10">
        {/* ===== FIXED CORE SECTION (Non-modifiable) ===== */}
        <div className="text-center space-y-6 pt-8 animate-fade-in">
          {/* Level Core - Center */}
          <div className="flex justify-center relative overflow-visible">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
            <div className="relative overflow-visible">
              <PactVisual 
                symbol={pact.symbol} 
                progress={progressPercentage}
                size="lg"
              />
            </div>
          </div>
          
          {/* Title & Subtitle */}
          <div className="space-y-3 relative">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_hsl(var(--primary)/0.6)]">
              {pact.name}
            </h1>
            <p className="text-base text-primary/80 italic font-rajdhani tracking-wide">&ldquo;{pact.mantra}&rdquo;</p>
            
            {/* Today's Focus Message - NEW */}
            <div className="pt-2">
              <TodaysFocusMessage 
                focusGoals={focusGoals} 
                allGoals={allGoals} 
              />
            </div>
          </div>

          {/* Next Milestone Card - REPLACES 3-column HUD */}
          <NextMilestoneCard
            totalPoints={totalPoints}
            currentRank={currentRank}
            nextRank={nextRank}
            focusGoals={focusGoals}
            projectEndDate={pact.project_end_date}
            className="max-w-2xl mx-auto"
          />

          {/* Global XP Progress Bar */}
          <div className="space-y-3 max-w-3xl mx-auto">
            {nextRank && currentRank ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary/60 uppercase tracking-wider font-orbitron">
                    Next: {nextRank.name}
                  </span>
                  <span className="font-medium text-primary font-orbitron">
                    {nextRank.min_points - totalPoints} XP
                  </span>
                </div>
                <div className="relative h-3 w-full bg-card/20 backdrop-blur rounded-full overflow-hidden border border-primary/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% auto' }} />
                  <div
                    className="h-full bg-gradient-to-r from-primary via-accent to-primary relative transition-all duration-1000 shadow-[0_0_20px_hsl(var(--primary)/0.6)]"
                    style={{
                      width: `${
                        ((totalPoints - currentRank.min_points) /
                          (nextRank.min_points - currentRank.min_points)) *
                        100
                      }%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                  </div>
                </div>
              </>
            ) : nextRank && !currentRank ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary/60 uppercase tracking-wider font-orbitron">
                    Next: {nextRank.name}
                  </span>
                  <span className="font-medium text-primary font-orbitron">
                    {nextRank.min_points - totalPoints} XP
                  </span>
                </div>
                <div className="relative h-3 w-full bg-card/20 backdrop-blur rounded-full overflow-hidden border border-primary/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% auto' }} />
                  <div
                    className="h-full bg-gradient-to-r from-primary via-accent to-primary relative transition-all duration-1000 shadow-[0_0_20px_hsl(var(--primary)/0.6)]"
                    style={{
                      width: `${(totalPoints / nextRank.min_points) * 100}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-primary/60 font-orbitron uppercase tracking-wider">
                {ranks.length === 0 ? (
                  <span>No ranks defined</span>
                ) : (
                  <span className="font-medium text-primary">🏆 Max Rank Reached</span>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Bar - NEW */}
          <QuickActionsBar
            ownedModules={{
              todo: ownedModules['todo-list'],
              journal: ownedModules['journal'],
              health: ownedModules['track-health'],
            }}
            className="pt-2"
          />
        </div>

        {/* ===== USER-STATE ADAPTIVE SECTION ===== */}
        {userState === 'onboarding' && (
          <GettingStartedCard
            hasGoals={dashboardData.totalGoals > 0}
            hasTimeline={!!pact.project_start_date || !!pact.project_end_date}
            hasPurchasedModules={Object.values(ownedModules).some(v => v)}
          />
        )}

        {/* ===== MODULAR SECTION ===== */}
        <ModuleGrid 
          modules={visibleModules} 
          isEditMode={isEditMode} 
          onReorder={reorderModules}
        >
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

        {/* Locked Modules Teaser - only show if there are locked modules */}
        {lockedModules.length > 0 && !isEditMode && (
          <LockedModulesTeaser lockedModules={lockedModules} />
        )}
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

// ===== MODULE COMPONENTS =====

function FocusGoalsModule({ goals, navigate, compact = false }: { goals: Goal[]; navigate: any; compact?: boolean }) {
  return (
    <div className="animate-fade-in relative group">
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl" />
      <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        <div className="relative z-10">
          <div className="p-6 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                  <TrendingUp className="h-5 w-5 text-primary relative z-10 animate-glow-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                    Focus Goals
                  </h3>
                  <p className="text-xs text-primary/50 font-rajdhani mt-1">Your starred priorities</p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate("/goals")}
                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 font-orbitron text-xs uppercase tracking-wider"
              >
                View All
              </Button>
            </div>
          </div>
          <div className="p-6">
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-primary/40 relative z-10" />
                </div>
                <p className="text-sm text-primary/60 font-rajdhani">No focus goals yet</p>
                <p className="text-xs text-primary/40 mt-2 font-rajdhani">Star goals in the Goals tab to see them here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal, index) => {
                  const remainingSteps = (goal.total_steps || 0) - (goal.validated_steps || 0);
                  const progressPercent = goal.total_steps > 0
                    ? Math.round((goal.validated_steps / goal.total_steps) * 100)
                    : 0;
                  
                  return (
                    <button
                      key={goal.id}
                      onClick={() => navigate(`/goals/${goal.id}`)}
                      className="w-full text-left rounded-lg bg-primary/5 backdrop-blur border border-primary/30 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] group/goal overflow-hidden relative"
                    >
                      {/* Priority badge for top 3 */}
                      {index < 3 && (
                        <div className="absolute top-3 left-3 z-20 w-6 h-6 rounded-full bg-primary/80 border border-primary flex items-center justify-center shadow-[0_0_10px_hsl(var(--primary)/0.5)]">
                          <span className="text-xs font-bold text-primary-foreground font-orbitron">{index + 1}</span>
                        </div>
                      )}
                      
                      <div className="flex">
                        {/* Goal Image Section */}
                        <div className="relative w-24 h-24 flex-shrink-0 bg-card/30">
                          {goal.image_url ? (
                            <img 
                              src={goal.image_url} 
                              alt={goal.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <Target className="w-8 h-8 text-primary/50" />
                            </div>
                          )}
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
                        </div>
                        
                        {/* Goal Info Section */}
                        <div className="flex-1 p-4 flex flex-col justify-center">
                          <h3 className="font-semibold text-sm text-primary font-orbitron drop-shadow-[0_0_5px_hsl(var(--primary)/0.3)] line-clamp-1 mb-2">
                            {goal.name}
                          </h3>
                          
                          {/* Steps Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-primary/70 font-rajdhani">
                                {remainingSteps > 0 
                                  ? `${remainingSteps} step${remainingSteps > 1 ? 's' : ''} remaining`
                                  : 'All steps complete!'
                                }
                              </span>
                              <span className="text-primary font-orbitron font-bold">
                                {progressPercent}%
                              </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="h-1.5 w-full bg-card/40 rounded-full overflow-hidden border border-primary/20">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            
                            {/* Badges */}
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-orbitron bg-primary/10 text-primary border border-primary/30">
                                {goal.difficulty}
                              </span>
                              <span className="text-[10px] text-primary/50 font-rajdhani">
                                {goal.validated_steps}/{goal.total_steps} steps
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TheCallModule({ navigate, size = 'half' }: { navigate: any; size?: ModuleSize }) {
  const isCompact = size === 'quarter';
  
  return (
    <div className="animate-fade-in relative group h-full">
      {/* Dynamic orange/fire accent glow for The Call */}
      <div className="absolute inset-0 bg-orange-500/10 rounded-lg blur-3xl group-hover:blur-[40px] transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-amber-500/10 to-orange-500/5 rounded-lg blur-2xl" />
      <button
        onClick={() => navigate("/the-call")}
        className="relative w-full h-full min-h-[80px] bg-gradient-to-br from-card/30 via-orange-950/20 to-card/30 backdrop-blur-xl border-2 border-orange-500/40 rounded-lg overflow-hidden hover:border-orange-400/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(249,115,22,0.4),inset_0_0_30px_rgba(249,115,22,0.1)] group/call"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-orange-500/20 rounded-[6px]" />
        </div>
        <div className={cn(
          "relative z-10 p-4 flex items-center justify-center gap-3",
          isCompact && "flex-col"
        )}>
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/30 blur-lg rounded-full animate-pulse" />
            <Flame className={cn(
              "text-orange-400 relative z-10 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]",
              isCompact ? "w-6 h-6" : "w-8 h-8"
            )} />
          </div>
          <div className={cn("flex flex-col", isCompact ? "items-center" : "items-start")}>
            <span className={cn(
              "font-bold uppercase tracking-[0.15em] font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400",
              isCompact ? "text-xs" : "text-lg"
            )}>
              The Call
            </span>
            {!isCompact && (
              <span className="text-xs text-orange-400/60 font-rajdhani tracking-wide mt-0.5">
                Daily meditation & alignment
              </span>
            )}
          </div>
        </div>
        
        <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-orange-500/50 rounded-tl" />
        <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-orange-500/50 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-orange-500/50 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-orange-500/50 rounded-br" />
      </button>
    </div>
  );
}

function FinanceModule({ navigate, size = 'half' }: { navigate: any; size?: ModuleSize }) {
  const isCompact = size === 'quarter';
  
  return (
    <div className="animate-fade-in relative group h-full">
      {/* Gold/amber accent glow for Finance */}
      <div className="absolute inset-0 bg-amber-500/10 rounded-lg blur-3xl group-hover:blur-[40px] transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-yellow-500/10 to-amber-500/5 rounded-lg blur-2xl" />
      <button
        onClick={() => navigate("/finance")}
        className="relative w-full h-full min-h-[80px] bg-gradient-to-br from-card/30 via-amber-950/20 to-card/30 backdrop-blur-xl border-2 border-amber-500/40 rounded-lg overflow-hidden hover:border-amber-400/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(245,158,11,0.4),inset_0_0_30px_rgba(245,158,11,0.1)] group/finance"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-amber-500/20 rounded-[6px]" />
        </div>
        <div className={cn(
          "relative z-10 p-4 flex items-center justify-center gap-3",
          isCompact && "flex-col"
        )}>
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/30 blur-lg rounded-full" />
            <span className={cn(
              "relative z-10 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]",
              isCompact ? "text-xl" : "text-2xl"
            )}>
              💰
            </span>
          </div>
          <div className={cn("flex flex-col", isCompact ? "items-center" : "items-start")}>
            <span className={cn(
              "font-bold uppercase tracking-[0.15em] font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400",
              isCompact ? "text-xs" : "text-lg"
            )}>
              Track Finance
            </span>
            {!isCompact && (
              <span className="text-xs text-amber-400/60 font-rajdhani tracking-wide mt-0.5">
                Budget & projections
              </span>
            )}
          </div>
        </div>
        
        <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-amber-500/50 rounded-tl" />
        <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-amber-500/50 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-amber-500/50 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-amber-500/50 rounded-br" />
      </button>
    </div>
  );
}

function JournalModule({ navigate, size = 'half' }: { navigate: any; size?: ModuleSize }) {
  const isCompact = size === 'quarter';
  
  return (
    <div className="animate-fade-in relative group h-full">
      {/* Calm indigo accent glow for Journal */}
      <div className="absolute inset-0 bg-indigo-500/10 rounded-lg blur-3xl group-hover:blur-[40px] transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/10 to-indigo-500/5 rounded-lg blur-2xl" />
      <button
        onClick={() => navigate("/journal")}
        className="relative w-full h-full min-h-[80px] bg-gradient-to-br from-card/30 via-indigo-950/20 to-card/30 backdrop-blur-xl border-2 border-indigo-500/40 rounded-lg overflow-hidden hover:border-indigo-400/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.4),inset_0_0_30px_rgba(99,102,241,0.1)] group/journal"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-indigo-500/20 rounded-[6px]" />
        </div>
        <div className={cn(
          "relative z-10 p-4 flex items-center justify-center gap-3",
          isCompact && "flex-col"
        )}>
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/30 blur-lg rounded-full" />
            <BookOpen className={cn(
              "text-indigo-400 relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]",
              isCompact ? "w-6 h-6" : "w-8 h-8"
            )} />
          </div>
          <div className={cn("flex flex-col", isCompact ? "items-center" : "items-start")}>
            <span className={cn(
              "font-bold uppercase tracking-[0.15em] font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400",
              isCompact ? "text-xs" : "text-lg"
            )}>
              Journal
            </span>
            {!isCompact && (
              <span className="text-xs text-indigo-400/60 font-rajdhani tracking-wide mt-0.5">
                Your memory timeline
              </span>
            )}
          </div>
        </div>
        
        <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-indigo-500/50 rounded-tl" />
        <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-indigo-500/50 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-indigo-500/50 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-indigo-500/50 rounded-br" />
      </button>
    </div>
  );
}

function TodoListModuleCard({ navigate, size = 'half' }: { navigate: any; size?: ModuleSize }) {
  const isCompact = size === 'quarter';
  const { tasks, stats, isLoading } = useTodoList();

  // Count by task type
  const typeCounts = {
    flexible: tasks.filter(t => t.task_type === 'flexible' || !t.task_type).length,
    waiting: tasks.filter(t => t.task_type === 'waiting').length,
    rendezvous: tasks.filter(t => t.task_type === 'rendezvous').length,
    deadline: tasks.filter(t => t.task_type === 'deadline').length,
  };

  const totalActive = tasks.length;
  
  return (
    <div className="animate-fade-in relative group h-full">
      {/* Cyan accent glow for To-Do List */}
      <div className="absolute inset-0 bg-cyan-500/10 rounded-lg blur-3xl group-hover:blur-[40px] transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-teal-500/10 to-cyan-500/5 rounded-lg blur-2xl" />
      <button
        onClick={() => navigate("/todo")}
        className="relative w-full h-full min-h-[80px] bg-gradient-to-br from-card/30 via-cyan-950/20 to-card/30 backdrop-blur-xl border-2 border-cyan-500/40 rounded-lg overflow-hidden hover:border-cyan-400/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.4),inset_0_0_30px_rgba(6,182,212,0.1)] group/todo"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-cyan-500/20 rounded-[6px]" />
        </div>
        
        <div className={cn(
          "relative z-10 p-4",
          isCompact && "flex flex-col items-center justify-center gap-2"
        )}>
          {/* Header */}
          <div className={cn(
            "flex items-center gap-3",
            isCompact ? "justify-center" : "mb-3"
          )}>
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/30 blur-lg rounded-full" />
              <ListTodo className={cn(
                "text-cyan-400 relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]",
                isCompact ? "w-6 h-6" : "w-6 h-6"
              )} />
            </div>
            <span className={cn(
              "font-bold uppercase tracking-[0.15em] font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400",
              isCompact ? "text-xs" : "text-sm"
            )}>
              To-Do List
            </span>
          </div>
          
          {/* Task type counts - only show in non-compact mode */}
          {!isCompact && !isLoading && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <TypeCountBadge label="Flexible" count={typeCounts.flexible} color="cyan" />
              <TypeCountBadge label="Waiting" count={typeCounts.waiting} color="amber" />
              <TypeCountBadge label="Rendez-vous" count={typeCounts.rendezvous} color="purple" />
              <TypeCountBadge label="Deadline" count={typeCounts.deadline} color="red" />
            </div>
          )}
          
          {/* Compact stats */}
          {isCompact && !isLoading && (
            <div className="text-center">
              <span className="text-lg font-bold text-cyan-400">{totalActive}</span>
              <span className="text-xs text-cyan-400/60 ml-1">active</span>
            </div>
          )}

          {/* Score and streak - non-compact */}
          {!isCompact && !isLoading && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">{stats?.score ?? 0}</span>
                  <span className="text-xs text-cyan-400/60">pts</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-sm font-medium text-orange-300">{stats?.current_streak ?? 0}</span>
                </div>
              </div>
              <span className="text-xs text-cyan-400/60">{totalActive} active</span>
            </div>
          )}
        </div>
        
        <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-cyan-500/50 rounded-tl" />
        <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-cyan-500/50 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-cyan-500/50 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-cyan-500/50 rounded-br" />
      </button>
    </div>
  );
}

// Helper component for task type badges
function TypeCountBadge({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClasses: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    red: 'text-red-400 bg-red-500/10',
  };
  
  return (
    <div className={cn(
      "flex items-center justify-between px-2 py-1 rounded",
      colorClasses[color] || colorClasses.cyan
    )}>
      <span className="text-[10px] opacity-80">{label}</span>
      <span className="text-xs font-bold">{count}</span>
    </div>
  );
}

function HealthModule({ navigate, size = 'half' }: { navigate: any; size?: ModuleSize }) {
  const isCompact = size === 'quarter';
  
  return (
    <div className="animate-fade-in relative group h-full">
      {/* Calm teal/mint accent glow for Health */}
      <div className="absolute inset-0 bg-teal-500/10 rounded-lg blur-3xl group-hover:blur-[40px] transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-emerald-500/10 to-teal-500/5 rounded-lg blur-2xl" />
      <button
        onClick={() => navigate("/health")}
        className="relative w-full h-full min-h-[80px] bg-gradient-to-br from-card/30 via-teal-950/20 to-card/30 backdrop-blur-xl border-2 border-teal-500/40 rounded-lg overflow-hidden hover:border-teal-400/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(20,184,166,0.4),inset_0_0_30px_rgba(20,184,166,0.1)] group/health"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-teal-500/20 rounded-[6px]" />
        </div>
        <div className={cn(
          "relative z-10 p-4 flex items-center justify-center gap-3",
          isCompact && "flex-col"
        )}>
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500/30 blur-lg rounded-full" />
            <Heart className={cn(
              "text-teal-400 relative z-10 drop-shadow-[0_0_15px_rgba(20,184,166,0.6)]",
              isCompact ? "w-6 h-6" : "w-8 h-8"
            )} />
          </div>
          <div className={cn("flex flex-col", isCompact ? "items-center" : "items-start")}>
            <span className={cn(
              "font-bold uppercase tracking-[0.15em] font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400",
              isCompact ? "text-xs" : "text-lg"
            )}>
              Track Health
            </span>
            {!isCompact && (
              <span className="text-xs text-teal-400/60 font-rajdhani tracking-wide mt-0.5">
                Balance & awareness
              </span>
            )}
          </div>
        </div>
        
        <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-teal-500/50 rounded-tl" />
        <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-teal-500/50 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-teal-500/50 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-teal-500/50 rounded-br" />
      </button>
    </div>
  );
}

function WishlistModule({ navigate, size = 'half' }: { navigate: any; size?: ModuleSize }) {
  const isCompact = size === 'quarter';

  return (
    <div className="animate-fade-in relative group h-full">
      <div className="absolute inset-0 bg-primary/10 rounded-lg blur-3xl group-hover:blur-[40px] transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 rounded-lg blur-2xl" />
      <button
        onClick={() => navigate("/wishlist")}
        className="relative w-full h-full min-h-[80px] bg-gradient-to-br from-card/30 via-primary/10 to-card/30 backdrop-blur-xl border-2 border-primary/40 rounded-lg overflow-hidden hover:border-primary/60 transition-all duration-500 hover:shadow-[0_0_40px_hsl(var(--primary)/0.35),inset_0_0_30px_hsl(var(--primary)/0.12)] group/wishlist"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>

        <div className={cn(
          "relative z-10 p-4 flex items-center justify-center gap-3",
          isCompact && "flex-col"
        )}>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/25 blur-lg rounded-full" />
            <ShoppingCart className={cn(
              "text-primary relative z-10 drop-shadow-[0_0_15px_hsl(var(--primary)/0.6)]",
              isCompact ? "w-6 h-6" : "w-8 h-8"
            )} />
          </div>
          <div className={cn("flex flex-col", isCompact ? "items-center" : "items-start")}>
            <span className={cn(
              "font-bold uppercase tracking-[0.15em] font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary",
              isCompact ? "text-xs" : "text-lg"
            )}>
              Wishlist
            </span>
            {!isCompact && (
              <span className="text-xs text-primary/60 font-rajdhani tracking-wide mt-0.5">
                Plan what you truly need
              </span>
            )}
          </div>
        </div>

        <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-primary/50 rounded-tl" />
        <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-primary/50 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-primary/50 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-primary/50 rounded-br" />
      </button>
    </div>
  );
}
