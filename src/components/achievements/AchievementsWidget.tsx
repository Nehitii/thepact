import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAchievementStats } from "@/lib/achievements";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight } from "lucide-react";
import { AchievementCard } from "./AchievementCard";
import { useNavigate } from "react-router-dom";
import { DashboardWidgetShell, WidgetDisplayMode } from "@/components/home/DashboardWidgetShell";

interface AchievementsWidgetProps {
  displayMode?: WidgetDisplayMode;
  onToggleDisplayMode?: () => void;
}

export function AchievementsWidget({ 
  displayMode = 'compact',
  onToggleDisplayMode,
}: AchievementsWidgetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isCompact = displayMode === 'compact';

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

  const recentAchievements = (
    <div className="space-y-2">
      <h4 className="text-[10px] font-orbitron text-primary/50 uppercase tracking-wider">Recent Unlocks</h4>
      {stats?.recent?.slice(0, 3).map((achievement: any) => (
        <AchievementCard key={achievement.key} achievement={achievement} compact />
      ))}
    </div>
  );

  return (
    <DashboardWidgetShell
      title="The Pact Achievements"
      icon={Trophy}
      subtitle={stats ? `${stats.unlocked} / ${stats.total} unlocked` : undefined}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      isLoading={loading || !stats}
      expandableContent={!isCompact && stats?.recent?.length > 1 ? recentAchievements : undefined}
      headerAction={
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/achievements")} 
          className="h-7 px-2 gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 font-orbitron text-[10px] uppercase tracking-wider"
        >
          View
          <ChevronRight className="w-3 h-3" />
        </Button>
      }
      accentColor="primary"
    >
      {!stats ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-primary/40 text-sm font-rajdhani">Loading achievements...</div>
        </div>
      ) : stats.unlocked === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
            <Trophy className="w-10 h-10 text-primary/40 relative z-10" />
          </div>
          <p className="text-sm text-primary/60 font-rajdhani">
            Complete actions to unlock your first achievement
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-primary/50 uppercase tracking-wider font-rajdhani">Progress</span>
              <span className="font-bold text-primary font-orbitron drop-shadow-[0_0_5px_rgba(91,180,255,0.5)]">
                {stats.percentage}%
              </span>
            </div>
            <div className="relative h-2.5 w-full bg-card/30 backdrop-blur rounded-full overflow-hidden border border-primary/20">
              <div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-1000 shadow-[0_0_15px_rgba(91,180,255,0.5)]"
                style={{ width: `${stats.percentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
              </div>
            </div>
          </div>

          {/* Recent achievement */}
          {stats.recent?.length > 0 && (
            <div className="flex-1">
              <h3 className="text-[10px] font-semibold text-primary/50 uppercase tracking-wider font-rajdhani mb-2">
                Latest Achievement
              </h3>
              <AchievementCard achievement={stats.recent[0]} compact />
            </div>
          )}
        </div>
      )}
    </DashboardWidgetShell>
  );
}
