import { useState, useMemo } from "react";
import { TrendingUp, Phone, BookOpen, ListTodo, Heart, Sparkles, Zap, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShopModules, useUserModulePurchases } from "@/hooks/useShop";
import { Input } from "@/components/ui/input";
import { PurchaseConfirmModal, PurchaseItem } from "./PurchaseConfirmModal";
import { ShopLoadingState } from "./ShopLoadingState";
import { UnlockAnimation } from "./UnlockAnimation";
import { CyberItemCard } from "./CyberItemCard";
import { useShopTransaction } from "@/hooks/useShopTransaction";

const moduleIcons: Record<string, any> = {
  finance: TrendingUp,
  "the-call": Phone,
  journal: BookOpen,
  "todo-list": ListTodo,
  "track-health": Heart,
};

const moduleFeatures: Record<string, string[]> = {
  finance: ["Track income & expenses", "Smart budget projections", "Recurring transaction management"],
  "the-call": ["Guided motivational prompts", "Daily check-in reminders", "Mindset reinforcement tools"],
  journal: ["Daily reflection entries", "Mood & context tracking", "Personal growth insights"],
  "todo-list": ["Priority-based task management", "Deadline & reminder system", "Gamified productivity scoring"],
  "track-health": ["Vital metrics dashboard", "Sleep quality monitoring", "Health trend analytics"],
};

export function ModulesShop() {
  const { user } = useAuth();
  const { data: modules = [], isLoading } = useShopModules();
  const { data: purchasedModuleIds = [] } = useUserModulePurchases(user?.id);
  const transaction = useShopTransaction();

  const [searchQuery, setSearchQuery] = useState("");
  const [purchaseItem, setPurchaseItem] = useState<PurchaseItem | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);

  const handlePurchaseClick = (module: (typeof modules)[0]) => {
    const Icon = moduleIcons[module.key] || Sparkles;
    setPurchaseItem({
      id: module.id,
      name: module.name,
      type: "module",
      price: module.price_bonds,
      rarity: module.rarity,
      previewElement: (
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      ),
    });
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseItem) return;
    const success = await transaction.initiatePurchase({
      itemId: purchaseItem.id,
      itemName: purchaseItem.name,
      itemType: "module",
      price: purchaseItem.price,
      rarity: purchaseItem.rarity,
    });
    if (success) {
      setShowUnlock(true);
      setPurchaseItem(null);
    }
  };

  const isOwned = (moduleId: string) => purchasedModuleIds.includes(moduleId);

  const filteredModules = useMemo(() => {
    if (!searchQuery) return modules;
    return modules.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [modules, searchQuery]);

  if (isLoading) return <ShopLoadingState type="modules" count={3} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-rajdhani text-primary">Power Up Your Experience</span>
        </div>
        <h2 className="font-orbitron text-2xl text-foreground tracking-wider">Premium Modules</h2>
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map((module, i) => {
          const Icon = moduleIcons[module.key] || Sparkles;
          const features = moduleFeatures[module.key] || [];
          return (
            <CyberItemCard
              key={module.id}
              id={module.id}
              name={module.name}
              rarity={module.rarity}
              price={module.price_bonds}
              owned={isOwned(module.id)}
              canAfford={transaction.canAfford(module.price_bonds)}
              isComingSoon={module.is_coming_soon}
              itemType="module"
              index={i}
              onPurchase={() => handlePurchaseClick(module)}
              preview={
                <div className="flex flex-col items-center gap-3">
                  <Icon className="w-10 h-10 text-primary/80" />
                  <ul className="text-[10px] text-muted-foreground font-rajdhani space-y-1">
                    {features.slice(0, 3).map((f, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-primary/50" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              }
            />
          );
        })}
      </div>

      <PurchaseConfirmModal
        open={!!purchaseItem}
        onOpenChange={(v) => !v && setPurchaseItem(null)}
        item={purchaseItem}
        currentBalance={transaction.currentBalance}
        onConfirm={handleConfirmPurchase}
        isPending={transaction.isPending}
      />

      {transaction.lastPurchased && (
        <UnlockAnimation
          isOpen={showUnlock}
          onComplete={() => {
            setShowUnlock(false);
            transaction.clearLastPurchased();
          }}
          itemName={transaction.lastPurchased.name}
          itemType="module"
          rarity={transaction.lastPurchased.rarity}
        />
      )}
    </div>
  );
}
