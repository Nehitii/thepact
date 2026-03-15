import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalLockOverlayProps {
  className?: string;
}

export function GoalLockOverlay({ className }: GoalLockOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-[100] flex flex-col items-center justify-center rounded-[inherit]",
        "bg-[#050508]/90",
        "cursor-pointer select-none",
        className,
      )}
      style={{ isolation: "isolate" }} // Enferme strictement le contexte d'empilement
    >
      <div className="p-3 rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)] animate-pulse transform-gpu">
        {/* On a retiré le drop-shadow qui faisait bugger Chrome */}
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <span className="mt-2 text-[10px] font-orbitron uppercase tracking-widest text-primary/90 font-bold animate-pulse transform-gpu">
        Locked
      </span>
    </div>
  );
}
