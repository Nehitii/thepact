import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ReactionType = 'support' | 'respect' | 'inspired';

interface ReactionButtonProps {
  type: ReactionType;
  count: number;
  isActive: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

const reactionConfig: Record<ReactionType, { emoji: string; label: string; activeClasses: string }> = {
  support: {
    emoji: "💪",
    label: "Support",
    activeClasses: "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
  },
  respect: {
    emoji: "🫡",
    label: "Respect",
    activeClasses: "bg-amber-500/15 border-amber-500/50 text-amber-300"
  },
  inspired: {
    emoji: "⚡",
    label: "Inspired",
    activeClasses: "bg-violet-500/15 border-violet-500/50 text-violet-300"
  }
};

export function ReactionButton({ type, count, isActive, onToggle, size = 'md' }: ReactionButtonProps) {
  const config = reactionConfig[type];

  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "flex items-center gap-1.5 rounded-full transition-all border font-medium",
        size === 'sm' ? "px-2 py-1 gap-1 text-[10px]" : "px-3.5 py-1.5 text-xs",
        isActive
          ? config.activeClasses
          : "bg-card border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
      )}
    >
      <motion.span
        animate={isActive ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
        className="text-sm"
      >
        {config.emoji}
      </motion.span>
      <span>{count > 0 ? count : config.label}</span>
    </motion.button>
  );
}
