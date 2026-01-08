import { motion } from 'framer-motion';
import { 
  Briefcase, Heart, BookOpen, Cog, User, Tag, Filter, Clock, Calendar, Sparkles, X,
  ArrowUpDown, ArrowUp, ArrowDown, SortAsc
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export type SortField = 'created_at' | 'deadline' | 'priority' | 'name' | 'category' | 'is_urgent';
export type SortDirection = 'asc' | 'desc';

interface TodoFilterSortProps {
  selectedCategory: string | null;
  selectedTaskType: string | null;
  sortField: SortField;
  sortDirection: SortDirection;
  onCategoryChange: (category: string | null) => void;
  onTaskTypeChange: (taskType: string | null) => void;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const categories = [
  { id: 'work', label: 'Work', icon: Briefcase, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { id: 'health', label: 'Health', icon: Heart, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { id: 'personal', label: 'Personal', icon: User, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { id: 'study', label: 'Study', icon: BookOpen, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { id: 'admin', label: 'Admin', icon: Cog, color: 'text-gray-400 border-gray-500/30 bg-gray-500/10' },
  { id: 'general', label: 'General', icon: Tag, color: 'text-muted-foreground border-border bg-muted/30' },
];

const taskTypes = [
  { id: 'flexible', label: 'Flexible', icon: Sparkles, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  { id: 'deadline', label: 'Deadline', icon: Clock, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { id: 'appointment', label: 'Appointment', icon: Calendar, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
];

const sortOptions: { field: SortField; label: string; icon: React.ElementType }[] = [
  { field: 'created_at', label: 'Date Created', icon: Calendar },
  { field: 'deadline', label: 'Deadline', icon: Clock },
  { field: 'priority', label: 'Priority', icon: ArrowUpDown },
  { field: 'name', label: 'Name', icon: SortAsc },
  { field: 'category', label: 'Category', icon: Tag },
  { field: 'is_urgent', label: 'Urgency', icon: Sparkles },
];

export function TodoFilterSort({ 
  selectedCategory, 
  selectedTaskType,
  sortField,
  sortDirection,
  onCategoryChange, 
  onTaskTypeChange,
  onSortChange,
}: TodoFilterSortProps) {
  const hasFilters = selectedCategory || selectedTaskType;
  const currentSort = sortOptions.find(s => s.field === sortField);

  const toggleDirection = () => {
    onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-4 rounded-2xl bg-card/30 border border-border/30 backdrop-blur-sm"
    >
      {/* Header with sort controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filter & Sort</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-3 text-xs bg-card/50 border border-border/50 hover:bg-card/80"
              >
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                Sort: {currentSort?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => {
                const Icon = option.icon;
                const isActive = sortField === option.field;
                return (
                  <DropdownMenuItem
                    key={option.field}
                    onClick={() => onSortChange(option.field, sortDirection)}
                    className={cn(
                      'cursor-pointer flex items-center gap-2',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {option.label}
                    {isActive && (
                      <span className="ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Direction toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDirection}
            className="h-8 w-8 p-0 bg-card/50 border border-border/50 hover:bg-card/80"
          >
            {sortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5" />
            )}
          </Button>

          {/* Clear filters */}
          {hasFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onCategoryChange(null);
                  onTaskTypeChange(null);
                }}
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Categories</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCategoryChange(isSelected ? null : cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                  isSelected
                    ? cat.color + ' ring-1 ring-current'
                    : 'border-border/50 bg-card/30 text-muted-foreground hover:bg-card/50'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Task Types */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">Task Type</span>
        <div className="flex flex-wrap gap-2">
          {taskTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedTaskType === type.id;
            
            return (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTaskTypeChange(isSelected ? null : type.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                  isSelected
                    ? type.color + ' ring-1 ring-current'
                    : 'border-border/50 bg-card/30 text-muted-foreground hover:bg-card/50'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {type.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
