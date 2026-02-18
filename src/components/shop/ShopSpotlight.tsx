import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, Eye, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useShopFrames,
  useShopBanners,
  useShopTitles,
  useUserCosmetics,
  useBondBalance,
} from "@/hooks/useShop";
import { BondIcon } from "@/components/ui/bond-icon";
import { FramePreview } from "@/components/ui/avatar-frame";
import { Button } from "@/components/ui/button";

const rarityOrder: Record<string, number> = {
  legendary: 4,
  epic: 3,
  rare: 2,
  common: 1,
};

const rarityColors: Record<string, { border: string; glow: string; badge: string }> = {
  legendary: {
    border: "hsl(45 100% 60%)",
    glow: "hsl(45 100% 60% / 0.35)",
    badge: "hsl(45 100% 60%)",
  },
  epic: {
    border: "hsl(270 80% 60%)",
    glow: "hsl(270 80% 60% / 0.3)",
    badge: "hsl(270 80% 60%)",
  },
  rare: {
    border: "hsl(212 90% 55%)",
    glow: "hsl(212 90% 55% / 0.25)",
    badge: "hsl(212 90% 55%)",
  },
  common: {
    border: "hsl(var(--primary) / 0.4)",
    glow: "hsl(var(--primary) / 0.15)",
    badge: "hsl(var(--primary))",
  },
};

interface ShopSpotlightProps {
  onPreview?: (item: any, type: string) => void;
  onPurchase?: (item: any, type: string) => void;
}

export function ShopSpotlight({ onPreview, onPurchase }: ShopSpotlightProps) {
  const { user } = useAuth();
  const { data: frames = [] } = useShopFrames();
  const { data: banners = [] } = useShopBanners();
  const { data: titles = [] } = useShopTitles();
  const { data: ownedCosmetics } = useUserCosmetics(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // Pick the rarest + most expensive unowned item
  const featured = useMemo(() => {
    const allItems = [
      ...frames.map((f) => ({ ...f, _type: "frame" as const })),
      ...banners.map((b) => ({ ...b, _type: "banner" as const })),
      ...titles.map((t) => ({ ...t, name: t.title_text, _type: "title" as const })),
    ];

    const unowned = allItems.filter((item) => {
      if (!ownedCosmetics) return true;
      if (item._type === "frame") return !ownedCosmetics.frames.includes(item.id) && !item.is_default;
      if (item._type === "banner") return !ownedCosmetics.banners.includes(item.id) && !item.is_default;
      return !ownedCosmetics.titles.includes(item.id) && !item.is_default;
    });

    if (unowned.length === 0) return null;

    unowned.sort((a, b) => {
      const ra = rarityOrder[a.rarity] || 0;
      const rb = rarityOrder[b.rarity] || 0;
      if (rb !== ra) return rb - ra;
      return b.price - a.price;
    });

    return unowned[0];
  }, [frames, banners, titles, ownedCosmetics]);

  if (!featured) return null;

  const colors = rarityColors[featured.rarity] || rarityColors.common;
  const canAfford = (balance?.balance || 0) >= featured.price;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const renderPreview = () => {
    if (featured._type === "frame") {
      const frame = featured as any;
      return (
        <FramePreview
          size="lg"
          frameImage={frame.preview_url}
          borderColor={frame.border_color}
          glowColor={frame.glow_color}
          frameScale={frame.frame_scale}
          frameOffsetX={frame.frame_offset_x}
          frameOffsetY={frame.frame_offset_y}
        />
      );
    }
    if (featured._type === "banner") {
      const banner = featured as any;
      return (
        <div
          className="w-full max-w-[200px] h-14 rounded-lg"
          style={{
            background: banner.banner_url
              ? `url(${banner.banner_url}) center/cover`
              : `linear-gradient(135deg, ${banner.gradient_start || "#0a0a12"}, ${banner.gradient_end || "#1a1a2e"})`,
          }}
        />
      );
    }
    const title = featured as any;
    return (
      <span
        className="font-orbitron text-xl font-bold tracking-wider"
        style={{
          color: title.text_color || colors.badge,
          textShadow: title.glow_color
            ? `0 0 12px ${title.glow_color}, 0 0 24px ${title.glow_color}`
            : `0 0 12px ${colors.glow}`,
        }}
      >
        {title.title_text || title.name}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4" style={{ color: colors.badge }} />
        <h2 className="font-orbitron text-sm tracking-widest uppercase" style={{ color: colors.badge }}>
          Featured
        </h2>
      </div>

      <div
        className="relative rounded-xl overflow-hidden border cursor-pointer group"
        style={{
          borderColor: colors.border,
          boxShadow: `0 0 30px ${colors.glow}, inset 0 0 30px ${colors.glow}`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: 0.5, y: 0.5 })}
      >
        {/* Animated rotating conic border for legendary/epic */}
        {(featured.rarity === "legendary" || featured.rarity === "epic") && (
          <div
            className="absolute -inset-[1px] rounded-xl pointer-events-none z-0"
            style={{
              background: `conic-gradient(from ${Date.now() % 360}deg, ${colors.border}, transparent 40%, ${colors.border} 50%, transparent 90%, ${colors.border})`,
              animation: "spin 4s linear infinite",
            }}
          />
        )}

        {/* BG with parallax glow */}
        <div
          className="relative z-[1] rounded-xl overflow-hidden"
          style={{ background: "hsl(var(--card))" }}
        >
          {/* Parallax radial glow */}
          <div
            className="absolute inset-0 transition-all duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${colors.glow}, transparent 60%)`,
            }}
          />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative flex items-center gap-6 p-6 sm:p-8">
            {/* Preview with parallax */}
            <motion.div
              className="shrink-0 flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32"
              animate={{
                x: (mousePos.x - 0.5) * 8,
                y: (mousePos.y - 0.5) * 8,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              {renderPreview()}
            </motion.div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Rarity + FEATURED badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] uppercase tracking-widest font-orbitron font-bold px-2.5 py-1 rounded-md border"
                  style={{
                    color: colors.badge,
                    borderColor: `${colors.border}`,
                    background: `${colors.glow}`,
                  }}
                >
                  {featured.rarity}
                </span>
                <span
                  className="text-[9px] uppercase tracking-[0.2em] font-orbitron px-2 py-0.5 rounded"
                  style={{
                    background: `linear-gradient(90deg, ${colors.glow}, transparent)`,
                    color: colors.badge,
                  }}
                >
                  ★ Featured
                </span>
              </div>

              <h3 className="font-orbitron text-base sm:text-lg font-bold tracking-wide text-foreground truncate">
                {featured.name}
              </h3>

              {/* Price + actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-orbitron text-lg font-bold" style={{ color: colors.badge }}>
                  <BondIcon size={20} />
                  {featured.price.toLocaleString()}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {onPreview && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onPreview(featured, featured._type)}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Preview
                    </Button>
                  )}
                  {onPurchase && (
                    <Button
                      size="sm"
                      disabled={!canAfford}
                      onClick={() => onPurchase(featured, featured._type)}
                      className="h-8 text-xs font-orbitron tracking-wider border"
                      style={{
                        borderColor: colors.border,
                        color: canAfford ? colors.badge : undefined,
                        background: canAfford ? `${colors.glow}` : undefined,
                      }}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                      Buy Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
