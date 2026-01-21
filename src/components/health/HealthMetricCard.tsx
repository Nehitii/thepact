import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayHealth, useWeeklyHealth } from "@/hooks/useHealth";

interface HealthMetricCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "blue" | "green" | "purple" | "cyan" | "orange";
  metricKey: "sleep" | "activity" | "stress" | "hydration" | "nutrition";
}

const colorVariants = {
  blue: {
    bg: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/30",
    icon: "text-blue-400",
    glow: "bg-blue-500/20",
    progress: "bg-blue-500",
  },
  green: {
    bg: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-500/30",
    icon: "text-emerald-400",
    glow: "bg-emerald-500/20",
    progress: "bg-emerald-500",
  },
  purple: {
    bg: "from-purple-500/20 to-purple-600/10",
    border: "border-purple-500/30",
    icon: "text-purple-400",
    glow: "bg-purple-500/20",
    progress: "bg-purple-500",
  },
  cyan: {
    bg: "from-cyan-500/20 to-cyan-600/10",
    border: "border-cyan-500/30",
    icon: "text-cyan-400",
    glow: "bg-cyan-500/20",
    progress: "bg-cyan-500",
  },
  orange: {
    bg: "from-orange-500/20 to-orange-600/10",
    border: "border-orange-500/30",
    icon: "text-orange-400",
    glow: "bg-orange-500/20",
    progress: "bg-orange-500",
  },
};

export function HealthMetricCard({ icon: Icon, title, description, color, metricKey }: HealthMetricCardProps) {
  const { user } = useAuth();
  const { data: todayData } = useTodayHealth(user?.id);
  const { data: weeklyData } = useWeeklyHealth(user?.id);
  
  const colors = colorVariants[color];

  // Get today's value and weekly average
  const getTodayValue = (): number | null => {
    if (!todayData) return null;
    switch (metricKey) {
      case "sleep": return todayData.sleep_quality;
      case "activity": return todayData.activity_level;
      case "stress": return todayData.stress_level;
      case "hydration": return todayData.hydration_glasses;
      case "nutrition": return todayData.meal_balance;
      default: return null;
    }
  };

  const getWeeklyAverage = (): number => {
    if (!weeklyData || weeklyData.length === 0) return 0;
    
    let values: number[] = [];
    switch (metricKey) {
      case "sleep":
        values = weeklyData.filter(d => d.sleep_quality).map(d => d.sleep_quality!);
        break;
      case "activity":
        values = weeklyData.filter(d => d.activity_level).map(d => d.activity_level!);
        break;
      case "stress":
        values = weeklyData.filter(d => d.stress_level).map(d => 6 - d.stress_level!); // Invert for display
        break;
      case "hydration":
        values = weeklyData.filter(d => d.hydration_glasses).map(d => Math.min(d.hydration_glasses! / 8 * 5, 5));
        break;
      case "nutrition":
        values = weeklyData.filter(d => d.meal_balance).map(d => d.meal_balance!);
        break;
    }
    
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const getDisplayValue = (): string => {
    const value = getTodayValue();
    if (value === null) return "—";
    
    if (metricKey === "hydration") {
      return `${value} glasses`;
    }
    return `${value}/5`;
  };

  const getProgressPercentage = (): number => {
    const avg = getWeeklyAverage();
    return (avg / 5) * 100;
  };

  const todayValue = getTodayValue();
  const weeklyAvg = getWeeklyAverage();
  const hasData = todayValue !== null || weeklyData?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3 }}
      className="relative group"
    >
      {/* Glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity",
        colors.glow
      )} />
      
      <div className={cn(
        "relative bg-gradient-to-br rounded-2xl p-6 border backdrop-blur-xl",
        colors.bg,
        colors.border
      )}>
        {/* Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl bg-card/50 border",
            colors.border
          )}>
            <Icon className={cn("w-6 h-6", colors.icon)} />
          </div>
          
          {hasData && (
            <span className={cn(
              "text-2xl font-bold font-orbitron",
              colors.icon
            )}>
              {getDisplayValue()}
            </span>
          )}
        </div>
        
        {/* Title & Description */}
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground/70 mb-4">{description}</p>
        
        {/* Weekly Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Weekly Average</span>
            <span className={colors.icon}>{weeklyAvg.toFixed(1)}/5</span>
          </div>
          <div className="h-2 bg-card/50 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", colors.progress)}
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
        
        {!hasData && (
          <p className="text-xs text-muted-foreground/50 mt-4 text-center">
            No data yet. Start with a daily check-in!
          </p>
        )}
      </div>
    </motion.div>
  );
}
