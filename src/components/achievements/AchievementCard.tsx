import { Achievement, rarityColors, AchievementRarity } from "@/lib/achievements";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  achievement: Achievement;
  compact?: boolean;
}

export function AchievementCard({ achievement, compact = false }: AchievementCardProps) {
  const IconComponent =
    (LucideIcons as any)[
      achievement.icon_key
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("")
    ] || LucideIcons.Award;

  const isLocked = !achievement.unlocked;
  const isHidden = achievement.is_hidden && isLocked;
  const color = rarityColors[achievement.rarity];

  const condition = achievement.conditions as any;
  const isProgressBased = condition?.value && typeof condition.value === "number" && condition.value > 1;
  const progressPercent = Math.min(100, ((achievement.progress || 0) / (condition?.value || 1)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }} // On évite le scale global qui fait bugger le clip-path
      className={cn("relative group w-full transition-all duration-300", compact ? "h-24" : "h-32")}
    >
      {/* 1. LAYER DE FOND (Lueur externe) */}
      {!isLocked && (
        <div
          className="absolute -inset-1 opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500"
          style={{ backgroundColor: color }}
        />
      )}

      {/* 2. LE CORPS DE LA CARTE (Clip-path fixe) */}
      <div
        className={cn(
          "absolute inset-0 transition-all duration-300 border-l-2",
          isLocked ? "bg-slate-900/80 border-slate-700" : "bg-slate-950 border-t border-b border-r",
        )}
        style={{
          clipPath: "polygon(0 0, 92% 0, 100% 25%, 100% 100%, 8% 100%, 0 75%)",
          borderColor: isLocked ? undefined : `${color}60`,
          borderLeftColor: isLocked ? undefined : color,
        }}
      >
        {/* Scanlines animées */}
        {!isLocked && (
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        )}

        {/* Contenu principal */}
        <div className="relative flex items-center h-full px-4 gap-4">
          {/* ICON SECTION */}
          <div className="relative shrink-0 flex items-center justify-center w-12 h-12">
            {!isLocked && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-dashed rounded-full opacity-30"
                style={{ borderColor: color }}
              />
            )}
            <IconComponent
              className={cn("z-10 transition-all duration-500", isLocked ? "text-slate-700" : "")}
              style={{
                color: isLocked ? undefined : color,
                filter: isLocked ? "none" : `drop-shadow(0 0 5px ${color})`,
              }}
              size={compact ? 24 : 28}
            />
          </div>

          {/* TEXT SECTION */}
          <div className="flex-1 min-w-0">
            {" "}
            {/* min-w-0 est crucial pour empêcher le texte de push la carte */}
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[10px] font-black uppercase tracking-widest opacity-50 font-mono"
                style={{ color: isLocked ? "#475569" : color }}
              >
                [{achievement.rarity}]
              </span>
              {!isLocked && (
                <div
                  className="h-1 w-1 rounded-full animate-pulse"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                />
              )}
            </div>
            <h3
              className={cn(
                "font-bold uppercase tracking-tight truncate leading-none mb-1",
                compact ? "text-xs" : "text-sm",
                isLocked ? "text-slate-500" : "text-white",
              )}
            >
              {isHidden ? "••••••••••••" : achievement.name}
            </h3>
            <p
              className={cn(
                "text-[11px] leading-tight line-clamp-1 opacity-70 italic",
                isLocked ? "text-slate-600" : "text-slate-300",
              )}
            >
              {isHidden ? "Locked Data Fragment" : achievement.description}
            </p>
            {/* PROGRESS BAR */}
            {(isProgressBased || isLocked) && (
              <div className="mt-2 relative">
                <div className="flex justify-between text-[9px] mb-1 font-mono opacity-50">
                  <span>PROG_</span>
                  <span>{isLocked && isHidden ? "??%" : `${Math.round(progressPercent)}%`}</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full"
                    style={{
                      backgroundColor: isLocked ? "#334155" : color,
                      boxShadow: isLocked ? "none" : `0 0 10px ${color}`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. EFFET DE REFLET AU SURVOL (Glint) */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 20%, white 50%, transparent 80%)",
          clipPath: "polygon(0 0, 92% 0, 100% 25%, 100% 100%, 8% 100%, 0 75%)",
        }}
      />
    </motion.div>
  );
}
