import { useState } from "react";
import { motion } from "framer-motion";
import { CyberBackground } from "@/components/CyberBackground";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { VictoryReelsFeed } from "@/components/community/VictoryReelsFeed";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useCommunityStats, useCommunityPosts } from "@/hooks/useCommunity";

type CommunityTab = 'feed' | 'reels';

function LiveTicker() {
  const { data: stats } = useCommunityStats();
  const { data: postsData } = useCommunityPosts('all', 'recent');
  const allPosts = postsData?.pages.flatMap((page) => page.posts) || [];

  // Build ticker items from real posts + stats
  const postSnippets = allPosts.slice(0, 12).map((post) => {
    const typeEmoji: Record<string, string> = {
      reflection: '💡', progress: '📈', obstacle: '⚠️',
      mindset: '🧠', help_request: '🆘', encouragement: '💚',
    };
    const snippet = post.content.length > 60 ? post.content.slice(0, 57) + '…' : post.content;
    const name = post.profile?.display_name || 'Agent';
    return { emoji: typeEmoji[post.post_type] || '📝', text: `${name}: "${snippet}"` };
  });

  const statsItems = [
    { emoji: "👥", text: `Active members: ${stats?.activeMembers ?? 0}` },
    { emoji: "📝", text: `Posts this week: ${stats?.postsThisWeek ?? 0}` },
  ];

  const items = postSnippets.length > 0 ? [...postSnippets, ...statsItems] : [
    ...statsItems,
    { emoji: "🏆", text: "Goals completed today: —" },
    { emoji: "⚡", text: "Reactions given: —" },
    { emoji: "🎬", text: "Victory Reels: —" },
  ];

  // Duplicate for seamless infinite loop
  const tickerContent = [...items, ...items];

  return (
    <div className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl overflow-hidden"
      style={{ background: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--card)) 100%)' }}
    >
      <div className="flex items-center gap-2 px-3 py-2 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
          </span>
          <span className="font-mono text-[10px] font-medium tracking-wider uppercase text-primary">LIVE</span>
        </div>
        <div className="overflow-hidden flex-1 min-w-0">
          <motion.div
            className="flex gap-8 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: Math.max(20, items.length * 4), repeat: Infinity, ease: "linear" }}
          >
            {tickerContent.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                {item.emoji} <span className="text-foreground/70">{item.text}</span>
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
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <CyberBackground />

      <LiveTicker />

      <div className="relative z-10 mx-auto px-3 sm:px-4 pb-20 max-w-2xl">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-12 pb-8"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/35 mb-5"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
            </span>
            <span className="font-mono text-[11px] font-medium tracking-[0.1em] uppercase text-primary">
              NEURAL NETWORK · LIVE
            </span>
          </motion.div>

          <h1 className="font-orbitron font-black tracking-wider mb-3"
            style={{ fontSize: 'clamp(24px, 5vw, 40px)', lineHeight: 1.1 }}
          >
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, rgba(123,92,250,0.9) 40%, hsl(var(--primary)) 100%)' }}
            >
              {t("community.title")}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
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
            { value: stats?.activeMembers ?? 0, label: "Online now", colorClass: "text-primary" },
            { value: stats?.postsThisWeek ?? 0, label: "Posts / week", colorClass: "text-foreground" },
            { value: "—", label: "Goals completed", colorClass: "text-violet-400" },
          ].map((stat, i) => (
            <div
              key={i}
              className="relative bg-card border border-border/50 rounded-2xl p-4 text-center overflow-hidden group hover:border-primary/30 transition-all hover:-translate-y-0.5 cursor-default"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              <span className={cn("font-orbitron text-[22px] font-bold block", stat.colorClass)}>
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
                  "relative text-left p-[18px] rounded-[18px] border transition-all overflow-hidden group",
                  isActive
                    ? "border-primary shadow-[0_0_0_1px_rgba(123,92,250,0.3),0_8px_32px_rgba(123,92,250,0.15)]"
                    : "border-border/50 bg-card hover:border-primary/30 hover:-translate-y-px"
                )}
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(123,92,250,0.12) 0%, hsl(var(--card)) 100%)',
                } : undefined}
              >
                {/* Glow overlay for active */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent pointer-events-none" />
                )}

                {/* Count badge */}
                <span className={cn(
                  "absolute top-3 right-3.5 font-mono text-[10px] px-2 py-0.5 rounded-full border",
                  isActive
                    ? "bg-primary/25 border-primary/40 text-primary"
                    : "bg-primary/8 border-primary/20 text-primary/70"
                )}>
                  {tab.count}
                </span>

                <div className="relative z-10 flex items-center gap-3.5">
                  <div className={cn(
                    "w-[42px] h-[42px] rounded-xl flex items-center justify-center text-xl shrink-0 transition-all",
                    isActive
                      ? "bg-primary shadow-[0_4px_16px_rgba(123,92,250,0.25)]"
                      : "bg-muted"
                  )}>
                    {tab.emoji}
                  </div>
                  <div>
                    <div className={cn(
                      "font-orbitron text-[13px] font-semibold tracking-wide",
                      isActive ? "text-white" : "text-foreground"
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
