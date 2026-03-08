import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, Eye, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShopFrames, useShopBanners, useShopTitles, useUserCosmetics, useBondBalance } from "@/hooks/useShop";
import { BondIcon } from "@/components/ui/bond-icon";
import { FramePreview } from "@/components/ui/avatar-frame";
import { Button } from "@/components/ui/button";
import { getRarity } from "./shopRarity";

const rarityOrder: Record<string, number> = { legendary: 4, epic: 3, rare: 2, common: 1 };

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
    unowned.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0) || b.price - a.price);
    return unowned[0];
  }, [frames, banners, titles, ownedCosmetics]);

  if (!featured) return null;

  const r = getRarity(featured.rarity);
  const canAfford = (balance?.balance || 0) >= featured.price;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  };

  const renderPreview = () => {
    if (featured._type === "frame") {
      const frame = featured as any;
      return <FramePreview size="lg" frameImage={frame.preview_url} borderColor={frame.border_color} glowColor={frame.glow_color} frameScale={frame.frame_scale} frameOffsetX={frame.frame_offset_x} frameOffsetY={frame.frame_offset_y} />;
    }
    if (featured._type === "banner") {
      const banner = featured as any;
      return (
        <div className="w-full max-w-[260px] h-20 rounded-xl" style={{
          background: banner.banner_url ? `url(${banner.banner_url}) center/cover` : `linear-gradient(135deg, ${banner.gradient_start || "#0a0a12"}, ${banner.gradient_end || "#1a1a2e"})`,
        }} />
      );
    }
    const title = featured as any;
    return (
      <span className="font-orbitron text-2xl font-bold tracking-wider" style={{
        color: title.text_color || r.accent,
        textShadow: title.glow_color ? `0 0 16px ${title.glow_color}, 0 0 32px ${title.glow_color}` : `0 0 16px ${r.glow}`,
      }}>
        {title.title_text || title.name}
      </span>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div
        className="relative rounded-2xl overflow-hidden border group cursor-pointer"
        style={{ borderColor: r.border, boxShadow: `0 0 40px ${r.glow}` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: 0.5, y: 0.5 })}
      >
        {/* Conic border for legendary/epic */}
        {r.animated && (
          <div className="absolute -inset-[1px] rounded-2xl pointer-events-none z-0" style={{
            background: `conic-gradient(from 0deg, ${r.accent}, transparent 30%, ${r.accent} 50%, transparent 80%, ${r.accent})`,
            animation: "spin 4s linear infinite",
          }} />
        )}

        <div className="relative z-[1] rounded-2xl overflow-hidden" style={{ background: "hsl(var(--card))" }}>
          {/* Parallax glow */}
          <div className="absolute inset-0 transition-all duration-300 pointer-events-none" style={{
            background: `radial-gradient(ellipse at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${r.glowStrong}, transparent 60%)`,
          }} />

          {/* FEATURED watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span className="font-orbitron text-[100px] sm:text-[140px] font-black uppercase tracking-[0.15em] opacity-[0.02]" style={{ transform: "rotate(-12deg)" }}>
              FEATURED
            </span>
          </div>

          <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-10 p-6 sm:p-8">
            {/* Preview */}
            <motion.div
              className="shrink-0 flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44"
              animate={{ x: (mousePos.x - 0.5) * 16, y: (mousePos.y - 0.5) * 16 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              {renderPreview()}
            </motion.div>

            {/* Info */}
            <motion.div
              className="flex-1 min-w-0 space-y-4 text-center sm:text-left"
              animate={{ x: (mousePos.x - 0.5) * -6, y: (mousePos.y - 0.5) * -6 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span className="text-[10px] uppercase tracking-[0.15em] font-orbitron font-bold px-3 py-1 rounded-lg border" style={{
                  color: r.accent, borderColor: r.border, background: r.glow,
                }}>
                  {featured.rarity}
                </span>
                <motion.span
                  className="text-[9px] uppercase tracking-[0.2em] font-orbitron px-2 py-0.5 rounded-md flex items-center gap-1"
                  style={{ background: r.glow, color: r.accent }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star className="w-2.5 h-2.5" /> Featured
                </motion.span>
              </div>

              <h3 className="font-orbitron text-xl sm:text-2xl font-bold tracking-wide text-foreground">
                {featured.name}
              </h3>

              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="flex items-center gap-2 font-orbitron text-xl font-bold" style={{ color: r.accent }}>
                  <BondIcon size={22} />
                  {featured.price.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  {onPreview && (
                    <Button size="sm" variant="ghost" onClick={() => onPreview(featured, featured._type)} className="h-9 text-xs text-muted-foreground hover:text-foreground">
                      <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                    </Button>
                  )}
                  {onPurchase && (
                    <Button size="sm" disabled={!canAfford} onClick={() => onPurchase(featured, featured._type)}
                      className="h-9 text-xs font-orbitron tracking-wider rounded-lg"
                      style={{ background: canAfford ? r.glow : undefined, borderColor: r.border, color: canAfford ? r.accent : undefined, border: `1px solid ${r.border}` }}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Buy Now
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
