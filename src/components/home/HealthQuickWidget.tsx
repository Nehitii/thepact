/**
 * Health quick widget for the Home dashboard.
 * Displays today's health status with quick check-in access.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayHealth, useHealthScore, useHealthSettings } from "@/hooks/useHealth";
import { useHealthStreak, useHasCheckedInToday } from "@/hooks/useHealthStreak";
import { HealthStreakBadge } from "@/components/health/HealthStreakBadge";
import { HealthDailyCheckin } from "@/components/health/HealthDailyCheckin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ArrowRight, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface HealthQuickWidgetProps {
  className?: string;
}

export function HealthQuickWidget({ className }: HealthQuickWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCheckin, setShowCheckin] = useState(false);
  
  const { data: todayData, isLoading } = useTodayHealth(user?.id);
  const healthScore = useHealthScore(user?.id);
  const hasCheckedIn = useHasCheckedInToday(user?.id);
  
  const getTrendIcon = () => {
    switch (healthScore.trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case "down": return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };
  
  const getScoreColor = () => {
    if (healthScore.score >= 80) return "text-emerald-400";
    if (healthScore.score >= 60) return "text-amber-400";
    if (healthScore.score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <>
      <Card className={cn(
        "bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20 overflow-hidden relative",
        className
      )}>
        {/* Subtle glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Heart className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="font-semibold text-sm">{t("health.widget.title")}</span>
                </div>
                
                <HealthStreakBadge size="sm" showLabel={false} />
              </div>
              
              {/* Score or CTA */}
              {hasCheckedIn ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-3xl font-bold font-orbitron", getScoreColor())}>
                        {healthScore.score}
                      </span>
                      <span className="text-muted-foreground text-sm">/100</span>
                      {getTrendIcon()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("health.widget.todayScore")}
                    </p>
                  </div>
                  
                  {/* Quick factors */}
                  {healthScore.factors.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-emerald-400">
                        {healthScore.factors[0]}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-2"
                >
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("health.widget.noCheckinYet")}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowCheckin(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {t("health.dailyCheckin")}
                  </Button>
                </motion.div>
              )}
              
              {/* Footer actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                {hasCheckedIn && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCheckin(true)}
                    className="text-xs text-muted-foreground hover:text-emerald-400"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {t("health.widget.updateToday")}
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate("/health")}
                  className={cn(
                    "text-xs text-emerald-400 hover:text-emerald-300",
                    !hasCheckedIn && "ml-auto"
                  )}
                >
                  {t("health.widget.viewDetails")}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Check-in modal */}
      <HealthDailyCheckin
        open={showCheckin}
        onOpenChange={setShowCheckin}
      />
    </>
  );
}
