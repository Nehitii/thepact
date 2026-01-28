// Centralized Goal Constants - Single source of truth for goal-related data
// This file standardizes tags, difficulties, statuses across the entire Goals module

// Goal Tags with colors - matches database goal_type enum
export const GOAL_TAGS = [
  { value: "personal", label: "Personal", color: "hsl(200 100% 67%)" },
  { value: "professional", label: "Professional", color: "hsl(45 95% 55%)" },
  { value: "health", label: "Health", color: "hsl(142 70% 50%)" },
  { value: "creative", label: "Creative", color: "hsl(280 75% 55%)" },
  { value: "financial", label: "Financial", color: "hsl(212 90% 55%)" },
  { value: "learning", label: "Learning", color: "hsl(25 100% 60%)" },
  { value: "relationship", label: "Relationship", color: "hsl(340 75% 55%)" },
  { value: "diy", label: "DIY", color: "hsl(175 70% 45%)" },
  { value: "other", label: "Other", color: "hsl(210 30% 50%)" },
] as const;

// Difficulty options (without custom - that comes from user profile)
export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy", color: "hsl(142 70% 50%)" },
  { value: "medium", label: "Medium", color: "hsl(45 95% 55%)" },
  { value: "hard", label: "Hard", color: "hsl(25 100% 60%)" },
  { value: "extreme", label: "Extreme", color: "hsl(0 90% 65%)" },
  { value: "impossible", label: "Impossible", color: "hsl(280 75% 45%)" },
] as const;

// Difficulty order for sorting (custom is highest tier when active)
export const DIFFICULTY_ORDER = ["easy", "medium", "hard", "extreme", "impossible", "custom"];

// Status configuration with labels and styling
export const STATUS_CONFIG = {
  not_started: { 
    label: "Not Started", 
    color: "bg-muted text-muted-foreground", 
    badgeClass: "bg-card/80 text-muted-foreground border-border" 
  },
  in_progress: { 
    label: "In Progress", 
    color: "bg-blue-500/10 text-blue-400", 
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30" 
  },
  validated: { 
    label: "Validated", 
    color: "bg-yellow-500/10 text-yellow-400", 
    badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" 
  },
  fully_completed: { 
    label: "Completed", 
    color: "bg-green-500/10 text-green-400", 
    badgeClass: "bg-green-500/15 text-green-400 border-green-500/30" 
  },
  paused: { 
    label: "Paused", 
    color: "bg-orange-500/10 text-orange-400", 
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30" 
  },
  active: { 
    label: "Active", 
    color: "bg-blue-500/10 text-blue-400", 
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30" 
  },
  completed: { 
    label: "Completed", 
    color: "bg-green-500/10 text-green-400", 
    badgeClass: "bg-green-500/15 text-green-400 border-green-500/30" 
  },
  cancelled: { 
    label: "Cancelled", 
    color: "bg-red-500/10 text-red-400", 
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30" 
  },
} as const;

// Helper function: Get status label
export function getStatusLabel(status: string): string {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || 
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

// Helper function: Get status color classes
export function getStatusColor(status: string): string {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || 
    "bg-muted text-muted-foreground";
}

// Helper function: Get status badge class
export function getStatusBadgeClass(status: string): string {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.badgeClass || 
    "bg-card/80 text-muted-foreground border-border";
}

// Helper function: Get difficulty label (handles custom difficulty name)
export function getDifficultyLabel(difficulty: string, customName?: string): string {
  if (difficulty === "custom") return customName || "Custom";
  const found = DIFFICULTY_OPTIONS.find(d => d.value === difficulty);
  return found?.label || difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

// Helper function: Get tag label
export function getTagLabel(type: string): string {
  const found = GOAL_TAGS.find(t => t.value === type);
  return found?.label || type.charAt(0).toUpperCase() + type.slice(1);
}

// Helper function: Get tag color
export function getTagColor(type: string): string {
  const found = GOAL_TAGS.find(t => t.value === type);
  return found?.color || "hsl(210 30% 50%)";
}

// Helper function: Map legacy/invalid tags to valid ones
export function mapToValidTag(tag: string): string {
  const validValues = GOAL_TAGS.map(t => t.value) as readonly string[];
  const lowered = tag.toLowerCase();
  if (validValues.includes(lowered)) return lowered;
  
  // Map old tags to closest valid tag
  const mapping: Record<string, string> = {
    "growth": "personal",
    "career": "professional",
    "fitness": "health",
    "art": "creative",
    "money": "financial",
    "education": "learning",
    "social": "relationship",
    "craft": "diy"
  };
  return mapping[lowered] || "other";
}

// Helper function: Get difficulty intensity level (1-5) for visual effects
export function getDifficultyIntensity(difficulty: string): number {
  switch (difficulty) {
    case "easy": return 1;
    case "medium": return 2;
    case "hard": return 3;
    case "extreme": return 4;
    case "impossible":
    case "custom": return 5;
    default: return 1;
  }
}

// Type exports for TypeScript support
export type GoalTag = typeof GOAL_TAGS[number];
export type DifficultyOption = typeof DIFFICULTY_OPTIONS[number];
export type StatusKey = keyof typeof STATUS_CONFIG;
