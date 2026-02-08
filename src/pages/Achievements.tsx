import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserAchievements, Achievement, AchievementRarity, rarityColors } from "@/lib/achievements";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ChevronDown, Check, Sparkles, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const rarityOrder: AchievementRarity[] = ["common", "uncommon", "rare", "epic", "mythic", "legendary"];
const rarityLabels: Record<AchievementRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  mythic: "Mythic",
  legendary: "Legendary",
};

export default function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | "all">("all");

  useEffect(() => {
    if (user) loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;
    try {
      const data = await getUserAchievements(user.id);
      setAchievements(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const rarityCounts = useMemo(() => {
    const counts: any = {};
    rarityOrder.forEach((r) => (counts[r] = { unlocked: 0, total: 0 }));
    achievements.forEach((a) => {
      counts[a.rarity].total++;
      if (a.unlocked) counts[a.rarity].unlocked++;
    });
    return counts;
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      if (filter === "unlocked" && !a.unlocked) return false;
      if (filter === "locked" && a.unlocked) return false;
      if (selectedRarity !== "all" && a.rarity !== selectedRarity) return false;
      return true;
    });
  }, [achievements, filter, selectedRarity]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const percentage = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 relative overflow-hidden font-rajdhani">
      {/* --- BACKGROUND PANTHEON EFFECT --- */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Rayons de lumière venant du haut */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,_rgba(120,119,198,0.15)_0%,_rgba(255,255,255,0)_50%)]" />
        {/* Grille de sol futuriste en perspective */}
        <div className="absolute bottom-0 w-full h-[500px] opacity-20 [perspective:1000px]">
          <div className="absolute inset-0 [transform:rotateX(60deg)] bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)]" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* --- HEADER PANTHÉON --- */}
        <header className="relative mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block relative mb-6"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <Trophy className="w-16 h-16 text-primary relative z-10 drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          </motion.div>

          <motion.h1
            initial={{ letterSpacing: "0.1em", opacity: 0 }}
            animate={{ letterSpacing: "0.4em", opacity: 1 }}
            className="text-4xl md:text-6xl font-black uppercase font-orbitron mb-4 text-white"
          >
            Hall of <span className="text-primary">Eternity</span>
          </motion.h1>
          <p className="text-muted-foreground tracking-[0.3em] uppercase text-sm mb-12">Legacy of your achievements</p>

          {/* STATS MONUMENTALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { label: "Completion", val: `${percentage}%`, sub: `${unlockedCount}/${achievements.length}` },
              { label: "Legacy Rank", val: "Elite", sub: "Top 5% Users" },
              { label: "Points", val: unlockedCount * 150, sub: "Total Score" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative group cursor-default"
              >
                <div className="absolute inset-x-0 -bottom-2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="py-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{s.label}</div>
                  <div className="text-4xl font-black font-orbitron text-white group-hover:scale-110 transition-transform duration-500">
                    {s.val}
                  </div>
                  <div className="text-[10px] text-primary/60 font-mono mt-1">{s.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </header>

        {/* --- FILTRES DE STRUCTURE --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-y border-white/5 py-6 bg-white/[0.02] backdrop-blur-md px-4 rounded-xl">
          <div className="flex items-center gap-4">
            <Crown className="w-5 h-5 text-primary opacity-50" />
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-auto">
              <TabsList className="bg-black/40 border border-white/10 p-1">
                {["all", "unlocked", "locked"].map((v) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className="font-orbitron text-[10px] uppercase px-6 data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
                  >
                    {v}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 bg-black/40 border border-white/10 px-6 py-2 rounded-full hover:bg-white/5 transition-all group">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: selectedRarity === "all" ? "#fff" : rarityColors[selectedRarity] }}
              />
              <span className="font-orbitron text-xs uppercase tracking-[0.2em]">
                {selectedRarity === "all" ? "Filter Rarity" : rarityLabels[selectedRarity]}
              </span>
              <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0a0a0a] border-white/10 text-white min-w-[200px]">
              <DropdownMenuItem
                onClick={() => setSelectedRarity("all")}
                className="font-orbitron text-[10px] uppercase tracking-widest"
              >
                Show All
              </DropdownMenuItem>
              {rarityOrder.map((r) => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => setSelectedRarity(r)}
                  className="flex justify-between font-orbitron text-[10px] uppercase tracking-widest hover:bg-white/5"
                >
                  <span style={{ color: rarityColors[r] }}>{r}</span>
                  <span className="opacity-40">
                    {rarityCounts[r].unlocked}/{rarityCounts[r].total}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* --- GRID ACHIEVEMENTS --- */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5" />
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredAchievements.map((achievement, idx) => (
                <motion.div
                  key={achievement.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: idx * 0.03 }}
                >
                  <AchievementCard achievement={achievement} compact={false} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* --- EMPTY STATE --- */}
        {!loading && filteredAchievements.length === 0 && (
          <div className="text-center py-24">
            <Sparkles className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h3 className="font-orbitron uppercase text-muted-foreground tracking-widest">No remnants found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
