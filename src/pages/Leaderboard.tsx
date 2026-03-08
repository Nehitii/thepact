import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Star, Target, TrendingUp } from "lucide-react";
import { useLeaderboard, LeaderboardEntry } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

function RankBadge({ position }: { position: number }) {
  if (position === 1) return <Crown className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />;
  if (position === 2) return <Medal className="h-5 w-5 text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.5)]" />;
  if (position === 3) return <Medal className="h-5 w-5 text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.5)]" />;
  return <span className="text-sm font-mono text-muted-foreground w-6 text-center">#{position}</span>;
}

function LeaderboardRow({ entry, position, isCurrentUser }: { entry: LeaderboardEntry; position: number; isCurrentUser: boolean }) {
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
          {entry.display_name || "Anonymous Agent"}
          {isCurrentUser && <span className="ml-2 text-[10px] text-primary font-mono">(YOU)</span>}
        </p>
        {entry.rank_name && (
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{entry.rank_name}</p>
        )}
      </div>

      <div className="flex items-center gap-6 text-right">
        <div>
          <p className="text-lg font-orbitron font-bold text-primary">{entry.points.toLocaleString()}</p>
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">XP</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-mono text-foreground">{entry.goals_completed}</p>
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Goals</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const { data: entries = [], isLoading } = useLeaderboard();

  const currentUserPosition = entries.findIndex((e) => e.user_id === user?.id) + 1;

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-7 w-7 text-amber-400" />
          <h1 className="text-3xl font-black font-orbitron text-foreground tracking-wide">Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground font-mono">Global rankings • Top agents by XP</p>

        {currentUserPosition > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground font-rajdhani">
              Your position: <span className="font-orbitron font-bold text-primary">#{currentUserPosition}</span> of {entries.length}
            </span>
          </div>
        )}
      </motion.div>

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-mono text-sm">No agents on the leaderboard yet</p>
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
  );
}
