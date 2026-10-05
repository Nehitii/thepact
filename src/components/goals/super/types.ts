// Super Goal Types and Interfaces

export interface SuperGoalRule {
  difficulties?: string[];  // Filter by difficulty: ["easy", "hard", "custom"]
  tags?: string[];          // Filter by tags: ["personal", "health"]
  statuses?: string[];      // Filter by status: ["in_progress", "not_started"]
  focusOnly?: boolean;      // Only include focused goals
  excludeCompleted?: boolean; // Exclude already completed goals
}

export interface SuperGoalChildInfo {
  id: string;
  name: string;
  difficulty: string;
  status: string;
  progress: number;
  isCompleted: boolean;
  isMissing?: boolean;
}

export type SuperGoalBuildMode = "manual" | "auto";
export type SuperGoalType = "static" | "dynamic";

export interface SuperGoalFormData {
  buildMode: SuperGoalBuildMode;
  selectedGoalIds: string[];
  rule: SuperGoalRule;
  isDynamic: boolean;
}

// Compute progress from child goals
export function computeSuperGoalProgress(children: SuperGoalChildInfo[]): {
  completedCount: number;
  totalCount: number;
  percentage: number;
  isFullyCompleted: boolean;
} {
  const validChildren = children.filter(c => !c.isMissing);
  const completedCount = validChildren.filter(c => c.isCompleted).length;
  const totalCount = validChildren.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  return {
    completedCount,
    totalCount,
    percentage,
    isFullyCompleted: totalCount > 0 && completedCount === totalCount,
  };
}

// Apply rule to filter goals
export function filterGoalsByRule<T extends {
  id: string;
  difficulty?: string | null;
  status?: string | null;
  is_focus?: boolean | null;
  tags?: string[];
}>(goals: T[], rule: SuperGoalRule): T[] {
  return goals.filter(goal => {
    // Filter by difficulty
    if (rule.difficulties && rule.difficulties.length > 0) {
      if (!goal.difficulty || !rule.difficulties.includes(goal.difficulty)) {
        return false;
      }
    }
    
    // Filter by tags
    if (rule.tags && rule.tags.length > 0) {
      const goalTags = goal.tags || [];
      const hasMatchingTag = rule.tags.some(t => goalTags.includes(t));
      if (!hasMatchingTag) return false;
    }
    
    // Filter by status
    if (rule.statuses && rule.statuses.length > 0) {
      if (!goal.status || !rule.statuses.includes(goal.status)) {
        return false;
      }
    }
    
    // Focus only filter
    if (rule.focusOnly && !goal.is_focus) {
      return false;
    }
    
    // Exclude completed
    if (rule.excludeCompleted && goal.status === "fully_completed") {
      return false;
    }
    
    return true;
  });
}
