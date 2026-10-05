import React, { useState, useEffect, useMemo } from "react";
import { Crown, Zap, Save, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { GoalSelectionList } from "./GoalSelectionList";
import { AutoBuildRuleEditor } from "./AutoBuildRuleEditor";
import { filterGoalsByRule, type SuperGoalRule } from "./types";
import type { Goal } from "@/hooks/useGoals";

interface SuperGoalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    childGoalIds: string[];
    rule: SuperGoalRule | null;
    isDynamic: boolean;
  }) => Promise<void>;
  currentChildIds: string[];
  currentRule: SuperGoalRule | null;
  currentIsDynamic: boolean;
  allGoals: Goal[];
  superGoalId: string;
  customDifficultyName?: string;
  customDifficultyColor?: string;
}

export function SuperGoalEditModal({
  isOpen,
  onClose,
  onSave,
  currentChildIds,
  currentRule,
  currentIsDynamic,
  allGoals,
  superGoalId,
  customDifficultyName = "",
  customDifficultyColor = "#a855f7",
}: SuperGoalEditModalProps) {
  const [isDynamic, setIsDynamic] = useState(currentIsDynamic);
  const [selectedIds, setSelectedIds] = useState<string[]>(currentChildIds);
  const [rule, setRule] = useState<SuperGoalRule>(currentRule || {});
  const [saving, setSaving] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsDynamic(currentIsDynamic);
      setSelectedIds(currentChildIds);
      setRule(currentRule || {});
    }
  }, [isOpen, currentIsDynamic, currentChildIds, currentRule]);

  // Filter out the super goal itself and other super goals from selection
  const eligibleGoals = useMemo(() => {
    return allGoals.filter(g => g.id !== superGoalId && g.goal_type !== "super");
  }, [allGoals, superGoalId]);

  // Compute goals matching current rule
  const matchedGoals = useMemo(() => {
    if (!isDynamic) return [];
    return filterGoalsByRule(eligibleGoals, rule);
  }, [isDynamic, eligibleGoals, rule]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        childGoalIds: isDynamic ? matchedGoals.map(g => g.id) : selectedIds,
        rule: isDynamic ? rule : null,
        isDynamic,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToStatic = () => {
    // Copy current matched goals to selected and switch to manual
    setSelectedIds(matchedGoals.map(g => g.id));
    setIsDynamic(false);
  };

  const handleConvertToDynamic = () => {
    setIsDynamic(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-hidden"
      >
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 h-full overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-xl font-orbitron font-bold tracking-wider">
                    Edit Super Goal
                  </h2>
                  <p className="text-sm text-muted-foreground font-rajdhani">
                    Manage child goals
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </motion.div>

            {/* Mode toggle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 p-4 rounded-xl border border-border bg-card/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className={`h-5 w-5 ${isDynamic ? "text-purple-400" : "text-muted-foreground"}`} />
                  <div>
                    <Label className="font-rajdhani font-medium">
                      Dynamic Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Auto-update when new goals match rules
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDynamic}
                  onCheckedChange={setIsDynamic}
                />
              </div>

              {/* Conversion buttons */}
              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                {isDynamic ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConvertToStatic}
                    className="font-rajdhani"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Snapshot to Static ({matchedGoals.length} goals)
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConvertToDynamic}
                    className="font-rajdhani"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Convert to Dynamic
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Content based on mode */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              {isDynamic ? (
                <div className="space-y-4">
                  <AutoBuildRuleEditor
                    rule={rule}
                    onRuleChange={setRule}
                    goals={eligibleGoals}
                    customDifficultyName={customDifficultyName}
                    customDifficultyActive={!!customDifficultyName}
                  />
                  
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        Preview
                      </Badge>
                      <span className="text-sm font-rajdhani text-muted-foreground">
                        {matchedGoals.length} goals match this rule
                      </span>
                    </div>
                    {matchedGoals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {matchedGoals.slice(0, 5).map(g => (
                          <Badge key={g.id} variant="outline" className="text-xs">
                            {g.name}
                          </Badge>
                        ))}
                        {matchedGoals.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{matchedGoals.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <GoalSelectionList
                  goals={eligibleGoals}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  customDifficultyName={customDifficultyName}
                  customDifficultyColor={customDifficultyColor}
                />
              )}
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-end gap-3"
            >
              <Button
                variant="outline"
                onClick={onClose}
                className="font-rajdhani"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || (!isDynamic && selectedIds.length === 0)}
                className="font-rajdhani"
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
