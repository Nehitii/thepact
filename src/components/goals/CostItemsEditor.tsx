import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Receipt, ArrowDownToLine, ShoppingCart, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getCurrencySymbol, formatCurrency } from "@/lib/currency";
import { COST_ITEM_CATEGORIES } from "@/lib/goalConstants";

export interface CostItemData {
  id?: string;
  name: string;
  price: number;
  category?: string;
  stepId?: string | null;
}

interface StepOption {
  id: string;
  title: string;
  order: number;
}

interface CostItemsEditorProps {
  items: CostItemData[];
  onChange: (items: CostItemData[]) => void;
  legacyTotal?: number;
  onAddToWishlist?: (item: CostItemData) => void;
  steps?: StepOption[];
}

export function CostItemsEditor({ items, onChange, legacyTotal, onAddToWishlist, steps }: CostItemsEditorProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const totalCost = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const hasLegacyCost = items.length === 0 && legacyTotal && legacyTotal > 0;
  const displayTotal = hasLegacyCost ? legacyTotal : totalCost;

  const handleAddItem = () => {
    onChange([...items, { name: "", price: 0, category: undefined, stepId: null }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleItemChange = (index: number, field: keyof CostItemData, value: string | number | null) => {
    const newItems = [...items];
    if (field === "price") {
      newItems[index] = { ...newItems[index], price: Number(value) || 0 };
    } else if (field === "category") {
      newItems[index] = { ...newItems[index], category: value as string || undefined };
    } else if (field === "stepId") {
      newItems[index] = { ...newItems[index], stepId: value as string | null };
    } else {
      newItems[index] = { ...newItems[index], [field]: String(value) };
    }
    onChange(newItems);
  };

  const handleConvertLegacyCost = () => {
    if (legacyTotal && legacyTotal > 0) {
      onChange([{ name: "Estimated Cost (migrated)", price: legacyTotal }]);
    }
  };

  const handleClearLegacyCost = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/70 flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Estimated Cost (Itemized)
        </Label>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-3 rounded-xl border border-primary/20 bg-background/50 backdrop-blur-sm animate-fade-in space-y-3"
          >
            {/* Row 1: Name + Price + Actions */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Item name (e.g., Materials)"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, "name", e.target.value)}
                  variant="light"
                  className="rounded-lg"
                />
              </div>
              <div className="w-32 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 text-sm">
                  {currencySymbol}
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={item.price || ""}
                  onChange={(e) => handleItemChange(index, "price", e.target.value)}
                  variant="light"
                  className="pl-7 rounded-lg"
                />
              </div>
              {onAddToWishlist && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onAddToWishlist(item)}
                  className="h-9 w-9 text-primary/70 hover:text-primary hover:bg-primary/10 rounded-lg"
                  title="Add to Wishlist"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(index)}
                className="h-9 w-9 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Row 2: Category + Step Link */}
            <div className="flex items-center gap-3">
              {/* Category */}
              <div className="flex-1">
                <Select
                  value={item.category || "none"}
                  onValueChange={(v) => handleItemChange(index, "category", v === "none" ? null : v)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-lg border-border bg-muted/30">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {COST_ITEM_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {t(cat.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step Link (only if steps provided) */}
              {steps && steps.length > 0 && (
                <div className="flex-1">
                  <Select
                    value={item.stepId || "none"}
                    onValueChange={(v) => handleItemChange(index, "stepId", v === "none" ? null : v)}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-lg border-border bg-muted/30">
                      <Link2 className="h-3 w-3 mr-1 text-primary/50" />
                      <SelectValue placeholder="Link to step" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked step</SelectItem>
                      {steps.map((step) => (
                        <SelectItem key={step.id} value={step.id}>
                          Step {step.order}: {step.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Legacy cost handling */}
        {hasLegacyCost && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
            <div className="text-center">
              <p className="text-sm font-rajdhani text-amber-400">
                Legacy Cost: <span className="font-bold">{formatCurrency(legacyTotal!, currency)}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This cost was set before itemization was available
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleConvertLegacyCost}
                className="flex-1 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-400 font-rajdhani text-xs"
              >
                <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
                Convert to Item
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearLegacyCost}
                className="flex-1 border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10 text-destructive font-rajdhani text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Clear Cost
              </Button>
            </div>
          </div>
        )}

        {items.length === 0 && !hasLegacyCost && (
          <div className="text-center py-6 text-muted-foreground font-rajdhani border border-dashed border-primary/20 rounded-xl">
            <p className="text-sm">No cost items added yet</p>
          </div>
        )}
      </div>

      {/* Add item button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddItem}
        className="w-full border-primary/30 border-dashed hover:border-primary/50 hover:bg-primary/5 font-rajdhani tracking-wide rounded-xl"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Cost Item
      </Button>

      {/* Total display */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-background/80 backdrop-blur-sm">
        <span className="font-rajdhani uppercase tracking-wider text-primary/70 text-sm">
          Total Estimated Cost
        </span>
        <span className="font-orbitron font-bold text-lg text-primary drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
          {formatCurrency(displayTotal, currency)}
        </span>
      </div>
    </div>
  );
}
