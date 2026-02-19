import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Film, Sparkles, Trophy } from "lucide-react";
import { CyberBackground } from "@/components/CyberBackground";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { VictoryReelsFeed } from "@/components/community/VictoryReelsFeed";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useCommunityStats } from "@/hooks/useCommunity";

type CommunityTab = 'feed' | 'reels';

function LiveTicker() {
  const { data: stats } = useCommunityStats();
  const items = [
    { emoji: "👥", label: "Active members", value: stats?.activeMembers ?? 0 },
    { emoji: "📝", label: "Posts this week", value: stats?.postsThisWeek ?? 0 },
    { emoji: "🏆", label: "Goals completed", value: "—" },
    { emoji: "⚡", label: "Reactions given", value: "—" },
    { emoji: "🎬", label: "Victory Reels", value: "—" },
  ];

  const tickerContent = [...items, ...items]; // duplicate for seamless loop

  return (
    <div className="sticky top-0 z-50 bg-muted/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center gap-2 px-4 py-2 overflow-hidden">
        <div className="flex items-center gap-1.5 text-primary shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
          </span>
          <span className="font-mono text-[11px] font-medium tracking-wider uppercase">NETWORK</span>
        </div>
        <div className="overflow-hidden flex-1">
          <motion.div
            className="flex gap-8 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {tickerContent.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                {item.emoji} {item.label}{" "}
                <b className="text-foreground font-medium">{item.value}</b>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const { data: stats } = useCommunityStats();

  const tabs: { id: CommunityTab; emoji: string; title: string; desc: string; count: number | string }[] = [
    { id: 'feed', emoji: '👥', title: t("community.tabs.feed"), desc: "reflections · progress · help", count: stats?.postsThisWeek ?? "—" },
    { id: 'reels', emoji: '🎬', title: t("community.tabs.reels"), desc: "celebrate completions", count: "—" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />

      {/* Live Ticker */}
      <LiveTicker />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-7"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-5"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="font-mono text-[11px] font-medium tracking-widest uppercase text-primary">
              NEURAL NETWORK · LIVE
            </span>
          </motion.div>

          <h1 className="font-orbitron text-3xl md:text-4xl font-black tracking-wider mb-3">
            <span className="bg-gradient-to-r from-foreground via-primary/90 to-primary bg-clip-text text-transparent">
              {t("community.title")}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("community.subtitle")}
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-3 mb-7"
        >
          {[
            { value: stats?.activeMembers ?? 0, label: "Online now", accent: true },
            { value: stats?.postsThisWeek ?? 0, label: "Posts / week", accent: false },
            { value: "—", label: "Goals completed", accent: true },
          ].map((stat, i) => (
            <div
              key={i}
              className="relative bg-card border border-border/50 rounded-2xl p-4 text-center overflow-hidden group hover:border-primary/30 transition-all hover:-translate-y-0.5"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              <span className={cn(
                "font-orbitron text-xl md:text-2xl font-bold block",
                stat.accent ? "text-primary" : "text-foreground"
              )}>
                {stat.value}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mt-1 block">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Mode Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3 mb-7"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative text-left p-4 md:p-5 rounded-2xl border transition-all overflow-hidden group",
                  isActive
                    ? "border-primary bg-gradient-to-br from-primary/12 to-card shadow-lg shadow-primary/10"
                    : "border-border/50 bg-card hover:border-primary/30 hover:-translate-y-0.5"
                )}
              >
                {/* Glow overlay */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent pointer-events-none" />
                )}

                {/* Count badge */}
                <span className={cn(
                  "absolute top-3 right-3 font-mono text-[10px] px-2 py-0.5 rounded-full border",
                  isActive
                    ? "bg-primary/25 border-primary/40 text-primary"
                    : "bg-primary/8 border-primary/20 text-primary/70"
                )}>
                  {tab.count}
                </span>

                <div className="relative z-10 flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-lg shrink-0",
                    isActive
                      ? "bg-primary shadow-md shadow-primary/30"
                      : "bg-muted"
                  )}>
                    {tab.emoji}
                  </div>
                  <div>
                    <div className={cn(
                      "font-orbitron text-xs md:text-sm font-semibold tracking-wide",
                      isActive ? "text-foreground" : "text-foreground"
                    )}>
                      {tab.title}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                      {tab.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'feed' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'feed' ? (
            <CommunityFeed />
          ) : (
            <VictoryReelsFeed />
          )}
        </motion.div>
      </div>
    </div>
  );
}
