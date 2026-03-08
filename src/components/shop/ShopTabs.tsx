import { motion } from "framer-motion";
import { Sparkles, Puzzle, Heart, History } from "lucide-react";
import { BondIcon } from "@/components/ui/bond-icon";
import { cn } from "@/lib/utils";

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
    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const isWishlistFull = tab.id === "wishlist" && wishlistCount > 0;

        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "relative flex items-center gap-2.5 py-3 px-5 rounded-xl font-orbitron text-[11px] font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap border",
              isActive
                ? "text-primary border-primary/30"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-primary/10 hover:bg-card/40"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="shopActiveTab"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.04))",
                  border: "1px solid hsl(var(--primary) / 0.25)",
                  boxShadow: "0 0 20px hsl(var(--primary) / 0.08), inset 0 1px 0 hsl(var(--primary) / 0.1)",
                }}
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <div className="relative z-10">
              {tab.isImage ? (
                <BondIcon size={16} className={isActive ? "drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]" : ""} />
              ) : Icon ? (
                <Icon className={cn("w-4 h-4", isWishlistFull && "text-rose-400")} />
              ) : null}
            </div>

            <span className="relative z-10">{tab.label}</span>

            {isWishlistFull && (
              <motion.span
                className="relative z-10 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[9px] font-bold"
                style={{
                  background: "hsl(350 80% 55% / 0.2)",
                  color: "hsl(350 80% 55%)",
                }}
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
