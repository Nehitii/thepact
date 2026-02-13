import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Zap, ShieldCheck, Ticket, Star, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBondPacks, useBondBalance, useSpecialOffers } from "@/hooks/useShop";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { PromoCodeRedemption } from "./PromoCodeRedemption";
import { Skeleton } from "@/components/ui/skeleton";

export function BondsShop() {
  const { user } = useAuth();
  const { data: packs = [], isLoading: loadingPacks } = useBondPacks();
  const { data: balance, isLoading: loadingBalance } = useBondBalance(user?.id);
  const { data: offers = [], isLoading: loadingOffers } = useSpecialOffers();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-12 pb-20 p-4">
      {/* HEADER SECTION - FOCUS SUR LE SOLDE */}
      <header className="flex flex-col lg:flex-row gap-8 items-end justify-between border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-orbitron text-sm tracking-[0.3em]">
            <span className="w-8 h-[1px] bg-primary" />
            MARKETPLACE
          </div>
          <h1 className="text-5xl font-orbitron font-black text-white italic tracking-tighter">
            GET <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">BONDS</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* REDEEM CODE - VERSION RÉDUITE & ÉLÉGANTE */}
          <div className="w-full sm:w-80 group">
            <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-1 focus-within:border-primary/50 transition-all">
              <PromoCodeRedemption />
              {/* Note: Ajustez le composant interne pour qu'il soit minimaliste (input + petite flèche) */}
            </div>
          </div>

          <div className="h-16 flex items-center gap-4 px-6 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-2xl min-w-[200px]">
            <div className="relative">
              <BondIcon size={32} />
              <div className="absolute inset-0 bg-primary/50 blur-lg rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-orbitron text-muted-foreground uppercase">Balance</p>
              <p className="text-2xl font-orbitron font-bold text-white leading-none">
                {loadingBalance ? "---" : balance?.balance?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* SPECIAL OFFERS - CARTES XL HORIZONTALES */}
      <AnimatePresence>
        {offers.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Gift className="text-amber-400 w-6 h-6" />
              <h2 className="font-orbitron text-2xl font-bold text-white tracking-tight">Prime Opportunities</h2>
            </div>

            <div className="grid gap-6">
              {offers.map((offer, idx) => (
                <motion.div
                  key={offer.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative overflow-hidden rounded-3xl border border-amber-500/30 bg-slate-900/50 hover:bg-slate-900/80 transition-all duration-500"
                >
                  <div className="flex flex-col md:flex-row items-stretch">
                    <div className="relative w-full md:w-72 h-48 md:h-auto overflow-hidden">
                      <img
                        src={offer.image_url || "/api/placeholder/400/400"}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={offer.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-transparent to-transparent" />
                    </div>

                    <div className="flex-1 p-8 flex flex-col justify-center space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                          Limited
                        </span>
                        <h3 className="text-2xl font-orbitron font-bold text-white">{offer.name}</h3>
                      </div>
                      <p className="text-muted-foreground font-rajdhani text-lg leading-relaxed max-w-xl">
                        {offer.description}
                      </p>
                    </div>

                    <div className="p-8 flex flex-col items-center justify-center bg-white/[0.02] border-l border-white/5 min-w-[240px] space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground line-through">€{offer.original_price_eur}</p>
                        <p className="text-4xl font-orbitron font-black text-amber-400">€{offer.price_eur}</p>
                      </div>
                      <Button className="w-full h-14 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-lg group/btn">
                        PURCHASE{" "}
                        <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </AnimatePresence>

      {/* PACKS STANDARDS - CARTES XL VERTICALES */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="text-primary w-6 h-6 fill-primary/20" />
            <h2 className="font-orbitron text-2xl font-bold text-white">Supply Packs</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loadingPacks
            ? Array(3)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-[400px] rounded-3xl bg-white/5" />)
            : packs.map((pack, idx) => {
                const isEpic = pack.bonus_percentage >= 25;
                return (
                  <motion.div
                    key={pack.id}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -10 }}
                    className={`relative group p-8 rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${
                      isEpic
                        ? "border-primary/40 bg-gradient-to-b from-primary/10 to-transparent shadow-[0_20px_50px_-20px_rgba(59,130,246,0.3)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    {/* SHINE EFFECT ON HOVER */}
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />

                    <div className="relative z-10 space-y-8">
                      <div className="flex justify-between items-start">
                        <div className={`p-4 rounded-2xl ${isEpic ? "bg-primary/20 shadow-inner" : "bg-white/5"}`}>
                          <BondIcon size={48} />
                        </div>
                        {pack.bonus_percentage > 0 && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-orbitron text-primary tracking-widest uppercase">
                              Bonus
                            </span>
                            <span className="text-2xl font-orbitron font-black text-white">
                              +{pack.bonus_percentage}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-5xl font-orbitron font-black text-white tracking-tighter mb-1">
                          {pack.bond_amount.toLocaleString()}
                        </h3>
                        <p className="text-primary font-rajdhani font-bold tracking-[0.2em] uppercase text-sm">
                          {pack.name}
                        </p>
                      </div>

                      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-[0.1em]">
                            Unit Price
                          </p>
                          <p className="text-xl font-orbitron font-bold text-white italic">€{pack.price_eur}</p>
                        </div>
                        <Button
                          className={`rounded-xl px-6 h-12 font-bold ${
                            isEpic ? "bg-primary hover:bg-blue-400" : "bg-white/10 hover:bg-white/20"
                          }`}
                        >
                          SELECT
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </section>

      {/* FOOTER TRUST - CLEAN & MINIMALIST */}
      <footer className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5">
        {[
          { icon: ShieldCheck, text: "Military Grade Security", color: "text-emerald-400" },
          { icon: Zap, text: "Instant Global Delivery", color: "text-primary" },
          { icon: Ticket, text: "Verified Transactions", color: "text-purple-400" },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-center gap-3">
            <item.icon className={`${item.color} w-5 h-5`} />
            <span className="font-rajdhani font-bold text-xs uppercase tracking-widest text-muted-foreground">
              {item.text}
            </span>
          </div>
        ))}
      </footer>
    </motion.div>
  );
}
