import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserAchievements, Achievement, AchievementRarity, rarityColors } from "@/lib/achievements";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, ChevronDown, Check } from "lucide-react";
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
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;
    try {
      const data = await getUserAchievements(user.id);
      setAchievements(data);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate rarity counters
  const rarityCounts = useMemo(() => {
    const counts: Record<AchievementRarity, { unlocked: number; total: number }> = {
      common: { unlocked: 0, total: 0 },
      uncommon: { unlocked: 0, total: 0 },
      rare: { unlocked: 0, total: 0 },
      epic: { unlocked: 0, total: 0 },
      mythic: { unlocked: 0, total: 0 },
      legendary: { unlocked: 0, total: 0 },
    };
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

  const selectedRarityLabel = selectedRarity === "all" ? "All Rarities" : rarityLabels[selectedRarity];

  return (
    <div className="min-h-screen pb-20 bg-background relative overflow-hidden">
      {/* Clean subtle background - no harsh lines */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-accent/3 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Title */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
              <div className="relative p-3.5 rounded-full bg-card/40 backdrop-blur-xl border border-primary/40">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-orbitron uppercase tracking-wider">
              Pact Achievements
            </h1>
          </div>

          {/* Stats Cards - Clean Design without scan lines */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto mb-8">
            {/* Unlocked */}
            <div className="relative bg-card/30 backdrop-blur-xl border border-primary/20 rounded-lg p-4 hover:border-primary/40 transition-all">
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-orbitron mb-1">Unlocked</div>
              <div className="text-2xl sm:text-3xl font-bold text-primary font-orbitron">
                {unlockedCount}
              </div>
            </div>

            {/* Total */}
            <div className="relative bg-card/30 backdrop-blur-xl border border-primary/20 rounded-lg p-4 hover:border-primary/40 transition-all">
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-orbitron mb-1">Total</div>
              <div className="text-2xl sm:text-3xl font-bold text-primary font-orbitron">
                {achievements.length}
              </div>
            </div>

            {/* Completion */}
            <div className="relative bg-card/30 backdrop-blur-xl border border-primary/20 rounded-lg p-4 hover:border-primary/40 transition-all">
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-orbitron mb-1">Complete</div>
              <div className="text-2xl sm:text-3xl font-bold text-primary font-orbitron">
                {percentage}%
              </div>
            </div>
          </div>

          {/* Premium Progress Bar */}
          <div className="max-w-lg mx-auto">
            <div className="relative h-4 w-full bg-card/40 backdrop-blur rounded-full overflow-hidden border border-primary/20">
              {/* Background shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-cyber-shimmer" style={{ backgroundSize: '200% auto' }} />
              
              {/* Progress fill */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full relative"
                style={{
                  background: `linear-gradient(90deg, 
                    hsl(var(--primary)) 0%, 
                    hsl(var(--accent)) 50%, 
                    hsl(var(--primary)) 100%)`,
                  boxShadow: `0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.3)`,
                }}
              >
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent" />
                
                {/* Edge glow */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-2 rounded-r-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent, hsl(var(--primary-glow)))',
                    boxShadow: '0 0 15px hsl(var(--primary))',
                  }}
                />
              </motion.div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground font-rajdhani">
              {unlockedCount} of {achievements.length} achievements unlocked
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-card/30 backdrop-blur-xl border border-primary/20 rounded-lg p-1.5">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="bg-transparent border-0 p-0 gap-1">
                {["all", "unlocked", "locked"].map((val) => (
                  <TabsTrigger
                    key={val}
                    value={val}
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_hsl(var(--primary)/0.3)] text-muted-foreground font-orbitron text-xs uppercase tracking-wider px-4 py-2 rounded-md transition-all"
                  >
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Rarity Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 bg-card/30 backdrop-blur-xl border border-primary/20 rounded-lg px-4 py-2.5 hover:border-primary/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: selectedRarity === "all" ? "hsl(var(--primary))" : rarityColors[selectedRarity],
                  }}
                />
                <span className="font-orbitron text-xs uppercase tracking-wider text-foreground">
                  {selectedRarityLabel}
                </span>
                {selectedRarity !== "all" && (
                  <span className="text-xs text-muted-foreground font-rajdhani">
                    ({rarityCounts[selectedRarity].unlocked}/{rarityCounts[selectedRarity].total})
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="w-56 bg-card/95 backdrop-blur-xl border border-primary/30 z-50"
            >
              <DropdownMenuItem
                onClick={() => setSelectedRarity("all")}
                className="flex items-center justify-between gap-2 cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: "hsl(var(--primary))" }}
                  />
                  <span className="font-orbitron text-xs uppercase tracking-wider">All Rarities</span>
                </div>
                {selectedRarity === "all" && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>

              {rarityOrder.map((rarity) => (
                <DropdownMenuItem
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  className="flex items-center justify-between gap-2 cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: rarityColors[rarity] }}
                    />
                    <span className="font-orbitron text-xs uppercase tracking-wider">
                      {rarityLabels[rarity]}
                    </span>
                    <span className="text-xs text-muted-foreground font-rajdhani">
                      ({rarityCounts[rarity].unlocked}/{rarityCounts[rarity].total})
                    </span>
                  </div>
                  {selectedRarity === rarity && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-36 bg-card/20 backdrop-blur-sm rounded-lg border border-primary/10 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                >
                  <AchievementCard achievement={achievement} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredAchievements.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative p-5 rounded-full bg-card/30 backdrop-blur-xl border border-primary/20">
                <Trophy className="w-12 h-12 text-muted-foreground/50" />
              </div>
            </div>
            <p className="text-lg text-muted-foreground font-rajdhani tracking-wide">
              No achievements found with current filters
            </p>
          </motion.div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
