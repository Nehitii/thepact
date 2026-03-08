import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { SuperGoalChildList, type SuperGoalChildInfo } from "@/components/goals/super";
import type { GoalDetailData } from "@/hooks/useGoalDetail";

interface GoalDetailSuperGoalProps {
  goal: GoalDetailData;
  childGoalsInfo: SuperGoalChildInfo[];
  customDifficultyName: string;
  customDifficultyColor: string;
  onEditChildren: () => void;
}

export const GoalDetailSuperGoal = React.memo(function GoalDetailSuperGoal({
  goal, childGoalsInfo, customDifficultyName, customDifficultyColor, onEditChildren,
}: GoalDetailSuperGoalProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="relative rounded-xl border-2 border-primary/30 bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(ellipse at top, hsl(var(--primary) / 0.3), transparent 70%)` }} />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 flex items-center justify-center">
                <Crown className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <Badge variant="outline" className="border-primary/30 text-primary text-xs font-bold uppercase mb-1">
                  {goal.is_dynamic_super ? "Dynamic Super Goal" : "Super Goal"}
                </Badge>
                {goal.is_dynamic_super && goal.super_goal_rule && (
                  <p className="text-xs text-muted-foreground font-mono">Auto-updates based on rules</p>
                )}
              </div>
            </div>
            <Button variant="hud" size="sm" onClick={onEditChildren} className="rounded-lg">
              <Edit className="h-4 w-4 mr-2" />Edit Goals
            </Button>
          </div>
          <SuperGoalChildList
            children={childGoalsInfo}
            onChildClick={(childId) => navigate(`/goals/${childId}`)}
            customDifficultyName={customDifficultyName}
            customDifficultyColor={customDifficultyColor}
          />
        </div>
      </div>
    </motion.div>
  );
});
