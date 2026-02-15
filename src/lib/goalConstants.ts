// Centralized Goal Constants - Single source of truth for goal-related data
// This file standardizes tags, difficulties, statuses across the entire Goals module
// All labels are translation keys for i18n support

import type { TFunction } from "i18next";

// Goal Tags with colors - matches database goal_type enum
export const GOAL_TAGS = [
  { value: "personal", labelKey: "goals.tags.personal", color: "hsl(200 100% 67%)" },
  { value: "professional", labelKey: "goals.tags.professional", color: "hsl(45 95% 55%)" },
  { value: "health", labelKey: "goals.tags.health", color: "hsl(142 70% 50%)" },
  { value: "creative", labelKey: "goals.tags.creative", color: "hsl(280 75% 55%)" },
  { value: "financial", labelKey: "goals.tags.financial", color: "hsl(212 90% 55%)" },
  { value: "learning", labelKey: "goals.tags.learning", color: "hsl(25 100% 60%)" },
  { value: "relationship", labelKey: "goals.tags.relationship", color: "hsl(340 75% 55%)" },
  { value: "diy", labelKey: "goals.tags.diy", color: "hsl(175 70% 45%)" },
  { value: "other", labelKey: "goals.tags.other", color: "hsl(210 30% 50%)" },
] as const;

// Difficulty options (without custom - that comes from user profile)
export const DIFFICULTY_OPTIONS = [
  { value: "easy", labelKey: "goals.difficulties.easy", color: "hsl(142 70% 50%)" },
  { value: "medium", labelKey: "goals.difficulties.medium", color: "hsl(45 95% 55%)" },
  { value: "hard", labelKey: "goals.difficulties.hard", color: "hsl(25 100% 60%)" },
  { value: "extreme", labelKey: "goals.difficulties.extreme", color: "hsl(0 90% 65%)" },
  { value: "impossible", labelKey: "goals.difficulties.impossible", color: "hsl(280 75% 45%)" },
] as const;

// Difficulty order for sorting (custom is highest tier when active)
export const DIFFICULTY_ORDER = ["easy", "medium", "hard", "extreme", "impossible", "custom"];

// Status configuration with labels and styling
export const STATUS_CONFIG = {
  not_started: { 
    labelKey: "goals.statuses.not_started", 
    color: "bg-muted text-muted-foreground", 
    badgeClass: "bg-card/80 text-muted-foreground border-border" 
  },
  in_progress: { 
    labelKey: "goals.statuses.in_progress", 
    color: "bg-blue-500/10 text-blue-400", 
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30" 
  },
  validated: { 
    labelKey: "goals.statuses.validated", 
    color: "bg-yellow-500/10 text-yellow-400", 
    badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" 
  },
  fully_completed: { 
    labelKey: "goals.statuses.fully_completed", 
    color: "bg-green-500/10 text-green-400", 
    badgeClass: "bg-green-500/15 text-green-400 border-green-500/30" 
  },
  paused: { 
    labelKey: "goals.statuses.paused", 
    color: "bg-orange-500/10 text-orange-400", 
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30" 
  },
  active: { 
    labelKey: "goals.statuses.active", 
    color: "bg-blue-500/10 text-blue-400", 
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30" 
  },
  completed: { 
    labelKey: "goals.statuses.completed", 
    color: "bg-green-500/10 text-green-400", 
    badgeClass: "bg-green-500/15 text-green-400 border-green-500/30" 
  },
  cancelled: { 
    labelKey: "goals.statuses.cancelled", 
    color: "bg-red-500/10 text-red-400", 
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30" 
  },
} as const;

// Helper function: Get status label (with i18n support)
export function getStatusLabel(status: string, t?: TFunction): string {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  if (!config) {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  }
  if (t) {
    return t(config.labelKey);
  }
  // Fallback to English if no translation function provided
  const fallbacks: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    validated: "Validated",
    fully_completed: "Completed",
    paused: "Paused",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return fallbacks[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
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

// Helper function: Get difficulty label (with i18n support, handles custom difficulty name)
export function getDifficultyLabel(difficulty: string, t?: TFunction, customName?: string): string {
  if (difficulty === "custom") return customName || (t ? t("goals.difficulties.custom") : "Custom");
  const found = DIFFICULTY_OPTIONS.find(d => d.value === difficulty);
  if (!found) return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  if (t) return t(found.labelKey);
  // Fallback to English
  const fallbacks: Record<string, string> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    extreme: "Extreme",
    impossible: "Impossible",
  };
  return fallbacks[difficulty] || difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

// Helper function: Get tag label (with i18n support)
export function getTagLabel(type: string, t?: TFunction): string {
  const found = GOAL_TAGS.find(tag => tag.value === type);
  if (!found) return type.charAt(0).toUpperCase() + type.slice(1);
  if (t) return t(found.labelKey);
  // Fallback to English
  const fallbacks: Record<string, string> = {
    personal: "Personal",
    professional: "Professional",
    health: "Health",
    creative: "Creative",
    financial: "Financial",
    learning: "Learning",
    relationship: "Relationship",
    diy: "DIY",
    other: "Other",
  };
  return fallbacks[type] || type.charAt(0).toUpperCase() + type.slice(1);
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

// Cost Item Categories
export const COST_ITEM_CATEGORIES = [
  { value: "car", labelKey: "goals.costCategories.car" },
  { value: "home", labelKey: "goals.costCategories.home" },
  { value: "furniture", labelKey: "goals.costCategories.furniture" },
  { value: "clothing", labelKey: "goals.costCategories.clothing" },
  { value: "electronics", labelKey: "goals.costCategories.electronics" },
  { value: "tools", labelKey: "goals.costCategories.tools" },
  { value: "materials", labelKey: "goals.costCategories.materials" },
  { value: "software", labelKey: "goals.costCategories.software" },
  { value: "services", labelKey: "goals.costCategories.services" },
  { value: "food", labelKey: "goals.costCategories.food" },
  { value: "transport", labelKey: "goals.costCategories.transport" },
  { value: "education", labelKey: "goals.costCategories.education" },
  { value: "health", labelKey: "goals.costCategories.health" },
  { value: "decoration", labelKey: "goals.costCategories.decoration" },
  { value: "beauty", labelKey: "goals.costCategories.beauty" },
  { value: "sports", labelKey: "goals.costCategories.sports" },
  { value: "pets", labelKey: "goals.costCategories.pets" },
  { value: "gifts", labelKey: "goals.costCategories.gifts" },
  { value: "travel", labelKey: "goals.costCategories.travel" },
  { value: "subscriptions", labelKey: "goals.costCategories.subscriptions" },
  { value: "other", labelKey: "goals.costCategories.other" },
] as const;

// Helper: Get cost category label
export function getCostCategoryLabel(category: string, t?: TFunction): string {
  const found = COST_ITEM_CATEGORIES.find(c => c.value === category);
  if (!found) return category.charAt(0).toUpperCase() + category.slice(1);
  if (t) return t(found.labelKey);
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// Type exports for TypeScript support
export type GoalTag = typeof GOAL_TAGS[number];
export type DifficultyOption = typeof DIFFICULTY_OPTIONS[number];
export type StatusKey = keyof typeof STATUS_CONFIG;
export type CostItemCategory = typeof COST_ITEM_CATEGORIES[number];
