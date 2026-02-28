import { motion } from "framer-motion";
import { Sparkles, Puzzle, Heart, History } from "lucide-react";
import { BondIcon } from "@/components/ui/bond-icon";

export type ShopTab = "cosmetics" | "modules" | "bonds" | "wishlist" | "history";

interface ShopTabsProps {
  activeTab: ShopTab;
  onTabChange: (tab: ShopTab) => void;
  wishlistCount?: number;
}

const tabs = [
  { id: "cosmetics" as const, label: "Cosmetics", icon: Sparkles, isImage: false },
  { id: "modules" as const, label: "Modules", icon: Puzzle, isImage: false },
  { id: "bonds" as const, label: "Bonds", icon: null, isImage: true },
  { id: "wishlist" as const, label: "Wishlist", icon: Heart, isImage: false },
  { id: "history" as const, label: "History", icon: History, isImage: false },
];

export function ShopTabs({ activeTab, onTabChange, wishlistCount = 0 }: ShopTabsProps) {
  return (
    <div className="relative flex gap-0.5 p-1.5 rounded-lg bg-card/40 border border-primary/15 backdrop-blur-xl overflow-x-auto hide-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const isWishlistFull = tab.id === "wishlist" && wishlistCount > 0;

        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileTap={{ scale: 0.96 }}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3.5 px-3 sm:px-4 rounded-md font-orbitron text-[10px] sm:text-xs font-semibold tracking-wider uppercase transition-colors duration-200 whitespace-nowrap ${
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-primary/70"
            }`}
          >
            {/* Active background + beam underline */}
            {isActive && (
              <>
                <motion.div
                  layoutId="shopActiveTab"
                  className="absolute inset-0 rounded-md"
                  style={{
                    background: "linear-gradient(180deg, hsl(var(--primary) / 0.14), hsl(var(--primary) / 0.05))",
                    border: "1px solid hsl(var(--primary) / 0.3)",
                  }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                {/* Animated beam underline */}
                <motion.div
                  layoutId="shopTabBeam"
                  className="absolute bottom-0 left-[20%] right-[20%] h-[2px] rounded-full"
                  style={{
                    background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
                    boxShadow: "0 0 8px hsl(var(--primary) / 0.6), 0 0 16px hsl(var(--primary) / 0.3)",
                  }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              </>
            )}

            {/* Icon with glow + active dot */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              {tab.isImage ? (
                <BondIcon
                  size={15}
                  className={`transition-all duration-200 ${isActive ? "drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)]" : ""}`}
                />
              ) : Icon ? (
                <Icon
                  className={`w-3.5 h-3.5 transition-all duration-200 ${
                    isActive ? "drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)]" : ""
                  } ${isWishlistFull ? "text-rose-400" : ""}`}
                />
              ) : null}
              {/* Glow dot under icon when active */}
              {isActive && (
                <motion.div
                  className="w-1 h-1 rounded-full bg-primary"
                  style={{ boxShadow: "0 0 4px hsl(var(--primary))" }}
                  layoutId="shopTabDot"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </div>

            <span className="relative z-10 hidden sm:block">{tab.label}</span>

            {/* Wishlist badge with pulse */}
            {isWishlistFull && (
              <motion.span
                className="relative z-10 min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
