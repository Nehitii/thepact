import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";
import { Button } from "@/components/ui/button";

export type CyberItemType = "module" | "frame" | "banner" | "title";

interface CyberItemCardProps {
  id: string;
  name: string;
  rarity: string;
  price: number;
  owned: boolean;
  canAfford: boolean;
  isComingSoon?: boolean;
  itemType: CyberItemType;
  preview: React.ReactNode;
  onPurchase: () => void;
  onPreview?: () => void;
  index?: number;
}

const rarityConfig: Record<string, {
  border: string;
  bg: string;
  text: string;
  glow: string;
  glowColor: string;
  animated: boolean;
}> = {
  common: {
    border: "border-slate-500/30",
    bg: "bg-slate-500/5",
    text: "text-slate-400",
    glow: "",
    glowColor: "hsl(210 15% 60%)",
    animated: false,
  },
  rare: {
    border: "border-blue-500/40",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    glowColor: "hsl(212 90% 55%)",
    animated: false,
  },
  epic: {
    border: "border-purple-500/50",
    bg: "bg-purple-500/5",
    text: "text-purple-400",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    glowColor: "hsl(270 80% 60%)",
    animated: true,
  },
  legendary: {
    border: "border-amber-500/50",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.25)]",
    glowColor: "hsl(45 100% 60%)",
    animated: true,
  },
};

// Rarity-specific background patterns
const rarityBgStyle: Record<string, React.CSSProperties> = {
  common: {
    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(210 15% 60% / 0.03) 10px, hsl(210 15% 60% / 0.03) 11px)",
  },
  rare: {
    background: "radial-gradient(ellipse at 50% 0%, hsl(212 90% 55% / 0.08), transparent 70%)",
  },
  epic: {},
  legendary: {},
};

export function CyberItemCard({
  id,
  name,
  rarity,
  price,
  owned,
  canAfford,
  isComingSoon = false,
  itemType,
  preview,
  onPurchase,
  onPreview,
  index = 0,
}: CyberItemCardProps) {
  const config = rarityConfig[rarity] || rarityConfig.common;
  const isCosmetic = itemType !== "module";
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -12, y: x * 12 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "800px",
      }}
    >
      <motion.div
        className={cn(
          "group relative rounded-xl overflow-hidden",
          "bg-card/60 backdrop-blur-sm transition-shadow duration-300",
          !isComingSoon && !owned && "cursor-pointer",
        )}
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
          scale: isHovered && !owned && !isComingSoon ? 1.03 : 1,
          z: isHovered && !owned ? 20 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          transformStyle: "preserve-3d",
          border: `1px solid ${isHovered && !owned ? config.glowColor + "80" : "hsl(var(--primary) / 0.15)"}`,
          boxShadow: isHovered && !owned
            ? `0 0 20px ${config.glowColor}30, 0 8px 32px hsl(var(--background) / 0.5)`
            : undefined,
        }}
      >
        {/* Epic: breathing purple border glow (always visible) */}
        {rarity === "epic" && !owned && (
          <motion.div
            className="absolute -inset-[1px] rounded-xl pointer-events-none z-0"
            style={{
              border: `1px solid ${config.glowColor}`,
              boxShadow: `0 0 12px ${config.glowColor}40`,
            }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Animated conic border for legendary on hover */}
        {rarity === "legendary" && (
          <div
            className="absolute -inset-[1px] rounded-xl pointer-events-none z-0 opacity-40 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `conic-gradient(from 0deg, ${config.glowColor}, transparent 30%, ${config.glowColor} 50%, transparent 80%, ${config.glowColor})`,
              animation: "spin 3s linear infinite",
            }}
          />
        )}

        {/* Inner background (sits above conic border) */}
        <div className="relative z-[1] bg-card/95 rounded-xl">
          {/* Rarity-specific background pattern */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={rarityBgStyle[rarity] || {}}
          />

          {/* Inner glow on hover */}
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${config.glowColor}10, transparent 60%)`,
            }}
          />

          {/* Legendary: floating golden particles */}
          {rarity === "legendary" && !owned && (
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-[2]">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full"
                  style={{
                    background: config.glowColor,
                    boxShadow: `0 0 4px ${config.glowColor}`,
                    left: `${20 + i * 20}%`,
                    bottom: "0%",
                  }}
                  animate={{
                    y: [0, -80 - i * 15, 0],
                    opacity: [0, 0.8, 0],
                    x: [0, (i % 2 === 0 ? 8 : -8), 0],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.8,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {/* Wishlist */}
          {!owned && !isComingSoon && (
            <div className="absolute top-2 right-2 z-10">
              <WishlistButton itemId={id} itemType={isCosmetic ? "cosmetic" : "module"} size="sm" />
            </div>
          )}

          {/* Preview Area */}
          <div className={cn(
            "relative flex items-center justify-center p-4",
            itemType === "module" ? "min-h-[100px]" : "min-h-[120px]"
          )}>
            <div style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }}>
              {preview}
            </div>

            {/* ACQUIRED holographic badge stamp */}
            {owned && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
                <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px] rounded-t-xl" />
                <div className="relative">
                  {/* Hexagonal badge */}
                  <div
                    className="relative w-16 h-16 flex items-center justify-center"
                    style={{
                      clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                      background: "hsl(142 70% 50% / 0.12)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <div
                      className="w-14 h-14 flex items-center justify-center"
                      style={{
                        clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                        border: "1px solid hsl(142 70% 50% / 0.4)",
                        background: "hsl(142 70% 50% / 0.06)",
                      }}
                    >
                      <Check className="w-6 h-6" style={{ color: "hsl(142 70% 50%)" }} />
                    </div>
                  </div>
                  {/* Shimmer sweep */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(120deg, transparent 40%, hsl(142 70% 50% / 0.15) 50%, transparent 60%)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{ backgroundPosition: ["200% 0", "-100% 0"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>
            )}

            {/* Coming Soon */}
            {isComingSoon && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-t-xl">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-muted-foreground/30">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-orbitron text-muted-foreground tracking-wider">SOON</span>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="relative z-[2] px-4 pb-4 space-y-3 border-t border-primary/10 pt-3">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "font-orbitron text-sm font-medium tracking-wide truncate flex-1 transition-all duration-200",
                  isHovered && !owned && "text-foreground"
                )}
                style={isHovered && !owned ? { textShadow: `0 0 8px ${config.glowColor}40` } : undefined}
              >
                {name}
              </h3>
              {/* Rarity badge with animated dot */}
              <span className={cn(
                "flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border",
                config.bg, config.text, config.border
              )}>
                {config.animated && (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: config.glowColor }}
                  />
                )}
                {rarity}
              </span>
            </div>

            {/* Price + Actions */}
            <div className="flex items-center justify-between">
              {owned ? (
                <span className="text-xs font-rajdhani font-medium flex items-center gap-1" style={{ color: "hsl(142 70% 50%)" }}>
                  <Check className="w-3 h-3" /> Unlocked
                </span>
              ) : isComingSoon ? (
                <span className="text-xs text-muted-foreground font-rajdhani">TBA</span>
              ) : (
                <div className="flex items-center gap-1.5 font-orbitron text-sm" style={{ color: config.glowColor }}>
                  <motion.div
                    animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    <BondIcon size={16} />
                  </motion.div>
                  {price.toLocaleString()}
                </div>
              )}

              {!owned && !isComingSoon && (
                <div className="flex items-center gap-1.5">
                  {isCosmetic && onPreview && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); onPreview(); }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canAfford}
                    onClick={onPurchase}
                    className="text-xs border-primary/30 hover:bg-primary/10 font-rajdhani"
                  >
                    {canAfford ? "BUY" : <Lock className="w-3 h-3" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
