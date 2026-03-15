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
        "bg-[#050508]/90", // Fond sombre solide, sans flou, sans animation
        "cursor-pointer select-none",
        className,
      )}
    >
      {/* On applique animate-pulse UNIQUEMENT sur l'icône et le texte, pas sur le fond ! */}
      <div className="p-3 rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)] animate-pulse">
        <Lock className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
      </div>
      <span className="mt-2 text-[10px] font-orbitron uppercase tracking-widest text-primary/90 font-bold drop-shadow-md animate-pulse">
        Locked
      </span>
    </div>
  );
}
