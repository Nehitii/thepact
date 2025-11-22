import { Flame, Heart, Target, Sparkles } from "lucide-react";

interface PactVisualProps {
  symbol?: string;
  progress?: number;
  size?: "sm" | "md" | "lg";
}

const symbolMap = {
  flame: Flame,
  heart: Heart,
  target: Target,
  sparkles: Sparkles,
};

export function PactVisual({ symbol = "flame", progress = 0, size = "lg" }: PactVisualProps) {
  const Icon = symbolMap[symbol as keyof typeof symbolMap] || Flame;
  
  const sizes = {
    sm: { container: "h-16 w-16", icon: "h-8 w-8" },
    md: { container: "h-24 w-24", icon: "h-12 w-12" },
    lg: { container: "h-32 w-32", icon: "h-16 w-16" },
  };

  const currentSize = sizes[size];

  return (
    <div className="relative inline-block">
      {/* Outer glow ring */}
      <div 
        className={`absolute inset-0 rounded-full bg-primary/20 blur-xl animate-glow-pulse`}
        style={{ transform: "scale(1.2)" }}
      />
      
      {/* Progress ring */}
      <svg className={`${currentSize.container} -rotate-90`}>
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted/30"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-primary transition-all duration-1000"
          strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
          strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Center icon */}
      <div className={`absolute inset-0 flex items-center justify-center ${currentSize.container}`}>
        <Icon className={`${currentSize.icon} text-primary animate-float`} />
      </div>
    </div>
  );
}
