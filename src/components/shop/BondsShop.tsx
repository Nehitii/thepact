import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Zap, ShieldCheck, Crown, Wallet, TrendingUp, Info } from "lucide-react";
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

  // On trie pour mettre les plus gros packs en avant ou identifier le "Best Value"
  const sortedPacks = [...packs].sort((a, b) => a.price_eur - b.price_eur);

  return (
    <div className="min-h-screen w-full text-foreground p-4 md:p-8 max-w-[1400px] mx-auto space-y-12">
      {/* --- SECTION 1: HEADER & USER WEALTH --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        {/* Left: Branding & Redeem */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 relative">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-[2px] w-10 bg-primary/60"></span>
              <span className="text-xs font-orbitron tracking-[0.3em] text-primary/80 uppercase">
                Official Treasury
              </span>
            </div>
            {/* Added padding-right to fix italic clipping */}
            <h1 className="text-5xl md:text-7xl font-orbitron font-black text-white italic tracking-tighter leading-tight pr-4">
              BOND{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-white">
                EXCHANGE
              </span>
            </h1>
          </motion.div>

          {/* Integrated Redeem Section - Clean & Aligned */}
          <div className="max-w-md bg-white/[0.03] border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <Gift size={14} />
              <span className="text-xs font-rajdhani uppercase tracking-wider">Redeem Voucher</span>
            </div>
            <PromoCodeRedemption />
          </div>
        </div>

        {/* Right: The "Wallet" - High Visibility */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-4">
          <div className="relative group overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-[#0a0a1a] to-slate-900 border border-primary/30 shadow-[0_0_40px_-10px_rgba(59,130,246,0.2)]">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />

            <div className="p-8 relative z-10 flex flex-col justify-between h-full min-h-[180px]">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-orbitron text-primary/80 tracking-widest uppercase flex items-center gap-2">
                    <Wallet size={12} /> Current Balance
                  </p>
                  <p className="text-xs font-rajdhani text-muted-foreground">
                    ID: {user?.id?.slice(0, 8) || "ANON"}...
                  </p>
                </div>
                <BondIcon size={32} className="text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              </div>

              <div className="mt-6">
                {loadingBalance ? (
                  <Skeleton className="h-12 w-32 bg-white/10 rounded-lg" />
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-orbitron font-bold text-white tracking-tight drop-shadow-lg">
                      {balance?.balance?.toLocaleString()}
                    </span>
                    <span className="text-lg text-primary font-orbitron font-medium">BND</span>
                  </div>
                )}
              </div>
            </div>
            {/* Bottom shine bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* --- SECTION 2: SPECIAL OFFERS (If any) --- */}
      <AnimatePresence>
        {offers.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-900/10 to-transparent p-1 overflow-hidden"
          >
            <div className="bg-slate-950/80 backdrop-blur-md rounded-[1.4rem] p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
              {/* Decorative background stripes */}
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5" />
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full" />

              <div className="relative z-10 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <Sparkles className="w-12 h-12 text-amber-400" />
              </div>

              <div className="flex-1 text-center md:text-left space-y-2 z-10">
                <h2 className="text-2xl font-orbitron font-bold text-white">Limited Time Opportunities</h2>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center gap-4 bg-white/5 rounded-lg pr-4 pl-2 py-2 border border-white/10"
                    >
                      <img src={offer.image_url || ""} alt="" className="w-10 h-10 rounded bg-black/50 object-cover" />
                      <div>
                        <p className="font-bold text-white">{offer.name}</p>
                        <p className="text-amber-400 text-sm font-orbitron">€{offer.price_eur}</p>
                      </div>
                      <Button size="sm" className="ml-2 bg-amber-500 hover:bg-amber-600 text-black font-bold">
                        GET
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* --- SECTION 3: THE PACKS (Grid) --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <Zap className="text-primary w-5 h-5" />
          <h2 className="font-orbitron text-xl text-white tracking-wide uppercase">Select Supply Drop</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {loadingPacks
            ? Array(3)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-[400px] rounded-3xl bg-white/5" />)
            : sortedPacks.map((pack, index) => {
                // LOGIC: Differentiate "Standard" vs "Premium/Whale" packs
                const isPremium = pack.price_eur >= 50;
                const isPopular = !isPremium && pack.price_eur >= 20;

                return (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    className={`relative group flex flex-col p-6 lg:p-8 rounded-[2rem] border transition-all duration-300 ${
                      isPremium
                        ? "bg-gradient-to-b from-slate-900 via-amber-950/10 to-slate-950 border-amber-500/40 shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]"
                        : isPopular
                          ? "bg-gradient-to-b from-slate-900 via-primary/5 to-slate-950 border-primary/30"
                          : "bg-slate-950 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Badge "Best Value" pour les packs premium */}
                    {isPremium && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-orbitron font-black px-4 py-1 rounded-full shadow-lg z-20 flex items-center gap-1">
                        <Crown size={12} /> BEST VALUE
                      </div>
                    )}

                    {/* Top: Icon & Bonus */}
                    <div className="flex justify-between items-start mb-8">
                      <div
                        className={`p-4 rounded-2xl transition-colors ${
                          isPremium ? "bg-amber-500/10 text-amber-500" : "bg-white/5 text-primary"
                        }`}
                      >
                        <BondIcon size={32} />
                      </div>

                      {pack.bonus_percentage > 0 && (
                        <div className={`text-right ${isPremium ? "text-amber-500" : "text-primary"}`}>
                          <div className="text-2xl font-orbitron font-black leading-none">
                            +{pack.bonus_percentage}%
                          </div>
                          <div className="text-[10px] uppercase tracking-widest opacity-80">Bonus</div>
                        </div>
                      )}
                    </div>

                    {/* Middle: Amount - Fix italics clipping here too */}
                    <div className="flex-1 space-y-2 mb-8">
                      <h3 className="text-5xl font-orbitron font-bold text-white tracking-tighter pr-2">
                        {pack.bond_amount.toLocaleString()}
                      </h3>
                      <p
                        className={`text-sm font-rajdhani font-bold uppercase tracking-[0.2em] ${
                          isPremium ? "text-amber-500" : "text-muted-foreground"
                        }`}
                      >
                        {pack.name}
                      </p>

                      {/* Unit price calculation for savvy users */}
                      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground/60">
                        <Info size={12} />
                        <span>≈ {(pack.price_eur / pack.bond_amount).toFixed(3)}€ / bond</span>
                      </div>
                    </div>

                    {/* Bottom: Price & Action */}
                    <div className="mt-auto pt-6 border-t border-white/5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase">Price</span>
                          <span className="text-2xl font-orbitron font-bold text-white">€{pack.price_eur}</span>
                        </div>
                        <Button
                          className={`h-12 px-6 rounded-xl font-bold font-orbitron transition-all ${
                            isPremium
                              ? "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] flex-1"
                              : "bg-white/10 hover:bg-primary text-white flex-1"
                          }`}
                        >
                          PURCHASE
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </div>

      {/* --- FOOTER: TRUST BADGES --- */}
      <div className="pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 text-muted-foreground">
          <ShieldCheck className="text-emerald-500" />
          <span className="text-xs font-rajdhani uppercase tracking-widest">SSL Encrypted Payment</span>
        </div>
        <div className="flex items-center justify-center md:justify-start gap-3 text-muted-foreground">
          <TrendingUp className="text-blue-500" />
          <span className="text-xs font-rajdhani uppercase tracking-widest">Live Market Rates</span>
        </div>
        <div className="flex items-center justify-center md:justify-start gap-3 text-muted-foreground">
          <Zap className="text-amber-500" />
          <span className="text-xs font-rajdhani uppercase tracking-widest">Instant Account Credit</span>
        </div>
      </div>
    </div>
  );
}
