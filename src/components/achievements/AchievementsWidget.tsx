import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAchievementStats, Achievement } from "@/lib/achievements";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight } from "lucide-react";
import { AchievementCard } from "./AchievementCard";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
export function AchievementsWidget() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);
  const loadStats = async () => {
    if (!user) return;
    try {
      const data = await getAchievementStats(user.id);
      setStats(data);
    } catch (error) {
      console.error("Error loading achievement stats:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading || !stats) {
    return <Card className="p-6 bg-card/30 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Achievements</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded" />
          <div className="h-2 bg-muted rounded" />
        </div>
      </Card>;
  }
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }}>
      <Card className="p-6 bg-card/30 backdrop-blur-sm border-border/50 overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">The Pact Achievements</h2>
                <p className="text-sm text-muted-foreground">
                  {stats.unlocked} / {stats.total} unlocked
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile?tab=achievements")} className="gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-bold text-primary">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-3" style={{
            "--progress-background": "hsl(var(--primary))"
          } as any} />
          </div>

          {/* Recent achievement */}
          {stats.recent.length > 0 && <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Latest Achievement</h3>
              <AchievementCard achievement={stats.recent[0]} size="small" />
            </div>}

          {stats.unlocked === 0 && <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-muted" />
              <p className="text-sm text-muted">
                Complete actions to unlock your first achievement
              </p>
            </div>}
        </div>
      </Card>
    </motion.div>;
}