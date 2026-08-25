import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";
import { Button } from "@/components/ui/button";
import { getRarity, useRarityLabel } from "./shopRarity";

export type CyberItemType = "module" | "frame" | "banner" | "title";

interface CyberItemCardProps {
  id: string;
  name: string;
  rarity: string;
  price: number;
  owned: boolean;
  canAfford: boolean;
  isComingSoon?: boolean;
  itemType: CyberItemType;
  preview: React.ReactNode;
  /* L article porte, montre au survol : le cadre sur le vrai avatar,
     la banniere derriere le vrai pseudonyme. A defaut, `preview` reste
     affiche et rien ne bouge. */
  previewPorte?: React.ReactNode;
  onPurchase: () => void;
  onPreview?: () => void;
  index?: number;
}

export function CyberItemCard({
  id, name, rarity, price, owned, canAfford, isComingSoon = false, itemType,
  preview, previewPorte, onPurchase, onPreview, index = 0,
}: CyberItemCardProps) {
  const { t } = useTranslation();
  const libelleRarete = useRarityLabel();
  const r = getRarity(rarity);
  const isCosmetic = itemType !== "module";
  const [survol, setSurvol] = useState(false);
  const [focus, setFocus] = useState(false);

  /* LA CARTE SE TAIT AU REPOS.
   *
   * Elle portait en permanence un bandeau de rarete, un fond teinte
   * par cette rarete, un badge, un coeur, un prix, un bouton d apercu
   * et un bouton d achat — sur chacune des vingt-neuf cartes. La
   * couleur de la rarete recouvrait celle de l objet, qui est pourtant
   * ce qu on vend : les quatre anneaux d energie du catalogue —
   * azur, violet, ecarlate, cramoisi — disparaissaient tous sous le
   * meme violet « epique ».
   *
   * Au repos il ne reste que l apercu, le nom, un point de rarete et
   * le prix. Le reste apparait au survol, la ou la main est deja. */
  /* AU CLAVIER AUSSI. Cacher les actions derriere le survol les
     laissait dans l ordre de tabulation tout en les rendant
     invisibles : `pointer-events-none` ne retire pas du parcours au
     clavier. On decouvre donc la carte au focus comme au survol, et
     rien n est atteignable sans etre visible. */
  const actionnable = !owned && !isComingSoon;
  const decouvert = (survol || focus) && actionnable;

  /* Les effets ne disparaissent pas, ils deviennent exclusifs : un
     ornement porte par toutes les cartes ne distingue plus rien.
     Legendaire garde son halo tournant, epique son lisere ; le reste
     est calme. */
  const estLegendaire = rarity === "legendary";
  const estEpique = rarity === "epic";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      onFocusCapture={() => setFocus(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
      }}
    >
      <motion.div
        className={cn(
          "group relative rounded-2xl overflow-hidden transition-colors duration-300",
          actionnable && "cursor-pointer",
        )}
        whileHover={actionnable ? { y: -3 } : {}}
        style={{
          /* Fond neutre : la seule couleur de la carte vient de l objet. */
          background: "hsl(var(--card) / 0.82)",
          /* `r.accent` est un `hsl(...)`, pas un hexadecimal : lui coller
             un suffixe d opacite donnait `hsl(215 20% 55%)55`, que le
             navigateur jette en silence — la bordure de survol n a donc
             jamais change. `r.border` porte deja la meme teinte avec son
             alpha. */
          border: `1px solid ${decouvert ? r.border : "hsl(var(--primary) / 0.10)"}`,
          boxShadow: decouvert ? "0 10px 34px hsl(var(--background) / 0.55)" : undefined,
        }}
      >
        {/* Legendaire : le halo tournant, discret au repos, vif au survol. */}
        {estLegendaire && !owned && (
          <div
            className="absolute -inset-[1px] rounded-2xl pointer-events-none z-0 transition-opacity duration-500"
            style={{
              opacity: survol ? 0.7 : 0.18,
              background: `conic-gradient(from 0deg, ${r.accent}, transparent 30%, ${r.accent} 50%, transparent 80%, ${r.accent})`,
              animation: "spin 4s linear infinite",
            }}
          />
        )}

        <div
          className="relative z-[1] rounded-2xl"
          style={{ background: estLegendaire ? "hsl(var(--card))" : "transparent" }}
        >
          {/* Epique : un lisere haut, sans animation. */}
          {estEpique && !owned && (
            <div
              className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${r.accent}, transparent)` }}
            />
          )}

          {/* ── L APERCU ─────────────────────────────────────────── */}
          <div
            className={cn(
              "relative flex items-center justify-center p-5",
              itemType === "module" ? "min-h-[100px]" : "min-h-[136px]",
            )}
          >
            {/* Le coeur ne se montre qu au survol. */}
            <AnimatePresence>
              {decouvert && (
                <motion.div
                  className="absolute top-2 right-2 z-20"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                >
                  <WishlistButton itemId={id} itemType={isCosmetic ? "cosmetic" : "module"} size="sm" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* L article seul, puis l article porte. Les deux occupent la
                meme place et on croise leur opacite : les permuter ferait
                sauter le cadre d un pixel au survol. */}
            {/* sh-scene : l ECRIN. Un cosmetique est dessine pour le
                theme sombre — c est la que le joueur le portera. Presente
                sur une carte blanche, il ne montre pas ce qu il est.
                En theme clair, l apercu recoit donc son propre fond de
                nuit, comme un bijoutier pose une piece sur du velours.
                La classe ne fait rien en theme sombre. */}
            <div className="sh-scene relative flex items-center justify-center w-full">
              <motion.div
                animate={{ opacity: previewPorte && decouvert ? 0 : 1 }}
                transition={{ duration: 0.18 }}
                className={cn("flex items-center justify-center w-full", owned && "opacity-45")}
              >
                {preview}
              </motion.div>

              {previewPorte && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  initial={false}
                  animate={{ opacity: decouvert ? 1 : 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {previewPorte}
                </motion.div>
              )}
            </div>

            {/* Possede : une pastille, non plus un hexagone en surimpression. */}
            {owned && (
              <div
                className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md ds-t-label"
                style={{
                  color: "hsl(142 70% 50%)",
                  background: "hsl(142 70% 50% / 0.10)",
                  border: "1px solid hsl(142 70% 50% / 0.22)",
                }}
              >
                <Check className="w-3 h-3" />
                {t("shop.item.owned", "Possédé")}
              </div>
            )}

            {isComingSoon && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-muted-foreground/30">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-orbitron text-muted-foreground tracking-wider">
                    {t("shop.modules.comingSoon", "Bientôt disponible")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── LE PIED : nom, puis prix OU achat ────────────────── */}
          <div className="relative z-[2] px-4 pb-4 pt-1 space-y-2">
            <div className="flex items-center gap-2">
              {/* La rarete tient dans un point. Le mot reste accessible
                  au survol et aux lecteurs d ecran. */}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: r.accent, boxShadow: estLegendaire ? `0 0 6px ${r.accent}` : undefined }}
                aria-hidden="true"
              />
              <h3
                className="font-orbitron text-[0.8125rem] font-semibold tracking-wide truncate flex-1 text-foreground"
                title={`${name} · ${libelleRarete(rarity)}`}
              >
                {name}
              </h3>
              <span className="sr-only">{libelleRarete(rarity)}</span>
            </div>

            <div className="relative h-8">
              {/* Au repos : le prix. */}
              <motion.div
                className="absolute inset-0 flex items-center"
                animate={{ opacity: decouvert ? 0 : 1 }}
                transition={{ duration: 0.15 }}
              >
                {owned ? (
                  <span className="text-xs font-rajdhani text-muted-foreground">
                    {t("shop.modules.unlocked", "Débloqué")}
                  </span>
                ) : isComingSoon ? (
                  <span className="text-xs text-muted-foreground font-rajdhani">
                    {t("shop.modules.comingSoon", "Bientôt disponible")}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 font-orbitron text-sm font-bold" style={{ color: r.accent }}>
                    <BondIcon size={16} /> {price.toLocaleString()}
                  </div>
                )}
              </motion.div>

              {/* Au survol : l action prend la place du prix. */}
              <motion.div
                className={cn(
                  "absolute inset-0 flex items-center gap-1.5",
                  decouvert ? "pointer-events-auto" : "pointer-events-none",
                )}
                animate={{ opacity: decouvert ? 1 : 0 }}
                transition={{ duration: 0.15 }}
              >
                {actionnable && (
                  <>
                    <Button
                      size="sm"
                      disabled={!canAfford}
                      onClick={onPurchase}
                      className="flex-1 h-8 text-xs font-rajdhani font-semibold rounded-lg"
                      style={{
                        background: canAfford ? r.glowStrong : "hsl(var(--muted) / 0.3)",
                        color: canAfford ? r.accent : "hsl(var(--muted-foreground))",
                        border: `1px solid ${canAfford ? r.border : "hsl(var(--border))"}`,
                      }}
                    >
                      {canAfford ? (
                        <span className="flex items-center gap-1.5">
                          <BondIcon size={13} /> {price.toLocaleString()}
                        </span>
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                    </Button>

                    {isCosmetic && onPreview && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); onPreview(); }}
                        className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-primary"
                        title={t("shop.purchase.preview", "Aperçu")}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
