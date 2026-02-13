import { useState, useMemo } from "react";
import {
  TrendingUp,
  Phone,
  BookOpen,
  ListTodo,
  Heart,
  Sparkles,
  Zap,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShopModules, useUserModulePurchases, useBondBalance } from "@/hooks/useShop";
import { Input } from "@/components/ui/input";
import { PurchaseConfirmModal, PurchaseItem } from "./PurchaseConfirmModal";
import { ShopLoadingState } from "./ShopLoadingState";
import { UnlockAnimation } from "./UnlockAnimation";
import { CyberItemCard } from "./CyberItemCard";
import { useShopTransaction } from "@/hooks/useShopTransaction";

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  finance: TrendingUp,
  "the-call": Phone,
  journal: BookOpen,
  "todo-list": ListTodo,
  "track-health": Heart,
};

const moduleFeatures: Record<string, string[]> = {
  finance: ["Track income & expenses", "Budget projections", "Recurring management"],
  "the-call": ["Motivational prompts", "Daily check-ins", "Mindset tools"],
  journal: ["Daily reflection", "Mood tracking", "Growth insights"],
  "todo-list": ["Priority tasks", "Deadline system", "Gamified scoring"],
  "track-health": ["Vitals dashboard", "Sleep monitoring", "Health analytics"],
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
  const transaction = useShopTransaction();

  const [searchQuery, setSearchQuery] = useState("");
  const [purchaseItem, setPurchaseItem] = useState<PurchaseItem | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);

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
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-rajdhani text-primary">Power Up Your Experience</span>
        </div>
        <h2 className="font-orbitron text-2xl text-foreground tracking-wider">Premium Modules</h2>
        <p className="text-sm text-muted-foreground font-rajdhani max-w-md mx-auto">
          Unlock powerful features to supercharge your productivity, wellness, and personal growth
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

      {/* Modules Grid - CyberItemCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map((module, index) => {
          const owned = isOwned(module.id);
          const canAfford = (balance?.balance || 0) >= module.price_bonds;
          const Icon = moduleIcons[module.key] || Sparkles;
          const features = moduleFeatures[module.key] || [];

          return (
            <CyberItemCard
              key={module.id}
              id={module.id}
              name={module.name}
              rarity={module.rarity}
              price={module.price_bonds}
              owned={owned}
              canAfford={canAfford}
              isComingSoon={module.is_coming_soon}
              itemType="module"
              index={index}
              preview={
                <div className="flex flex-col items-center gap-2">
                  <Icon className="w-10 h-10 text-primary/80" />
                  {features.length > 0 && (
                    <ul className="text-[10px] text-muted-foreground font-rajdhani space-y-0.5">
                      {features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-primary/50" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              }
              onPurchase={() => handlePurchaseClick(module)}
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
        </div>
      )}

      {/* Purchase Modal */}
      <PurchaseConfirmModal
        open={!!purchaseItem}
        onOpenChange={(open) => !open && setPurchaseItem(null)}
        item={purchaseItem}
        currentBalance={balance?.balance || 0}
        onConfirm={handleConfirmPurchase}
        isPending={transaction.isPending}
      />

      {/* Unlock Animation */}
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
