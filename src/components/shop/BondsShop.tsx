import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Zap, ShieldCheck, Ticket, Star, ArrowRight, Wallet, Crown } from "lucide-react";
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
  const { data: offers = [] } = useSpecialOffers();

  // On trie les packs pour identifier les "Master" (les plus chers)
  const sortedPacks = [...packs].sort((a, b) => b.price_eur - a.price_eur);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-16 pb-24 p-6">
      {/* --- HEADER & BALANCE SECTION --- */}
      <section className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 pt-8">
        <div className="space-y-6 z-10">
          <div className="space-y-1">
            <motion.div
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="flex items-center gap-3 text-primary font-orbitron text-xs tracking-[0.4em]"
            >
              <span className="w-12 h-[2px] bg-primary/50" />
              ESTABLISHED 2024
            </motion.div>
            <h1 className="text-6xl md:text-7xl font-orbitron font-black text-white italic tracking-tighter leading-none">
              BOND <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">VAULT</span>
            </h1>
          </div>

          {/* REDEEM POSITIONNÉ SOUS LE TITRE */}
          <div className="max-w-sm">
            <p className="text-[10px] font-orbitron text-muted-foreground mb-2 ml-1 tracking-widest uppercase opacity-60">
              Have a voucher?
            </p>
            <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <PromoCodeRedemption />
            </div>
          </div>
        </div>

        {/* BALANCE CARD - ULTRA VISIBLE */}
        <motion.div whileHover={{ scale: 1.02 }} className="relative group min-w-[320px]">
          <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full group-hover:bg-primary/30 transition-all" />
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-primary/50 bg-slate-950 p-8 shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={80} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="font-orbitron text-xs text-primary tracking-[0.2em] uppercase">Active Capital</span>
              </div>

              <div className="flex items-end gap-3">
                <span className="text-5xl font-orbitron font-black text-white tabular-nums tracking-tighter">
                  {loadingBalance ? "..." : balance?.balance?.toLocaleString()}
                </span>
                <BondIcon size={32} className="mb-2 text-primary" />
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-xs font-rajdhani text-muted-foreground">
                  Linked to account: <span className="text-white">{user?.email?.split("@")[0]}</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- SPECIAL OFFERS --- */}
      {offers.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 p-6 flex gap-6 items-center"
            >
              <div className="h-24 w-24 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Star className="w-12 h-12 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-orbitron font-bold text-white text-xl">{offer.name}</h3>
                <p className="text-amber-500/70 font-rajdhani font-bold">SALE: €{offer.price_eur}</p>
              </div>
              <Button size="icon" className="rounded-full bg-amber-500 hover:bg-amber-400 text-black">
                <ArrowRight />
              </Button>
            </div>
          ))}
        </section>
      )}

      {/* --- SUPPLY PACKS - GRID XL --- */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <Zap className="text-primary w-8 h-8" />
          <h2 className="font-orbitron text-3xl font-bold text-white uppercase tracking-tighter">Available Credits</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {loadingPacks
            ? Array(3)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-[450px] rounded-[3rem] bg-white/5" />)
            : packs.map((pack) => {
                // Différenciation des packs les plus chers
                const isMaster = pack.price_eur >= 50;
                const isIntermediate = pack.price_eur >= 20 && pack.price_eur < 50;

                return (
                  <motion.div
                    key={pack.id}
                    whileHover={{ y: -12 }}
                    className={`relative group p-10 rounded-[3rem] transition-all duration-500 ${
                      isMaster
                        ? "bg-slate-950 border-2 border-amber-500 shadow-[0_0_60px_-15px_rgba(245,158,11,0.4)]"
                        : isIntermediate
                          ? "bg-slate-900/50 border-2 border-primary/40 shadow-xl"
                          : "bg-white/[0.02] border border-white/10"
                    }`}
                  >
                    {/* Badge Exclusif pour Master Packs */}
                    {isMaster && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-orbitron font-black text-[10px] px-6 py-1 rounded-full shadow-lg z-20 whitespace-nowrap">
                        MOST POPULAR / BEST VALUE
                      </div>
                    )}

                    <div className="relative z-10 h-full flex flex-col">
                      <div className="flex justify-between items-start mb-12">
                        <div
                          className={`p-5 rounded-2xl ${isMaster ? "bg-amber-500 text-black" : "bg-primary/10 text-primary"}`}
                        >
                          {isMaster ? <Crown size={40} /> : <BondIcon size={40} />}
                        </div>
                        {pack.bonus_percentage > 0 && (
                          <div className="text-right">
                            <p
                              className={`text-4xl font-orbitron font-black ${isMaster ? "text-amber-500" : "text-white"}`}
                            >
                              +{pack.bonus_percentage}%
                            </p>
                            <p className="text-[10px] font-orbitron text-muted-foreground tracking-[0.2em] uppercase">
                              Bonus Included
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mb-10">
                        <h3
                          className={`text-6xl font-orbitron font-black tracking-tighter ${isMaster ? "text-white" : "text-white/90"}`}
                        >
                          {pack.bond_amount.toLocaleString()}
                        </h3>
                        <p
                          className={`font-rajdhani font-bold text-lg tracking-[0.2em] uppercase ${isMaster ? "text-amber-500" : "text-primary"}`}
                        >
                          {pack.name}
                        </p>
                      </div>

                      <div className="mt-auto space-y-6">
                        <div className="flex items-center justify-between border-t border-white/10 pt-6">
                          <span className="text-muted-foreground font-rajdhani uppercase text-sm">Secure Checkout</span>
                          <span className="text-3xl font-orbitron font-bold text-white">€{pack.price_eur}</span>
                        </div>

                        <Button
                          className={`w-full h-16 rounded-2xl font-orbitron font-black text-xl transition-all ${
                            isMaster
                              ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg"
                              : "bg-white/10 hover:bg-primary text-white"
                          }`}
                        >
                          GET PACK
                        </Button>
                      </div>
                    </div>

                    {/* Effet visuel de fond pour les Master */}
                    {isMaster && (
                      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden rounded-[3rem]">
                        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-amber-500/20 blur-[120px] rotate-45" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
        </div>
      </section>

      {/* --- TRUST FOOTER --- */}
      <footer className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 rounded-[2rem] bg-white/[0.02] border border-white/5">
        <div className="flex gap-10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-500 h-6 w-6" />
            <span className="text-xs font-orbitron text-muted-foreground uppercase tracking-widest">Encrypted</span>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="text-primary h-6 w-6" />
            <span className="text-xs font-orbitron text-muted-foreground uppercase tracking-widest">Instant</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-orbitron text-white/20 uppercase tracking-[0.5em]">
            Cosmic Security Protocol v2.4
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
