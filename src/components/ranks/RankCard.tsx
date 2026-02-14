import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Shield, Trophy } from "lucide-react";

// Définition de l'interface Rank si elle n'est pas importée depuis un fichier de types global
export interface Rank {
  id: string;
  name: string;
  min_points: number;
  max_points?: number | null;
  image_url?: string | null;
  logo_url?: string | null;
  background_url?: string | null;
  background_opacity?: number | null;
  frame_color?: string | null;
  glow_color?: string | null;
  quote?: string | null;
}

// --- RANK BADGE ---
// C'est ici qu'on corrige l'erreur en ajoutant la prop 'size'
export interface RankBadgeProps {
  rank: {
    name: string;
    image_url?: string | null;
    min_points?: number;
  };
  currentXP?: number;
  nextRankMinXP?: number;
  size?: "sm" | "md" | "lg"; // Ajout de la taille
  className?: string;
}

export function RankBadge({ rank, currentXP, nextRankMinXP, size = "md", className }: RankBadgeProps) {
  // Configuration des tailles
  const sizeClasses = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-12 w-12 text-xs",
    lg: "h-16 w-16 text-sm",
  };

  const iconSize = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-black/40 border border-white/10 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.3)]",
          sizeClasses[size],
        )}
      >
        {rank.image_url ? (
          <img src={rank.image_url} alt={rank.name} className={cn("object-contain", iconSize[size])} />
        ) : (
          <Shield className={cn("text-primary", iconSize[size])} />
        )}

        {/* Petit indicateur de progression circulaire optionnel si on voulait aller plus loin */}
        <div className="absolute inset-0 rounded-full border border-primary/20" />
      </div>

      {/* N'afficher le nom que si ce n'est pas la taille "sm" pour éviter la surcharge */}
      {size !== "sm" && (
        <span className="text-xs font-rajdhani text-muted-foreground uppercase tracking-wider font-semibold">
          {rank.name}
        </span>
      )}
    </div>
  );
}

// --- RANK CARD (Composant Principal) ---
export interface RankCardProps {
  rank?: Rank;
  currentRank?: Rank;
  nextRank?: Rank | null;
  currentXP: number;
  nextRankMinXP?: number;
  totalMaxXP?: number;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RankCard({ rank, currentRank: currentRankProp, nextRank, currentXP, nextRankMinXP, totalMaxXP, isActive, size = "md", className }: RankCardProps) {
  const currentRank = rank || currentRankProp!;
  // Calcul de la progression
  const currentRankMin = currentRank.min_points;
  const nextRankMin = nextRankMinXP || nextRank?.min_points || currentRankMin * 1.5;

  // XP gagnée DANS ce rang (ex: j'ai 1500xp, rang commence à 1000, j'ai fait 500 dans ce rang)
  const xpInRank = Math.max(0, currentXP - currentRankMin);

  // XP totale nécessaire pour passer ce rang
  const xpNeededForNext = Math.max(1, nextRankMin - currentRankMin);

  // Pourcentage (0 à 100)
  const progressPercent = Math.min(100, Math.max(0, (xpInRank / xpNeededForNext) * 100));

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-card border border-border/50 p-4", className)}>
      <div className="flex items-center gap-4">
        {/* Badge Actuel */}
        <RankBadge rank={currentRank} size="md" />

        {/* Barre de progression centrale */}
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Current XP</span>
              <span className="text-lg font-bold font-rajdhani text-primary tabular-nums">
                {currentXP.toLocaleString()}
              </span>
            </div>
            {nextRank && (
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground">Next Rank: {nextRank.name}</span>
                <div className="text-xs font-mono text-primary/80">
                  {Math.floor(nextRankMin - currentXP).toLocaleString()} XP left
                </div>
              </div>
            )}
          </div>

          <div className="relative h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
            <Progress
              value={progressPercent}
              className="h-full [&>div]:bg-primary [&>div]:shadow-[0_0_10px_rgba(91,180,255,0.5)]"
            />
          </div>
        </div>

        {/* Badge Suivant (Grisé ou en trophée) */}
        <div className="hidden sm:flex flex-col items-center justify-center opacity-50">
          {nextRank ? (
            <RankBadge rank={nextRank} size="sm" />
          ) : (
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Trophy className="h-4 w-4 text-yellow-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
