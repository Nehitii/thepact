import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PactVisual } from "@/components/PactVisual";
import { PactTimeline } from "@/components/PactTimeline";
import { AchievementsWidget } from "@/components/achievements/AchievementsWidget";

import { Button } from "@/components/ui/button";
import { TrendingUp, Flame, ListTodo, BookOpen, Lock, ShoppingCart } from "lucide-react";
import { useModuleLayout, ModuleSize } from "@/hooks/useModuleLayout";
import { ModuleCard } from "@/components/home/ModuleCard";
import { ModuleGrid } from "@/components/home/ModuleGrid";
import { ModuleManager } from "@/components/home/ModuleManager";
import { ProgressByDifficultyModule } from "@/components/home/ProgressByDifficultyModule";
import { CostTrackingModule } from "@/components/home/CostTrackingModule";
import { usePact, Pact } from "@/hooks/usePact";
import { useRanks, Rank } from "@/hooks/useRanks";
import { useProfile } from "@/hooks/useProfile";
import { useGoals, Goal } from "@/hooks/useGoals";
import { useUserShop } from "@/hooks/useShop";
import { useFinanceSettings } from "@/hooks/useFinance";

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
  const { focusGoals, totalPoints, currentRank, nextRank, level, dashboardData } = useMemo(() => {
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

    const totalCostEngaged = allGoals.reduce((sum, g) => sum + (Number(g.estimated_cost) || 0), 0);
    
    // Unified calculation: completed goals + already_funded (same as Track Finance)
    const completedGoalsCost = allGoals
      .filter(g => g.status === 'completed' || g.status === 'fully_completed' || g.status === 'validated')
      .reduce((sum, g) => sum + (Number(g.estimated_cost) || 0), 0);
    
    const alreadyFunded = Number(financeSettings?.already_funded) || 0;
    const totalCostPaid = Math.min(completedGoalsCost + alreadyFunded, totalCostEngaged);

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
      },
    };
  }, [allGoals, ranks, financeSettings]);

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
      case 'goals-gauge':
        return <GoalsGaugeModule data={dashboardData} compact={compact} />;
      case 'steps-gauge':
        return <StepsGaugeModule data={dashboardData} compact={compact} />;
      case 'status-summary':
        return <StatusSummaryModule data={dashboardData} compact={compact} />;
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
          />
        );
      case 'focus-goals':
        return <FocusGoalsModule goals={focusGoals} navigate={navigate} compact={compact} />;
      case 'the-call':
        // Only show if purchased - use correct database key "the-call"
        if (!isModulePurchased("the-call")) {
          return <LockedModuleCard name="The Call" moduleKey="the-call" icon={Flame} size={size} navigate={navigate} />;
        }
        return <TheCallModule navigate={navigate} size={size} />;
      case 'finance':
        // Only show if purchased - use correct database key "finance"
        if (!isModulePurchased("finance")) {
          return <LockedModuleCard name="Track Finance" moduleKey="finance" icon={() => <span className="text-2xl">💰</span>} size={size} navigate={navigate} />;
        }
        return <FinanceModule navigate={navigate} size={size} />;
      case 'achievements':
        return <AchievementsWidget />;
      case 'todo-list':
        return <PlaceholderModule name="To Do List" icon={ListTodo} size={size} />;
      case 'journal':
        // Only show if purchased - use correct database key "journal"
        if (!isModulePurchased("journal")) {
          return <LockedModuleCard name="Journal" moduleKey="journal" icon={BookOpen} size={size} navigate={navigate} />;
        }
        return <JournalModule navigate={navigate} size={size} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#00050B] relative overflow-hidden">
      {/* Deep space background with radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>
      
      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8 relative z-10">
        {/* ===== FIXED CORE SECTION (Non-modifiable) ===== */}
        <div className="text-center space-y-8 pt-8 animate-fade-in">
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
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-shimmer uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)]" style={{ backgroundSize: '200% auto' }}>
              {pact.name}
            </h1>
            <p className="text-base text-primary/80 italic font-rajdhani tracking-wide">&ldquo;{pact.mantra}&rdquo;</p>
          </div>

          {/* Three HUD Info Panels - Bottom Row */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {/* Pact XP Panel */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className="text-xs text-primary/70 uppercase tracking-widest font-orbitron mb-2">Pact XP</div>
                  <div className="text-3xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                    {totalPoints}
                  </div>
                  <div className="text-xs text-primary/50 uppercase tracking-wider font-rajdhani mt-1">Points</div>
                </div>
              </div>
            </div>

            {/* Rank Panel */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className="text-xs text-primary/70 uppercase tracking-widest font-orbitron mb-2">Rank</div>
                  <div className="text-2xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)] truncate">
                    {currentRank ? currentRank.name : "No Rank"}
                  </div>
                  <div className="text-xs text-primary/50 uppercase tracking-wider font-rajdhani mt-1">Current Tier</div>
                </div>
              </div>
            </div>

            {/* Level Panel */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className="text-xs text-primary/70 uppercase tracking-widest font-orbitron mb-2">Level</div>
                  <div className="text-3xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                    {level}
                  </div>
                  <div className="text-xs text-primary/50 uppercase tracking-wider font-rajdhani mt-1">Tier</div>
                </div>
              </div>
            </div>
          </div>

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
                    className="h-full bg-gradient-to-r from-primary via-accent to-primary relative transition-all duration-1000 shadow-[0_0_20px_rgba(91,180,255,0.6)]"
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
                    className="h-full bg-gradient-to-r from-primary via-accent to-primary relative transition-all duration-1000 shadow-[0_0_20px_rgba(91,180,255,0.6)]"
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
        </div>

        {/* ===== MODULAR SECTION ===== */}
        <ModuleGrid 
          modules={sortedModules} 
          isEditMode={isEditMode} 
          onReorder={reorderModules}
        >
          {sortedModules.map((module) => (
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

function GoalsGaugeModule({ data, compact = false }: { data: any; compact?: boolean }) {
  return (
    <div className="relative group animate-fade-in">
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
      <div className={`relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg overflow-hidden hover:border-primary/50 transition-all ${compact ? 'p-4' : 'p-6'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        <div className="relative z-10">
          <div className={`text-primary/70 uppercase tracking-widest font-orbitron ${compact ? 'text-[10px] mb-2' : 'text-xs mb-4'}`}>Goals Completed</div>
          <div className={`text-center ${compact ? 'mb-2' : 'mb-4'}`}>
            <div className={`font-bold text-primary font-orbitron drop-shadow-[0_0_15px_rgba(91,180,255,0.5)] ${compact ? 'text-3xl' : 'text-5xl'}`}>
              {data.goalsCompleted}
              <span className={`text-primary/50 ml-2 ${compact ? 'text-lg' : 'text-2xl'}`}>/ {data.totalGoals}</span>
            </div>
            <div className={`font-semibold text-accent font-orbitron ${compact ? 'text-sm mt-1' : 'text-xl mt-2'}`}>
              {data.totalGoals > 0 
                ? ((data.goalsCompleted / data.totalGoals) * 100).toFixed(0)
                : 0}%
            </div>
          </div>
          <div className="space-y-2">
            <div className={`relative w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/20 ${compact ? 'h-2' : 'h-3'}`}>
              <div
                className="h-full bg-gradient-to-r from-health via-health to-health/80 transition-all duration-1000 shadow-[0_0_15px_rgba(74,222,128,0.5)]"
                style={{ 
                  width: `${data.totalGoals > 0 
                    ? ((data.goalsCompleted / data.totalGoals) * 100)
                    : 0}%` 
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
              </div>
            </div>
            <div className={`flex items-center justify-between text-primary/50 uppercase tracking-wider font-rajdhani ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
              <span>{data.goalsCompleted} complete</span>
              <span>{data.totalGoals - data.goalsCompleted} remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepsGaugeModule({ data, compact = false }: { data: any; compact?: boolean }) {
  return (
    <div className="relative group animate-fade-in">
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
      <div className={`relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg overflow-hidden hover:border-primary/50 transition-all ${compact ? 'p-4' : 'p-6'}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        <div className="relative z-10">
          <div className={`text-primary/70 uppercase tracking-widest font-orbitron ${compact ? 'text-[10px] mb-2' : 'text-xs mb-4'}`}>Steps Completed</div>
          <div className={`text-center ${compact ? 'mb-2' : 'mb-4'}`}>
            <div className={`font-bold text-primary font-orbitron drop-shadow-[0_0_15px_rgba(91,180,255,0.5)] ${compact ? 'text-3xl' : 'text-5xl'}`}>
              {data.totalStepsCompleted}
              <span className={`text-primary/50 ml-2 ${compact ? 'text-lg' : 'text-2xl'}`}>/ {data.totalSteps}</span>
            </div>
            <div className={`font-semibold text-accent font-orbitron ${compact ? 'text-sm mt-1' : 'text-xl mt-2'}`}>
              {data.totalSteps > 0 
                ? ((data.totalStepsCompleted / data.totalSteps) * 100).toFixed(0)
                : 0}%
            </div>
          </div>
          <div className="space-y-2">
            <div className={`relative w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/20 ${compact ? 'h-2' : 'h-3'}`}>
              <div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-1000 shadow-[0_0_15px_rgba(91,180,255,0.5)]"
                style={{ 
                  width: `${data.totalSteps > 0 
                    ? ((data.totalStepsCompleted / data.totalSteps) * 100)
                    : 0}%` 
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
              </div>
            </div>
            <div className={`flex items-center justify-between text-primary/50 uppercase tracking-wider font-rajdhani ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
              <span>{data.totalStepsCompleted} complete</span>
              <span>{data.totalSteps - data.totalStepsCompleted} remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusSummaryModule({ data, compact = false }: { data: any; compact?: boolean }) {
  return (
    <div className="animate-fade-in relative group">
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-2xl" />
      <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg overflow-hidden hover:border-primary/50 transition-all">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        <div className="relative z-10">
          <div className={`border-b border-primary/20 ${compact ? 'p-4' : 'p-6'}`}>
            <h3 className={`font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary ${compact ? 'text-xs' : 'text-sm'}`}>
              Goals Status Summary
            </h3>
            <p className={`text-primary/50 font-rajdhani mt-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>Distribution by current status</p>
          </div>
          <div className={compact ? 'p-4' : 'p-6'}>
            <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
              {/* Not Started */}
              <div className={`relative text-center rounded-lg bg-card/30 backdrop-blur border border-primary/20 hover:border-primary/40 transition-all overflow-hidden ${compact ? 'p-3' : 'p-4'}`}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[1px] border border-primary/10 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className={`flex items-center justify-center gap-2 ${compact ? 'mb-2' : 'mb-3'}`}>
                    <div className="h-2 w-2 rounded-full bg-muted-foreground shadow-[0_0_8px_rgba(156,163,175,0.5)]"></div>
                    <span className={`font-medium text-muted-foreground uppercase tracking-wider font-orbitron ${compact ? 'text-[8px]' : 'text-[10px]'}`}>Not Started</span>
                  </div>
                  <div className={`font-bold text-muted-foreground font-orbitron drop-shadow-[0_0_10px_rgba(156,163,175,0.3)] ${compact ? 'text-2xl' : 'text-4xl'}`}>
                    {data.statusCounts.not_started}
                  </div>
                  <div className={`text-muted-foreground/70 mt-1 font-rajdhani ${compact ? 'text-[10px]' : 'text-xs mt-2'}`}>
                    {data.totalGoals > 0 
                      ? ((data.statusCounts.not_started / data.totalGoals) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
              </div>

              {/* In Progress */}
              <div className={`relative text-center rounded-lg bg-primary/5 backdrop-blur border border-primary/30 hover:border-primary/50 transition-all overflow-hidden ${compact ? 'p-3' : 'p-4'}`}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[1px] border border-primary/10 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className={`flex items-center justify-center gap-2 ${compact ? 'mb-2' : 'mb-3'}`}>
                    <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(91,180,255,0.6)] animate-glow-pulse"></div>
                    <span className={`font-medium text-primary uppercase tracking-wider font-orbitron ${compact ? 'text-[8px]' : 'text-[10px]'}`}>In Progress</span>
                  </div>
                  <div className={`font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)] ${compact ? 'text-2xl' : 'text-4xl'}`}>
                    {data.statusCounts.in_progress}
                  </div>
                  <div className={`text-primary/70 mt-1 font-rajdhani ${compact ? 'text-[10px]' : 'text-xs mt-2'}`}>
                    {data.totalGoals > 0 
                      ? ((data.statusCounts.in_progress / data.totalGoals) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
              </div>

              {/* Validated */}
              <div className={`relative text-center rounded-lg bg-accent/5 backdrop-blur border border-accent/30 hover:border-accent/50 transition-all overflow-hidden ${compact ? 'p-3' : 'p-4'}`}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[1px] border border-primary/10 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className={`flex items-center justify-center gap-2 ${compact ? 'mb-2' : 'mb-3'}`}>
                    <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(122,191,255,0.6)]"></div>
                    <span className={`font-medium text-accent uppercase tracking-wider font-orbitron ${compact ? 'text-[8px]' : 'text-[10px]'}`}>Validated</span>
                  </div>
                  <div className={`font-bold text-accent font-orbitron drop-shadow-[0_0_10px_rgba(122,191,255,0.5)] ${compact ? 'text-2xl' : 'text-4xl'}`}>
                    {data.statusCounts.validated}
                  </div>
                  <div className={`text-accent/70 mt-1 font-rajdhani ${compact ? 'text-[10px]' : 'text-xs mt-2'}`}>
                    {data.totalGoals > 0 
                      ? ((data.statusCounts.validated / data.totalGoals) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
              </div>

              {/* Completed */}
              <div className={`relative text-center rounded-lg bg-health/5 backdrop-blur border border-health/30 hover:border-health/50 transition-all overflow-hidden ${compact ? 'p-3' : 'p-4'}`}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[1px] border border-primary/10 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className={`flex items-center justify-center gap-2 ${compact ? 'mb-2' : 'mb-3'}`}>
                    <div className="h-2 w-2 rounded-full bg-health shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
                    <span className={`font-medium text-health uppercase tracking-wider font-orbitron ${compact ? 'text-[8px]' : 'text-[10px]'}`}>Completed</span>
                  </div>
                  <div className={`font-bold text-health font-orbitron drop-shadow-[0_0_10px_rgba(74,222,128,0.5)] ${compact ? 'text-2xl' : 'text-4xl'}`}>
                    {data.statusCounts.fully_completed}
                  </div>
                  <div className={`text-health/70 mt-1 font-rajdhani ${compact ? 'text-[10px]' : 'text-xs mt-2'}`}>
                    {data.totalGoals > 0 
                      ? ((data.statusCounts.fully_completed / data.totalGoals) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
              <div className="space-y-3">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => navigate(`/goals/${goal.id}`)}
                    className="w-full text-left p-4 rounded-lg bg-primary/5 backdrop-blur border border-primary/30 hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(91,180,255,0.2)] group/goal overflow-hidden relative"
                  >
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-[1px] border border-primary/10 rounded-[6px]" />
                    </div>
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 text-primary font-orbitron drop-shadow-[0_0_5px_rgba(91,180,255,0.3)]">{goal.name}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider font-orbitron bg-primary/10 text-primary border border-primary/30">
                            {goal.type}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider font-orbitron bg-accent/10 text-accent border border-accent/30">
                            {goal.difficulty}
                          </span>
                          <span className="text-xs text-primary/70 font-rajdhani">
                            {goal.validated_steps} / {goal.total_steps} steps
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="relative h-12 w-12 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/5">
                          <div className="absolute inset-0 bg-primary/10 rounded-full blur-sm" />
                          <span className="text-sm font-bold text-primary font-orbitron drop-shadow-[0_0_5px_rgba(91,180,255,0.5)] relative z-10">
                            {goal.total_steps > 0
                              ? Math.round((goal.validated_steps / goal.total_steps) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
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
      <div className="absolute inset-0 bg-orange-500/10 rounded-lg blur-3xl group-hover:blur-[40px] transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/10 to-orange-500/5 rounded-lg blur-2xl animate-pulse" />
      <button
        onClick={() => navigate("/the-call")}
        className="relative w-full h-full min-h-[80px] bg-gradient-to-br from-card/30 via-orange-950/20 to-card/30 backdrop-blur-xl border-2 border-orange-500/40 rounded-lg overflow-hidden hover:border-orange-400/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(249,115,22,0.4),inset_0_0_30px_rgba(249,115,22,0.1)] group/call"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-orange-500/20 rounded-[6px]" />
        </div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-orange-400/60 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-red-400/50 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        </div>
        
        <div className={`relative z-10 p-4 flex items-center justify-center gap-3 ${isCompact ? 'flex-col' : ''}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full scale-150 group-hover/call:scale-[2] transition-transform duration-500" />
            <Flame className={`text-orange-400 relative z-10 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)] ${isCompact ? 'w-6 h-6' : 'w-8 h-8'}`} />
          </div>
          
          <div className={`flex flex-col ${isCompact ? 'items-center' : 'items-start'}`}>
            <span className={`font-bold uppercase tracking-[0.15em] font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 ${isCompact ? 'text-xs' : 'text-lg'}`}>
              The Call
            </span>
            {!isCompact && (
              <span className="text-xs text-orange-400/60 font-rajdhani tracking-wide mt-0.5">
                Answer if you dare...
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
      {/* Distinct accent glow for Track Finance */}
      <div className="absolute inset-0 bg-emerald-500/10 rounded-lg blur-3xl group-hover:blur-[40px] transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/10 to-emerald-500/5 rounded-lg blur-2xl" />
      <button
        onClick={() => navigate("/finance")}
        className="relative w-full h-full min-h-[80px] bg-gradient-to-br from-card/30 via-emerald-950/20 to-card/30 backdrop-blur-xl border-2 border-emerald-500/40 rounded-lg overflow-hidden hover:border-emerald-400/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.4),inset_0_0_30px_rgba(16,185,129,0.1)] group/finance"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-emerald-500/20 rounded-[6px]" />
        </div>
        <div className={`relative z-10 p-4 flex items-center justify-center gap-3 ${isCompact ? 'flex-col' : ''}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/30 blur-lg rounded-full" />
            <span className={`relative z-10 ${isCompact ? 'text-2xl' : 'text-4xl'}`}>💰</span>
          </div>
          <span className={`font-bold uppercase tracking-[0.15em] font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 ${isCompact ? 'text-xs' : 'text-lg'}`}>
            Track Finance
          </span>
        </div>
        
        <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-emerald-500/50 rounded-tl" />
        <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-emerald-500/50 rounded-tr" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-emerald-500/50 rounded-bl" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-emerald-500/50 rounded-br" />
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
        <div className={`relative z-10 p-4 flex items-center justify-center gap-3 ${isCompact ? 'flex-col' : ''}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/30 blur-lg rounded-full" />
            <BookOpen className={`text-indigo-400 relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)] ${isCompact ? 'w-6 h-6' : 'w-8 h-8'}`} />
          </div>
          <div className={`flex flex-col ${isCompact ? 'items-center' : 'items-start'}`}>
            <span className={`font-bold uppercase tracking-[0.15em] font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 ${isCompact ? 'text-xs' : 'text-lg'}`}>
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

function PlaceholderModule({ name, icon: Icon, size = 'quarter' }: { name: string; icon: any; size?: ModuleSize }) {
  const isCompact = size === 'quarter';
  
  return (
    <div className="animate-fade-in relative group h-full">
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl" />
      <div className="relative w-full h-full min-h-[80px] bg-card/20 backdrop-blur-xl border-2 border-primary/20 border-dashed rounded-lg overflow-hidden">
        <div className={`relative z-10 p-4 flex items-center justify-center gap-3 h-full ${isCompact ? 'flex-col' : ''}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-md rounded-full" />
            <Icon className={`text-primary/40 relative z-10 ${isCompact ? 'w-5 h-5' : 'w-6 h-6'}`} />
          </div>
          <div className={`flex flex-col ${isCompact ? 'items-center' : 'items-start'}`}>
            <span className={`font-medium uppercase tracking-wider font-orbitron text-primary/40 ${isCompact ? 'text-[10px]' : 'text-sm'}`}>
              {name}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Lock className="w-3 h-3 text-primary/30" />
              <span className="text-[10px] text-primary/30 font-rajdhani uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Locked module card - prompts user to purchase in shop
function LockedModuleCard({ 
  name, 
  moduleKey, 
  icon: Icon, 
  size = 'quarter', 
  navigate 
}: { 
  name: string; 
  moduleKey: string; 
  icon: any; 
  size?: ModuleSize; 
  navigate: any;
}) {
  const isCompact = size === 'quarter';
  
  return (
    <div className="animate-fade-in relative group h-full">
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl" />
      <button
        onClick={() => navigate("/shop")}
        className="relative w-full h-full min-h-[80px] bg-card/20 backdrop-blur-xl border-2 border-primary/20 rounded-lg overflow-hidden hover:border-primary/40 transition-all cursor-pointer"
      >
        <div className={`relative z-10 p-4 flex items-center justify-center gap-3 h-full ${isCompact ? 'flex-col' : ''}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-md rounded-full" />
            {typeof Icon === 'function' && Icon.toString().includes('span') ? (
              <div className={`relative z-10 opacity-40 ${isCompact ? 'text-xl' : 'text-2xl'}`}>
                <Icon />
              </div>
            ) : (
              <Icon className={`text-primary/40 relative z-10 ${isCompact ? 'w-5 h-5' : 'w-6 h-6'}`} />
            )}
          </div>
          <div className={`flex flex-col ${isCompact ? 'items-center' : 'items-start'}`}>
            <span className={`font-medium uppercase tracking-wider font-orbitron text-primary/50 ${isCompact ? 'text-[10px]' : 'text-sm'}`}>
              {name}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Lock className="w-3 h-3 text-primary/40" />
              <span className="text-[10px] text-primary/40 font-rajdhani uppercase tracking-wider">
                Unlock in Shop
              </span>
            </div>
          </div>
          <ShoppingCart className={`absolute ${isCompact ? 'top-2 right-2 w-3 h-3' : 'top-3 right-3 w-4 h-4'} text-primary/30`} />
        </div>
      </button>
    </div>
  );
}
