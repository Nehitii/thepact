import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Star, TrendingUp } from "lucide-react";
import { useLeaderboard, LeaderboardEntry } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { CyberBackground } from "@/components/CyberBackground";

function RankBadge({ position }: { position: number }) {
  if (position === 1) return <Crown className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />;
  if (position === 2) return <Medal className="h-5 w-5 text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.5)]" />;
  if (position === 3) return <Medal className="h-5 w-5 text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.5)]" />;
  return <span className="text-sm font-mono text-muted-foreground w-6 text-center">#{position}</span>;
}

function LeaderboardRow({ entry, position, isCurrentUser }: { entry: LeaderboardEntry; position: number; isCurrentUser: boolean }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: position * 0.03 }}
      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
        isCurrentUser
          ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]"
          : position <= 3
          ? "bg-card/80 border-amber-500/20"
          : "bg-card/50 border-border/50 hover:bg-card/80"
      }`}
    >
      <div className="w-8 flex justify-center">
        <RankBadge position={position} />
      </div>

      <Avatar className="h-10 w-10 border border-border/50">
        <AvatarImage src={entry.avatar_url || undefined} />
        <AvatarFallback className="bg-muted text-foreground font-orbitron text-xs">
          {entry.display_name?.[0] || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate font-rajdhani">
          {entry.display_name || t("leaderboard.anonymousAgent")}
          {isCurrentUser && <span className="ml-2 text-[10px] text-primary font-mono">{t("leaderboard.you")}</span>}
        </p>
        {entry.rank_name && (
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{entry.rank_name}</p>
        )}
      </div>

      <div className="flex items-center gap-6 text-right">
        <div>
          <p className="text-lg font-orbitron font-bold text-primary">{entry.points.toLocaleString()}</p>
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{t("leaderboard.xp")}</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-mono text-foreground">{entry.goals_completed}</p>
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{t("leaderboard.goals")}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: entries = [], isLoading } = useLeaderboard();

  const currentUserPosition = entries.findIndex((e) => e.user_id === user?.id) + 1;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CyberBackground />
      <div className="max-w-3xl mx-auto px-4 md:px-6 relative z-10">
        <ModuleHeader
          systemLabel="RANK_ENGINE // SYS.GLOBAL"
          title="LEADER"
          titleAccent="BOARD"
          badges={currentUserPosition > 0 ? [
            { label: "YOUR RANK", value: `#${currentUserPosition}`, color: "#00ffe0" },
            { label: "AGENTS", value: entries.length, color: "#bf5af2" },
          ] : []}
        />

        <div className="space-y-2 pb-12">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-mono text-sm">{t("leaderboard.noAgents")}</p>
            </div>
          ) : (
            entries.map((entry, i) => (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                position={i + 1}
                isCurrentUser={entry.user_id === user?.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
