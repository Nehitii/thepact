import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthHistory } from "@/hooks/useHealth";
import { useHealthStreak } from "@/hooks/useHealthStreak";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Insight {
  emoji: string;
  text: string;
  category: string;
  sentiment: "positive" | "neutral" | "warning";
}

export function HealthInsightsPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: history } = useHealthHistory(user?.id, 30);
  const { data: streak } = useHealthStreak(user?.id);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchInsights = async () => {
    if (!history || history.length < 3) {
      toast.info(t("health.insights.needMoreData"));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("health-insights", {
        body: {
          healthData: history.slice(0, 14).map((d) => ({
            date: d.entry_date,
            sleep_hours: d.sleep_hours,
            sleep_quality: d.sleep_quality,
            activity_level: d.activity_level,
            stress_level: d.stress_level,
            hydration_glasses: d.hydration_glasses,
            mood_level: (d as Record<string, unknown>).mood_level ?? null,
          })),
          streakDays: streak?.current_streak ?? 0,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setInsights(data.insights || []);
      setHasLoaded(true);
    } catch (err) {
      console.error("Insights error:", err);
      toast.error(t("health.insights.error"));
    } finally {
      setLoading(false);
    }
  };

  const sentimentColor = (s: string) => {
    if (s === "positive") return "border-emerald-500/30 bg-emerald-500/5";
    if (s === "warning") return "border-amber-500/30 bg-amber-500/5";
    return "border-border bg-muted/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Lightbulb className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="font-semibold text-foreground">{t("health.insights.title")}</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInsights}
          disabled={loading}
          className="border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1" />
          )}
          {hasLoaded ? t("health.insights.refresh") : t("health.insights.generate")}
        </Button>
      </div>

      {!hasLoaded && !loading && (
        <p className="text-sm text-muted-foreground">{t("health.insights.description")}</p>
      )}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          </motion.div>
        )}

        {!loading && insights.length > 0 && (
          <motion.div
            key="insights"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn("rounded-xl border p-3 flex items-start gap-3", sentimentColor(insight.sentiment))}
              >
                <span className="text-xl">{insight.emoji}</span>
                <p className="text-sm text-foreground/90">{insight.text}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
