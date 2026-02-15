import {
  LayoutGrid,
  LayoutList,
  Bookmark,
  Search,
  X,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SortOption,
  SortDirection,
  DisplayMode,
} from "@/hooks/useGoalFilters";

interface GoalsToolbarProps {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  sortDirection: SortDirection;
  toggleSortDirection: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  hideSuperGoals: boolean;
  setHideSuperGoals: (v: boolean) => void;
  hasSuperGoals: boolean;
  itemsPerPage: number;
  handleItemsPerPageChange: (v: string) => void;
}

const displayModes: { mode: DisplayMode; icon: typeof LayoutList; title: string }[] = [
  { mode: "bar", icon: LayoutList, title: "Bar View" },
  { mode: "grid", icon: LayoutGrid, title: "Grid View" },
  { mode: "bookmark", icon: Bookmark, title: "Bookmark View" },
];

export function GoalsToolbar({
  displayMode,
  setDisplayMode,
  sortBy,
  setSortBy,
  sortDirection,
  toggleSortDirection,
  searchQuery,
  setSearchQuery,
  hideSuperGoals,
  setHideSuperGoals,
  hasSuperGoals,
  itemsPerPage,
  handleItemsPerPageChange,
}: GoalsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border">
      {/* Display Mode Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
        {displayModes.map(({ mode, icon: Icon, title }) => (
          <button
            key={mode}
            onClick={() => setDisplayMode(mode)}
            className={`p-2 rounded-md transition-all ${
              displayMode === mode
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={title}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-border hidden md:block" />

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-rajdhani tracking-wider uppercase text-foreground/60">Sort</span>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="difficulty">Difficulty</SelectItem>
            <SelectItem value="type">Tag</SelectItem>
            <SelectItem value="points">Points</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="start">Start Date</SelectItem>
            <SelectItem value="progression">Progress</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSortDirection}
          className="h-9 w-9 rounded-xl border border-border/60 bg-card/90 hover:bg-card hover:border-primary/40 hover:shadow-[0_0_8px_hsl(var(--primary)/0.15)] transition-all duration-200"
        >
          <ChevronRight
            className={`h-4 w-4 text-foreground/70 transition-transform duration-200 ${
              sortDirection === "asc" ? "-rotate-90" : "rotate-90"
            }`}
          />
        </Button>
      </div>

      <div className="h-6 w-px bg-border hidden md:block" />

      {/* Search */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none z-30" />
        <Input
          type="text"
          placeholder="Search goals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="light"
          className="w-[180px] h-9 pl-9 pr-8 text-sm rounded-xl"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Hide Super Goals */}
      {hasSuperGoals && (
        <>
          <div className="h-6 w-px bg-border hidden md:block" />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={hideSuperGoals}
              onCheckedChange={(checked) => setHideSuperGoals(checked === true)}
            />
            <span className="text-xs font-rajdhani tracking-wider text-foreground/60">
              Hide Super Goals
            </span>
          </label>
        </>
      )}

      <div className="flex-1" />

      {/* Per Page */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-rajdhani text-foreground/60">Per page</span>
        <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
          <SelectTrigger className="w-[70px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["5", "10", "20", "50", "100", "200"].map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
