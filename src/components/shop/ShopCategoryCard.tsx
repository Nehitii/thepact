import { cn } from "@/lib/utils";
import { ChevronRight, Lock } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ShopCategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  itemCount?: number;
  isComingSoon?: boolean;
  onClick?: () => void;
  gradient?: string;
}

export function ShopCategoryCard({
  title,
  description,
  icon: Icon,
  itemCount,
  isComingSoon = false,
  onClick,
  gradient = "from-primary/20 to-primary/5",
}: ShopCategoryCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={isComingSoon}
      className={cn(
        "relative w-full p-4 rounded-xl border-2 border-primary/30 bg-card/80 backdrop-blur-xl",
        "transition-all duration-300 text-left group overflow-hidden",
        "shadow-[0_8px_32px_rgba(0,5,11,0.4),inset_0_0_20px_rgba(91,180,255,0.05)]",
        isComingSoon && "opacity-60 cursor-not-allowed",
        !isComingSoon && "hover:border-primary/60 hover:shadow-[0_0_30px_rgba(91,180,255,0.2)]"
      )}
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        gradient
      )} />

      <div className="relative z-10 flex items-center gap-4">
        {/* Icon container */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-orbitron text-base font-bold text-foreground tracking-wider">
              {title}
            </h3>
            {isComingSoon && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border border-muted-foreground/30">
                <Lock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-orbitron text-muted-foreground tracking-wider">
                  Soon
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-rajdhani mt-0.5">
            {description}
          </p>
          {itemCount !== undefined && !isComingSoon && (
            <p className="text-xs text-primary/60 font-rajdhani mt-1">
              {itemCount} items available
            </p>
          )}
        </div>

        {/* Arrow */}
        {!isComingSoon && (
          <ChevronRight className="w-5 h-5 text-primary/60 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        )}
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent translate-y-full group-hover:translate-y-[-100%] transition-transform duration-1000" />
      </div>
    </button>
  );
}
