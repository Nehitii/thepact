import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Phone, 
  BookOpen, 
  ListTodo, 
  Heart, 
  Coins, 
  Check, 
  Lock,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShopModules, useUserModulePurchases, useBondBalance, usePurchaseModule } from "@/hooks/useShop";
import { Button } from "@/components/ui/button";

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  finance: TrendingUp,
  "the-call": Phone,
  journal: BookOpen,
  "todo-list": ListTodo,
  "track-health": Heart,
};

const rarityColors: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  common: { border: "border-slate-400/50", bg: "bg-slate-500/5", text: "text-slate-400", glow: "" },
  rare: { border: "border-blue-400/50", bg: "bg-blue-500/5", text: "text-blue-400", glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]" },
  epic: { border: "border-purple-400/50", bg: "bg-purple-500/5", text: "text-purple-400", glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]" },
  legendary: { border: "border-amber-400/50", bg: "bg-amber-500/5", text: "text-amber-400", glow: "shadow-[0_0_25px_rgba(245,158,11,0.2)]" },
};

export function ModulesShop() {
  const { user } = useAuth();
  const { data: modules = [] } = useShopModules();
  const { data: purchasedModuleIds = [] } = useUserModulePurchases(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const purchaseModule = usePurchaseModule();

  const handlePurchase = (moduleId: string, price: number) => {
    if (!user?.id) return;
    purchaseModule.mutate({
      userId: user.id,
      moduleId,
      price,
    });
  };

  const isOwned = (moduleId: string) => purchasedModuleIds.includes(moduleId);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-orbitron text-xl text-primary tracking-wider">
          Unlock Your Potential
        </h2>
        <p className="text-sm text-muted-foreground font-rajdhani">
          Expand your capabilities with powerful modules
        </p>
      </div>

      <div className="grid gap-4">
        {modules.map((module, index) => {
          const owned = isOwned(module.id);
          const rarity = rarityColors[module.rarity] || rarityColors.common;
          const canAfford = (balance?.balance || 0) >= module.price_bonds;
          const Icon = moduleIcons[module.key] || Sparkles;

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-6 rounded-2xl border-2 ${rarity.border} ${rarity.bg} ${rarity.glow} backdrop-blur-xl overflow-hidden transition-all hover:scale-[1.01]`}
            >
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
              
              <div className="relative flex items-center gap-6">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl ${rarity.bg} border ${rarity.border} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-8 h-8 ${rarity.text}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-orbitron text-lg text-foreground tracking-wide">
                      {module.name}
                    </h3>
                    <span className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded ${rarity.bg} ${rarity.text}`}>
                      {module.rarity}
                    </span>
                    {module.is_coming_soon && (
                      <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-rajdhani mt-1 line-clamp-2">
                    {module.description}
                  </p>
                </div>

                {/* Price & Action */}
                <div className="flex-shrink-0 text-right space-y-2">
                  {owned ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <Check className="w-5 h-5" />
                      <span className="font-rajdhani font-medium">Unlocked</span>
                    </div>
                  ) : module.is_coming_soon ? (
                    <div className="text-muted-foreground font-rajdhani">
                      Coming Soon
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 justify-end">
                        <Coins className="w-5 h-5 text-primary" />
                        <span className="font-orbitron text-lg text-primary">
                          {module.price_bonds}
                        </span>
                      </div>
                      {module.price_eur && (
                        <div className="text-xs text-muted-foreground">
                          or €{module.price_eur}
                        </div>
                      )}
                      <Button
                        size="sm"
                        disabled={!canAfford || purchaseModule.isPending}
                        onClick={() => handlePurchase(module.id, module.price_bonds)}
                        className="bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary mt-2"
                      >
                        {canAfford ? (
                          "Unlock"
                        ) : (
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Need More
                          </span>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
