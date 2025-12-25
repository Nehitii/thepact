import { motion } from "framer-motion";
import { Sparkles, Puzzle } from "lucide-react";
import { BondIcon } from "@/components/ui/bond-icon";

type ShopTab = "cosmetics" | "modules" | "bonds";

interface ShopTabsProps {
  activeTab: ShopTab;
  onTabChange: (tab: ShopTab) => void;
}

const tabs = [
  { id: "cosmetics" as const, label: "Cosmetics", icon: Sparkles, isImage: false },
  { id: "modules" as const, label: "Modules", icon: Puzzle, isImage: false },
  { id: "bonds" as const, label: "Bonds", icon: null, isImage: true },
];

export function ShopTabs({ activeTab, onTabChange }: ShopTabsProps) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-card/30 border border-primary/20 backdrop-blur-xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-rajdhani text-sm font-medium transition-all duration-300 ${
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
              <Icon className="w-4 h-4 relative z-10" />
            ) : null}
            <span className="relative z-10 hidden sm:block">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
