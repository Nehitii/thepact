import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  LayoutGrid,
  LayoutList,
  Bookmark,
  Zap,
  List,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { UIVerseGoalCard } from "@/components/goals/UIVerseGoalCard";
import { BarViewGoalCard } from "@/components/goals/BarViewGoalCard";
import { GridViewGoalCard } from "@/components/goals/GridViewGoalCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParticleEffect } from "@/components/ParticleEffect";
import { CyberBackground } from "@/components/CyberBackground";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";
import {
  getDifficultyIntensity,
  getStatusLabel as getConstantStatusLabel,
  getStatusBadgeClass,
} from "@/lib/goalConstants";
import { usePact } from "@/hooks/usePact";
import { useGoals, Goal } from "@/hooks/useGoals";
import { useProfile } from "@/hooks/useProfile";
import { motion, AnimatePresence } from "framer-motion";

type SortOption = "difficulty" | "type" | "points" | "created" | "name" | "status" | "start" | "progression";
type SortDirection = "asc" | "desc";
type DisplayMode = "bar" | "grid" | "bookmark";

// Get aura animation class based on difficulty
const getAuraClass = (difficulty: string): string => {
  switch (difficulty) {
    case "easy":
      return "difficulty-aura-easy";
    case "medium":
      return "difficulty-aura-medium";
    case "hard":
      return "difficulty-aura-hard";
    case "extreme":
      return "difficulty-aura-extreme";
    case "impossible":
    case "custom":
      return "difficulty-aura-impossible";
    default:
      return "difficulty-aura-easy";
  }
};

// Get border width based on difficulty
const getBorderWidth = (difficulty: string): string => {
  const intensity = getDifficultyIntensity(difficulty);
  return `${1 + intensity * 0.4}px`;
};

// Add alpha to a CSS color string (supports modern hsl() and hex)
const withAlphaColor = (color: string, alpha: number): string => {
  // Supports modern space-separated HSL: `hsl(280 75% 45%)` or with existing alpha.
  // Convert to: `hsl(280 75% 45% / 0.7)`
  if (color.startsWith("hsl(")) {
    const inner = color.slice(4, -1).trim();
    const base = inner.split("/")[0].trim();
    return `hsl(${base} / ${alpha})`;
  }

  // Hex → rgba
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    if (full.length === 6) {
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  return color;
};

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("active");
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [completedCurrentPage, setCompletedCurrentPage] = useState(1);
  const [allCurrentPage, setAllCurrentPage] = useState(1);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("bar");
  const [searchQuery, setSearchQuery] = useState("");
  const { trigger: triggerParticles, ParticleEffects } = useParticleEffect();

  // Normalize string for accent-insensitive, case-insensitive comparison
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const { data: pact } = usePact(user?.id);
  const { data: goals = [], isLoading: goalsLoading } = useGoals(pact?.id, { includeStepCounts: true });
  const { data: profile } = useProfile(user?.id);

  const customDifficultyName = profile?.custom_difficulty_name || "";
  const customDifficultyColor = profile?.custom_difficulty_color || "#a855f7";
  const loading = !user || goalsLoading;

  const [localGoals, setLocalGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (goals.length > 0) setLocalGoals(goals);
  }, [goals]);

  const displayGoals = localGoals.length > 0 ? localGoals : goals;

  const toggleFocus = async (goalId: string, currentFocus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const goal = displayGoals.find((g) => g.id === goalId);
    if (goal) {
      const difficultyColor = getUnifiedDifficultyColor(goal.difficulty, customDifficultyColor);
      triggerParticles(e, difficultyColor);
    }
    const { error } = await supabase.from("goals").update({ is_focus: !currentFocus }).eq("id", goalId);
    if (!error) {
      setLocalGoals(displayGoals.map((g) => (g.id === goalId ? { ...g, is_focus: !currentFocus } : g)));
    }
  };

  // Use centralized constants for status - keeping local getStatusColor for badge styling
  const getStatusColor = (status: string) => getStatusBadgeClass(status);
  const getStatusLabel = (status: string) => getConstantStatusLabel(status);

  const getDifficultyColor = (difficulty: string) => getUnifiedDifficultyColor(difficulty, customDifficultyColor);

  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === "custom" && customDifficultyName) return customDifficultyName;
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const handleSortChange = (newSortBy: SortOption) => setSortBy(newSortBy);
  const handleDirectionChange = (newDirection: SortDirection) => setSortDirection(newDirection);

  const sortGoals = (goalsToSort: Goal[]) => {
    const sorted = [...goalsToSort];
    const direction = sortDirection === "asc" ? 1 : -1;

    switch (sortBy) {
      case "difficulty": {
        const difficultyOrder = ["easy", "medium", "hard", "extreme", "impossible", "custom"];
        return sorted.sort(
          (a, b) => (difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty)) * direction,
        );
      }
      case "type":
        return sorted.sort((a, b) => a.type.localeCompare(b.type) * direction);
      case "points":
        return sorted.sort((a, b) => ((a.potential_score || 0) - (b.potential_score || 0)) * direction);
      case "created":
        return sorted.sort((a, b) => (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction);
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name) * direction);
      case "status": {
        const statusOrder = ["not_started", "in_progress", "fully_completed", "paused"];
        return sorted.sort((a, b) => (statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)) * direction);
      }
      case "start":
        return sorted.sort((a, b) => {
          if (!a.start_date) return 1;
          if (!b.start_date) return -1;
          return (new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) * direction;
        });
      case "progression":
        return sorted.sort((a, b) => {
          const getProgression = (goal: Goal) => {
            if (goal.goal_type === "habit" && goal.habit_checks && goal.habit_duration_days) {
              return (goal.habit_checks.filter(Boolean).length / goal.habit_duration_days) * 100;
            }
            const total = goal.totalStepsCount || goal.total_steps || 0;
            const completed = goal.completedStepsCount || goal.validated_steps || 0;
            return total === 0 ? 0 : (completed / total) * 100;
          };
          return (getProgression(a) - getProgression(b)) * direction;
        });
      default:
        return sorted;
    }
  };

  // Filter goals based on search query (accent-insensitive, case-insensitive)
  const filterGoalsBySearch = (goalsToFilter: Goal[]): Goal[] => {
    if (!searchQuery.trim()) return goalsToFilter;
    const normalizedQuery = normalizeString(searchQuery);
    return goalsToFilter.filter((goal) => {
      const normalizedName = normalizeString(goal.name);
      const normalizedType = normalizeString(goal.type || "");
      const tagsMatch = goal.tags?.some((tag) => normalizeString(tag).includes(normalizedQuery)) || false;
      return normalizedName.includes(normalizedQuery) || normalizedType.includes(normalizedQuery) || tagsMatch;
    });
  };

  const filteredGoals = filterGoalsBySearch(displayGoals);
  const activeGoals = filteredGoals.filter((g) => g.status === "not_started" || g.status === "in_progress");
  const completedGoals = filteredGoals.filter((g) => g.status === "fully_completed" || g.status === "validated");
  const allGoals = filteredGoals;

  const sortedActiveGoals = sortGoals(activeGoals);
  const sortedCompletedGoals = sortGoals(completedGoals);
  const sortedAllGoals = sortGoals(allGoals);

  const activeTotalPages = Math.ceil(sortedActiveGoals.length / itemsPerPage);
  const completedTotalPages = Math.ceil(sortedCompletedGoals.length / itemsPerPage);
  const allTotalPages = Math.ceil(sortedAllGoals.length / itemsPerPage);

  const paginatedActiveGoals = sortedActiveGoals.slice(
    (activeCurrentPage - 1) * itemsPerPage,
    activeCurrentPage * itemsPerPage,
  );
  const paginatedCompletedGoals = sortedCompletedGoals.slice(
    (completedCurrentPage - 1) * itemsPerPage,
    completedCurrentPage * itemsPerPage,
  );
  const paginatedAllGoals = sortedAllGoals.slice((allCurrentPage - 1) * itemsPerPage, allCurrentPage * itemsPerPage);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setActiveCurrentPage(1);
    setCompletedCurrentPage(1);
    setAllCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  // Phase 2: Enhanced Difficulty Badge Component
  const DifficultyBadge = ({ difficulty, isCompleted = false }: { difficulty: string; isCompleted?: boolean }) => {
    const difficultyColor = getDifficultyColor(difficulty);
    const intensity = getDifficultyIntensity(difficulty);
    const isHighTier = intensity >= 4;

    const withAlpha = withAlphaColor;

    const getTierBackground = () => {
      switch (difficulty) {
        case "easy":
          return `linear-gradient(135deg, ${withAlpha(difficultyColor, 0.9)}, ${withAlpha(difficultyColor, 0.7)})`;
        case "medium":
          return `linear-gradient(135deg, ${withAlpha(difficultyColor, 0.95)}, ${withAlpha(difficultyColor, 0.75)})`;
        case "hard":
          return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.8)})`;
        case "extreme":
          return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.6)}, ${difficultyColor})`;
        case "impossible":
        case "custom":
          return `linear-gradient(135deg, ${difficultyColor}, ${withAlpha(difficultyColor, 0.7)}, ${difficultyColor})`;
        default:
          return difficultyColor;
      }
    };

    return (
      <Badge
        variant="outline"
        className={`text-xs font-bold font-rajdhani uppercase tracking-wider relative overflow-hidden ${
          isHighTier && !isCompleted ? "badge-pulse" : ""
        }`}
        style={{
          borderColor: difficultyColor,
          color: "#fff",
          background: getTierBackground(),
          boxShadow: isCompleted ? "none" : `0 0 ${8 + intensity * 3}px ${difficultyColor}50`,
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        }}
      >
        {isHighTier && !isCompleted && (
          <span
            className="absolute inset-0 badge-shimmer pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              backgroundSize: "200% 100%",
            }}
          />
        )}
        <span className="relative z-10">{getDifficultyLabel(difficulty)}</span>
      </Badge>
    );
  };

  // Phase 3: Enhanced Progress Bar Component
  const ProgressBar = ({
    progress,
    difficultyColor,
    difficulty,
    isCompleted = false,
  }: {
    progress: number;
    difficultyColor: string;
    difficulty: string;
    isCompleted?: boolean;
  }) => {
    const intensity = getDifficultyIntensity(difficulty);
    const isHighTier = intensity >= 3;
    const isComplete = progress >= 100;

    return (
      <div
        className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden border border-border relative"
        style={{ boxShadow: isComplete && !isCompleted ? `0 0 12px ${difficultyColor}60` : "none" }}
      >
        <motion.div
          className={`h-full rounded-full relative ${isHighTier && !isCompleted ? "progress-shimmer" : ""}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            background: isCompleted
              ? "hsl(142 70% 45%)"
              : `linear-gradient(90deg, hsl(var(--primary)), ${difficultyColor})`,
            boxShadow:
              isComplete && !isCompleted
                ? `0 0 15px ${difficultyColor}, inset 0 0 10px rgba(255,255,255,0.2)`
                : `0 0 ${4 + intensity * 2}px ${difficultyColor}60`,
          }}
        >
          {isHighTier && !isCompleted && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                animation: "progress-shimmer 1.5s ease-in-out infinite",
              }}
            />
          )}
          {intensity >= 4 && !isCompleted && progress > 10 && progress < 100 && (
            <span
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
              style={{
                background: "white",
                boxShadow: `0 0 6px white, 0 0 12px ${difficultyColor}`,
                animation: "progress-sparkle 1s ease-in-out infinite",
              }}
            />
          )}
        </motion.div>
      </div>
    );
  };

  const renderGoalCard = (goal: Goal, index: number, isCompleted = false) => {
    // Bar Mode (Default)
    if (displayMode === "bar") {
      return (
        <motion.div key={goal.id} variants={itemVariants}>
          <BarViewGoalCard
            goal={goal}
            isCompleted={isCompleted}
            customDifficultyName={customDifficultyName}
            customDifficultyColor={customDifficultyColor}
            onNavigate={(goalId) => navigate(`/goals/${goalId}`)}
            onToggleFocus={toggleFocus}
          />
        </motion.div>
      );
    }

    // Grid Mode
    if (displayMode === "grid") {
      return (
        <motion.div key={goal.id} variants={itemVariants}>
          <GridViewGoalCard
            goal={goal}
            isCompleted={isCompleted}
            customDifficultyName={customDifficultyName}
            customDifficultyColor={customDifficultyColor}
            onNavigate={(goalId) => navigate(`/goals/${goalId}`)}
            onToggleFocus={toggleFocus}
          />
        </motion.div>
      );
    }

    // Bookmark Mode
    if (displayMode === "bookmark") {
      return (
        <motion.div key={goal.id} variants={itemVariants}>
          <UIVerseGoalCard
            goal={goal}
            isCompleted={isCompleted}
            customDifficultyName={customDifficultyName}
            customDifficultyColor={customDifficultyColor}
            onNavigate={(goalId) => navigate(`/goals/${goalId}`)}
            onToggleFocus={toggleFocus}
          />
        </motion.div>
      );
    }

    return null;
  };

  const renderPagination = (currentPage: number, totalPages: number, setCurrentPage: (page: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 pt-6">
        <button
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-primary/20 text-foreground/80 font-rajdhani text-sm font-medium transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-primary/20 disabled:hover:bg-card/80 disabled:hover:text-foreground/80 disabled:hover:shadow-none flex items-center gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1.5 px-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;

            const isActive = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-9 h-9 rounded-xl font-rajdhani text-sm font-medium transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? "bg-primary/15 border border-primary/50 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                    : "bg-card/80 backdrop-blur-sm border border-primary/20 text-foreground/70 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-primary/20 text-foreground/80 font-rajdhani text-sm font-medium transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-primary/20 disabled:hover:bg-card/80 disabled:hover:text-foreground/80 disabled:hover:shadow-none flex items-center gap-1.5"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </motion.div>
    );
  };

  /**
   * ✅ FIX APPLIED HERE:
   * - Bar view must always be 1 column (no lg:grid-cols-2)
   */
  const getGridClass = () => {
    if (displayMode === "grid") return "flex flex-wrap justify-center gap-6";
    if (displayMode === "bookmark") return "flex flex-wrap justify-center gap-6";
    // Bar view: ALWAYS one per line
    return "grid grid-cols-1 gap-4 w-full max-w-4xl mx-auto";
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      <ParticleEffects />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6"
      >
        {/* Header - Centered */}
        <motion.div variants={itemVariants} className="flex flex-col items-center text-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-orbitron tracking-wider">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(91,180,255,0.4)]">
                GOALS
              </span>
            </h1>
            <p className="text-muted-foreground font-rajdhani tracking-wide mt-1">Evolutions of your Pact</p>
          </div>

          <button
            onClick={() => navigate("/goals/new")}
            className="relative overflow-hidden group px-5 py-2.5 rounded-xl bg-card/80 backdrop-blur-sm border border-primary/30 text-primary font-rajdhani font-medium tracking-wider transition-all duration-300 hover:border-primary/60 hover:bg-primary/10 hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Goal</span>
          </button>
        </motion.div>

        {/* Controls Bar */}
        {displayGoals.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border"
          >
            {/* Display Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
              <button
                onClick={() => setDisplayMode("bar")}
                className={`p-2 rounded-md transition-all ${
                  displayMode === "bar" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Bar View"
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDisplayMode("grid")}
                className={`p-2 rounded-md transition-all ${
                  displayMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDisplayMode("bookmark")}
                className={`p-2 rounded-md transition-all ${
                  displayMode === "bookmark"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Bookmark View"
              >
                <Bookmark className="h-4 w-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-border hidden md:block" />

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-rajdhani tracking-wider uppercase text-foreground/60">Sort</span>
              <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
                <SelectTrigger className="w-[130px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="type">Tag</SelectItem>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="start">Start Date</SelectItem>
                  <SelectItem value="progression">Progress</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDirectionChange(sortDirection === "asc" ? "desc" : "asc")}
                className="h-9 w-9 rounded-xl border border-border/60 bg-card/90 hover:bg-card hover:border-primary/40 hover:shadow-[0_0_8px_hsl(var(--primary)/0.15)] transition-all duration-200"
              >
                <ChevronRight
                  className={`h-4 w-4 text-foreground/70 transition-transform duration-200 ${
                    sortDirection === "asc" ? "-rotate-90" : "rotate-90"
                  }`}
                />
              </Button>
            </div>

            <div className="h-6 w-px bg-border hidden md:block" />

            {/* Search Bar */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none z-30" />
              <Input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="light"
                className="w-[180px] h-9 pl-9 pr-8 text-sm rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex-1" />

            {/* Per Page */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-rajdhani text-foreground/60">Per page</span>
              <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[70px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        {/* Content */}
        {displayGoals.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-card/60 backdrop-blur-sm border border-border"
          >
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(91,180,255,0.2)]">
              <Plus className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-orbitron tracking-wider text-primary mb-2">NO GOALS YET</h3>
            <p className="text-muted-foreground font-rajdhani mb-6 max-w-sm">
              Start your journey by adding your first Pact evolution
            </p>
            <Button onClick={() => navigate("/goals/new")} className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Plus className="h-4 w-4 mr-2 relative z-10" />
              <span className="relative z-10">Create First Goal</span>
            </Button>
          </motion.div>
        ) : (
          <div className="w-full">
            {/* Custom Tabs */}
            <motion.div variants={itemVariants} className="flex justify-center mb-6">
              <div className="flex gap-1 p-1 rounded-xl bg-card/30 border border-primary/20 backdrop-blur-xl">
                {[
                  { id: "all" as const, label: "All", count: allGoals.length, icon: List },
                  { id: "active" as const, label: "Active", count: activeGoals.length, icon: Zap },
                  { id: "completed" as const, label: "Completed", count: completedGoals.length, icon: CheckCircle2 },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-rajdhani text-sm font-medium transition-all duration-300 ${
                        isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="goalsActiveTab"
                          className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-lg"
                          initial={false}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                      <span className="relative z-10 text-xs opacity-70">({tab.count})</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeTab === "all" && (
                <motion.div
                  key="all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {allGoals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl bg-card/60 backdrop-blur-sm border border-border">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Plus className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold font-orbitron tracking-wider text-primary mb-2">NO GOALS YET</h3>
                      <p className="text-muted-foreground font-rajdhani mb-4">Start your journey by adding a goal</p>
                      <Button onClick={() => navigate("/goals/new")} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Goal
                      </Button>
                    </div>
                  ) : (
                    <>
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className={getGridClass()}
                      >
                        {paginatedAllGoals.map((goal, i) => {
                          const isCompleted = goal.status === "fully_completed" || goal.status === "validated";
                          return renderGoalCard(goal, i, isCompleted);
                        })}
                      </motion.div>
                      {displayMode === "bar" && renderPagination(allCurrentPage, allTotalPages, setAllCurrentPage)}
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === "active" && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeGoals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl bg-card/60 backdrop-blur-sm border border-border">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Plus className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold font-orbitron tracking-wider text-primary mb-2">
                        NO ACTIVE GOALS
                      </h3>
                      <p className="text-muted-foreground font-rajdhani mb-4">Start your journey by adding a goal</p>
                      <Button onClick={() => navigate("/goals/new")} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Goal
                      </Button>
                    </div>
                  ) : (
                    <>
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className={getGridClass()}
                      >
                        {paginatedActiveGoals.map((goal, i) => renderGoalCard(goal, i, false))}
                      </motion.div>
                      {displayMode === "bar" &&
                        renderPagination(activeCurrentPage, activeTotalPages, setActiveCurrentPage)}
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === "completed" && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {completedGoals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl bg-card/60 backdrop-blur-sm border border-border">
                      <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-400" />
                      </div>
                      <h3 className="text-lg font-bold font-orbitron tracking-wider text-primary mb-2">
                        NO COMPLETED GOALS YET
                      </h3>
                      <p className="text-muted-foreground font-rajdhani">Complete your first goal to see it here</p>
                    </div>
                  ) : (
                    <>
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className={getGridClass()}
                      >
                        {paginatedCompletedGoals.map((goal, i) => renderGoalCard(goal, i, true))}
                      </motion.div>
                      {displayMode === "bar" &&
                        renderPagination(completedCurrentPage, completedTotalPages, setCompletedCurrentPage)}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination for non-bar views (kept as original behavior) */}
            {displayMode !== "bar" && allGoals.length > 0 && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                {renderPagination(allCurrentPage, allTotalPages, setAllCurrentPage)}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
