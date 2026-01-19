import { useState, useMemo } from "react";
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
  BarChart3,
  Bell,
  Shield,
  Target,
  Brain,
  Flame,
  Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShopModules, useUserModulePurchases, useBondBalance, usePurchaseModule } from "@/hooks/useShop";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { Input } from "@/components/ui/input";
import { PurchaseConfirmModal, PurchaseItem } from "./PurchaseConfirmModal";
import { ShopLoadingState } from "./ShopLoadingState";
import { WishlistButton } from "./WishlistButton";
import { UnlockAnimation } from "./UnlockAnimation";

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
    "Visual spending analytics",
    "Goal cost estimation & tracking"
  ],
  "the-call": [
    "Guided motivational prompts",
    "Daily check-in reminders",
    "Mindset reinforcement tools",
    "Progress milestone celebrations",
    "Personal accountability system"
  ],
  journal: [
    "Daily reflection entries",
    "Mood & context tracking",
    "Life area categorization",
    "Searchable entry history",
    "Personal growth insights"
  ],
  "todo-list": [
    "Priority-based task management",
    "Deadline & reminder system",
    "Category organization",
    "Completion streaks & stats",
    "Gamified productivity scoring"
  ],
  "track-health": [
    "Vital metrics dashboard",
    "Weight & body tracking",
    "Sleep quality monitoring",
    "Exercise logging system",
    "Health trend analytics"
  ],
};

const moduleCategories: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  finance: { label: "Productivity", icon: BarChart3 },
  "the-call": { label: "Mindset", icon: Brain },
  journal: { label: "Wellness", icon: Heart },
  "todo-list": { label: "Productivity", icon: Target },
  "track-health": { label: "Wellness", icon: Heart },
};

const rarityColors: Record<string, { border: string; bg: string; text: string; glow: string; accent: string }> = {
  common: { 
    border: "border-slate-400/50", 
    bg: "bg-slate-500/5", 
    text: "text-slate-400", 
    glow: "",
    accent: "from-slate-400/20 to-slate-600/10"
  },
  rare: { 
    border: "border-blue-400/50", 
    bg: "bg-blue-500/5", 
    text: "text-blue-400", 
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    accent: "from-blue-400/20 to-blue-600/10"
  },
  epic: { 
    border: "border-purple-400/50", 
    bg: "bg-purple-500/5", 
    text: "text-purple-400", 
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    accent: "from-purple-400/20 to-purple-600/10"
  },
  legendary: { 
    border: "border-amber-400/50", 
    bg: "bg-amber-500/5", 
    text: "text-amber-400", 
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.2)]",
    accent: "from-amber-400/20 to-amber-600/10"
  },
};

export function ModulesShop() {
  const { user } = useAuth();
  const { data: modules = [], isLoading } = useShopModules();
  const { data: purchasedModuleIds = [] } = useUserModulePurchases(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const purchaseModule = usePurchaseModule();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [purchaseItem, setPurchaseItem] = useState<PurchaseItem | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockedItem, setUnlockedItem] = useState<{ name: string; rarity: string } | null>(null);

  const handlePurchaseClick = (module: typeof modules[0]) => {
    const Icon = moduleIcons[module.key] || Sparkles;
    const rarity = rarityColors[module.rarity] || rarityColors.common;
    
    setPurchaseItem({
      id: module.id,
      name: module.name,
      type: "module",
      price: module.price_bonds,
      rarity: module.rarity,
      previewElement: (
        <div className={`w-12 h-12 rounded-xl ${rarity.bg} border ${rarity.border} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${rarity.text}`} />
        </div>
      ),
    });
  };

  const handleConfirmPurchase = () => {
    if (!user?.id || !purchaseItem) return;
    purchaseModule.mutate({
      userId: user.id,
      moduleId: purchaseItem.id,
      price: purchaseItem.price,
    }, {
      onSuccess: () => {
        setUnlockedItem({ name: purchaseItem.name, rarity: purchaseItem.rarity || "common" });
        setShowUnlock(true);
        setPurchaseItem(null);
      },
    });
  };

  const isOwned = (moduleId: string) => purchasedModuleIds.includes(moduleId);

  const filteredModules = useMemo(() => {
    if (!searchQuery) return modules;
    const query = searchQuery.toLowerCase();
    return modules.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query) ||
      moduleFeatures[m.key]?.some(f => f.toLowerCase().includes(query))
    );
  }, [modules, searchQuery]);

  if (isLoading) {
    return <ShopLoadingState type="modules" count={3} />;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-rajdhani text-primary">Power Up Your Experience</span>
        </div>
        <h2 className="font-orbitron text-2xl text-foreground tracking-wider">
          Premium Modules
        </h2>
        <p className="text-sm text-muted-foreground font-rajdhani max-w-md mx-auto">
          Unlock powerful features to supercharge your productivity, wellness, and personal growth journey
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card/50 border-primary/20 font-rajdhani"
        />
      </div>

      {/* Modules Grid */}
      <div className="space-y-6">
        {filteredModules.map((module, index) => {
          const owned = isOwned(module.id);
          const rarity = rarityColors[module.rarity] || rarityColors.common;
          const canAfford = (balance?.balance || 0) >= module.price_bonds;
          const Icon = moduleIcons[module.key] || Sparkles;
          const features = moduleFeatures[module.key] || [];
          const category = moduleCategories[module.key];

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl border-2 ${rarity.border} ${rarity.bg} ${rarity.glow} backdrop-blur-xl overflow-hidden premium-card`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${rarity.accent} pointer-events-none`} />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
              
              {/* Wishlist button */}
              {!owned && !module.is_coming_soon && (
                <div className="absolute top-4 right-4 z-10">
                  <WishlistButton itemId={module.id} itemType="module" />
                </div>
              )}
              
              <div className="relative p-6">
                <div className="flex items-start gap-5 mb-5">
                  <div className={`w-20 h-20 rounded-2xl ${rarity.bg} border-2 ${rarity.border} flex items-center justify-center flex-shrink-0 relative`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
                    <Icon className={`w-10 h-10 ${rarity.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <h3 className="font-orbitron text-xl text-foreground tracking-wide">
                        {module.name}
                      </h3>
                      <span className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded-full ${rarity.bg} ${rarity.text} border ${rarity.border}`}>
                        {module.rarity}
                      </span>
                      {module.is_coming_soon && (
                        <span className="text-xs uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    
                    {category && (
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
                        <category.icon className="w-3.5 h-3.5" />
                        <span className="font-rajdhani">{category.label}</span>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground font-rajdhani leading-relaxed">
                      {module.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right min-w-[140px]">
                    {owned ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
                        <Check className="w-5 h-5" />
                        <span className="font-rajdhani font-semibold">Unlocked</span>
                      </div>
                    ) : module.is_coming_soon ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 text-muted-foreground">
                        <Bell className="w-4 h-4" />
                        <span className="font-rajdhani">Notify Me</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 justify-end">
                          <BondIcon size={24} />
                          <span className="font-orbitron text-2xl text-primary font-bold">
                            {module.price_bonds.toLocaleString()}
                          </span>
                        </div>
                        {module.price_eur && (
                          <div className="text-xs text-muted-foreground font-rajdhani">
                            or €{module.price_eur.toFixed(2)}
                          </div>
                        )}
                        <Button
                          disabled={!canAfford}
                          onClick={() => handlePurchaseClick(module)}
                          className={`w-full mt-2 font-rajdhani font-semibold ${
                            canAfford 
                              ? "bg-primary/20 border-2 border-primary/40 hover:bg-primary/30 hover:border-primary/60 text-primary" 
                              : "bg-muted/30 border border-muted/50 text-muted-foreground"
                          }`}
                        >
                          {canAfford ? (
                            <span className="flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Unlock Module
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Need More Bonds
                            </span>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {features.length > 0 && (
                  <div className="pt-4 border-t border-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-primary/60" />
                      <span className="text-xs font-orbitron text-primary/60 uppercase tracking-wider">
                        What's Included
                      </span>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 module-features">
                      {features.map((feature, i) => (
                        <li 
                          key={i} 
                          className="text-sm text-muted-foreground font-rajdhani"
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredModules.length === 0 && (
        <div className="text-center py-16">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary/30" />
          <h3 className="font-orbitron text-lg text-muted-foreground mb-2">
            {modules.length === 0 ? "No Modules Available" : "No modules match your search"}
          </h3>
          <p className="text-sm text-muted-foreground/60 font-rajdhani">
            {modules.length === 0 
              ? "Check back soon for new modules to unlock!"
              : "Try a different search term"
            }
          </p>
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      <PurchaseConfirmModal
        open={!!purchaseItem}
        onOpenChange={(open) => !open && setPurchaseItem(null)}
        item={purchaseItem}
        currentBalance={balance?.balance || 0}
        onConfirm={handleConfirmPurchase}
        isPending={purchaseModule.isPending}
      />

      {/* Unlock Animation */}
      {unlockedItem && (
        <UnlockAnimation
          isOpen={showUnlock}
          onComplete={() => {
            setShowUnlock(false);
            setUnlockedItem(null);
          }}
          itemName={unlockedItem.name}
          itemType="module"
          rarity={unlockedItem.rarity}
        />
      )}
    </div>
  );
}
