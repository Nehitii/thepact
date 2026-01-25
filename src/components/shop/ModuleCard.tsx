import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Phone, 
  BookOpen, 
  ListTodo, 
  Heart, 
  Check, 
  Lock,
  Sparkles,
  Zap,
  Bell
} from "lucide-react";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  finance: TrendingUp,
  "the-call": Phone,
  journal: BookOpen,
  "todo-list": ListTodo,
  "track-health": Heart,
};

const moduleFeatures: Record<string, string[]> = {
  finance: [
    "Track income & expenses monthly",
    "Smart budget projections",
    "Recurring transaction management",
  ],
  "the-call": [
    "Guided motivational prompts",
    "Daily check-in reminders",
    "Mindset reinforcement tools",
  ],
  journal: [
    "Daily reflection entries",
    "Mood & context tracking",
    "Personal growth insights",
  ],
  "todo-list": [
    "Priority-based task management",
    "Deadline & reminder system",
    "Gamified productivity scoring",
  ],
  "track-health": [
    "Vital metrics dashboard",
    "Sleep quality monitoring",
    "Health trend analytics",
  ],
};

// Rarity hue configurations for dynamic glow colors
const rarityHues: Record<string, { hue: number; saturation: string; lightness: string }> = {
  common: { hue: 210, saturation: "10%", lightness: "50%" },
  rare: { hue: 210, saturation: "82%", lightness: "51%" },
  epic: { hue: 270, saturation: "82%", lightness: "51%" },
  legendary: { hue: 45, saturation: "82%", lightness: "51%" },
};

interface ModuleCardProps {
  module: {
    id: string;
    key: string;
    name: string;
    description?: string | null;
    price_bonds: number;
    price_eur?: number | null;
    rarity: string;
    is_coming_soon?: boolean;
  };
  owned: boolean;
  canAfford: boolean;
  onPurchaseClick: () => void;
  index?: number;
}

export function ModuleCard({ module, owned, canAfford, onPurchaseClick, index = 0 }: ModuleCardProps) {
  const Icon = moduleIcons[module.key] || Sparkles;
  const features = moduleFeatures[module.key] || [];
  const rarityConfig = rarityHues[module.rarity] || rarityHues.common;

  const getRarityBadgeClasses = () => {
    switch (module.rarity) {
      case "legendary":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "epic":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "rare":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="module-card-wrapper"
      style={{
        "--hue": rarityConfig.hue,
        "--saturation": rarityConfig.saturation,
        "--lightness": rarityConfig.lightness,
      } as React.CSSProperties}
    >
      <div className="module-card">
        {/* Wishlist button */}
        {!owned && !module.is_coming_soon && (
          <div className="absolute top-3 right-3 z-10">
            <WishlistButton itemId={module.id} itemType="module" />
          </div>
        )}

        {/* Header with icon and name */}
        <div className="module-card__header">
          <div className="module-card__icon">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="module-card__heading">{module.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRarityBadgeClasses()}`}>
                {module.rarity}
              </span>
              {module.is_coming_soon && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[hsl(var(--difficulty-medium)/.2)] text-[hsl(var(--difficulty-medium))] border border-[hsl(var(--difficulty-medium)/.3)]">
                  Coming Soon
                </span>
              )}
              {owned && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[hsl(var(--health)/.2)] text-[hsl(var(--health))] border border-[hsl(var(--health)/.3)] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Owned
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="module-card__price">
          {owned ? (
            <div className="flex items-center gap-2 text-health">
              <Check className="w-5 h-5" />
              <span>Unlocked</span>
            </div>
          ) : module.is_coming_soon ? (
            <span className="text-muted-foreground">TBA</span>
          ) : (
            <div className="flex items-center gap-2">
              <BondIcon size={20} />
              <span>{module.price_bonds.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Features list */}
        <ul className="module-card__bullets flow" role="list">
          {features.length > 0 ? (
            features.map((feature, i) => (
              <li key={i}>{feature}</li>
            ))
          ) : module.description ? (
            <li>{module.description}</li>
          ) : (
            <li>Premium module features</li>
          )}
        </ul>

        {/* CTA Button */}
        {owned ? (
          <button className="module-card__cta module-card__cta--owned" disabled>
            <Check className="w-4 h-4 mr-2" />
            Already Owned
          </button>
        ) : module.is_coming_soon ? (
          <button className="module-card__cta module-card__cta--coming-soon" disabled>
            <Bell className="w-4 h-4 mr-2" />
            Coming Soon
          </button>
        ) : (
          <button 
            className={`module-card__cta ${!canAfford ? 'module-card__cta--disabled' : ''}`}
            onClick={onPurchaseClick}
            disabled={!canAfford}
          >
            {canAfford ? (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Purchase
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Need More Bonds
              </>
            )}
          </button>
        )}

        {/* Overlay for effects */}
        <div className="module-card__overlay" />
      </div>
    </motion.div>
  );
}
