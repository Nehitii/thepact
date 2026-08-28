import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Frame, Crown, Shuffle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShopFrames, useShopBanners, useShopTitles, useUserCosmetics, useBondBalance, CosmeticFrame, CosmeticBanner, CosmeticTitle } from "@/domaines/boutique/hooks/useShop";
import { FramePreview, AvatarFrame } from "@/components/ui/avatar-frame";
import { useProfile } from "@/hooks/useProfile";
import { useCarteProfil } from "@/hooks/useCarteProfil";
import { TitreCosmetique } from "@/components/profile/TitreCosmetique";
import { ApercuFondCarte } from "./ApercuFondCarte";
import { ShopFilters, ShopFilterState } from "./ShopFilters";
import { applyShopFilters } from "@/domaines/boutique/logique/appliquerFiltres";
import { PurchaseConfirmModal, PurchaseItem } from "./PurchaseConfirmModal";
import { ShopLoadingState } from "./ShopLoadingState";
import { UnlockAnimation } from "./UnlockAnimation";
import { CyberItemCard } from "./CyberItemCard";
import { FittingRoom } from "./FittingRoom";
import { useShopTransaction } from "@/domaines/boutique/hooks/useShopTransaction";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type CosmeticCategory = "frames" | "banners" | "titles";

const categories = [
  { id: "frames" as const, cle: "shop.cosmetics.frames", secours: "Cadres", icon: Frame },
  { id: "banners" as const, cle: "shop.cosmetics.banners", secours: "Bannières", icon: Image },
  { id: "titles" as const, cle: "shop.cosmetics.titles", secours: "Titres", icon: Crown },
];

export function CosmeticShop() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState<CosmeticCategory>("frames");
  const [purchaseItem, setPurchaseItem] = useState<PurchaseItem | null>(null);
  const [showUnlock, setShowUnlock] = useState(false);
  const [filters, setFilters] = useState<ShopFilterState>({ search: "", sort: "price-asc", rarity: "all", hideOwned: false });
  /* MELANGER. Le tri par prix ou par nom fige toujours la meme
     vitrine, et l on finit par ne plus voir que les premieres cartes.
     Un remaniement rebat l ordre sans rien cacher ; la graine vit dans
     l etat, donc l ordre tient tant qu on ne redemande pas. */
  const [graine, setGraine] = useState(0);

  const [fittingItem, setFittingItem] = useState<
    | { type: "frame"; data: CosmeticFrame } | { type: "banner"; data: CosmeticBanner } | { type: "title"; data: CosmeticTitle } | null
  >(null);

  const { data: frames = [], isLoading: framesLoading } = useShopFrames();
  const { data: banners = [], isLoading: bannersLoading } = useShopBanners();
  const { data: titles = [], isLoading: titlesLoading } = useShopTitles();
  const { data: ownedCosmetics } = useUserCosmetics(user?.id);
  const { data: balance } = useBondBalance(user?.id);
  const { data: profil } = useProfile(user?.id);
  /* Une seule requete sert tous les fonds de carte : on ne change que
     l image, le reste de la carte est le meme pour chacun. */
  const { data: maCarte } = useCarteProfil(user?.id, true);
  const transaction = useShopTransaction();

  /* L APERCU PORTE.
     Un cadre pose sur une silhouette grise ne dit pas ce qu il fera sur
     toi. `FramePreview` n est d ailleurs qu un `AvatarFrame` avec
     `avatarUrl = null` : montrer l article porte ne demandait que de
     passer le vrai avatar. La carte croise les deux au survol. */
  const monAvatar = profil?.avatar_url ?? null;
  const mesInitiales = (profil?.display_name ?? "")
    .split(/s+/).filter(Boolean).slice(0, 2).map((m) => m[0]?.toUpperCase() ?? "").join("") || "?";

  const isLoading = activeCategory === "frames" ? framesLoading : activeCategory === "banners" ? bannersLoading : titlesLoading;

  const handlePurchaseClick = (item: PurchaseItem) => setPurchaseItem(item);

  const handleConfirmPurchase = async () => {
    if (!purchaseItem) return;
    const success = await transaction.initiatePurchase({
      itemId: purchaseItem.id, itemName: purchaseItem.name, itemType: purchaseItem.type as "frame" | "banner" | "title",
      price: purchaseItem.price, rarity: purchaseItem.rarity,
    });
    if (success) { setShowUnlock(true); setPurchaseItem(null); }
  };

  const handleFittingPurchase = async () => {
    if (!fittingItem) return;
    const itemName = fittingItem.type === "title" ? (fittingItem.data as CosmeticTitle).title_text : fittingItem.data.name;
    const success = await transaction.initiatePurchase({
      itemId: fittingItem.data.id, itemName, itemType: fittingItem.type,
      price: fittingItem.data.price, rarity: fittingItem.data.rarity,
    });
    if (success) { setFittingItem(null); setShowUnlock(true); }
  };

  /* Meme raison que `remanier` : recreee a chaque rendu, elle ne
     pouvait pas etre declaree la ou on s en sert. */
  const isOwned = useCallback((id: string, type: "frame" | "banner" | "title") => {
    if (!ownedCosmetics) return false;
    if (type === "frame") return ownedCosmetics.frames.includes(id);
    if (type === "banner") return ownedCosmetics.banners.includes(id);
    return ownedCosmetics.titles.includes(id);
  }, [ownedCosmetics]);

  /* L ordre melange est deduit de la graine et de l identifiant : pas
     de tirage au sort, donc pas de reordonnancement a chaque rendu. */
  /* MÉMORISÉE POUR POUVOIR ÊTRE DÉCLARÉE.
     Recréée à chaque rendu, cette fonction ne pouvait pas figurer dans
     les dépendances des trois `useMemo` ci-dessous sans les annuler.
     On y listait donc `graine` à sa place — ce qui était juste, mais
     invisible pour qui relit. Mémorisée sur `graine`, elle se déclare. */
  const remanier = useCallback(<T extends { id: string }>(liste: T[]) => {
    if (!graine) return liste;
    /* FNV-1a puis avalanche. Un simple `h * 31 + code` partant de la
       graine ne brassait rien : deux graines consecutives donnaient le
       meme ordre a une rotation pres — mesure faite, la seconde
       pression ne deplacait qu une carte. Il faut disperser la graine
       avant de replier l identifiant, puis melanger les bits obtenus. */
    const rang = (id: string) => {
      let h = Math.imul(graine, 2654435761) >>> 0;
      for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
      h ^= h >>> 15;
      h = Math.imul(h, 2246822507) >>> 0;
      h ^= h >>> 13;
      return h >>> 0;
    };
    return [...liste].sort((a, b) => rang(a.id) - rang(b.id));
  }, [graine]);

  const filteredFrames = useMemo(() => remanier(applyShopFilters(frames, filters, (f) => isOwned(f.id, "frame"))), [frames, filters, isOwned, remanier]);
  const filteredBanners = useMemo(() => remanier(applyShopFilters(banners, filters, (b) => isOwned(b.id, "banner"))), [banners, filters, isOwned, remanier]);
  const filteredTitles = useMemo(() => remanier(applyShopFilters(titles.map(t => ({ ...t, name: t.title_text })), filters, (t) => isOwned(t.id, "title"))), [titles, filters, isOwned, remanier]);

  const totalItems = activeCategory === "frames" ? frames.length : activeCategory === "banners" ? banners.length : titles.length;
  const visibleItems = activeCategory === "frames" ? filteredFrames.length : activeCategory === "banners" ? filteredBanners.length : filteredTitles.length;

  return (
    <div className={`${isMobile ? "flex flex-col" : "flex gap-6"} h-full`}>
      {/* Category nav */}
      <div className={cn(isMobile ? "flex gap-2 mb-4 overflow-x-auto hide-scrollbar" : "w-48 flex-shrink-0 space-y-2")}>
        {!isMobile && (
          <h3 className="ds-t-label text-muted-foreground uppercase tracking-[0.15em] font-orbitron mb-4 px-2">{t("shop.cosmetics.categories", "Catégories")}</h3>
        )}
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          const count = cat.id === "frames" ? frames.length : cat.id === "banners" ? banners.length : titles.length;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isMobile ? "flex-1 min-w-0 justify-center" : "w-full",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-card/50 text-muted-foreground hover:text-foreground"
              )}
              style={isActive ? { border: `1px solid hsl(var(--primary) / 0.2)` } : { border: "1px solid transparent" }}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="font-rajdhani font-medium text-sm">{t(cat.cle, cat.secours)}</span>
              <span className="text-xs opacity-50 ml-auto">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 mb-5">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <ShopFilters filters={filters} onFiltersChange={setFilters} totalItems={totalItems} visibleItems={visibleItems} />
            </div>
            <button
              type="button"
              onClick={() => setGraine((g) => g + 1)}
              title={t("shop.filters.shuffle", "Mélanger")}
              className="shrink-0 h-10 px-3 rounded-lg border border-primary/20 bg-card/50 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline font-rajdhani text-sm">{t("shop.filters.shuffle", "Mélanger")}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {isLoading ? (
            <ShopLoadingState type="cosmetics" count={8} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={activeCategory} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeCategory === "frames" && filteredFrames.map((frame, i) => (
                  <CyberItemCard key={frame.id} id={frame.id} name={frame.name} rarity={frame.rarity} price={frame.price}
                    owned={isOwned(frame.id, "frame") || frame.is_default} canAfford={(balance?.balance || 0) >= frame.price} itemType="frame" index={i}
                    preview={<FramePreview size="lg" frameImage={frame.preview_url} borderColor={frame.border_color} glowColor={frame.glow_color} frameScale={frame.frame_scale} frameOffsetX={frame.frame_offset_x} frameOffsetY={frame.frame_offset_y} />}
                    previewPorte={<AvatarFrame size="lg" avatarUrl={monAvatar} fallback={mesInitiales} frameImage={frame.preview_url} borderColor={frame.border_color} glowColor={frame.glow_color} frameScale={frame.frame_scale} frameOffsetX={frame.frame_offset_x} frameOffsetY={frame.frame_offset_y} />}
                    onPurchase={() => handlePurchaseClick({ id: frame.id, name: frame.name, type: "frame", price: frame.price, rarity: frame.rarity })}
                    onPreview={() => setFittingItem({ type: "frame", data: frame })} />
                ))}
                {activeCategory === "banners" && filteredBanners.map((banner, i) => (
                  <CyberItemCard key={banner.id} id={banner.id} name={banner.name} rarity={banner.rarity} price={banner.price}
                    owned={isOwned(banner.id, "banner") || banner.is_default} canAfford={(balance?.balance || 0) >= banner.price} itemType="banner" index={i}
                    preview={<ApercuFondCarte carte={maCarte} fond={banner} />}
                    onPurchase={() => handlePurchaseClick({ id: banner.id, name: banner.name, type: "banner", price: banner.price, rarity: banner.rarity })}
                    onPreview={() => setFittingItem({ type: "banner", data: banner })} />
                ))}
                {activeCategory === "titles" && filteredTitles.map((title, i) => {
                  const originalTitle = titles.find(t => t.id === title.id);
                  return (
                    <CyberItemCard key={title.id} id={title.id} name={title.name} rarity={title.rarity} price={title.price}
                      owned={isOwned(title.id, "title") || title.is_default} canAfford={(balance?.balance || 0) >= title.price} itemType="title" index={i}
                      preview={
                        /* Le rayon montre exactement ce qu on portera :
                           meme composant, meme echelle de rarete. Il
                           peignait jusqu ici son propre aplat avec une
                           double ombre, sans rien dire du cran. */
                        <TitreCosmetique
                          texte={originalTitle?.title_text || title.name}
                          couleur={originalTitle?.text_color}
                          lueur={originalTitle?.glow_color}
                          rarete={title.rarity}
                        />
                      }
                      onPurchase={() => handlePurchaseClick({ id: title.id, name: title.name, type: "title", price: title.price, rarity: title.rarity })}
                      onPreview={() => originalTitle && setFittingItem({ type: "title", data: originalTitle })} />
                  );
                })}

                {/* Empty states */}
                {activeCategory === "frames" && filteredFrames.length === 0 && !framesLoading && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Frame className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-rajdhani">{t(frames.length === 0 ? "shop.cosmetics.noneYet" : "shop.cosmetics.noneMatch", { type: t("shop.cosmetics.frames", "Cadres").toLowerCase() })}</p>
                  </div>
                )}
                {activeCategory === "banners" && filteredBanners.length === 0 && !bannersLoading && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-rajdhani">{t(banners.length === 0 ? "shop.cosmetics.noneYet" : "shop.cosmetics.noneMatch", { type: t("shop.cosmetics.banners", "Bannières").toLowerCase() })}</p>
                  </div>
                )}
                {activeCategory === "titles" && filteredTitles.length === 0 && !titlesLoading && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Crown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-rajdhani">{t(titles.length === 0 ? "shop.cosmetics.noneYet" : "shop.cosmetics.noneMatch", { type: t("shop.cosmetics.titles", "Titres").toLowerCase() })}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <PurchaseConfirmModal open={!!purchaseItem} onOpenChange={(open) => !open && setPurchaseItem(null)} item={purchaseItem}
        currentBalance={balance?.balance || 0} onConfirm={handleConfirmPurchase} isPending={transaction.isPending} />

      <FittingRoom open={!!fittingItem} onOpenChange={(open) => !open && setFittingItem(null)} previewItem={fittingItem}
        onPurchase={handleFittingPurchase} isPending={transaction.isPending}
        canAfford={fittingItem ? transaction.canAfford(fittingItem.data.price) : false} currentBalance={transaction.currentBalance} />

      {transaction.lastPurchased && (
        <UnlockAnimation isOpen={showUnlock} onComplete={() => { setShowUnlock(false); transaction.clearLastPurchased(); }}
          itemName={transaction.lastPurchased.name} itemType="cosmetic" rarity={transaction.lastPurchased.rarity} />
      )}
    </div>
  );
}
