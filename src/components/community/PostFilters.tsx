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
  dot: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}[] = [
  {
    value: "all",
    label: "All",
    dot: "#7b5cfa",
    activeBg: "rgba(123,92,250,0.18)",
    activeBorder: "rgba(123,92,250,0.4)",
    activeText: "#c4b5fd",
  },
  {
    value: "reflection",
    label: "Reflections",
    dot: "#3b82f6",
    activeBg: "rgba(59,130,246,0.15)",
    activeBorder: "rgba(59,130,246,0.4)",
    activeText: "#93c5fd",
  },
  {
    value: "progress",
    label: "Progress",
    dot: "#f59e0b",
    activeBg: "rgba(245,158,11,0.15)",
    activeBorder: "rgba(245,158,11,0.4)",
    activeText: "#fcd34d",
  },
  {
    value: "obstacle",
    label: "Obstacles",
    dot: "#f43f5e",
    activeBg: "rgba(244,63,94,0.15)",
    activeBorder: "rgba(244,63,94,0.4)",
    activeText: "#fda4af",
  },
  {
    value: "mindset",
    label: "Mindset",
    dot: "#a855f7",
    activeBg: "rgba(168,85,247,0.15)",
    activeBorder: "rgba(168,85,247,0.4)",
    activeText: "#d8b4fe",
  },
  {
    value: "help_request",
    label: "Help Needed",
    dot: "#fb923c",
    activeBg: "rgba(251,146,60,0.15)",
    activeBorder: "rgba(251,146,60,0.4)",
    activeText: "#fdba74",
  },
  {
    value: "encouragement",
    label: "Support",
    dot: "#10b981",
    activeBg: "rgba(16,185,129,0.15)",
    activeBorder: "rgba(16,185,129,0.4)",
    activeText: "#6ee7b7",
  },
];

export function PostFilters({ activeFilter, onFilterChange, activeSort, onSortChange }: PostFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Section label */}
      <div className="font-mono text-[10px] text-muted-foreground tracking-[0.1em] uppercase">Filter by type</div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {filterOptions.map((opt) => {
          const isActive = activeFilter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onFilterChange(opt.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 border",
                !isActive &&
                  "bg-card border-border/50 text-muted-foreground hover:border-primary/25 hover:text-foreground",
              )}
              style={
                isActive
                  ? {
                      background: opt.activeBg,
                      borderColor: opt.activeBorder,
                      color: opt.activeText,
                      fontWeight: 600,
                    }
                  : undefined
              }
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: opt.dot }} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Sort row */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">Sort:</span>
        {(["recent", "popular"] as PostSortOption[]).map((s) => (
          <button
            key={s}
            onClick={() => onSortChange(s)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] font-medium border transition-all",
              activeSort === s
                ? "bg-primary border-primary text-white shadow-[0_2px_12px_rgba(123,92,250,0.35)]"
                : "bg-transparent border-border/50 text-muted-foreground hover:border-primary/25",
            )}
          >
            {s === "recent" ? "⏱" : "🔥"} {s === "recent" ? "Recent" : "Popular"}
          </button>
        ))}
      </div>
    </div>
  );
}
