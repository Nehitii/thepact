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
    <div className="flex gap-1 p-1 rounded-xl bg-card/30 border border-primary/20 backdrop-blur-xl overflow-x-auto hide-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-lg font-rajdhani text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              isActive 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary/70"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-lg"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {tab.isImage ? (
              <BondIcon size={16} className="relative z-10" />
            ) : Icon ? (
              <Icon className={`w-4 h-4 relative z-10 ${tab.id === 'wishlist' && wishlistCount > 0 ? 'text-rose-400' : ''}`} />
            ) : null}
            <span className="relative z-10 hidden sm:block">{tab.label}</span>
            
            {/* Wishlist badge */}
            {tab.id === 'wishlist' && wishlistCount > 0 && (
              <span className="relative z-10 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
