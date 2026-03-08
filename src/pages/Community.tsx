import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CyberBackground } from "@/components/CyberBackground";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { VictoryReelsFeed } from "@/components/community/VictoryReelsFeed";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useCommunityStats } from "@/hooks/useCommunity";
import { Trophy, TrendingUp, Star } from "lucide-react";
import { useLeaderboard, LeaderboardEntry } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Medal } from "lucide-react";

type CommunityTab = "feed" | "reels" | "leaderboard";

/* ── LIVE TICKER ──────────────────────────────────────────── */
function LiveTicker() {
  const { data: stats } = useCommunityStats();
  const items = [
    { emoji: "👥", label: "Active members", value: stats?.activeMembers ?? "—" },
    { emoji: "📝", label: "Posts this week", value: stats?.postsThisWeek ?? "—" },
    { emoji: "🏆", label: "Goals completed today", value: "—" },
    { emoji: "⚡", label: "Reactions given", value: "—" },
    { emoji: "🎬", label: "Victory Reels", value: "—" },
  ];
  const doubled = [...items, ...items];

  return (
    <div
      className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl overflow-hidden"
      style={{ background: "linear-gradient(90deg, hsl(var(--card)) 0%, hsl(var(--muted)/0.6) 100%)" }}
    >
      <div className="flex items-center gap-3 px-6 py-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
          </span>
          <span className="font-mono text-[11px] font-medium tracking-widest uppercase text-primary">NETWORK</span>
        </div>
        <div className="overflow-hidden flex-1">
          <motion.div
            className="flex gap-8 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          >
            {doubled.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                {item.emoji} {item.label} <b className="text-foreground font-medium">{item.value}</b>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ── STAT CARD ────────────────────────────────────────────── */
function StatCard({ value, label, color }: { value: string | number; label: string; color?: "accent" | "violet" }) {
  return (
    <div className="relative bg-card border border-border/50 rounded-2xl p-4 text-center overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 group cursor-default">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
        }}
      />
      <span
        className={cn(
          "block font-orbitron text-[22px] font-bold",
          color === "accent" && "text-primary",
          color === "violet" && "text-violet-400",
          !color && "text-foreground",
        )}
      >
        {value}
      </span>
      <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-[0.08em] mt-1">
        {label}
      </span>
    </div>
  );
}

/* ── MODE BUTTON ──────────────────────────────────────────── */
function ModeButton({
  active,
  emoji,
  title,
  desc,
  count,
  onClick,
}: {
  active: boolean;
  emoji: string;
  title: string;
  desc: string;
  count: string | number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3.5 p-[18px] rounded-[18px] border text-left overflow-hidden transition-all duration-250 w-full",
        active
          ? "border-primary bg-gradient-to-br from-primary/12 to-card shadow-[0_0_0_1px_rgba(123,92,250,0.3),0_8px_32px_rgba(123,92,250,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "border-border/50 bg-card hover:border-primary/25 hover:-translate-y-px",
      )}
    >
      {active && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(123,92,250,0.12) 0%, transparent 60%)",
          }}
        />
      )}
      <div
        className={cn(
          "relative z-10 w-[42px] h-[42px] rounded-xl flex items-center justify-center text-xl shrink-0 transition-all",
          active ? "bg-primary shadow-[0_4px_16px_rgba(123,92,250,0.35)]" : "bg-muted",
        )}
      >
        {emoji}
      </div>
      <div className="relative z-10 min-w-0">
        <div
          className={cn(
            "font-orbitron text-[13px] font-semibold tracking-[0.03em]",
            active ? "text-white" : "text-foreground",
          )}
        >
          {title}
        </div>
        <div className="font-mono text-[11px] text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div
        className={cn(
          "absolute top-3 right-3.5 font-mono text-[10px] text-primary border border-primary/30 px-2 py-0.5 rounded-full",
          active ? "bg-primary/25" : "bg-primary/8",
        )}
      >
        {count}
      </div>
    </button>
  );
}

/* ── LEADERBOARD (INLINE) ─────────────────────────────────── */
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

function LeaderboardPanel() {
  const { user } = useAuth();
  const { data: entries = [], isLoading } = useLeaderboard();
  const currentUserPosition = entries.findIndex((e) => e.user_id === user?.id) + 1;

  return (
    <div>
      {currentUserPosition > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground font-rajdhani">
            Your position: <span className="font-orbitron font-bold text-primary">#{currentUserPosition}</span> of {entries.length}
          </span>
        </div>
      )}
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

/* ── MAIN PAGE ────────────────────────────────────────────── */
export default function Community() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");
  const { data: stats } = useCommunityStats();

  return (
    <div className="min-h-screen">
      <CyberBackground />
      <LiveTicker />

      <div className="relative z-10 max-w-[760px] mx-auto px-4 pb-20">
        {/* ── HERO ── */}
        <div className="pt-12 pb-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/35 mb-5"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="font-mono text-[11px] font-medium text-primary tracking-[0.1em] uppercase">
              Neural Network · Live
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-orbitron font-black text-[clamp(28px,6vw,48px)] leading-[1.1] tracking-[0.04em] mb-3"
            style={{
              background: "linear-gradient(135deg, #fff 0%, rgba(123,92,250,0.9) 40%, hsl(var(--primary)) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            COMMUNITY HUB
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-sm text-muted-foreground leading-relaxed"
          >
            Share your journey. Fuel others. Grow together.
          </motion.p>
        </div>

        {/* ── STATS ROW ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-7"
        >
          <StatCard value={stats?.activeMembers ?? "—"} label="Online now" color="accent" />
          <StatCard value={stats?.postsThisWeek ?? "—"} label="Posts / week" />
          <StatCard value="38" label="Goals completed" color="violet" />
        </motion.div>

        {/* ── MODE SWITCHER (3 tabs) ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-3 gap-3 mb-7"
        >
          <ModeButton
            active={activeTab === "feed"}
            emoji="👥"
            title={t("community.tabs.feed")}
            desc="reflections · progress"
            count={stats?.postsThisWeek ? `${Math.round(((stats.postsThisWeek as number) / 1000) * 10) / 10}K` : "—"}
            onClick={() => setActiveTab("feed")}
          />
          <ModeButton
            active={activeTab === "reels"}
            emoji="🎬"
            title={t("community.tabs.reels")}
            desc="celebrate wins"
            count="184"
            onClick={() => setActiveTab("reels")}
          />
          <ModeButton
            active={activeTab === "leaderboard"}
            emoji="🏆"
            title="Leaderboard"
            desc="global rankings"
            count="TOP"
            onClick={() => setActiveTab("leaderboard")}
          />
        </motion.div>

        {/* ── PANELS ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "feed" && <CommunityFeed />}
            {activeTab === "reels" && <VictoryReelsFeed />}
            {activeTab === "leaderboard" && <LeaderboardPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
