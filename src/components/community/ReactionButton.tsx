import { motion } from "framer-motion";
import { Heart, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ReactionType = 'support' | 'respect' | 'inspired';

interface ReactionButtonProps {
  type: ReactionType;
  count: number;
  isActive: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

const reactionConfig: Record<ReactionType, { icon: typeof Heart; label: string; activeClass: string }> = {
  support: {
    icon: Heart,
    label: "Support",
    activeClass: "text-rose-500 fill-rose-500"
  },
  respect: {
    icon: Trophy,
    label: "Respect",
    activeClass: "text-amber-500 fill-amber-500"
  },
  inspired: {
    icon: Sparkles,
    label: "Inspired",
    activeClass: "text-primary fill-primary"
  }
};

export function ReactionButton({ type, count, isActive, onToggle, size = 'md' }: ReactionButtonProps) {
  const config = reactionConfig[type];
  const Icon = config.icon;
  
  const iconSize = size === 'sm' ? 14 : 18;
  
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all",
        "bg-muted/50 hover:bg-muted border border-border/50",
        size === 'sm' && "px-2 py-1 gap-1"
      )}
    >
      <motion.div
        animate={isActive ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Icon 
          className={cn(
            "transition-colors",
            isActive ? config.activeClass : "text-muted-foreground"
          )}
          size={iconSize}
        />
      </motion.div>
      <span className={cn(
        "text-xs font-medium",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}>
        {count > 0 ? count : config.label}
      </span>
    </motion.button>
  );
}
