import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalLockOverlayProps {
  className?: string;
}

export function GoalLockOverlay({ className }: GoalLockOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-30 flex items-center justify-center rounded-[inherit]",
        "backdrop-blur-lg bg-background/40",
        "cursor-pointer select-none",
        className
      )}
    >
      <div className="flex flex-col items-center gap-2 animate-pulse">
        <div className="p-3 rounded-full bg-primary/10 border border-primary/30">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <span className="text-[10px] font-orbitron uppercase tracking-widest text-primary/70">
          Locked
        </span>
      </div>
    </div>
  );
}
