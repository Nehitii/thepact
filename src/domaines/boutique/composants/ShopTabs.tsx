import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Puzzle, Heart, History } from "lucide-react";
import { BondIcon } from "@/components/ui/bond-icon";
import { cn } from "@/lib/utils";

export type ShopTab = "cosmetics" | "modules" | "bonds" | "wishlist" | "history";

interface ShopTabsProps {
  activeTab: ShopTab;
  onTabChange: (tab: ShopTab) => void;
  wishlistCount?: number;
}

/* Les libelles etaient ecrits en anglais alors que `shop.tabs.*`
   existe et est traduit depuis toujours. On relie les deux. */
const tabs = [
  { id: "cosmetics" as const, cle: "shop.tabs.cosmetics", secours: "Cosmétiques", icon: Sparkles, isImage: false },
  { id: "modules" as const, cle: "shop.tabs.modules", secours: "Modules", icon: Puzzle, isImage: false },
  { id: "bonds" as const, cle: "shop.tabs.bonds", secours: "Bonds", icon: null, isImage: true },
  { id: "wishlist" as const, cle: "shop.tabs.wishlist", secours: "Liste de souhaits", icon: Heart, isImage: false },
  { id: "history" as const, cle: "shop.tabs.history", secours: "Historique", icon: History, isImage: false },
];

export function ShopTabs({ activeTab, onTabChange, wishlistCount = 0 }: ShopTabsProps) {
  const { t } = useTranslation();
  const bande = useRef<HTMLDivElement>(null);
  const [resteADroite, setResteADroite] = useState(false);

  /* On ne devine pas le debordement, on le mesure — et on le remesure
     quand la fenetre change ou quand on fait defiler. Un voile pose en
     permanence mentirait a 1 280 px, ou la bande tient exactement. */
  useEffect(() => {
    const el = bande.current;
    if (!el) return;
    const jauger = () =>
      setResteADroite(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
    jauger();
    el.addEventListener("scroll", jauger, { passive: true });
    const observateur = new ResizeObserver(jauger);
    observateur.observe(el);
    return () => {
      el.removeEventListener("scroll", jauger);
      observateur.disconnect();
    };
  }, []);

  /* LA BANDE DEBORDAIT SANS LE DIRE. Mesure a 596 px de large : 653 px
     de contenu dans 555 px visibles, le cinquieme onglet coupe net au
     bord — et `hide-scrollbar` retirait le seul indice qu il restait
     quelque chose a droite. Le voile en degrade rend le debordement
     visible sans rendre la barre au navigateur ; il disparait quand la
     bande tient (`scrollbar-gutter` n aurait rien montre ici, le
     defilement etant horizontal). */
  return (
    <div className="relative">
      <div
        ref={bande}
        className="flex gap-2 overflow-x-auto hide-scrollbar"
        role="tablist"
        aria-label={t("shop.tabs.aria", "Sections de la boutique")}
      >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const isWishlistFull = tab.id === "wishlist" && wishlistCount > 0;

        return (
          <motion.button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "relative flex items-center gap-2.5 py-3 px-5 rounded-xl font-orbitron ds-t-label font-semibold tracking-wider uppercase transition-all duration-200 whitespace-nowrap border",
              isActive
                ? "text-primary border-primary/30"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-primary/10 hover:bg-card/40"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="shopActiveTab"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.04))",
                  border: "1px solid hsl(var(--primary) / 0.25)",
                  boxShadow: "0 0 20px hsl(var(--primary) / 0.08), inset 0 1px 0 hsl(var(--primary) / 0.1)",
                }}
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <div className="relative z-10">
              {tab.isImage ? (
                <BondIcon size={16} className={isActive ? "drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]" : ""} />
              ) : Icon ? (
                <Icon className={cn("w-4 h-4", isWishlistFull && "text-rose-400")} />
              ) : null}
            </div>

            <span className="relative z-10">{t(tab.cle, tab.secours)}</span>

            {isWishlistFull && (
              <motion.span
                className="relative z-10 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full ds-t-label font-bold"
                style={{
                  background: "hsl(350 80% 55% / 0.2)",
                  color: "hsl(350 80% 55%)",
                }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </motion.span>
            )}
          </motion.button>
        );
      })}
      </div>

      {/* Le voile ne se pose que si quelque chose reste a droite. */}
      {resteADroite && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-12"
          style={{ background: "linear-gradient(to right, transparent, hsl(var(--background)))" }}
        />
      )}
    </div>
  );
}
