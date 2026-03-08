import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/currency";
import { getCostCategoryLabel } from "@/lib/goalConstants";
import type { GoalDetailData } from "@/hooks/useGoalDetail";

interface CostItem {
  id: string;
  name: string;
  price: number;
  category: string | null;
  step_id: string | null;
}

interface Step {
  id: string;
  title: string;
  status: string;
}

interface GoalDetailCostsProps {
  goal: GoalDetailData;
  costItems: CostItem[];
  steps: Step[];
  difficultyColor: string;
  currency: string;
}

export const GoalDetailCosts = React.memo(function GoalDetailCosts({
  goal, costItems, steps, difficultyColor, currency,
}: GoalDetailCostsProps) {
  const { t } = useTranslation();

  if (!goal.notes && goal.estimated_cost <= 0 && costItems.length === 0) return null;

  const alreadyFinanced = costItems
    .filter((ci) => ci.step_id && steps.find((s) => s.id === ci.step_id && s.status === "completed"))
    .reduce((sum, ci) => sum + ci.price, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="relative rounded-xl border border-border bg-card/80 backdrop-blur-xl"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5" style={{ color: difficultyColor }} />
          <span className="font-orbitron font-bold tracking-wider">Details</span>
        </div>

        {(goal.estimated_cost > 0 || costItems.length > 0) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-rajdhani uppercase tracking-wider text-primary/70">
              <Receipt className="h-4 w-4" />
              Estimated Cost
            </div>
            {costItems.length > 0 ? (
              <div className="space-y-2">
                {costItems.map((item) => {
                  const linkedStep = item.step_id ? steps.find((s) => s.id === item.step_id) : null;
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-rajdhani text-foreground/90">{item.name}</span>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {item.category && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary/70">
                              {getCostCategoryLabel(item.category, t)}
                            </Badge>
                          )}
                          {linkedStep && (
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${linkedStep.status === "completed" ? "border-green-500/40 text-green-400" : "border-border text-muted-foreground"}`}>
                              ↳ {linkedStep.title}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="font-orbitron font-bold flex-shrink-0" style={{ color: difficultyColor }}>
                        {formatCurrency(item.price, currency)}
                      </span>
                    </div>
                  );
                })}
                {alreadyFinanced > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                    <span className="font-rajdhani uppercase tracking-wider text-green-400/70">{t("goals.detail.alreadyFinanced")}</span>
                    <span className="font-orbitron font-bold text-green-400">{formatCurrency(alreadyFinanced, currency)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <span className="font-rajdhani uppercase tracking-wider text-primary/70">Total</span>
                  <span className="font-orbitron font-bold text-lg text-primary">{formatCurrency(goal.estimated_cost, currency)}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <p className="text-2xl font-bold font-orbitron" style={{ color: difficultyColor }}>
                  {formatCurrency(goal.estimated_cost, currency)}
                </p>
              </div>
            )}
          </div>
        )}

        {goal.notes && (
          <div className="space-y-2">
            <p className="text-sm font-rajdhani uppercase tracking-wider text-primary/70">Notes</p>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm font-rajdhani leading-relaxed text-foreground/90">{goal.notes}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});
