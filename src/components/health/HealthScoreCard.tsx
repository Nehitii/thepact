import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthScoreCardProps {
  score: number;
  trend: "up" | "down" | "stable";
  factors: string[];
}

export function HealthScoreCard({ score, trend, factors }: HealthScoreCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up": return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case "down": return <TrendingDown className="w-5 h-5 text-orange-400" />;
      default: return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case "up": return "Improving";
      case "down": return "Needs attention";
      default: return "Stable";
    }
  };

  const getScoreColor = () => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-teal-400";
    if (score >= 40) return "text-yellow-400";
    return "text-orange-400";
  };

  const getScoreGlow = () => {
    if (score >= 80) return "shadow-emerald-500/30";
    if (score >= 60) return "shadow-teal-500/30";
    if (score >= 40) return "shadow-yellow-500/30";
    return "shadow-orange-500/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 rounded-3xl" />
      
      <div className="relative bg-card/30 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8">
        {/* Inner glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 bg-emerald-500/10 blur-3xl" />
        
        <div className="relative flex flex-col lg:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="relative flex-shrink-0">
            <div className={cn(
              "w-40 h-40 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-card/50 to-card/20",
              "border-4 border-emerald-500/30",
              "shadow-2xl",
              getScoreGlow()
            )}>
              {/* Progress ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-emerald-500/20"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="72"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={452}
                  initial={{ strokeDashoffset: 452 }}
                  animate={{ strokeDashoffset: 452 - (452 * score) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="text-center">
                <motion.span 
                  className={cn("text-5xl font-bold font-orbitron", getScoreColor())}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {score}
                </motion.span>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  Health Score
                </p>
              </div>
            </div>
          </div>
          
          {/* Score Details */}
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Weekly Wellness Overview
              </h2>
              <div className="flex items-center justify-center lg:justify-start gap-2">
                {getTrendIcon()}
                <span className={cn(
                  "text-sm font-medium",
                  trend === "up" && "text-emerald-400",
                  trend === "down" && "text-orange-400",
                  trend === "stable" && "text-muted-foreground"
                )}>
                  {getTrendLabel()}
                </span>
              </div>
            </div>
            
            {/* Factors */}
            {factors.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {factors.map((factor, i) => (
                  <motion.span
                    key={factor}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    )}
                  >
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {factor}
                  </motion.span>
                ))}
              </div>
            )}
            
            {factors.length === 0 && (
              <p className="text-muted-foreground/70 text-sm">
                Complete daily check-ins to see your wellness insights
              </p>
            )}
            
            <p className="text-xs text-muted-foreground/50">
              This score is indicative and based on your self-reported data. 
              It's designed to help you track trends, not to diagnose.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
