import { motion } from "framer-motion";
import { Sparkles, Gift, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBondPacks, useBondBalance, useSpecialOffers } from "@/hooks/useShop";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";

export function BondsShop() {
  const { user } = useAuth();
  const { data: packs = [] } = useBondPacks();
  const { data: balance } = useBondBalance(user?.id);
  const { data: offers = [] } = useSpecialOffers();

  return (
    <div className="space-y-8">
      {/* Current Balance */}
      <div className="text-center">
        <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/30 backdrop-blur-xl">
          <div className="relative">
            <BondIcon size={40} />
            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
          </div>
          <div className="text-left">
            <div className="text-xs text-primary/60 uppercase tracking-wider font-orbitron">
              Your Balance
            </div>
            <div className="text-3xl font-orbitron font-bold text-primary drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
              {balance?.balance || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Special Offers */}
      {offers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <h2 className="font-orbitron text-lg text-foreground tracking-wide">
              Special Offers
            </h2>
          </div>
          <div className="grid gap-4">
            {offers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative p-6 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card/50 to-amber-500/5 backdrop-blur-xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full" />
                
                <div className="relative flex items-center gap-6">
                  {offer.image_url ? (
                    <img 
                      src={offer.image_url} 
                      alt={offer.name}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-amber-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-orbitron text-lg text-foreground">{offer.name}</h3>
                    {offer.description && (
                      <p className="text-sm text-muted-foreground font-rajdhani mt-1">
                        {offer.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right space-y-2">
                    {offer.original_price_eur && offer.price_eur && (
                      <div className="text-sm text-muted-foreground line-through">
                        €{offer.original_price_eur}
                      </div>
                    )}
                    {offer.price_eur && (
                      <div className="text-xl font-orbitron text-amber-400">
                        €{offer.price_eur}
                      </div>
                    )}
                    <Button 
                      className="bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-400"
                    >
                      Get Offer
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Bond Packs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="font-orbitron text-lg text-foreground tracking-wide">
            Bond Packs
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {packs.map((pack, index) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-6 rounded-2xl border-2 backdrop-blur-xl overflow-hidden transition-all hover:scale-[1.02] ${
                pack.bonus_percentage >= 30
                  ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card/50 to-amber-500/5"
                  : pack.bonus_percentage >= 20
                    ? "border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-card/50 to-purple-500/5"
                    : "border-primary/30 bg-card/30"
              }`}
            >
              {/* Bonus badge */}
              {pack.bonus_percentage > 0 && (
                <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-orbitron ${
                  pack.bonus_percentage >= 30
                    ? "bg-amber-500/20 text-amber-400"
                    : pack.bonus_percentage >= 20
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-blue-500/20 text-blue-400"
                }`}>
                  +{pack.bonus_percentage}%
                </div>
              )}

              {/* Glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full ${
                pack.bonus_percentage >= 30
                  ? "bg-amber-500/20"
                  : pack.bonus_percentage >= 20
                    ? "bg-purple-500/20"
                    : "bg-primary/10"
              }`} />

              <div className="relative space-y-4">
                {/* Amount */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <BondIcon size={32} />
                    <div className={`absolute inset-0 blur-lg rounded-full ${
                      pack.bonus_percentage >= 30 ? "bg-amber-500/30" : "bg-primary/30"
                    }`} />
                  </div>
                  <div className={`text-2xl font-orbitron font-bold ${
                    pack.bonus_percentage >= 30 ? "text-amber-400" : "text-primary"
                  }`}>
                    {pack.bond_amount.toLocaleString()}
                  </div>
                </div>

                {/* Name */}
                <div className="font-rajdhani font-medium text-foreground">
                  {pack.name}
                </div>

                {/* Price */}
                <Button
                  className={`w-full ${
                    pack.bonus_percentage >= 30
                      ? "bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30 text-amber-400"
                      : "bg-primary/20 border-primary/30 hover:bg-primary/30 text-primary"
                  }`}
                >
                  €{pack.price_eur}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
          <p className="text-xs text-muted-foreground font-rajdhani">
            1 € ≈ 100 Bonds • Payments are secure and instant
          </p>
        </div>
      </div>
    </div>
  );
}
