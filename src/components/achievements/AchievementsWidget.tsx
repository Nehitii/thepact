import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAchievementStats } from "@/lib/achievements";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight } from "lucide-react";
import { AchievementCard } from "./AchievementCard";
import { useNavigate } from "react-router-dom";
import { NeuralPanel, WidgetDisplayMode } from "@/components/home/NeuralPanel";

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
    if (user) loadStats();
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
      <h4 className="text-[10px] font-orbitron text-[rgba(160,210,255,0.35)] uppercase tracking-wider">Recent Unlocks</h4>
      {stats?.recent?.slice(0, 3).map((achievement: any) => (
        <AchievementCard key={achievement.key} achievement={achievement} compact />
      ))}
    </div>
  );

  return (
    <NeuralPanel
      title="Achievements"
      icon={Trophy}
      subtitle={stats ? `${stats.unlocked}/${stats.total}` : undefined}
      displayMode={displayMode}
      onToggleDisplayMode={onToggleDisplayMode}
      isLoading={loading || !stats}
      expandableContent={!isCompact && stats?.recent?.length > 1 ? recentAchievements : undefined}
      headerAction={
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/achievements")} 
          className="h-6 px-2 gap-1 bg-transparent hover:bg-[rgba(0,180,255,0.05)] text-[rgba(160,210,255,0.4)] hover:text-[rgba(160,210,255,0.7)] border border-[rgba(0,180,255,0.1)] hover:border-[rgba(0,180,255,0.2)] font-orbitron text-[9px] uppercase tracking-wider rounded-sm"
        >
          View <ChevronRight className="w-3 h-3" />
        </Button>
      }
    >
      {!stats ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[rgba(160,210,255,0.25)] text-sm font-rajdhani">Loading...</div>
        </div>
      ) : stats.unlocked === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <Trophy className="w-8 h-8 text-[rgba(160,210,255,0.15)] mb-2" />
          <p className="text-xs text-[rgba(160,210,255,0.35)] font-rajdhani">Complete actions to unlock achievements</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="mb-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[rgba(160,210,255,0.3)] font-rajdhani uppercase">Progress</span>
              <span className="font-mono text-primary tabular-nums">{stats.percentage}%</span>
            </div>
            <div className="relative h-1.5 w-full bg-[rgba(0,180,255,0.06)] rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/50 transition-all duration-1000 rounded-full"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
          {stats.recent?.length > 0 && (
            <div className="flex-1">
              <h3 className="text-[10px] font-rajdhani text-[rgba(160,210,255,0.3)] uppercase tracking-wider mb-2">Latest</h3>
              <AchievementCard achievement={stats.recent[0]} compact />
            </div>
          )}
        </div>
      )}
    </NeuralPanel>
  );
}
