import { cn } from "@/lib/utils";
import { Sparkles, Lock, Check } from "lucide-react";

interface ShopItemCardProps {
  name: string;
  preview: React.ReactNode;
  price: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
  status?: "available" | "coming_soon" | "owned";
  onClick?: () => void;
}

const rarityStyles = {
  common: {
    border: "border-muted-foreground/30",
    glow: "shadow-[0_0_15px_rgba(150,150,150,0.2)]",
    label: "text-muted-foreground",
    bg: "bg-muted/20",
  },
  rare: {
    border: "border-blue-400/50",
    glow: "shadow-[0_0_20px_rgba(96,165,250,0.3)]",
    label: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  epic: {
    border: "border-purple-400/50",
    glow: "shadow-[0_0_20px_rgba(192,132,252,0.3)]",
    label: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  legendary: {
    border: "border-amber-400/50",
    glow: "shadow-[0_0_25px_rgba(251,191,36,0.4)]",
    label: "text-amber-400",
    bg: "bg-amber-500/10",
  },
};

const rarityLabels = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export function ShopItemCard({
  name,
  preview,
  price,
  rarity = "common",
  status = "available",
  onClick,
}: ShopItemCardProps) {
  const styles = rarityStyles[rarity];

  return (
    <button
      onClick={onClick}
      disabled={status === "coming_soon"}
      className={cn(
        "relative w-full rounded-xl border-2 bg-card/80 backdrop-blur-xl overflow-hidden",
        "transition-all duration-300 group",
        styles.border,
        styles.glow,
        status === "coming_soon" && "opacity-60 cursor-not-allowed",
        status !== "coming_soon" && "hover:scale-[1.02] hover:border-primary/60"
      )}
    >
      {/* Preview area */}
      <div className="relative aspect-square p-3 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        {preview}
        
        {/* Rarity badge */}
        {rarity !== "common" && (
          <div className={cn(
            "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-orbitron font-bold tracking-wider uppercase",
            styles.bg,
            styles.label
          )}>
            {rarityLabels[rarity]}
          </div>
        )}

        {/* Status overlay */}
        {status === "coming_soon" && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-muted-foreground/30">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-orbitron text-muted-foreground tracking-wider">
                Coming Soon
              </span>
            </div>
          </div>
        )}

        {status === "owned" && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/40">
            <Check className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-orbitron text-green-400 tracking-wider">
              Owned
            </span>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-3 pt-0 space-y-2 border-t border-primary/10">
        <h3 className="font-orbitron text-sm text-foreground font-medium tracking-wide truncate">
          {name}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-rajdhani text-sm text-primary font-semibold">
              {price}
            </span>
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
      </div>
    </button>
  );
}
