import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, ArrowUpDown, Eye, EyeOff, X } from "lucide-react";
import { Input } from "@/socle/ui/input";
import { Button } from "@/socle/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/socle/ui/dropdown-menu";
import { Badge } from "@/socle/ui/badge";

import type { SortOption, RarityFilter, ShopFilterState } from "@/domaines/boutique/types";
export type { SortOption, RarityFilter, ShopFilterState };

interface ShopFiltersProps {
  filters: ShopFilterState;
  onFiltersChange: (filters: ShopFilterState) => void;
  showRarityFilter?: boolean;
  totalItems?: number;
  visibleItems?: number;
}

/* Les tables gardent l ordre d affichage ; le texte vient de i18next.
   Ecrites en dur, elles etaient hors de portee de la traduction. */
const sortLabels: Record<SortOption, [string, string]> = {
  "price-asc": ["shop.filters.priceAsc", "Prix croissant"],
  "price-desc": ["shop.filters.priceDesc", "Prix décroissant"],
  "name-asc": ["shop.filters.nameAsc", "Nom · A à Z"],
  "name-desc": ["shop.filters.nameDesc", "Nom · Z à A"],
  "rarity": ["shop.filters.rarity", "Rareté"],
};

const rarityLabels: Record<RarityFilter, [string, string]> = {
  all: ["shop.filters.allRarities", "Toutes les raretés"],
  common: ["shop.rarity.common", "Commun"],
  rare: ["shop.rarity.rare", "Rare"],
  epic: ["shop.rarity.epic", "Épique"],
  legendary: ["shop.rarity.legendary", "Légendaire"],
};

const rarityColors: Record<string, string> = {
  common: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  rare: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  epic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  legendary: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export function ShopFilters({
  filters,
  onFiltersChange,
  showRarityFilter = true,
  totalItems,
  visibleItems,
}: ShopFiltersProps) {
  const { t } = useTranslation();
  const hasActiveFilters = 
    filters.search !== "" || 
    filters.rarity !== "all" || 
    filters.hideOwned;

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      search: "",
      rarity: "all",
      hideOwned: false,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("shop.filters.search", "Chercher un article")}
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10 bg-card/50 border-primary/20 font-rajdhani placeholder:text-muted-foreground/60"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 bg-card/50 border-primary/20 font-rajdhani"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">{t("shop.filters.sort", "Trier")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-orbitron text-xs">{t("shop.filters.sortBy", "Trier par")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={filters.sort}
              onValueChange={(value) => onFiltersChange({ ...filters, sort: value as SortOption })}
            >
              {Object.entries(sortLabels).map(([key, [cle, secours]]) => (
                <DropdownMenuRadioItem key={key} value={key} className="font-rajdhani">
                  {t(cle, secours)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`gap-2 bg-card/50 border-primary/20 font-rajdhani ${hasActiveFilters ? 'border-primary/50 text-primary' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">{t("shop.filters.filter", "Filtrer")}</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  !
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-orbitron text-xs">{t("shop.filters.filters", "Filtres")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Hide Owned Toggle */}
            <DropdownMenuCheckboxItem
              checked={filters.hideOwned}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, hideOwned: checked })}
              className="font-rajdhani"
            >
              <div className="flex items-center gap-2">
                {filters.hideOwned ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {t("shop.filters.hideOwned", "Masquer ce que je possède")}
              </div>
            </DropdownMenuCheckboxItem>
            
            {showRarityFilter && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-orbitron text-xs">{t("shop.filters.rarity", "Rareté")}</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={filters.rarity}
                  onValueChange={(value) => onFiltersChange({ ...filters, rarity: value as RarityFilter })}
                >
                  {Object.entries(rarityLabels).map(([key, [cle, secours]]) => (
                    <DropdownMenuRadioItem key={key} value={key} className="font-rajdhani">
                      {key !== "all" && (
                        <span className={`w-2 h-2 rounded-full mr-2 ${rarityColors[key]?.split(' ')[0]}`} />
                      )}
                      {t(cle, secours)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters & Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {hasActiveFilters && (
            <>
              {filters.rarity !== "all" && (
                <Badge 
                  variant="outline" 
                  className={`${rarityColors[filters.rarity]} font-rajdhani text-xs capitalize`}
                >
                  {filters.rarity}
                  <button
                    onClick={() => onFiltersChange({ ...filters, rarity: "all" })}
                    className="ml-1.5 hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.hideOwned && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-rajdhani text-xs">
                  {t("shop.filters.hidingOwned", "Possédés masqués")}
                  <button
                    onClick={() => onFiltersChange({ ...filters, hideOwned: false })}
                    className="ml-1.5 hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground font-rajdhani underline underline-offset-2"
              >
                {t("shop.filters.reset", "Tout effacer")}
              </button>
            </>
          )}
        </div>
        
        {typeof totalItems === "number" && typeof visibleItems === "number" && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground font-rajdhani"
          >
            {t("shop.cosmetics.showing", { n: visibleItems, total: totalItems })}
          </motion.span>
        )}
      </div>
    </div>
  );
}

// Helper function to apply filters

