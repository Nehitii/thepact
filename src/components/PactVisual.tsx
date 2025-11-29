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
      {/* Outer radial glow - Deep space aura */}
      <div 
        className="absolute inset-0 rounded-full blur-[40px] animate-glow-pulse"
        style={{ 
          transform: "scale(1.5)",
          background: "radial-gradient(circle, rgba(91, 180, 255, 0.3) 0%, rgba(91, 180, 255, 0.1) 50%, transparent 70%)"
        }}
      />
      
      {/* Middle glow ring */}
      <div 
        className="absolute inset-0 rounded-full blur-xl"
        style={{ 
          transform: "scale(1.3)",
          background: "radial-gradient(circle, rgba(122, 191, 255, 0.4) 0%, transparent 60%)"
        }}
      />
      
      {/* Progress ring container */}
      <div className="relative">
        <svg className={`${currentSize.container} -rotate-90 drop-shadow-[0_0_20px_rgba(91,180,255,0.6)]`}>
          {/* Background ring - Dark with inner glow */}
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="rgba(91, 180, 255, 0.1)"
            strokeWidth="3"
          />
          
          {/* Progress ring - Glowing cyan */}
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="4"
            className="transition-all duration-1000"
            strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
            strokeDashoffset={2 * Math.PI * 45 * (1 - progress / 100)}
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 8px rgba(91, 180, 255, 0.8))"
            }}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(200 100% 67%)" />
              <stop offset="50%" stopColor="hsl(200 100% 75%)" />
              <stop offset="100%" stopColor="hsl(205 100% 85%)" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center icon - Holographic flame */}
        <div className={`absolute inset-0 flex items-center justify-center ${currentSize.container}`}>
          <div className="relative">
            {/* Icon inner glow */}
            <div className="absolute inset-0 blur-md">
              <Icon className={`${currentSize.icon} text-accent`} />
            </div>
            {/* Main icon */}
            <Icon 
              className={`${currentSize.icon} text-primary animate-float relative z-10`}
              style={{
                filter: "drop-shadow(0 0 10px rgba(91, 180, 255, 0.8)) drop-shadow(0 0 20px rgba(122, 191, 255, 0.4))"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
