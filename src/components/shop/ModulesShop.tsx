import { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Phone, 
  BookOpen, 
  ListTodo, 
  Heart, 
  Sparkles,
  Zap,
  Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShopModules, useUserModulePurchases, useBondBalance, usePurchaseModule } from "@/hooks/useShop";
import { Input } from "@/components/ui/input";
import { BondIcon } from "@/components/ui/bond-icon";
import { PurchaseConfirmModal, PurchaseItem } from "./PurchaseConfirmModal";
import { ShopLoadingState } from "./ShopLoadingState";
import { UnlockAnimation } from "./UnlockAnimation";
import { ModuleCard } from "./ModuleCard";

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

const rarityColors: Record<string, { border: string; bg: string; text: string }> = {
  common: { border: "border-slate-400/50", bg: "bg-slate-500/5", text: "text-slate-400" },
  rare: { border: "border-blue-400/50", bg: "bg-blue-500/5", text: "text-blue-400" },
  epic: { border: "border-purple-400/50", bg: "bg-purple-500/5", text: "text-purple-400" },
  legendary: { border: "border-amber-400/50", bg: "bg-amber-500/5", text: "text-amber-400" },
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

      {/* Modules Grid - New Card Design */}
      <div className="modules-grid">
        {filteredModules.map((module, index) => {
          const owned = isOwned(module.id);
          const canAfford = (balance?.balance || 0) >= module.price_bonds;

          return (
            <ModuleCard
              key={module.id}
              module={module}
              owned={owned}
              canAfford={canAfford}
              onPurchaseClick={() => handlePurchaseClick(module)}
              index={index}
            />
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
