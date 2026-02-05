import { cn } from "@/lib/utils";
import { Rank } from "@/hooks/useRankXP"; // Assure-toi que l'import de Rank est correct pour ton projet

interface CurrentRankBadgeProps {
  rank: Rank | null;
  level: number;
  currentXP: number;
  progressToNext: number;
  className?: string;
  hideProgress?: boolean; // AJOUTÉ
}

export function CurrentRankBadge({
  rank,
  level,
  currentXP,
  progressToNext,
  className,
  hideProgress = false, // Valeur par défaut : false
}: CurrentRankBadgeProps) {
  const rankName = rank?.name || "Novice";
  const frameColor = rank?.frame_color || "#6b7280";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        {/* Nom du Rang */}
        <span
          className="font-orbitron font-bold text-lg md:text-xl tracking-wide uppercase"
          style={{ color: frameColor }}
        >
          {rankName}
        </span>

        {/* Badge Niveau */}
        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold font-orbitron">
          LVL {level}
        </span>
      </div>

      {/* Barre de progression interne (Masquée si hideProgress est true) */}
      {!hideProgress && (
        <div className="w-full bg-secondary/20 h-1.5 rounded-full mt-1 overflow-hidden relative">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${progressToNext}%` }}
          />
        </div>
      )}
    </div>
  );
}
