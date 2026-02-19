import { 
  Lightbulb, TrendingUp, AlertTriangle, Brain, HelpCircle, Heart,
  ArrowDownWideNarrow, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PostFilterType, PostSortOption } from "@/hooks/useCommunity";

interface PostFiltersProps {
  activeFilter: PostFilterType;
  onFilterChange: (filter: PostFilterType) => void;
  activeSort: PostSortOption;
  onSortChange: (sort: PostSortOption) => void;
}

const filterOptions: { value: PostFilterType; label: string; icon: typeof Lightbulb }[] = [
  { value: 'all', label: 'All', icon: ArrowDownWideNarrow },
  { value: 'reflection', label: 'Reflections', icon: Lightbulb },
  { value: 'progress', label: 'Progress', icon: TrendingUp },
  { value: 'obstacle', label: 'Obstacles', icon: AlertTriangle },
  { value: 'mindset', label: 'Mindset', icon: Brain },
  { value: 'help_request', label: 'Help', icon: HelpCircle },
  { value: 'encouragement', label: 'Support', icon: Heart },
];

export function PostFilters({ activeFilter, onFilterChange, activeSort, onSortChange }: PostFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {filterOptions.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              activeFilter === value
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-muted/50 text-muted-foreground border border-border/50 hover:border-primary/30 hover:text-foreground"
            )}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={activeSort === 'recent' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSortChange('recent')}
          className="h-7 text-xs gap-1"
        >
          <ArrowDownWideNarrow className="w-3 h-3" />
          Recent
        </Button>
        <Button
          variant={activeSort === 'popular' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSortChange('popular')}
          className="h-7 text-xs gap-1"
        >
          <Flame className="w-3 h-3" />
          Popular
        </Button>
      </div>
    </div>
  );
}
