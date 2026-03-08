import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, ShieldCheck, TrendingUp, Crown, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBondPacks, useBondBalance, useSpecialOffers } from "@/hooks/useShop";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { PromoCodeRedemption } from "./PromoCodeRedemption";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function BondsShop() {
  const { user } = useAuth();
  const { data: packs = [], isLoading: loadingPacks } = useBondPacks();
  const { data: balance, isLoading: loadingBalance } = useBondBalance(user?.id);
  const { data: offers = [], isLoading: loadingOffers } = useSpecialOffers();
  const { toast } = useToast();
  const isLoading = loadingPacks || loadingOffers;

  const handlePackPurchase = () => {
    toast({ title: "Coming Soon", description: "Payment integration is under development. Stay tuned!" });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl" style={{
        background: "linear-gradient(135deg, hsl(var(--card) / 0.8), hsl(var(--card) / 0.4))",
        border: "1px solid hsl(var(--primary) / 0.12)",
      }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 30% 50%, hsl(var(--primary) / 0.08), transparent 60%)",
        }} />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-orbitron font-black tracking-tight text-foreground">
              BOND <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">CENTRAL</span>
            </h2>
            <p className="text-sm text-muted-foreground font-rajdhani max-w-sm">
              Fuel your journey with premium credits. Secure, fast, and cosmic.
            </p>
          </div>

          <div className="flex items-center gap-4 px-6 py-4 rounded-2xl" style={{
            background: "hsl(var(--card) / 0.6)", border: "1px solid hsl(var(--primary) / 0.12)",
          }}>
            <BondIcon size={40} className="drop-shadow-[0_0_10px_hsl(var(--primary)/0.3)]" />
            <div>
              <p className="text-[10px] text-primary font-orbitron uppercase tracking-widest mb-0.5">Balance</p>
              {loadingBalance ? (
                <Skeleton className="h-8 w-20 bg-primary/10" />
              ) : (
                <span className="text-3xl font-orbitron font-bold text-foreground tracking-tight">
                  {balance?.balance?.toLocaleString() || 0}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Promo Code */}
      <div className="max-w-md mx-auto w-full">
        <PromoCodeRedemption />
      </div>

      {/* Special Offers */}
      <AnimatePresence>
        {offers.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <h2 className="flex items-center gap-3 font-orbitron text-lg text-foreground">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              Timed Anomalies
            </h2>

            <div className="grid gap-5">
              {offers.map((offer) => (
                <div key={offer.id} className="relative p-[1px] rounded-2xl overflow-hidden group hover:scale-[1.005] transition-transform">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-purple-500 to-amber-500 animate-shimmer bg-[length:200%_100%]" />
                  <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-[15px]" style={{ background: "hsl(var(--card) / 0.95)" }}>
                    <div className="relative h-20 w-20 shrink-0">
                      <img src={offer.image_url || "/placeholder.svg"} className="w-full h-full object-contain" alt="" />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-1">
                      <h3 className="font-orbitron text-lg font-bold text-foreground">{offer.name}</h3>
                      <p className="text-muted-foreground font-rajdhani text-sm line-clamp-2">{offer.description}</p>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-2 min-w-[140px]">
                      <div className="text-right font-orbitron">
                        <span className="block text-xs text-muted-foreground line-through">€{offer.original_price_eur}</span>
                        <span className="text-2xl font-black text-amber-400">€{offer.price_eur}</span>
                      </div>
                      <Button onClick={handlePackPurchase}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase rounded-xl">
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

      {/* Standard Packs */}
      <section className="space-y-5">
        <h2 className="flex items-center gap-3 font-orbitron text-lg text-foreground">
          <Zap className="text-primary fill-primary/20" /> Standard Supply
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading
            ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl bg-primary/5" />)
            : packs.map((pack) => {
                const isEpic = pack.bonus_percentage >= 30;
                return (
                  <motion.div key={pack.id} whileHover={{ y: -6 }}
                    className={cn(
                      "group relative p-6 rounded-2xl border transition-all duration-300",
                      isEpic
                        ? "border-amber-500/25"
                        : "border-primary/12 hover:border-primary/25",
                    )}
                    style={{ background: isEpic ? "linear-gradient(180deg, hsl(45 100% 60% / 0.04), transparent)" : "hsl(var(--card) / 0.5)" }}
                  >
                    {pack.bonus_percentage > 0 && (
                      <div className={cn(
                        "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg text-[10px] font-black font-orbitron z-20",
                        isEpic ? "bg-amber-500 text-black" : "bg-primary text-primary-foreground",
                      )}>
                        {isEpic && <Crown className="inline-block w-3 h-3 mr-1 mb-0.5" />}+{pack.bonus_percentage}% BONUS
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-center mb-4">
                        <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300", isEpic ? "bg-amber-500/10" : "bg-primary/5")}>
                          <BondIcon size={36} />
                        </div>
                      </div>
                      <div className="text-center space-y-1 mb-5">
                        <h3 className="text-2xl font-orbitron font-black text-foreground tracking-tight">
                          {pack.bond_amount.toLocaleString()}
                        </h3>
                        <p className="text-xs font-rajdhani text-muted-foreground uppercase tracking-[0.2em]">{pack.name}</p>
                      </div>
                      <Button onClick={handlePackPurchase}
                        className={cn(
                          "w-full py-5 rounded-xl font-orbitron font-black text-lg transition-all",
                          isEpic ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-primary/10 hover:bg-primary hover:text-primary-foreground text-foreground border border-primary/15",
                        )}>
                        €{pack.price_eur}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </section>

      {/* Trust footer */}
      <footer className="flex items-center justify-center gap-8 pt-6 border-t" style={{ borderColor: "hsl(var(--primary) / 0.08)" }}>
        {[
          { icon: ShieldCheck, color: "text-emerald-500", label: "Secure Protocol" },
          { icon: Zap, color: "text-primary", label: "Instant Delivery" },
          { icon: TrendingUp, color: "text-purple-500", label: "Best Value" },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-muted-foreground">
            <f.icon className={cn("w-4 h-4", f.color)} />
            <span className="text-[10px] font-orbitron uppercase tracking-wider">{f.label}</span>
          </div>
        ))}
      </footer>
    </motion.div>
  );
}
