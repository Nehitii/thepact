import { Achievement, rarityColors, AchievementRarity } from "@/lib/achievements";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { DynamicLucideIcon } from "@/components/DynamicLucideIcon";

interface AchievementCardProps {
  achievement: Achievement;
  compact?: boolean;
}

/** Le biseau de la carte. Il etait duplique a deux endroits du fichier :
 *  toute retouche de l'un desalignait l'autre. */
const BEVEL = "polygon(0 0, 92% 0, 100% 25%, 100% 100%, 8% 100%, 0 75%)";

export function AchievementCard({ achievement, compact = false }: AchievementCardProps) {
  const iconKey = achievement.icon_key;

  const isLocked = !achievement.unlocked;
  const isHidden = achievement.is_hidden && isLocked;
  const color = rarityColors[achievement.rarity];
  const hasModuleReq = !!achievement.required_module;

  const condition = achievement.conditions as any;
  const isProgressBased = condition?.value && typeof condition.value === "number" && condition.value > 1;
  const progressPercent = Math.min(100, ((achievement.progress || 0) / (condition?.value || 1)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={cn("relative group w-full transition-all duration-300", compact ? "h-24" : "h-36")}
    >
      {!isLocked && (
        <div
          className="absolute -inset-1 opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500"
          style={{ backgroundColor: color }}
        />
      )}

      <div
        className={cn(
          "absolute inset-0 transition-all duration-300 border-l-2",
          isLocked ? "bg-slate-900/80 border-slate-700" : "bg-slate-950 border-t border-b border-r",
        )}
        style={{
          clipPath: BEVEL,
          borderColor: isLocked ? undefined : `${color}60`,
          borderLeftColor: isLocked ? undefined : color,
        }}
      >
        {!isLocked && (
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        )}

        <div className="relative flex items-center h-full px-4 gap-4">
          {/* ICON */}
          <div className="relative shrink-0 flex items-center justify-center w-12 h-12">
            {/* L'anneau tournait en boucle infinie sur chaque carte debloquee,
                hors ecran compris : autant d'animations permanentes que de
                succes. Il ne tourne plus qu'au survol de la carte, ou le
                mouvement signifie quelque chose. */}
            {!isLocked && (
              <div
                className="absolute inset-0 rounded-full border border-dashed opacity-30 motion-safe:group-hover:animate-[spin_8s_linear_infinite]"
                style={{ borderColor: color }}
              />
            )}
            <DynamicLucideIcon
              name={iconKey}
              fallback="award"
              className={cn("z-10 transition-all duration-500", isLocked ? "text-slate-700" : "")}
              style={{
                color: isLocked ? undefined : color,
                filter: isLocked ? "none" : `drop-shadow(0 0 5px ${color})`,
              }}
              size={compact ? 24 : 28}
            />
          </div>

          {/* TEXT */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest font-mono",
                    isLocked ? "text-slate-400" : "opacity-60",
                  )}
                  style={{ color: isLocked ? undefined : color }}
                >
                  [{achievement.rarity}]
                </span>
                {/* Bond reward badge */}
                {(achievement.bond_reward || 0) > 0 && (
                  <span className="text-[9px] font-mono text-amber-400/70 bg-amber-400/10 px-1.5 py-0.5 rounded">
                    +{achievement.bond_reward}B
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {/* Points */}
                {(achievement.points || 0) > 0 && (
                  <span className="text-[9px] font-mono text-primary/50">
                    {achievement.points}pts
                  </span>
                )}
                {!isLocked && (
                  <div
                    className="h-1 w-1 rounded-full animate-pulse"
                    style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                  />
                )}
              </div>
            </div>
            <h3
              className={cn(
                "font-bold uppercase tracking-tight truncate leading-none mb-1",
                compact ? "text-xs" : "text-sm",
                isLocked ? "text-slate-300" : "text-white",
              )}
            >
              {isHidden ? "••••••••••••" : achievement.name}
            </h3>
            {/* Contraste : les valeurs precedentes (slate-500 / slate-600 sous
                opacity-70) tombaient autour de 2,3:1 sur ce fond. La teinte
                reste ardoise — elle vient de la surface — mais assez claire
                pour etre lue. Deux lignes au lieu d'une : la carte fait 144px,
                la place existe. */}
            <p
              className={cn(
                "text-[11px] leading-snug line-clamp-2 italic",
                isLocked ? "text-slate-400" : "text-slate-300",
              )}
            >
              {isHidden ? "Locked Data Fragment" : achievement.description}
            </p>

            {/* Module requirement badge */}
            {hasModuleReq && isLocked && (
              <div className="flex items-center gap-1 mt-1">
                <Lock size={9} className="text-amber-500/60" />
                <span className="text-[9px] font-mono text-amber-500/60 truncate">
                  Requires: {achievement.required_module?.replace(/-/g, ' ')}
                </span>
              </div>
            )}

            {/* PROGRESS BAR */}
            {(isProgressBased || isLocked) && !hasModuleReq && (
              <div className="mt-1.5 relative">
                <div className="flex justify-between text-[9px] mb-0.5 font-mono opacity-50">
                  <span>PROG_</span>
                  <span>
                    {isLocked && isHidden
                      ? "??%"
                      : `${achievement.progress || 0}/${condition?.value || "?"} (${Math.round(progressPercent)}%)`}
                  </span>
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

      {/* Glint effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 20%, white 50%, transparent 80%)",
          clipPath: BEVEL,
        }}
      />
    </motion.div>
  );
}
