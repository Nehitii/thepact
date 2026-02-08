import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserAchievements, Achievement, AchievementRarity, rarityColors } from "@/lib/achievements";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ChevronDown, Check, Sparkles, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
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
      setAchievements(data || []);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const rarityCounts = useMemo(() => {
    const counts: any = {};
    rarityOrder.forEach((r) => (counts[r] = { unlocked: 0, total: 0 }));
    achievements.forEach((a) => {
      if (counts[a.rarity]) {
        counts[a.rarity].total++;
        if (a.unlocked) counts[a.rarity].unlocked++;
      }
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
    <div className="pantheon-wrapper min-h-screen text-slate-200 relative overflow-x-hidden">
      {/* --- INJECTION CSS POUR PERSPECTIVE ET SUPPRESSION SCROLLBAR --- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Cache la scrollbar sur toute la page mais garde le défilement */
        html, body {
          scrollbar-width: none !important; /* Firefox */
          -ms-overflow-style: none !important;  /* IE/Edge */
          background-color: #050505 !important;
        }

        body::-webkit-scrollbar {
          display: none !important; /* Chrome/Safari */
        }

        .pantheon-wrapper {
          background-color: #050505 !important;
          perspective: 1200px;
        }

        .celestial-light {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 150%;
          height: 80%;
          background: radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.18) 0%, transparent 75%);
          pointer-events: none;
          z-index: 1;
        }

        .ground-grid {
          position: fixed;
          bottom: -150px;
          left: 0;
          width: 100%;
          height: 60vh;
          transform: rotateX(65deg);
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: linear-gradient(to top, black 20%, transparent 100%);
          -webkit-mask-image: linear-gradient(to top, black 20%, transparent 100%);
          pointer-events: none;
          z-index: 1;
        }

        .stat-monument {
          background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent);
          border-top: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 15px 30px -15px rgba(0,0,0,0.8);
          backdrop-blur: 5px;
        }
      `,
        }}
      />

      {/* Éléments de décor */}
      <div className="celestial-light" />
      <div className="ground-grid" />

      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10 font-rajdhani">
        {/* --- HEADER --- */}
        <header className="relative mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block relative mb-8"
          >
            <div className="absolute inset-0 bg-primary/30 blur-[80px] rounded-full" />
            <Trophy className="w-20 h-20 text-primary relative z-10 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
          </motion.div>

          <motion.h1
            initial={{ letterSpacing: "0.1em", opacity: 0 }}
            animate={{ letterSpacing: "0.5em", opacity: 1 }}
            className="text-4xl md:text-7xl font-black uppercase font-orbitron mb-4 text-white"
          >
            Hall of <span className="text-primary">Eternity</span>
          </motion.h1>
          <p className="text-primary/60 tracking-[0.4em] uppercase text-[10px] font-bold mb-14 italic">
            "Your legacy is etched in the stars"
          </p>

          {/* STATS MONUMENTALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {[
              { label: "Completion", val: `${percentage}%`, sub: `${unlockedCount} / ${achievements.length}` },
              { label: "Legacy Rank", val: "Elite", sub: "Global Status" },
              { label: "Expedition", val: unlockedCount * 125, sub: "Total Score" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="stat-monument p-8 rounded-t-2xl transition-transform hover:-translate-y-1 duration-500"
              >
                <div className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mb-3">{s.label}</div>
                <div className="text-5xl font-black font-orbitron text-white mb-2">{s.val}</div>
                <div className="text-[11px] text-muted-foreground font-mono border-l-2 border-primary/40 pl-3 text-left opacity-70">
                  {s.sub}
                </div>
              </motion.div>
            ))}
          </div>
        </header>

        {/* --- BARRE DE FILTRES --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 border-y border-white/10 py-8 bg-black/20 backdrop-blur-xl px-8 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-6">
            <Crown className="w-6 h-6 text-primary animate-pulse" />
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
                {["all", "unlocked", "locked"].map((v) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className="font-orbitron text-[10px] uppercase px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-lg"
                  >
                    {v}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-4 bg-white/5 border border-white/10 px-8 py-3 rounded-full hover:bg-white/10 transition-all outline-none">
              <div
                className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]"
                style={{
                  backgroundColor: selectedRarity === "all" ? "#fff" : rarityColors[selectedRarity],
                  color: selectedRarity === "all" ? "#fff" : rarityColors[selectedRarity],
                }}
              />
              <span className="font-orbitron text-xs uppercase tracking-[0.2em] text-white font-bold">
                {selectedRarity === "all" ? "All Rarities" : rarityLabels[selectedRarity]}
              </span>
              <ChevronDown size={16} className="text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0f0f0f] border border-white/10 text-white min-w-[240px] p-2 rounded-2xl shadow-3xl">
              <DropdownMenuItem
                onClick={() => setSelectedRarity("all")}
                className="font-orbitron text-[10px] uppercase tracking-widest p-4 cursor-pointer focus:bg-white/10 rounded-xl mb-1"
              >
                <Check
                  className={cn("mr-3 h-4 w-4 text-primary", selectedRarity === "all" ? "opacity-100" : "opacity-0")}
                />
                Show All
              </DropdownMenuItem>
              {rarityOrder.map((r) => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => setSelectedRarity(r)}
                  className="flex justify-between font-orbitron text-[10px] uppercase tracking-widest p-4 cursor-pointer focus:bg-white/10 rounded-xl mb-1"
                >
                  <div className="flex items-center">
                    <Check
                      className={cn("mr-3 h-4 w-4 text-primary", selectedRarity === r ? "opacity-100" : "opacity-0")}
                    />
                    <span style={{ color: rarityColors[r] }}>{r}</span>
                  </div>
                  <span className="opacity-30 text-[9px]">
                    {rarityCounts[r]?.unlocked || 0}/{rarityCounts[r]?.total || 0}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* --- GRID ACHIEVEMENTS --- */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-white/5 rounded-3xl" />
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {filteredAchievements.map((achievement, idx) => (
                <motion.div
                  key={achievement.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <AchievementCard achievement={achievement} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* --- EMPTY STATE --- */}
        {!loading && filteredAchievements.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 bg-white/[0.01] border border-dashed border-white/10 rounded-3xl mt-8"
          >
            <Sparkles className="w-12 h-12 text-white/5 mx-auto mb-4" />
            <h3 className="font-orbitron uppercase text-muted-foreground tracking-[0.4em]">Data Remnants Not Found</h3>
          </motion.div>
        )}
      </div>
    </div>
  );
}
