import React, { useMemo } from "react";
import { Check, Sparkles, Filter, Eye, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DIFFICULTY_OPTIONS, GOAL_TAGS, getDifficultyLabel, getTagLabel, getStatusLabel } from "@/lib/goalConstants";
import { cn } from "@/lib/utils";
import { SuperGoalRule, filterGoalsByRule } from "./types";

interface Goal {
  id: string;
  name: string;
  difficulty?: string | null;
  status?: string | null;
  is_focus?: boolean | null;
  goal_type?: string;
  tags?: string[];
}

interface AutoBuildRuleEditorProps {
  rule: SuperGoalRule;
  onRuleChange: (rule: SuperGoalRule) => void;
  goals: Goal[];
  customDifficultyName?: string;
  customDifficultyActive?: boolean;
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "fully_completed", label: "Completed" },
  { value: "paused", label: "Paused" },
];

export function AutoBuildRuleEditor({
  rule,
  onRuleChange,
  goals,
  customDifficultyName = "",
  customDifficultyActive = false,
}: AutoBuildRuleEditorProps) {
  // Filter out super goals from preview
  const availableGoals = useMemo(() => 
    goals.filter((g) => g.goal_type !== "super"),
    [goals]
  );

  // Compute matched goals based on current rule
  const matchedGoals = useMemo(() => 
    filterGoalsByRule(availableGoals, rule),
    [availableGoals, rule]
  );

  const allDifficulties = [
    ...DIFFICULTY_OPTIONS,
    ...(customDifficultyActive ? [{ value: "custom" as const, labelKey: "", color: "#a855f7" }] : []),
  ];

  const toggleDifficulty = (diff: string) => {
    const current = rule.difficulties || [];
    const updated = current.includes(diff)
      ? current.filter((d) => d !== diff)
      : [...current, diff];
    onRuleChange({ ...rule, difficulties: updated.length > 0 ? updated : undefined });
  };

  const toggleTag = (tag: string) => {
    const current = rule.tags || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    onRuleChange({ ...rule, tags: updated.length > 0 ? updated : undefined });
  };

  const toggleStatus = (status: string) => {
    const current = rule.statuses || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onRuleChange({ ...rule, statuses: updated.length > 0 ? updated : undefined });
  };

  return (
    <div className="space-y-5">
      {/* Difficulty Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Difficulty Filter
        </Label>
        <div className="flex flex-wrap gap-2">
          {allDifficulties.map((diff) => {
            const isSelected = (rule.difficulties || []).includes(diff.value);
            const label = diff.value === "custom" ? customDifficultyName || "Custom" : getDifficultyLabel(diff.value);
            return (
              <button
                key={diff.value}
                type="button"
                onClick={() => toggleDifficulty(diff.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium text-sm transition-all",
                  isSelected
                    ? "text-white shadow-lg"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border"
                )}
                style={isSelected ? { background: diff.color, boxShadow: `0 0 15px ${diff.color}40` } : {}}
              >
                <span className="flex items-center gap-1.5">
                  {isSelected && <Check className="h-3 w-3" />}
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Leave empty to include all difficulties</p>
      </div>

      {/* Tag Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">
          Tag Filter
        </Label>
        <div className="flex flex-wrap gap-2">
          {GOAL_TAGS.slice(0, 6).map((tag) => {
            const isSelected = (rule.tags || []).includes(tag.value);
            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleTag(tag.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium text-sm transition-all",
                  isSelected
                    ? "text-white shadow-lg"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border"
                )}
                style={isSelected ? { background: tag.color, boxShadow: `0 0 15px ${tag.color}40` } : {}}
              >
                <span className="flex items-center gap-1.5">
                  {isSelected && <Check className="h-3 w-3" />}
                  {getTagLabel(tag.value)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Focus Goals Only
          </Label>
          <Switch
            checked={rule.focusOnly || false}
            onCheckedChange={(checked) => onRuleChange({ ...rule, focusOnly: checked || undefined })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Exclude Completed Goals
          </Label>
          <Switch
            checked={rule.excludeCompleted || false}
            onCheckedChange={(checked) => onRuleChange({ ...rule, excludeCompleted: checked || undefined })}
          />
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview ({matchedGoals.length} goals match)
          </Label>
        </div>
        
        <ScrollArea className="h-[150px] rounded-xl border border-border bg-card/50 p-2">
          {matchedGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-6">
              <Sparkles className="h-6 w-6 mb-2 opacity-50" />
              <p className="text-sm">No goals match current filters</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {matchedGoals.slice(0, 10).map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-card/80 border border-border/50"
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: DIFFICULTY_OPTIONS.find(d => d.value === goal.difficulty)?.color || "#6b7280" }} />
                  <span className="text-sm truncate flex-1">{goal.name}</span>
                  {goal.is_focus && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                </div>
              ))}
              {matchedGoals.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{matchedGoals.length - 10} more goals
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
