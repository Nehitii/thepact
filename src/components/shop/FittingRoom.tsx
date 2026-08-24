import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { CosmeticFrame, CosmeticBanner, CosmeticTitle } from "@/hooks/useShop";
import { HoldPurchaseButton } from "./HoldPurchaseButton";
import { BondIcon } from "@/components/ui/bond-icon";
import { CarteProfilPublic } from "@/components/profile/CarteProfilPublic";
import { useCarteProfil, type CarteProfil } from "@/hooks/useCarteProfil";
import { useRarityLabel, getRarity } from "./shopRarity";

type PreviewItem =
  | { type: "frame"; data: CosmeticFrame }
  | { type: "banner"; data: CosmeticBanner }
  | { type: "title"; data: CosmeticTitle };

interface FittingRoomProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewItem: PreviewItem | null;
  onPurchase: () => void;
  isPending: boolean;
  canAfford: boolean;
  currentBalance: number;
}

/* L ESSAYAGE MONTRE LA CARTE, PAS UNE IMITATION.
 *
 * Il dessinait sa propre maquette de profil — une bande, un avatar, un
 * nom — a cote de la vraie carte qui existait deja. Deux rendus a
 * maintenir, et surtout un apercu qui pouvait mentir : la maquette ne
 * reprenait ni le rang, ni la phrase, ni la mise en page reelle, et
 * ses etiquettes « FITTING ROOM », « PREVIEW » et « NEW » etaient
 * restees en anglais.
 *
 * On rend maintenant `CarteProfilPublic`, la meme qu au survol d un
 * membre et que dans les reglages, avec la piece essayee substituee.
 * Ce qu on essaie est ce qu on portera. */
export function FittingRoom({
  open,
  onOpenChange,
  previewItem,
  onPurchase,
  isPending,
  canAfford,
  currentBalance,
}: FittingRoomProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const libelleRarete = useRarityLabel();
  /* La requete ne part qu a l ouverture du panneau. */
  const { data: maCarte } = useCarteProfil(user?.id, open);

  if (!previewItem) return null;

  const rarete = previewItem.data.rarity;
  const r = getRarity(rarete);
  const price = previewItem.data.price;
  const itemName =
    previewItem.type === "title" ? previewItem.data.title_text : previewItem.data.name;

  /* La carte du porteur, dont on ne change que la piece essayee. */
  const essai: CarteProfil | null = maCarte
    ? {
        ...maCarte,
        cadre:
          previewItem.type === "frame"
            ? {
                image: previewItem.data.preview_url ?? null,
                bordure: previewItem.data.border_color ?? null,
                lueur: previewItem.data.glow_color ?? null,
                montrerBordure: previewItem.data.show_border ?? null,
                echelle: previewItem.data.frame_scale ?? null,
                decalageX: previewItem.data.frame_offset_x ?? null,
                decalageY: previewItem.data.frame_offset_y ?? null,
              }
            : maCarte.cadre,
        banniere:
          previewItem.type === "banner"
            ? {
                image: previewItem.data.banner_url ?? null,
                debut: previewItem.data.gradient_start ?? null,
                fin: previewItem.data.gradient_end ?? null,
                rarete,
              }
            : maCarte.banniere,
        titre:
          previewItem.type === "title"
            ? {
                texte: previewItem.data.title_text ?? null,
                couleur: previewItem.data.text_color ?? null,
                lueur: previewItem.data.glow_color ?? null,
              }
            : maCarte.titre,
      }
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-l border-primary/20 bg-background/95 backdrop-blur-xl p-0 overflow-y-auto"
      >
        <SheetHeader className="p-6 pb-4 border-b border-primary/10">
          <SheetTitle className="font-orbitron text-lg tracking-wider text-primary">
            {t("shop.fitting.title", "Essayage")}
          </SheetTitle>
          <p className="text-xs text-muted-foreground font-rajdhani">
            {t("shop.fitting.subtitle", "Ta carte de profil, avec cette pièce dessus.")}
          </p>
        </SheetHeader>

        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            {essai ? (
              <CarteProfilPublic carte={essai} />
            ) : (
              <div className="w-[320px] h-[300px] rounded-2xl bg-card/40 animate-pulse" />
            )}
          </div>

          <div className="rounded-xl border border-primary/10 bg-card/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-rajdhani font-semibold text-foreground truncate">{itemName}</span>
              <span
                className="ds-t-label uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0"
                style={{ color: r.accent, borderColor: r.border, background: r.glow }}
              >
                {libelleRarete(rarete)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-rajdhani">
              <span className="text-muted-foreground">{t("shop.purchase.price", "Prix")}</span>
              <div className="flex items-center gap-1.5 text-primary font-orbitron tabular-nums">
                <BondIcon size={16} />
                {price.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm font-rajdhani">
              <span className="text-muted-foreground">{t("shop.fitting.balanceAfter", "Solde après")}</span>
              <span className={`font-orbitron tabular-nums ${canAfford ? "text-primary" : "text-destructive"}`}>
                {Math.max(0, currentBalance - price).toLocaleString()}
              </span>
            </div>
          </div>

          <HoldPurchaseButton onComplete={onPurchase} disabled={!canAfford} isPending={isPending} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
