import { motion } from 'framer-motion';
import { 
  Calendar, Clock, Sparkles, ChevronRight,
  List, Hourglass, CalendarClock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export type SortField = 'created_at' | 'deadline' | 'priority' | 'name' | 'category' | 'is_urgent';
export type SortDirection = 'asc' | 'desc';

interface TodoFilterSortProps {
  selectedTaskType: string | null;
  sortField: SortField;
  sortDirection: SortDirection;
  onTaskTypeChange: (taskType: string | null) => void;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const sortOptions: { field: SortField }[] = [
  { field: 'created_at' },
  { field: 'deadline' },
  { field: 'priority' },
  { field: 'name' },
  { field: 'category' },
  { field: 'is_urgent' },
];

// Updated task type filters with new types
const taskTypeFilters = [
  { id: null as string | null, labelKey: 'todo.filters.types.all', icon: List },
  { id: 'flexible', labelKey: 'todo.filters.types.flexible', icon: Sparkles },
  { id: 'waiting', labelKey: 'todo.filters.types.waiting', icon: Hourglass },
  { id: 'rendezvous', labelKey: 'todo.filters.types.rendezvous', icon: CalendarClock },
  { id: 'deadline', labelKey: 'todo.filters.types.deadline', icon: Clock },
];

export function TodoFilterSort({ 
  selectedTaskType,
  sortField,
  sortDirection,
  onTaskTypeChange,
  onSortChange,
}: TodoFilterSortProps) {
  const { t } = useTranslation();
  const toggleDirection = () => {
    onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border"
    >
      {/* Sort Controls - matching /goals style */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-rajdhani tracking-wider uppercase text-foreground/60">{t('todo.filters.sort')}</span>
        <Select 
          value={sortField} 
          onValueChange={(value) => onSortChange(value as SortField, sortDirection)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.field} value={option.field}>
                {t(`todo.filters.sortOptions.${option.field}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleDirection} 
          className="h-9 w-9 rounded-xl border border-border/60 bg-card/90 hover:bg-card hover:border-primary/40 hover:shadow-[0_0_8px_hsl(var(--primary)/0.15)] transition-all duration-200"
        >
          <ChevronRight className={cn(
            "h-4 w-4 text-foreground/70 transition-transform duration-200",
            sortDirection === "asc" ? "-rotate-90" : "rotate-90"
          )} />
        </Button>
      </div>

      <div className="h-6 w-px bg-border hidden md:block" />

      {/* Task Type Segmented Filter - matching /goals tabs style */}
      <div className="flex gap-1 p-1 rounded-xl bg-card/30 border border-primary/20 backdrop-blur-xl overflow-x-auto">
        {taskTypeFilters.map((type) => {
          const isActive = selectedTaskType === type.id;
          const Icon = type.icon;
          
          return (
            <button
              key={type.id ?? 'all'}
              onClick={() => onTaskTypeChange(type.id)}
              className={cn(
                "relative flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-lg font-rajdhani text-sm font-medium transition-all duration-300 whitespace-nowrap",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary/70"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="todoTaskTypeFilter"
                  className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10 hidden sm:inline">{t(type.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}