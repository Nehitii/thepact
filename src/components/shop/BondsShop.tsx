import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Zap, ShieldCheck, TrendingUp, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBondPacks, useBondBalance, useSpecialOffers } from "@/hooks/useShop";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { PromoCodeRedemption } from "./PromoCodeRedemption";
import { Skeleton } from "@/components/ui/skeleton";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export function BondsShop() {
  const { user } = useAuth();
  const { data: packs = [], isLoading: loadingPacks } = useBondPacks();
  const { data: balance, isLoading: loadingBalance } = useBondBalance(user?.id);
  const { data: offers = [], isLoading: loadingOffers } = useSpecialOffers();

  const isLoading = loadingPacks || loadingOffers;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-10 max-w-4xl mx-auto p-4"
    >
      {/* 1. Header & Balance Section */}
      <section className="relative overflow-hidden rounded-3xl p-8 bg-slate-950 border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/10" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-orbitron font-black tracking-tighter text-white">
              BOND <span className="text-primary">CENTRAL</span>
            </h1>
            <p className="text-muted-foreground font-rajdhani text-sm uppercase tracking-widest">
              Upgrade your cosmic experience
            </p>
          </div>

          <div className="flex items-center gap-6 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="relative group">
              <BondIcon size={52} className="relative z-10 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-primary/70 font-orbitron uppercase">Credits Available</p>
              {loadingBalance ? (
                <Skeleton className="h-8 w-20 bg-white/10" />
              ) : (
                <p className="text-4xl font-orbitron font-bold text-white tabular-nums">
                  {balance?.balance?.toLocaleString() || 0}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Promo Code */}
      <motion.div variants={itemVariants}>
        <PromoCodeRedemption />
      </motion.div>

      {/* 3. Special Limited Offers */}
      <AnimatePresence>
        {offers.length > 0 && (
          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                </div>
                <h2 className="font-orbitron text-xl text-white tracking-wide">Timed Anomalies</h2>
              </div>
              <span className="text-[10px] font-orbitron text-amber-500 animate-pulse">LIMITED TIME</span>
            </div>

            <div className="grid gap-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="group relative p-1 rounded-2xl overflow-hidden bg-gradient-to-r from-amber-500/50 to-purple-500/50 hover:from-amber-400 hover:to-purple-400 transition-all duration-500"
                >
                  <div className="relative flex flex-col sm:flex-row items-center gap-6 p-6 rounded-[14px] bg-slate-950/90 backdrop-blur-xl">
                    <div className="relative w-24 h-24 shrink-0">
                      {offer.image_url ? (
                        <img
                          src={offer.image_url}
                          alt=""
                          className="w-full h-full rounded-xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500/20 to-transparent flex items-center justify-center border border-amber-500/20">
                          <Sparkles className="w-10 h-10 text-amber-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-orbitron text-xl text-white group-hover:text-amber-400 transition-colors">
                        {offer.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-rajdhani line-clamp-2 max-w-md">
                        {offer.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-center sm:items-end gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground line-through opacity-50">
                          €{offer.original_price_eur}
                        </span>
                        <span className="text-3xl font-orbitron font-bold text-amber-400">€{offer.price_eur}</span>
                      </div>
                      <Button className="w-full sm:w-auto px-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-tighter">
                        Claim Offer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 4. Standard Bond Packs */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Zap className="w-5 h-5 text-primary fill-primary/20" />
          </div>
          <h2 className="font-orbitron text-xl text-white tracking-wide">Standard Supply</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array(6)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-[240px] rounded-2xl bg-white/5" />)
            : packs.map((pack) => {
                const isBestValue = pack.bonus_percentage >= 30;
                return (
                  <motion.div
                    key={pack.id}
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                      isBestValue
                        ? "border-amber-500/50 bg-amber-500/[0.03] shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]"
                        : "border-white/5 bg-white/[0.02] hover:border-primary/50"
                    }`}
                  >
                    {/* Visual Flourish for Premium Packs */}
                    {isBestValue && (
                      <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/20 blur-3xl rounded-full" />
                    )}

                    <div className="relative flex flex-col h-full space-y-6">
                      <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-xl ${isBestValue ? "bg-amber-500/20" : "bg-primary/20"}`}>
                          <BondIcon size={32} />
                        </div>
                        {pack.bonus_percentage > 0 && (
                          <div
                            className={`px-3 py-1 rounded-full text-[10px] font-black font-orbitron border animate-bounce ${
                              isBestValue
                                ? "bg-amber-500/20 border-amber-500 text-amber-400"
                                : "bg-primary/20 border-primary text-primary"
                            }`}
                          >
                            +{pack.bonus_percentage}% BONUS
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-3xl font-orbitron font-bold text-white tabular-nums">
                          {pack.bond_amount.toLocaleString()}
                        </h3>
                        <p className="text-xs font-rajdhani font-semibold text-muted-foreground uppercase tracking-widest group-hover:text-white/80 transition-colors">
                          {pack.name}
                        </p>
                      </div>

                      <Button
                        className={`w-full mt-auto py-6 font-orbitron font-bold text-lg transition-all ${
                          isBestValue
                            ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                            : "bg-white/10 hover:bg-primary text-white"
                        }`}
                      >
                        €{pack.price_eur}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </section>

      {/* 5. Footer Trust Info */}
      <motion.footer
        variants={itemVariants}
        className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-white/5"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-rajdhani uppercase tracking-tight">Secure Encryption</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs font-rajdhani uppercase tracking-tight">Instant Delivery</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <span className="text-xs font-rajdhani uppercase tracking-tight">Best Market Rate</span>
        </div>
      </motion.footer>
    </motion.div>
  );
}
