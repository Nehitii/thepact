import { motion } from 'framer-motion';
import { Briefcase, Heart, BookOpen, Cog, User, Tag, Filter, Clock, Calendar, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoCategoryFilterProps {
  selectedCategory: string | null;
  selectedTaskType: string | null;
  onCategoryChange: (category: string | null) => void;
  onTaskTypeChange: (taskType: string | null) => void;
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

export function TodoCategoryFilter({ 
  selectedCategory, 
  selectedTaskType, 
  onCategoryChange, 
  onTaskTypeChange 
}: TodoCategoryFilterProps) {
  const hasFilters = selectedCategory || selectedTaskType;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filter Tasks</span>
        </div>
        {hasFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => {
              onCategoryChange(null);
              onTaskTypeChange(null);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
            Clear filters
          </motion.button>
        )}
      </div>

      {/* Categories */}
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

      {/* Task Types */}
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
    </motion.div>
  );
}
