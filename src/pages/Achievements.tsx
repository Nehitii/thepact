import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserAchievements, Achievement, AchievementCategory } from "@/lib/achievements";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Filter, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const categories: (AchievementCategory | "All")[] = [
  "All",
  "Connection",
  "GoalsCreation",
  "Difficulty",
  "Time",
  "Pact",
  "Finance",
  "Series",
  "Hidden",
];

const categoryLabels: Record<AchievementCategory | "All", string> = {
  All: "All",
  Connection: "Connection Rituals",
  GoalsCreation: "Goal Creation",
  Difficulty: "Difficulty Mastery",
  Time: "Temporal Mastery",
  Pact: "Pact Milestones",
  Finance: "Financial Wisdom",
  Series: "Progression",
  Hidden: "Mystic Secrets",
};

export default function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [category, setCategory] = useState<AchievementCategory | "All">("All");

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

  const filteredAchievements = achievements.filter(a => {
    if (filter === "unlocked" && !a.unlocked) return false;
    if (filter === "locked" && a.unlocked) return false;
    if (category !== "All" && a.category !== category) return false;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const percentage = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <div className="min-h-screen pb-20 bg-[#00050B] relative overflow-hidden">
      {/* Deep space background with radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px]" />
      </div>
      
      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8"
        >
          {/* Title Section */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative p-4 rounded-full bg-card/30 backdrop-blur-xl border-2 border-primary/50 shadow-[0_0_30px_rgba(91,180,255,0.3)]">
                <Trophy className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(91,180,255,0.8)]" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-shimmer uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron" style={{ backgroundSize: '200% auto' }}>
                The Pact Achievements
              </h1>
              <p className="text-primary/70 font-rajdhani tracking-wide text-lg mt-2">
                Traces of your inner progress and commitment
              </p>
            </div>
          </div>

          {/* Stats HUD Panels */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl">
            {/* Unlocked Panel */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all overflow-hidden scan-line">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className="text-xs text-primary/70 uppercase tracking-widest font-orbitron mb-2">Unlocked</div>
                  <div className="text-3xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                    {unlockedCount}
                  </div>
                  <div className="text-xs text-primary/50 uppercase tracking-wider font-rajdhani mt-1">Achievements</div>
                </div>
              </div>
            </div>

            {/* Total Panel */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all overflow-hidden scan-line">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className="text-xs text-primary/70 uppercase tracking-widest font-orbitron mb-2">Total</div>
                  <div className="text-3xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                    {achievements.length}
                  </div>
                  <div className="text-xs text-primary/50 uppercase tracking-wider font-rajdhani mt-1">Available</div>
                </div>
              </div>
            </div>

            {/* Completion Panel */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-all overflow-hidden scan-line">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
                </div>
                <div className="relative z-10">
                  <div className="text-xs text-primary/70 uppercase tracking-widest font-orbitron mb-2">Completion</div>
                  <div className="text-3xl font-bold text-primary font-orbitron drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                    {percentage}%
                  </div>
                  <div className="text-xs text-primary/50 uppercase tracking-wider font-rajdhani mt-1">Progress</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 max-w-2xl">
            <div className="relative h-3 w-full bg-card/20 backdrop-blur rounded-full overflow-hidden border border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% auto' }} />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary via-accent to-primary relative shadow-[0_0_20px_rgba(91,180,255,0.6)]"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Status Filter */}
          <div className="relative group inline-block">
            <div className="absolute inset-0 bg-primary/5 rounded-lg blur-lg" />
            <div className="relative flex items-center gap-3 bg-card/20 backdrop-blur-xl border border-primary/30 rounded-lg p-2">
              <Filter className="w-4 h-4 text-primary/70 ml-2" />
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList className="bg-transparent border-0 p-0 gap-1">
                  <TabsTrigger 
                    value="all"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_rgba(91,180,255,0.3)] text-primary/60 font-orbitron text-xs uppercase tracking-wider px-4 py-2 rounded-md transition-all"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger 
                    value="unlocked"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_rgba(91,180,255,0.3)] text-primary/60 font-orbitron text-xs uppercase tracking-wider px-4 py-2 rounded-md transition-all"
                  >
                    Unlocked
                  </TabsTrigger>
                  <TabsTrigger 
                    value="locked"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_rgba(91,180,255,0.3)] text-primary/60 font-orbitron text-xs uppercase tracking-wider px-4 py-2 rounded-md transition-all"
                  >
                    Locked
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`relative px-4 py-2 rounded-lg text-sm font-orbitron uppercase tracking-wider transition-all overflow-hidden ${
                  category === cat
                    ? "bg-primary/20 text-primary border-2 border-primary/50 shadow-[0_0_20px_rgba(91,180,255,0.3)]"
                    : "bg-card/20 text-primary/60 border border-primary/20 hover:bg-card/30 hover:border-primary/40"
                }`}
              >
                {category === cat && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% auto' }} />
                )}
                <span className="relative z-10">{categoryLabels[cat]}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-card/20 backdrop-blur-sm rounded-lg border border-primary/20 animate-pulse"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% auto' }} />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <AchievementCard achievement={achievement} size="medium" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {filteredAchievements.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
              <div className="relative p-6 rounded-full bg-card/30 backdrop-blur-xl border-2 border-primary/30 mb-6">
                <Sparkles className="w-16 h-16 text-primary/50" />
              </div>
            </div>
            <p className="text-lg text-primary/60 font-rajdhani tracking-wide">
              No achievements found with current filters
            </p>
          </motion.div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
