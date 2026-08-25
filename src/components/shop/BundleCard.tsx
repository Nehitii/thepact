import { motion } from "framer-motion";
import { TitreCosmetique } from "@/components/profile/TitreCosmetique";
import { useTranslation } from "react-i18next";
import { Package, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { WishlistButton } from "./WishlistButton";
import { ShopBundle } from "@/hooks/useBundles";
import { getRarity, useRarityLabel } from "./shopRarity";
import { useShopFrames, useShopBanners, useShopTitles } from "@/hooks/useShop";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarFrame } from "@/components/ui/avatar-frame";

interface BundleCardProps {
  bundle: ShopBundle;
  onPurchase: () => void;
  canAfford: boolean;
  ownedItemCount: number;
}

export function BundleCard({ bundle, onPurchase, canAfford, ownedItemCount }: BundleCardProps) {
  const libelleRarete = useRarityLabel();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profil } = useProfile(user?.id);

  /* Les trois catalogues sont deja charges par la page ; React Query
     les mutualise, donc composer le lot ne coute aucune requete. */
  const { data: cadres = [] } = useShopFrames();
  const { data: bannieres = [] } = useShopBanners();
  const { data: titres = [] } = useShopTitles();

  const r = getRarity(bundle.rarity);
  const allOwned = ownedItemCount === bundle.items.length;
  const savings = bundle.original_price_bonds ? bundle.original_price_bonds - bundle.price_bonds : 0;
  const remise = bundle.original_price_bonds
    ? Math.round((savings / bundle.original_price_bonds) * 100)
    : 0;

  /* LE LOT SE MONTRE PORTE, PAS EN LISTE.
   *
   * Un lot valait « 4 articles » et quatre pastilles de texte : rien
   * n y laissait voir a quoi ressemblerait le resultat. Or un cadre,
   * une banniere et un titre ne s achetent pas separement dans la
   * tete de qui les regarde — ils composent une seule chose, la carte
   * de profil. On la dessine donc avec les pieces du lot dessus. */
  const idsDe = (type: string) =>
    bundle.items.filter((i) => i.item_type === type).map((i) => i.item_id);

  const cadre = cadres.find((c) => idsDe("cosmetic_frame").includes(c.id));
  const banniere = bannieres.find((b) => idsDe("cosmetic_banner").includes(b.id));
  const titre = titres.find((x) => idsDe("cosmetic_title").includes(x.id));
  const composable = Boolean(cadre || banniere || titre);

  const initiales =
    (profil?.display_name ?? "")
      .split(/\s+/).filter(Boolean).slice(0, 2)
      .map((m) => m[0]?.toUpperCase() ?? "").join("") || "?";

  const fondBanniere = banniere
    ? banniere.banner_url
      ? `url(${banniere.banner_url}) center/cover`
      : `linear-gradient(135deg, ${banniere.gradient_start || "#0a0a12"}, ${banniere.gradient_end || "#1a1a2e"})`
    : `linear-gradient(135deg, ${r.glow}, hsl(var(--card)))`;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative rounded-2xl overflow-hidden group"
      style={{
        border: `1px solid hsl(var(--primary) / 0.10)`,
        background: "hsl(var(--card) / 0.82)",
      }}
    >
      {/* Comme sur les articles : l ornement est reserve au legendaire. */}
      {bundle.rarity === "legendary" && (
        <div
          className="absolute -inset-[1px] rounded-2xl pointer-events-none z-0 opacity-20 group-hover:opacity-70 transition-opacity duration-500"
          style={{
            background: `conic-gradient(from 0deg, ${r.accent}, transparent 30%, ${r.accent} 50%, transparent 80%, ${r.accent})`,
            animation: "spin 4s linear infinite",
          }}
        />
      )}

      <div className="relative z-[1] rounded-2xl overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        {/* ── L APERCU COMPOSE : la carte de profil, lot applique ── */}
        {/* sh-banniere : cette banniere est peinte par un fond de nuit
            passe en style inline, dans les deux themes. En clair, le
            texte pose dessus heritait du toner de la page — de l encre
            sombre sur un fond sombre. Il y passe donc en reserve. */}
        <div className="sh-banniere relative h-[124px] overflow-hidden" style={{ background: fondBanniere }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(var(--card)) 4%, transparent 65%)" }} />

          <div className="absolute top-2.5 right-2.5 z-10">
            <WishlistButton itemId={bundle.id} itemType="bundle" size="sm" />
          </div>

          {composable ? (
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-2.5 px-3 pb-2.5">
              <AvatarFrame
                size="md"
                avatarUrl={profil?.avatar_url ?? null}
                fallback={initiales}
                frameImage={cadre?.preview_url}
                borderColor={cadre?.border_color}
                glowColor={cadre?.glow_color}
                frameScale={cadre?.frame_scale}
                frameOffsetX={cadre?.frame_offset_x}
                frameOffsetY={cadre?.frame_offset_y}
              />
              <div className="min-w-0 pb-0.5">
                <div className="font-orbitron text-sm font-bold text-foreground truncate">
                  {profil?.display_name ?? ""}
                </div>
                {titre && (
                  <TitreCosmetique
                    texte={titre.title_text}
                    couleur={titre.text_color || r.accent}
                    lueur={titre.glow_color}
                    rarete={titre.rarity}
                    taille="compacte"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-10 h-10" style={{ color: r.accent }} />
            </div>
          )}
        </div>

        <div className="relative p-4 space-y-3">
          {/* ── Nom et rarete ── */}
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: r.accent, boxShadow: bundle.rarity === "legendary" ? `0 0 6px ${r.accent}` : undefined }}
                aria-hidden="true"
              />
              <h3 className="font-orbitron text-base font-bold text-foreground truncate" title={`${bundle.name} · ${libelleRarete(bundle.rarity)}`}>
                {bundle.name}
              </h3>
              <span className="sr-only">{libelleRarete(bundle.rarity)}</span>
            </div>
            {bundle.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 font-rajdhani">{bundle.description}</p>
            )}
          </div>

          {/* ── Le contenu, nomme ── */}
          <div className="flex flex-wrap gap-1.5">
            {bundle.items.map((item, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md ds-t-label text-muted-foreground"
                style={{ background: "hsl(var(--primary) / 0.05)", border: "1px solid hsl(var(--primary) / 0.10)" }}
              >
                {item.name || item.item_type.replace("cosmetic_", "")}
              </span>
            ))}
          </div>

          {ownedItemCount > 0 && (
            <div className="flex items-center gap-1.5 ds-t-label" style={{ color: "hsl(142 70% 50%)" }}>
              <Check className="w-3 h-3" /> {t("shop.bundles.owned", { n: ownedItemCount, total: bundle.items.length })}
            </div>
          )}

          {/* ── Le prix sur une ligne, remise comprise ──
              Le gain vivait dans un badge d angle, loin du prix qu il
              corrige. Mis bout a bout, les trois nombres se lisent
              d une traite : ce que ca valait, ce que ca coute, ce
              qu on economise. */}
          <div className="pt-3 border-t space-y-2.5" style={{ borderColor: "hsl(var(--primary) / 0.08)" }}>
            <div className="flex items-baseline gap-2 flex-wrap">
              {savings > 0 && bundle.original_price_bonds && (
                <span className="text-xs text-muted-foreground line-through tabular-nums">
                  {bundle.original_price_bonds.toLocaleString()}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xl font-orbitron font-bold tabular-nums" style={{ color: r.accent }}>
                <BondIcon size={19} /> {bundle.price_bonds.toLocaleString()}
              </span>
              {remise > 0 && (
                <span className="font-orbitron text-sm font-bold" style={{ color: "hsl(142 70% 50%)" }}>
                  (−{remise} %)
                </span>
              )}
            </div>

            {allOwned ? (
              <div className="w-full py-2.5 rounded-lg text-center ds-t-label font-orbitron tracking-wider" style={{ color: "hsl(142 70% 50%)", background: "hsl(142 70% 50% / 0.1)" }}>
                {t("shop.bundles.allOwned", "Tout possédé")}
              </div>
            ) : (
              <Button
                onClick={onPurchase}
                disabled={!canAfford}
                variant="outline"
                className="w-full h-10 font-orbitron text-xs tracking-wider rounded-lg"
                style={{ borderColor: r.border, color: canAfford ? r.accent : undefined, background: canAfford ? r.glow : undefined }}
              >
                {canAfford
                  ? t("shop.bundles.get", "Prendre le lot")
                  : <><Lock className="w-3 h-3 mr-1.5" /> {t("shop.bundles.needMore", "Bonds insuffisants")}</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
