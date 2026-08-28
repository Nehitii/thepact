import { useState, useMemo } from "react";
import { Puzzle, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShopModules, useUserModulePurchases, useBondBalance } from "@/domaines/boutique/hooks/useShop";
import { Input } from "@/components/ui/input";
import { ShopLoadingState } from "./ShopLoadingState";
import { UnlockAnimation } from "./UnlockAnimation";
import { ModuleCard } from "./ModuleCard";
import { useShopTransaction } from "@/domaines/boutique/hooks/useShopTransaction";
import { SignalLostEmpty } from "./SignalLostEmpty";
import { useModuleFeatures } from "@/domaines/boutique/logique/moduleFeatures";
import { useTranslation } from "react-i18next";

export function ModulesShop() {
  const { t } = useTranslation();
  /* La recherche interroge desormais le texte reellement affiche.
     Elle portait sur une seconde liste, plus courte : une phrase lue
     a l ecran pouvait ne rien trouver. */
  const promessesDe = useModuleFeatures();
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
      promessesDe(m.key).some(f => f.toLowerCase().includes(query))
    );
  }, [modules, searchQuery, promessesDe]);

  if (isLoading) return <ShopLoadingState type="modules" count={3} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Puzzle className="w-5 h-5 text-primary" />
          <h2 className="font-orbitron text-xl text-foreground tracking-wide">{t("shop.modules.title", "Modules Premium")}</h2>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("shop.modules.search", "Chercher un module")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
        <SignalLostEmpty
          subtitle={modules.length === 0
            ? t("shop.cosmetics.noneYet", { type: t("shop.tabs.modules", "Modules").toLowerCase(), defaultValue: "Aucun module disponible" })
            : t("shop.cosmetics.noneMatch", { type: t("shop.tabs.modules", "Modules").toLowerCase(), defaultValue: "Aucun module ne correspond" })}
        />
      )}

      {transaction.lastPurchased && (
        <UnlockAnimation isOpen={showUnlock} onComplete={() => { setShowUnlock(false); transaction.clearLastPurchased(); }}
          itemName={transaction.lastPurchased.name} itemType="module" rarity={transaction.lastPurchased.rarity} />
      )}
    </div>
  );
}
