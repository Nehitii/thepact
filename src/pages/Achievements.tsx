import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserAchievements, Achievement, AchievementCategory } from "@/lib/achievements";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Filter } from "lucide-react";
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
  const percentage = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pb-24 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">The Pact Achievements</h1>
              <p className="text-muted-foreground">
                Traces of your inner progress and commitment
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-card/30 backdrop-blur-sm rounded-lg p-4 border border-border/50">
              <div className="text-3xl font-bold text-primary">{unlockedCount}</div>
              <div className="text-sm text-muted-foreground">Unlocked</div>
            </div>
            <div className="bg-card/30 backdrop-blur-sm rounded-lg p-4 border border-border/50">
              <div className="text-3xl font-bold text-primary">{achievements.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="bg-card/30 backdrop-blur-sm rounded-lg p-4 border border-border/50">
              <div className="text-3xl font-bold text-primary">{percentage}%</div>
              <div className="text-sm text-muted-foreground">Completion</div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 space-y-4"
        >
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
                <TabsTrigger value="locked">Locked</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-card/30 text-muted-foreground hover:bg-card/50"
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Achievements grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-muted/20 rounded-lg animate-pulse"
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
            {filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AchievementCard achievement={achievement} size="medium" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {filteredAchievements.length === 0 && !loading && (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              No achievements found with current filters
            </p>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}