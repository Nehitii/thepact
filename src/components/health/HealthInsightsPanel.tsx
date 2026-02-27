import { useState, useEffect } from "react";
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
import { HUDFrame } from "./HUDFrame";

interface Insight {
  emoji: string;
  text: string;
  category: string;
  sentiment: "positive" | "neutral" | "warning";
}

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, 12);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse text-hud-phosphor">▌</span>}
    </span>
  );
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
    if (!history || history.length < 3) { toast.info(t("health.insights.needMoreData")); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("health-insights", {
        body: {
          healthData: history.slice(0, 14).map((d) => ({
            date: d.entry_date, sleep_hours: d.sleep_hours, sleep_quality: d.sleep_quality,
            activity_level: d.activity_level, stress_level: d.stress_level,
            hydration_glasses: d.hydration_glasses,
            mood_level: (d as unknown as Record<string, unknown>).mood_level ?? null,
          })),
          streakDays: streak?.current_streak ?? 0,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setInsights(data.insights || []);
      setHasLoaded(true);
    } catch (err) {
      console.error("Insights error:", err);
      toast.error(t("health.insights.error"));
    } finally {
      setLoading(false);
    }
  };

  const sentimentBorder = (s: string) => {
    if (s === "positive") return "border-hud-phosphor/30 bg-hud-phosphor/5";
    if (s === "warning") return "border-hud-amber/30 bg-hud-amber/5";
    return "border-border bg-muted/10";
  };

  return (
    <HUDFrame className="p-6" variant="chart" scanLine>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-hud-phosphor/10 border border-hud-phosphor/20">
            <Lightbulb className="w-5 h-5 text-hud-phosphor" />
          </div>
          <h3 className="font-semibold text-foreground">{t("health.insights.title")}</h3>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInsights} disabled={loading}
          className="border-hud-phosphor/30 text-hud-phosphor hover:bg-hud-phosphor/10 font-mono rounded-lg">
          {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
          {hasLoaded ? t("health.insights.refresh") : t("health.insights.generate")}
        </Button>
      </div>

      {!hasLoaded && !loading && (
        <p className="text-sm text-muted-foreground font-mono">{t("health.insights.description")}</p>
      )}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-8">
            <span className="font-mono text-hud-phosphor animate-pulse text-lg">ANALYZING BIOMETRIC DATA_</span>
          </motion.div>
        )}
        {!loading && insights.length > 0 && (
          <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {insights.map((insight, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className={cn("border p-3 rounded-xl flex items-start gap-3 font-mono text-sm", sentimentBorder(insight.sentiment))}>
                <span className="text-hud-phosphor">&gt;</span>
                <span className="text-xl">{insight.emoji}</span>
                <p className="text-foreground/90"><TypewriterText text={insight.text} delay={i * 400} /></p>
              </motion.div>
            ))}
            <div className="font-mono text-hud-phosphor/60 text-sm pl-8"><span className="animate-pulse">▌</span></div>
          </motion.div>
        )}
      </AnimatePresence>
    </HUDFrame>
  );
}
