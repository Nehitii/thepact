import { useState, useMemo } from "react";
import { Puzzle, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShopModules, useUserModulePurchases, useBondBalance } from "@/hooks/useShop";
import { Input } from "@/components/ui/input";
import { ShopLoadingState } from "./ShopLoadingState";
import { UnlockAnimation } from "./UnlockAnimation";
import { ModuleCard } from "./ModuleCard";
import { useShopTransaction } from "@/hooks/useShopTransaction";
import { SignalLostEmpty } from "./SignalLostEmpty";

const moduleFeatures: Record<string, string[]> = {
  finance: ["Track income & expenses", "Budget projections", "Recurring management"],
  "the-call": ["Motivational prompts", "Daily check-ins", "Mindset tools"],
  journal: ["Daily reflection", "Mood tracking", "Growth insights"],
  "todo-list": ["Priority tasks", "Deadline system", "Gamified scoring"],
  "track-health": ["Vitals dashboard", "Sleep monitoring", "Health analytics"],
};

export function ModulesShop() {
  const { user } = useAuth();
  const { data: modules = [], isLoading } = useShopModules();
  const { data: purchasedModuleIds = [] } = useUserModulePurchases(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const transaction = useShopTransaction();

  const [searchQuery, setSearchQuery] = useState("");
  const [showUnlock, setShowUnlock] = useState(false);

  const handlePurchaseClick = (module: typeof modules[0]) => {
    transaction.initiatePurchase({
      itemId: module.id, itemName: module.name, itemType: "module", price: module.price_bonds, rarity: module.rarity,
    }).then((success) => { if (success) setShowUnlock(true); });
  };

  const filteredModules = useMemo(() => {
    if (!searchQuery) return modules;
    const query = searchQuery.toLowerCase();
    return modules.filter(m =>
      m.name.toLowerCase().includes(query) || m.description?.toLowerCase().includes(query) ||
      moduleFeatures[m.key]?.some(f => f.toLowerCase().includes(query))
    );
  }, [modules, searchQuery]);

  if (isLoading) return <ShopLoadingState type="modules" count={3} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Puzzle className="w-5 h-5 text-primary" />
          <h2 className="font-orbitron text-xl text-foreground tracking-wide">Premium Modules</h2>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search modules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50 border-primary/15 font-rajdhani h-9 text-sm" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModules.map((module, index) => (
          <ModuleCard key={module.id} module={module} owned={purchasedModuleIds.includes(module.id)}
            canAfford={(balance?.balance || 0) >= module.price_bonds} onPurchaseClick={() => handlePurchaseClick(module)} index={index} />
        ))}
      </div>

      {filteredModules.length === 0 && (
        <SignalLostEmpty subtitle={modules.length === 0 ? "No modules available" : "No modules match your search"} />
      )}

      {transaction.lastPurchased && (
        <UnlockAnimation isOpen={showUnlock} onComplete={() => { setShowUnlock(false); transaction.clearLastPurchased(); }}
          itemName={transaction.lastPurchased.name} itemType="module" rarity={transaction.lastPurchased.rarity} />
      )}
    </div>
  );
}
