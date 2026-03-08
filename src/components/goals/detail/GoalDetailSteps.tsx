import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronRight, MessageSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface Step {
  id: string;
  title: string;
  order: number;
  status: string;
  notes?: string | null;
}

interface GoalDetailStepsProps {
  steps: Step[];
  completedStepsCount: number;
  totalStepsCount: number;
  difficultyColor: string;
  onToggleStep: (stepId: string, currentStatus: string) => void;
}

export const GoalDetailSteps = React.memo(function GoalDetailSteps({
  steps, completedStepsCount, totalStepsCount, difficultyColor, onToggleStep,
}: GoalDetailStepsProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="relative rounded-xl border border-border bg-card/80 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-6">
            <Check className="h-5 w-5" style={{ color: difficultyColor }} />
            <span className="font-orbitron font-bold tracking-wider">Steps</span>
            <Badge variant="outline" className="ml-auto font-rajdhani text-sm" style={{ borderColor: difficultyColor, color: difficultyColor }}>
              {completedStepsCount}/{totalStepsCount}
            </Badge>
          </div>
          <div className="space-y-3">
            <TooltipProvider delayDuration={300}>
              {steps.map((step) => (
                <Tooltip key={step.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${step.status === "completed" ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"}`}
                      onClick={() => navigate(`/step/${step.id}`)}
                    >
                      <div onClick={(e) => e.stopPropagation()} className="p-2 -m-2 flex items-center justify-center">
                        <Checkbox checked={step.status === "completed"} onCheckedChange={() => onToggleStep(step.id, step.status)} className="border-primary/50" />
                      </div>
                      <span className={`flex-1 font-rajdhani ${step.status === "completed" ? "text-primary" : "text-muted-foreground"}`}>
                        {step.title}
                      </span>
                      {step.notes && <MessageSquare className="h-4 w-4 text-primary/50" />}
                      {step.status === "completed" && <Check className="h-4 w-4" style={{ color: difficultyColor }} />}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  {step.notes && (
                    <TooltipContent side="top" className="max-w-[300px] p-3 bg-card border-primary/30">
                      <p className="text-sm font-rajdhani text-foreground/90 whitespace-pre-wrap">{step.notes}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
