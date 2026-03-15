import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalLockOverlayProps {
  className?: string;
}

export function GoalLockOverlay({ className }: GoalLockOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-[50] flex items-center justify-center rounded-[inherit]",
        "overflow-hidden transform-gpu", // Force l'accélération GPU et limite strictement la zone
        "cursor-pointer select-none",
        className,
      )}
    >
      {/* Calque statique pour le flou (on ne l'anime pas pour éviter le bug visuel global) */}
      <div className="absolute inset-0 bg-background/50 backdrop-blur-md" />

      {/* Calque animé pour le contenu (cadenas + texte) */}
      <div className="relative z-10 flex flex-col items-center gap-2 animate-pulse">
        <div className="p-3 rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
          <Lock className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
        </div>
        <span className="text-[10px] font-orbitron uppercase tracking-widest text-primary/90 font-bold drop-shadow-md">
          Locked
        </span>
      </div>
    </div>
  );
}
