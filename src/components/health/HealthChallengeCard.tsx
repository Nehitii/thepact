/**
 * Health challenge card component.
 * Displays an active weekly challenge with progress.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { format, parseISO, differenceInDays } from "date-fns";
import { Target, Trophy, Clock, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HealthChallenge } from "@/hooks/useHealthChallenges";

interface HealthChallengeCardProps {
  challenge: HealthChallenge;
  onDelete?: (id: string) => void;
}

const CHALLENGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  sleep: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
  stress: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/30" },
  hydration: { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/30" },
  activity: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" },
  mood: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
};

export function HealthChallengeCard({ challenge, onDelete }: HealthChallengeCardProps) {
  const { t } = useTranslation();
  
  const colors = CHALLENGE_COLORS[challenge.challenge_type] || CHALLENGE_COLORS.activity;
  const progress = Math.min((challenge.current_value / challenge.target_days) * 100, 100);
  const daysLeft = differenceInDays(parseISO(challenge.end_date), new Date());
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      <Card className={cn(
        "relative overflow-hidden border-2 transition-all",
        colors.border,
        challenge.completed && "opacity-75"
      )}>
        {/* Completed overlay */}
        {challenge.completed && (
          <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center z-10">
            <div className="bg-emerald-500/90 text-white px-4 py-2 rounded-full flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="font-bold">{t("health.challenges.completed")}</span>
            </div>
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", colors.bg)}>
                <Target className={cn("w-5 h-5", colors.text)} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{challenge.title}</h3>
                {challenge.description && (
                  <p className="text-xs text-muted-foreground">{challenge.description}</p>
                )}
              </div>
            </div>
            
            {/* Bond reward */}
            <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-full">
              <span className="text-amber-500 text-xs font-bold">+{challenge.bond_reward}</span>
              <span className="text-[10px] text-amber-500/70">B</span>
            </div>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {challenge.current_value}/{challenge.target_days} {t("health.challenges.daysHit")}
              </span>
              <span className={cn("font-medium", colors.text)}>
                {Math.round(progress)}%
              </span>
            </div>
            
            <Progress 
              value={progress} 
              className="h-2"
            />
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {daysLeft > 0 ? (
                <span>{daysLeft} {t("health.challenges.daysLeft")}</span>
              ) : (
                <span>{t("health.challenges.endsToday")}</span>
              )}
            </div>
            
            {onDelete && !challenge.completed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(challenge.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
