import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Zap, ShieldCheck, TrendingUp, Star, Crown, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBondPacks, useBondBalance, useSpecialOffers } from "@/hooks/useShop";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { PromoCodeRedemption } from "./PromoCodeRedemption";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
      className="space-y-10 max-w-5xl mx-auto pb-16"
    >
      {/* --- HEADER SECTION (harmonized) --- */}
      <section className="relative overflow-hidden rounded-2xl p-1 border border-primary/15 bg-card/60 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-600/5" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-[0.2em] uppercase">
              <Sparkles className="w-3 h-3" /> Galactic Currency
            </div>
            <h1 className="text-2xl md:text-3xl font-orbitron font-black tracking-tighter text-foreground">
              BOND{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">CENTRAL</span>
            </h1>
            <p className="text-muted-foreground font-rajdhani text-sm max-w-sm">
              Fuel your journey with premium credits. Secure, fast, and cosmic.
            </p>
          </div>

          <div className="relative group">
            {/* Balance Card (harmonized) */}
            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-card/80 border border-primary/15 backdrop-blur-xl transition-all group-hover:border-primary/30">
              <div className="relative">
                <BondIcon size={48} className="relative z-10 drop-shadow-[0_0_10px_hsl(var(--primary)/0.4)]" />
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] text-primary font-orbitron uppercase tracking-widest mb-1">Total Balance</p>
                {loadingBalance ? (
                  <Skeleton className="h-8 w-20 bg-primary/10" />
                ) : (
                  <span className="text-3xl font-orbitron font-bold text-foreground tracking-tighter">
                    {balance?.balance?.toLocaleString() || 0}
                  </span>
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

      {/* --- SPECIAL OFFERS --- */}
      <AnimatePresence>
        {offers.length > 0 && (
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="flex items-center gap-3 font-orbitron text-xl text-foreground">
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
                  className="group relative p-[2px] rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-purple-500 to-amber-500 animate-shimmer bg-[length:200%_100%]" />
                  <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-[14px] bg-card/95 backdrop-blur-2xl">
                    <div className="relative h-24 w-24 shrink-0">
                      <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full" />
                      <img
                        src={offer.image_url || "/api/placeholder/128/128"}
                        className="relative z-10 w-full h-full object-contain"
                        alt=""
                      />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-1.5">
                      <h3 className="font-orbitron text-lg font-bold text-foreground group-hover:text-amber-400 transition-colors">
                        {offer.name}
                      </h3>
                      <p className="text-muted-foreground font-rajdhani text-sm line-clamp-2">{offer.description}</p>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-3 min-w-[160px]">
                      <div className="text-right font-orbitron">
                        <span className="block text-xs text-muted-foreground line-through">€{offer.original_price_eur}</span>
                        <span className="text-2xl font-black text-amber-400">€{offer.price_eur}</span>
                      </div>
                      <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase px-8 py-5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        Seize Pack <ChevronRight className="ml-1 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* --- STANDARD PACKS (harmonized) --- */}
      <section className="space-y-6">
        <h2 className="flex items-center gap-3 font-orbitron text-xl text-foreground px-2">
          <Zap className="text-primary fill-primary/20" /> Standard Supply
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array(6)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl bg-primary/5" />)
            : packs.map((pack) => {
                const isEpic = pack.bonus_percentage >= 30;

                return (
                  <motion.div
                    key={pack.id}
                    variants={itemVariants}
                    whileHover={{ y: -6 }}
                    className={cn(
                      "group relative p-6 rounded-2xl border transition-all duration-500",
                      isEpic
                        ? "bg-gradient-to-b from-amber-500/[0.06] to-transparent border-amber-500/30 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.15)]"
                        : "bg-card/60 border-primary/15 hover:border-primary/30",
                    )}
                  >
                    {/* Badge */}
                    {pack.bonus_percentage > 0 && (
                      <div
                        className={cn(
                          "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black font-orbitron z-20",
                          isEpic ? "bg-amber-500 text-black" : "bg-primary text-primary-foreground",
                        )}
                      >
                        {isEpic && <Crown className="inline-block w-3 h-3 mr-1 mb-0.5" />}+{pack.bonus_percentage}%
                        BONUS
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-center mb-4">
                        <div
                          className={cn(
                            "p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500",
                            isEpic ? "bg-amber-500/15" : "bg-primary/5",
                          )}
                        >
                          <BondIcon size={40} />
                        </div>
                      </div>

                      <div className="text-center space-y-1 mb-6">
                        <h3 className="text-2xl font-orbitron font-black text-foreground tracking-tighter">
                          {pack.bond_amount.toLocaleString()}
                        </h3>
                        <p className="text-xs font-rajdhani font-bold text-muted-foreground uppercase tracking-[0.2em]">
                          {pack.name}
                        </p>
                      </div>

                      <Button
                        className={cn(
                          "w-full py-5 rounded-xl font-orbitron font-black text-lg transition-all",
                          isEpic
                            ? "bg-amber-500 text-black hover:bg-amber-400"
                            : "bg-primary/10 hover:bg-primary hover:text-primary-foreground text-foreground border border-primary/20",
                        )}
                      >
                        €{pack.price_eur}
                      </Button>

                      <p className="mt-3 text-center text-[10px] text-muted-foreground font-rajdhani uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Instant Delivery
                      </p>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </section>

      {/* --- TRUST FOOTER (reduced padding) --- */}
      <motion.footer
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-primary/10"
      >
        {[
          { icon: ShieldCheck, color: "text-emerald-500", label: "Secure Protocol", desc: "Military grade encryption" },
          { icon: Zap, color: "text-primary", label: "Instant Infusion", desc: "Credits delivered in < 1s" },
          { icon: TrendingUp, color: "text-purple-500", label: "Market Leader", desc: "Best value per credit" },
        ].map((feature, i) => (
          <div key={i} className="flex flex-col items-center text-center p-3">
            <feature.icon className={cn("w-5 h-5 mb-1.5", feature.color)} />
            <h4 className="text-foreground font-orbitron text-[10px] uppercase tracking-wider">{feature.label}</h4>
            <p className="text-muted-foreground font-rajdhani text-[10px] uppercase">{feature.desc}</p>
          </div>
        ))}
      </motion.footer>
    </motion.div>
  );
}
