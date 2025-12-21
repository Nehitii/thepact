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
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/5 rounded-lg blur-2xl" />
        <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                <Trophy className="w-6 h-6 text-primary relative z-10" />
              </div>
              <h2 className="text-lg font-bold uppercase tracking-widest font-orbitron text-primary">Achievements</h2>
            </div>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-primary/10 rounded" />
              <div className="h-2 bg-primary/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="animate-fade-in relative group"
    >
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-2xl" />
      <div className="relative bg-card/20 backdrop-blur-xl border-2 border-primary/30 rounded-lg overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        
        <div className="relative z-10">
          <div className="p-6 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                  <Trophy className="w-6 h-6 text-primary relative z-10 animate-glow-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                    The Pact Achievements
                  </h2>
                  <p className="text-xs text-primary/50 font-rajdhani mt-1">
                    {stats.unlocked} / {stats.total} unlocked
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/achievements")} 
                className="gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 font-orbitron text-xs uppercase tracking-wider"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-primary/50 uppercase tracking-wider font-rajdhani">Progress</span>
                <span className="font-bold text-primary font-orbitron drop-shadow-[0_0_5px_rgba(91,180,255,0.5)]">{stats.percentage}%</span>
              </div>
              <div className="relative h-3 w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/20">
                <div
                  className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-1000 shadow-[0_0_15px_rgba(91,180,255,0.5)]"
                  style={{ width: `${stats.percentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                </div>
              </div>
            </div>

            {/* Recent achievement */}
            {stats.recent.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-primary/50 uppercase tracking-wider font-rajdhani">Latest Achievement</h3>
                <AchievementCard achievement={stats.recent[0]} compact />
              </div>
            )}

            {stats.unlocked === 0 && (
              <div className="text-center py-8">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-primary/40 relative z-10" />
                </div>
                <p className="text-sm text-primary/60 font-rajdhani">
                  Complete actions to unlock your first achievement
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}