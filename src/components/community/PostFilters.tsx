import { cn } from "@/lib/utils";
import type { PostFilterType, PostSortOption } from "@/hooks/useCommunity";

interface PostFiltersProps {
  activeFilter: PostFilterType;
  onFilterChange: (filter: PostFilterType) => void;
  activeSort: PostSortOption;
  onSortChange: (sort: PostSortOption) => void;
}

const filterOptions: {
  value: PostFilterType;
  label: string;
  dotColor: string;
  activeClasses: string;
}[] = [
  {
    value: "all",
    label: "All",
    dotColor: "bg-primary",
    activeClasses: "bg-primary/18 border-primary/40 text-violet-300 font-semibold",
  },
  {
    value: "reflection",
    label: "Reflections",
    dotColor: "bg-blue-500",
    activeClasses: "bg-blue-500/15 border-blue-500/40 text-blue-300 font-semibold",
  },
  {
    value: "progress",
    label: "Progress",
    dotColor: "bg-amber-500",
    activeClasses: "bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold",
  },
  {
    value: "obstacle",
    label: "Obstacles",
    dotColor: "bg-rose-500",
    activeClasses: "bg-rose-500/15 border-rose-500/40 text-rose-300 font-semibold",
  },
  {
    value: "mindset",
    label: "Mindset",
    dotColor: "bg-violet-500",
    activeClasses: "bg-violet-500/15 border-violet-500/40 text-violet-300 font-semibold",
  },
  {
    value: "help_request",
    label: "Help Needed",
    dotColor: "bg-orange-500",
    activeClasses: "bg-orange-500/15 border-orange-500/40 text-orange-300 font-semibold",
  },
  {
    value: "encouragement",
    label: "Support",
    dotColor: "bg-emerald-500",
    activeClasses: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold",
  },
];

export function PostFilters({ activeFilter, onFilterChange, activeSort, onSortChange }: PostFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="font-mono text-[10px] text-muted-foreground tracking-[0.1em] uppercase">Filter by type</div>

      {/* Filter chips
          ✅ FIX 1 : "-mx-1 px-1" supprimés — ils faisaient déborder le container
                     et déclenchaient un scroll horizontal sur la page.
          ✅ FIX 2 : "scrollbar-none" remplacé par "scrollbar-hide" (classe native
                     de tailwind-scrollbar-hide) OU par le style inline ci-dessous,
                     qui fonctionne sans plugin supplémentaire.
      */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        {filterOptions.map(({ value, label, dotColor, activeClasses }) => {
          const isActive = activeFilter === value;
          return (
            <button
              key={value}
              onClick={() => onFilterChange(value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 border",
                isActive
                  ? activeClasses
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground",
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-2 mt-3">
        <span className="font-mono text-[11px] text-muted-foreground">Sort:</span>
        {[
          { value: "recent" as PostSortOption, label: "⏱ Recent" },
          { value: "popular" as PostSortOption, label: "🔥 Popular" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSortChange(value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-medium font-mono border transition-all flex items-center gap-1.5",
              activeSort === value
                ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/25"
                : "bg-transparent border-border/50 text-muted-foreground hover:border-primary/30",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
