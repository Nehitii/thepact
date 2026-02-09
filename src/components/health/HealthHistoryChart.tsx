/**
 * Extended health history chart with 30/90-day views.
 * Provides trend visualization with line charts.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthHistory } from "@/hooks/useHealth";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type TimeRange = 7 | 30 | 90;
type MetricType = "sleep" | "activity" | "stress" | "hydration" | "mood";

interface HealthHistoryChartProps {
  className?: string;
}

const METRICS: { key: MetricType; label: string; color: string; dataKey: string }[] = [
  { key: "sleep", label: "health.metrics.sleep", color: "#3b82f6", dataKey: "sleep_quality" },
  { key: "activity", label: "health.metrics.activity", color: "#10b981", dataKey: "activity_level" },
  { key: "stress", label: "health.metrics.stress", color: "#a855f7", dataKey: "stress_level" },
  { key: "hydration", label: "health.metrics.hydration", color: "#06b6d4", dataKey: "hydration_glasses" },
  { key: "mood", label: "health.mood.title", color: "#f59e0b", dataKey: "mood_level" },
];

export function HealthHistoryChart({ className }: HealthHistoryChartProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [activeMetrics, setActiveMetrics] = useState<MetricType[]>(["sleep", "activity", "stress"]);
  
  const { data: historyData, isLoading } = useHealthHistory(user?.id, timeRange);
  
  // Transform data for chart
  const chartData = (historyData || [])
    .slice()
    .reverse()
    .map((entry) => ({
      date: format(parseISO(entry.entry_date), "MMM d"),
      fullDate: entry.entry_date,
      sleep_quality: entry.sleep_quality,
      activity_level: entry.activity_level,
      stress_level: entry.stress_level,
      hydration_glasses: entry.hydration_glasses ? Math.min(entry.hydration_glasses / 2, 5) : null, // Normalize to 0-5 scale
      mood_level: (entry as unknown as { mood_level?: number }).mood_level,
    }));
  
  const toggleMetric = (metric: MetricType) => {
    setActiveMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };
  
  // Calculate averages for the period
  const calculateAverage = (dataKey: string) => {
    const values = chartData
      .map((d) => d[dataKey as keyof typeof d])
      .filter((v): v is number => v !== null && v !== undefined);
    
    if (values.length === 0) return null;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  return (
    <Card className={cn("bg-card/30 backdrop-blur-sm border-primary/10", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            {t("health.history.title")}
          </CardTitle>
          
          {/* Time range selector */}
          <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
            {([7, 30, 90] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant="ghost"
                size="sm"
                onClick={() => setTimeRange(range)}
                className={cn(
                  "h-7 px-3 text-xs",
                  timeRange === range
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range}d
              </Button>
            ))}
          </div>
        </div>
        
        {/* Metric toggles */}
        <div className="flex flex-wrap gap-2 mt-3">
          {METRICS.map((metric) => (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                activeMetrics.includes(metric.key)
                  ? "border-current"
                  : "border-muted opacity-50 hover:opacity-80"
              )}
              style={{
                color: activeMetrics.includes(metric.key) ? metric.color : undefined,
                backgroundColor: activeMetrics.includes(metric.key) 
                  ? `${metric.color}20` 
                  : undefined,
              }}
            >
              {t(metric.label)}
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="w-12 h-12 mb-3 opacity-30" />
            <p>{t("health.history.noData")}</p>
            <p className="text-sm opacity-60">{t("health.history.startCheckin")}</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--muted-foreground) / 0.1)" 
                />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval={timeRange === 7 ? 0 : timeRange === 30 ? 4 : 13}
                />
                <YAxis 
                  domain={[0, 5]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  ticks={[1, 2, 3, 4, 5]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                
                {METRICS.filter((m) => activeMetrics.includes(m.key)).map((metric) => (
                  <Line
                    key={metric.key}
                    type="monotone"
                    dataKey={metric.dataKey}
                    stroke={metric.color}
                    strokeWidth={2}
                    dot={timeRange <= 30}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            
            {/* Average stats */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-border/50 justify-center flex-wrap">
              {METRICS.filter((m) => activeMetrics.includes(m.key)).map((metric) => {
                const avg = calculateAverage(metric.dataKey);
                if (!avg) return null;
                
                return (
                  <div key={metric.key} className="text-center">
                    <p 
                      className="text-lg font-bold"
                      style={{ color: metric.color }}
                    >
                      {avg}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("health.history.avgPrefix")} {t(metric.label)}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
