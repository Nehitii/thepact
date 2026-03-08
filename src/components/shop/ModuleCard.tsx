import { motion } from "framer-motion";
import { TrendingUp, Phone, BookOpen, ListTodo, Heart, Check, Lock, Sparkles, Zap, Bell } from "lucide-react";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";
import { Button } from "@/components/ui/button";
import { getRarity } from "./shopRarity";
import { cn } from "@/lib/utils";

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  finance: TrendingUp, "the-call": Phone, journal: BookOpen, "todo-list": ListTodo, "track-health": Heart,
};

const moduleFeatures: Record<string, string[]> = {
  finance: ["Track income & expenses monthly", "Smart budget projections", "Recurring transaction management"],
  "the-call": ["Guided motivational prompts", "Daily check-in reminders", "Mindset reinforcement tools"],
  journal: ["Daily reflection entries", "Mood & context tracking", "Personal growth insights"],
  "todo-list": ["Priority-based task management", "Deadline & reminder system", "Gamified productivity scoring"],
  "track-health": ["Vital metrics dashboard", "Sleep quality monitoring", "Health trend analytics"],
};

interface ModuleCardProps {
  module: {
    id: string; key: string; name: string; description?: string | null;
    price_bonds: number; price_eur?: number | null; rarity: string; is_coming_soon?: boolean;
  };
  owned: boolean;
  canAfford: boolean;
  onPurchaseClick: () => void;
  index?: number;
}

export function ModuleCard({ module, owned, canAfford, onPurchaseClick, index = 0 }: ModuleCardProps) {
  const Icon = moduleIcons[module.key] || Sparkles;
  const features = moduleFeatures[module.key] || [];
  const r = getRarity(module.rarity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative rounded-2xl overflow-hidden"
      style={{
        background: "hsl(var(--card) / 0.8)",
        border: `1px solid ${r.border}`,
      }}
    >
      {/* Rarity top stripe */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${r.accent}, transparent)` }} />

      {/* Inner glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${r.glowStrong}, transparent 60%)` }} />

      {/* Wishlist */}
      {!owned && !module.is_coming_soon && (
        <div className="absolute top-4 right-4 z-10">
          <WishlistButton itemId={module.id} itemType="module" />
        </div>
      )}

      <div className="relative p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: r.glow, border: `1px solid ${r.border}`, color: r.accent }}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-orbitron text-base font-bold text-foreground tracking-wide">{module.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border", r.badgeBg, r.badgeText, r.badgeBorder)}>
                {module.rarity}
              </span>
              {module.is_coming_soon && (
                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  Coming Soon
                </span>
              )}
              {owned && (
                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1"
                  style={{ background: "hsl(142 70% 50% / 0.12)", color: "hsl(142 70% 50%)", border: "1px solid hsl(142 70% 50% / 0.25)" }}>
                  <Check className="w-3 h-3" /> Owned
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="font-orbitron text-2xl font-bold flex items-center gap-2" style={{ color: r.accent }}>
          {owned ? (
            <span className="flex items-center gap-2 text-lg" style={{ color: "hsl(142 70% 50%)" }}>
              <Check className="w-5 h-5" /> Unlocked
            </span>
          ) : module.is_coming_soon ? (
            <span className="text-muted-foreground text-lg">TBA</span>
          ) : (
            <><BondIcon size={22} />{module.price_bonds.toLocaleString()}</>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {(features.length > 0 ? features : module.description ? [module.description] : ["Premium module features"]).map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-rajdhani">
              <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.accent }} />
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {owned ? (
          <Button disabled className="w-full h-11 rounded-xl font-rajdhani text-sm"
            style={{ background: "hsl(142 70% 50% / 0.1)", color: "hsl(142 70% 50%)", border: "1px solid hsl(142 70% 50% / 0.2)" }}>
            <Check className="w-4 h-4 mr-2" /> Already Owned
          </Button>
        ) : module.is_coming_soon ? (
          <Button disabled className="w-full h-11 rounded-xl font-rajdhani text-sm"
            style={{ background: "hsl(45 100% 55% / 0.1)", color: "hsl(45 100% 55%)", border: "1px solid hsl(45 100% 55% / 0.2)" }}>
            <Bell className="w-4 h-4 mr-2" /> Coming Soon
          </Button>
        ) : (
          <Button onClick={onPurchaseClick} disabled={!canAfford}
            className="w-full h-11 rounded-xl font-rajdhani text-sm font-semibold transition-all"
            style={{
              background: canAfford ? r.glow : "hsl(var(--muted) / 0.3)",
              color: canAfford ? r.accent : "hsl(var(--muted-foreground))",
              border: `1px solid ${canAfford ? r.border : "hsl(var(--border))"}`,
            }}>
            {canAfford ? <><Zap className="w-4 h-4 mr-2" />Purchase</> : <><Lock className="w-4 h-4 mr-2" />Need More Bonds</>}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
