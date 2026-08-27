import { useState, useEffect, useRef } from "react";
import { useRarityLabel, getRarity } from "./shopRarity";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { HoldPurchaseButton } from "@/components/shop/HoldPurchaseButton";

export interface PurchaseItem {
  id: string;
  name: string;
  type: "frame" | "banner" | "title" | "module" | "bundle" | "cosmetic";
  price: number;
  rarity?: string;
  previewElement?: React.ReactNode;
  originalPrice?: number;
}

interface PurchaseConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PurchaseItem | null;
  currentBalance: number;
  onConfirm: () => void;
  isPending?: boolean;
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  /* LA VALEUR DE DÉPART SE LIT, ELLE NE SE SUIT PAS.
     L'animation part de ce qui est affiché à l'instant où la cible
     change. Mettre `display` dans les dépendances relancerait l'effet à
     chaque image — une boucle. Un ref le donne sans l'observer. */
  const afficheRef = useRef(display);
  afficheRef.current = display;
  useEffect(() => {
    const start = afficheRef.current;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 400;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + diff * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span className={className}>{display.toLocaleString()}</span>;
}

/* TROIS DEFAUTS TENAIENT DANS CETTE FENETRE.
 *
 * `AlertDialog` interdit par principe la fermeture au clic exterieur :
 * c est le composant des decisions qu on ne doit pas ecarter par
 * megarde. Une confirmation d achat n en est pas une — on doit
 * pouvoir renoncer d un clic a cote. `Dialog` le permet, et garde
 * Echap.
 *
 * La pastille de rarete composait sa classe a l execution —
 * `bg-${...}-500/20` — ce que Tailwind ne peut pas generer : elle
 * n avait donc aucune couleur. Elle lit maintenant les memes jetons
 * que le reste de la boutique, quatrieme copie de la table de rarete
 * supprimee au passage.
 *
 * Et le texte etait en anglais dans une interface francaise. */
export function PurchaseConfirmModal({
  open,
  onOpenChange,
  item,
  currentBalance,
  onConfirm,
  isPending = false,
}: PurchaseConfirmModalProps) {
  const libelleRarete = useRarityLabel();
  const { t } = useTranslation();
  if (!item) return null;

  const canAfford = currentBalance >= item.price;
  const newBalance = currentBalance - item.price;
  const rarity = item.rarity || "common";
  const r = getRarity(rarity);
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const lowBalanceWarning = canAfford && newBalance < 100;
  const estLegendaire = rarity === "legendary";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border border-primary/15 bg-card/95 backdrop-blur-xl">
        {/* L ornement reste reserve au legendaire, comme sur les cartes. */}
        {estLegendaire && (
          <div
            className="absolute inset-x-0 top-0 h-[2px] pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${r.accent}, transparent)` }}
          />
        )}

        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl">
            {t("shop.purchase.title", "Confirmer l’achat")}
          </DialogTitle>
          <DialogDescription className="font-rajdhani text-muted-foreground">
            {t(`shop.purchase.about.${item.type}`, {
              defaultValue: t("shop.purchase.about.cosmetic", "Tu vas acquérir cette pièce."),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-background/40 border border-primary/10">
            {item.previewElement && (
              <div className="flex-shrink-0">{item.previewElement}</div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-rajdhani font-semibold text-foreground text-lg truncate">
                {item.name}
              </h4>
              <span
                className="inline-flex mt-1.5 ds-t-label uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{ color: r.accent, borderColor: r.border, background: r.glow }}
              >
                {libelleRarete(rarity)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-rajdhani">
              <span className="text-muted-foreground">{t("shop.purchase.currentBalance", "Solde actuel")}</span>
              <div className="flex items-center gap-1.5 tabular-nums">
                <BondIcon size={16} />
                <AnimatedNumber value={currentBalance} className="text-foreground font-medium" />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm font-rajdhani">
              <span className="text-muted-foreground">{t("shop.purchase.itemCost", "Coût")}</span>
              <div className="flex items-center gap-2 tabular-nums">
                {hasDiscount && (
                  <span className="text-muted-foreground line-through text-xs">
                    {item.originalPrice?.toLocaleString()}
                  </span>
                )}
                <span className="flex items-center gap-1 text-foreground">
                  −<BondIcon size={16} />
                  <span className="font-medium">{item.price.toLocaleString()}</span>
                </span>
              </div>
            </div>

            <div
              className="h-px"
              style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.25), transparent)" }}
            />

            <div className="flex items-center justify-between font-rajdhani">
              <span className="text-foreground font-medium">{t("shop.purchase.newBalance", "Nouveau solde")}</span>
              <div className={`flex items-center gap-1.5 tabular-nums ${canAfford ? "text-primary" : "text-destructive"}`}>
                <BondIcon size={18} />
                <span className="font-orbitron font-bold text-lg">
                  <AnimatedNumber value={Math.max(0, newBalance)} />
                </span>
              </div>
            </div>
          </div>

          {lowBalanceWarning && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs font-rajdhani text-amber-400">
                {t("shop.purchase.lowBalance", "Il te restera moins de 100 bonds après cet achat.")}
              </span>
            </motion.div>
          )}

          {!canAfford && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/25"
            >
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div className="text-sm font-rajdhani">
                <span className="text-destructive font-medium">
                  {t("shop.purchase.insufficient", "Bonds insuffisants")}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  {t("shop.purchase.missing", { n: (item.price - currentBalance).toLocaleString() })}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-rajdhani" disabled={isPending}>
            {t("shop.purchase.cancel", "Annuler")}
          </Button>
          <div className="flex-1 min-w-[160px]">
            <HoldPurchaseButton onComplete={onConfirm} disabled={!canAfford} isPending={isPending} />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
