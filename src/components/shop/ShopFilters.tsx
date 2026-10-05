import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, ArrowUpDown, Eye, EyeOff, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type SortOption = "price-asc" | "price-desc" | "name-asc" | "name-desc" | "rarity";
export type RarityFilter = "all" | "common" | "rare" | "epic" | "legendary";

export interface ShopFilterState {
  search: string;
  sort: SortOption;
  rarity: RarityFilter;
  hideOwned: boolean;
}

interface ShopFiltersProps {
  filters: ShopFilterState;
  onFiltersChange: (filters: ShopFilterState) => void;
  showRarityFilter?: boolean;
  totalItems?: number;
  visibleItems?: number;
}

const sortLabels: Record<SortOption, string> = {
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A to Z",
  "name-desc": "Name: Z to A",
  "rarity": "Rarity",
};

const rarityLabels: Record<RarityFilter, string> = {
  all: "All Rarities",
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
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
            placeholder="Search items..."
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
              <span className="hidden sm:inline">Sort</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-orbitron text-xs">Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={filters.sort}
              onValueChange={(value) => onFiltersChange({ ...filters, sort: value as SortOption })}
            >
              {Object.entries(sortLabels).map(([key, label]) => (
                <DropdownMenuRadioItem key={key} value={key} className="font-rajdhani">
                  {label}
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
              <span className="hidden sm:inline">Filter</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  !
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-orbitron text-xs">Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Hide Owned Toggle */}
            <DropdownMenuCheckboxItem
              checked={filters.hideOwned}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, hideOwned: checked })}
              className="font-rajdhani"
            >
              <div className="flex items-center gap-2">
                {filters.hideOwned ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Hide owned items
              </div>
            </DropdownMenuCheckboxItem>
            
            {showRarityFilter && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="font-orbitron text-xs">Rarity</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={filters.rarity}
                  onValueChange={(value) => onFiltersChange({ ...filters, rarity: value as RarityFilter })}
                >
                  {Object.entries(rarityLabels).map(([key, label]) => (
                    <DropdownMenuRadioItem key={key} value={key} className="font-rajdhani">
                      {key !== "all" && (
                        <span className={`w-2 h-2 rounded-full mr-2 ${rarityColors[key]?.split(' ')[0]}`} />
                      )}
                      {label}
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
                  Hiding owned
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
                Clear all
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
            Showing {visibleItems} of {totalItems} items
          </motion.span>
        )}
      </div>
    </div>
  );
}

// Helper function to apply filters
export function applyShopFilters<T extends { name: string; rarity?: string; price?: number; is_default?: boolean }>(
  items: T[],
  filters: ShopFilterState,
  isOwned: (item: T) => boolean
): T[] {
  let filtered = [...items];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(searchLower)
    );
  }

  // Rarity filter
  if (filters.rarity !== "all") {
    filtered = filtered.filter(item => item.rarity === filters.rarity);
  }

  // Hide owned filter
  if (filters.hideOwned) {
    filtered = filtered.filter(item => !isOwned(item) && !item.is_default);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (filters.sort) {
      case "price-asc":
        return (a.price || 0) - (b.price || 0);
      case "price-desc":
        return (b.price || 0) - (a.price || 0);
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "rarity": {
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
        return (rarityOrder[a.rarity as keyof typeof rarityOrder] ?? 4) - 
               (rarityOrder[b.rarity as keyof typeof rarityOrder] ?? 4);
      }
      default:
        return 0;
    }
  });

  return filtered;
}
