import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Zap, ShieldCheck, TrendingUp, Star, Crown, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBondPacks, useBondBalance, useSpecialOffers } from "@/hooks/useShop";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { PromoCodeRedemption } from "./PromoCodeRedemption";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"; // Utilitaire classique pour condenser les classes

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
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
      className="space-y-12 max-w-5xl mx-auto p-6 pb-20"
    >
      {/* --- HEADER SECTION --- */}
      <section className="relative overflow-hidden rounded-[2.5rem] p-1 border border-white/10 shadow-2xl bg-slate-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-purple-600/20" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-[0.2em] uppercase">
              <Sparkles className="w-3 h-3" /> Galactic Currency
            </div>
            <h1 className="text-4xl md:text-6xl font-orbitron font-black tracking-tighter text-white">
              BOND{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">CENTRAL</span>
            </h1>
            <p className="text-muted-foreground font-rajdhani text-lg max-w-sm">
              Fuel your journey with premium credits. Secure, fast, and cosmic.
            </p>
          </div>

          <div className="relative group">
            {/* Balance Card */}
            <div className="flex items-center gap-6 px-8 py-6 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl transition-all group-hover:border-primary/50">
              <div className="relative">
                <BondIcon size={64} className="relative z-10 drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] text-primary font-orbitron uppercase tracking-widest mb-1">Total Balance</p>
                {loadingBalance ? (
                  <Skeleton className="h-10 w-24 bg-white/10" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-orbitron font-bold text-white tracking-tighter">
                      {balance?.balance?.toLocaleString() || 0}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PROMO CODE --- */}
      <motion.div variants={itemVariants} className="max-w-md mx-auto w-full">
        <PromoCodeRedemption />
      </motion.div>

      {/* --- SPECIAL OFFERS (TIMED ANOMALIES) --- */}
      <AnimatePresence>
        {offers.length > 0 && (
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="flex items-center gap-3 font-orbitron text-2xl text-white">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                Timed Anomalies
              </h2>
            </div>

            <div className="grid gap-6">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="group relative p-[2px] rounded-3xl overflow-hidden transition-all hover:scale-[1.01]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-purple-500 to-amber-500 animate-shimmer bg-[length:200%_100%]" />
                  <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 rounded-[22px] bg-slate-950/95 backdrop-blur-2xl">
                    <div className="relative h-32 w-32 shrink-0">
                      <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
                      <img
                        src={offer.image_url || "/api/placeholder/128/128"}
                        className="relative z-10 w-full h-full object-contain"
                        alt=""
                      />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                      <h3 className="font-orbitron text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">
                        {offer.name}
                      </h3>
                      <p className="text-muted-foreground font-rajdhani text-lg line-clamp-2">{offer.description}</p>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-4 min-w-[200px]">
                      <div className="text-right font-orbitron">
                        <span className="block text-sm text-white/40 line-through">€{offer.original_price_eur}</span>
                        <span className="text-4xl font-black text-amber-400 italic">€{offer.price_eur}</span>
                      </div>
                      <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase italic px-10 py-7 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                        Seize Pack <ChevronRight className="ml-2 w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* --- STANDARD PACKS --- */}
      <section className="space-y-8">
        <h2 className="flex items-center gap-3 font-orbitron text-2xl text-white px-2">
          <Zap className="text-primary fill-primary/20" /> Standard Supply
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading
            ? Array(6)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-80 rounded-3xl bg-white/5" />)
            : packs.map((pack) => {
                // Définition d'un pack "Epic" vs "Normal"
                const isEpic = pack.bonus_percentage >= 30;

                return (
                  <motion.div
                    key={pack.id}
                    variants={itemVariants}
                    whileHover={{ y: -10 }}
                    className={cn(
                      "group relative p-8 rounded-[2rem] border transition-all duration-500",
                      isEpic
                        ? "bg-gradient-to-b from-amber-500/[0.08] to-transparent border-amber-500/50 shadow-[0_20px_50px_-20px_rgba(245,158,11,0.2)]"
                        : "bg-white/[0.02] border-white/10 hover:border-primary/40",
                    )}
                  >
                    {/* Badge Différencié */}
                    {pack.bonus_percentage > 0 && (
                      <div
                        className={cn(
                          "absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black font-orbitron z-20 shadow-xl",
                          isEpic ? "bg-amber-500 text-black" : "bg-primary text-white",
                        )}
                      >
                        {isEpic && <Crown className="inline-block w-3 h-3 mr-1 mb-0.5" />}+{pack.bonus_percentage}%
                        BONUS
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-center mb-6">
                        <div
                          className={cn(
                            "p-5 rounded-3xl transition-transform group-hover:scale-110 duration-500",
                            isEpic ? "bg-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]" : "bg-white/5",
                          )}
                        >
                          <BondIcon size={48} />
                        </div>
                      </div>

                      <div className="text-center space-y-1 mb-8">
                        <h3 className="text-4xl font-orbitron font-black text-white tracking-tighter">
                          {pack.bond_amount.toLocaleString()}
                        </h3>
                        <p className="text-xs font-rajdhani font-bold text-muted-foreground uppercase tracking-[0.2em]">
                          {pack.name}
                        </p>
                      </div>

                      <Button
                        className={cn(
                          "w-full py-7 rounded-2xl font-orbitron font-black text-xl transition-all",
                          isEpic
                            ? "bg-amber-500 text-black hover:bg-amber-400"
                            : "bg-white/5 hover:bg-primary text-white",
                        )}
                      >
                        €{pack.price_eur}
                      </Button>

                      <p className="mt-4 text-center text-[10px] text-muted-foreground font-rajdhani uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Instant Delivery
                      </p>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </section>

      {/* --- TRUST FOOTER --- */}
      <motion.footer
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/5"
      >
        {[
          { icon: ShieldCheck, color: "text-emerald-500", label: "Secure Protocol", desc: "Military grade encryption" },
          { icon: Zap, color: "text-primary", label: "Instant Infusion", desc: "Credits delivered in < 1s" },
          { icon: TrendingUp, color: "text-purple-500", label: "Market Leader", desc: "Best value per credit" },
        ].map((feature, i) => (
          <div key={i} className="flex flex-col items-center text-center p-4">
            <feature.icon className={cn("w-6 h-6 mb-2", feature.color)} />
            <h4 className="text-white font-orbitron text-xs uppercase tracking-wider">{feature.label}</h4>
            <p className="text-muted-foreground font-rajdhani text-[10px] uppercase">{feature.desc}</p>
          </div>
        ))}
      </motion.footer>
    </motion.div>
  );
}
