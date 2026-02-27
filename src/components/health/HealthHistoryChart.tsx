import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthHistory } from "@/hooks/useHealth";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Calendar, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { HUDFrame } from "./HUDFrame";

type TimeRange = 7 | 30 | 90;
type MetricType = "sleep" | "activity" | "stress" | "hydration" | "mood";

const METRICS: { key: MetricType; label: string; color: string; dataKey: string }[] = [
  { key: "sleep", label: "health.metrics.sleep", color: "#3b82f6", dataKey: "sleep_quality" },
  { key: "activity", label: "health.metrics.activity", color: "#00F2FF", dataKey: "activity_level" },
  { key: "stress", label: "health.metrics.stress", color: "#FFB800", dataKey: "stress_level" },
  { key: "hydration", label: "health.metrics.hydration", color: "#06b6d4", dataKey: "hydration_glasses" },
  { key: "mood", label: "health.mood.title", color: "#f59e0b", dataKey: "mood_level" },
];

export function HealthHistoryChart({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [activeMetrics, setActiveMetrics] = useState<MetricType[]>(["sleep", "activity", "stress"]);
  
  const { data: historyData, isLoading } = useHealthHistory(user?.id, timeRange);
  
  const chartData = (historyData || []).slice().reverse().map((entry) => ({
    date: format(parseISO(entry.entry_date), "MMM d"),
    fullDate: entry.entry_date,
    sleep_quality: entry.sleep_quality,
    activity_level: entry.activity_level,
    stress_level: entry.stress_level,
    hydration_glasses: entry.hydration_glasses ? Math.min(entry.hydration_glasses / 2, 5) : null,
    mood_level: (entry as unknown as { mood_level?: number }).mood_level,
  }));
  
  const toggleMetric = (metric: MetricType) => {
    setActiveMetrics((prev) => prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]);
  };
  
  const calculateAverage = (dataKey: string) => {
    const values = chartData.map((d) => d[dataKey as keyof typeof d]).filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const calculateTrend = (dataKey: string): "up" | "down" | "stable" => {
    const values = chartData.map((d) => d[dataKey as keyof typeof d]).filter((v): v is number => v !== null && v !== undefined);
    if (values.length < 3) return "stable";
    const half = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const secondHalf = values.slice(half).reduce((a, b) => a + b, 0) / (values.length - half);
    const diff = secondHalf - firstHalf;
    if (diff > 0.3) return "up";
    if (diff < -0.3) return "down";
    return "stable";
  };

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    if (trend === "up") return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    if (trend === "down") return <TrendingDown className="w-3 h-3 text-destructive" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <div className={className}>
      <HUDFrame className="p-0" variant="chart" scanLine>
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="w-5 h-5 text-hud-phosphor" />
              {t("health.history.title")}
            </h3>
            <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
              {([7, 30, 90] as TimeRange[]).map((range) => (
                <Button key={range} variant="ghost" size="sm" onClick={() => setTimeRange(range)}
                  className={cn("h-7 px-3 text-xs font-mono rounded-md", timeRange === range ? "bg-hud-phosphor/20 text-hud-phosphor" : "text-muted-foreground hover:text-foreground")}>
                  {range}d
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {METRICS.map((metric) => (
              <button key={metric.key} onClick={() => toggleMetric(metric.key)}
                className={cn("px-3 py-1 text-xs font-mono uppercase tracking-wider transition-all border rounded-lg",
                  activeMetrics.includes(metric.key) ? "border-current" : "border-muted opacity-50 hover:opacity-80"
                )}
                style={{
                  color: activeMetrics.includes(metric.key) ? metric.color : undefined,
                  backgroundColor: activeMetrics.includes(metric.key) ? `${metric.color}20` : undefined,
                }}>
                {t(metric.label)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <span className="font-mono text-hud-phosphor animate-pulse text-lg">_</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <Calendar className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-mono">{t("health.history.noData")}</p>
              <p className="text-sm opacity-60 font-mono">{t("health.history.startCheckin")}</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--hud-phosphor) / 0.08)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
                    interval={timeRange === 7 ? 0 : timeRange === 30 ? 4 : 13} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }} ticks={[1, 2, 3, 4, 5]} />
                  <Tooltip contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--hud-phosphor) / 0.3)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                  {METRICS.filter((m) => activeMetrics.includes(m.key)).map((metric) => (
                    <Line key={metric.key} type="monotone" dataKey={metric.dataKey} stroke={metric.color} strokeWidth={2}
                      dot={timeRange <= 30} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-4 pt-4 border-t border-border/50 justify-center flex-wrap">
                {METRICS.filter((m) => activeMetrics.includes(m.key)).map((metric) => {
                  const avg = calculateAverage(metric.dataKey);
                  if (!avg) return null;
                  const trend = calculateTrend(metric.dataKey);
                  return (
                    <div key={metric.key} className="text-center flex items-center gap-1.5">
                      <div>
                        <p className="text-lg font-bold font-orbitron" style={{ color: metric.color }}>{avg}</p>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                          {t("health.history.avgPrefix")} {t(metric.label)}
                        </p>
                      </div>
                      <TrendIcon trend={trend} />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </HUDFrame>
    </div>
  );
}
