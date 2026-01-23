import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, Calendar, Briefcase, Heart, BookOpen, Cog, User, Tag } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
} from 'date-fns';
import { TodoTask } from '@/hooks/useTodoList';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useDateFnsLocale } from '@/i18n/useDateFnsLocale';

interface TodoCalendarViewProps {
  tasks: (TodoTask & { category?: string; task_type?: string })[];
  onTaskClick?: (taskId: string) => void;
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  work: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  health: { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/20' },
  personal: { icon: User, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  study: { icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  admin: { icon: Cog, color: 'text-gray-400', bg: 'bg-gray-500/20' },
  general: { icon: Tag, color: 'text-muted-foreground', bg: 'bg-muted/30' },
};

const priorityDot: Record<string, string> = {
  low: 'bg-emerald-400',
  medium: 'bg-blue-400',
  high: 'bg-amber-400',
};

export function TodoCalendarView({ tasks, onTaskClick }: TodoCalendarViewProps) {
  const { t } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const dayNames = (t('common.daysShort', { returnObjects: true }) as unknown as string[]) || [];

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, (TodoTask & { category?: string; task_type?: string })[]>();
    
    tasks.forEach((task) => {
      if (task.deadline) {
        const dateKey = task.deadline.split('T')[0];
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });
    
    return map;
  }, [tasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const dateKey = format(selectedDay, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  }, [selectedDay, tasksByDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          {t('todo.calendarView.title')}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden"
      >
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border/50">
          {(dayNames.length ? dayNames : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']).map((day) => (
            <div
              key={day}
              className="p-3 text-center text-xs font-medium text-muted-foreground bg-card/50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isTodayDate = isToday(day);
            const hasUrgent = dayTasks.some((t) => t.is_urgent);

            return (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'relative p-2 min-h-[80px] md:min-h-[100px] border-r border-b border-border/30 transition-all text-left',
                  'hover:bg-card/50',
                  !isCurrentMonth && 'bg-muted/10 opacity-50',
                  isSelected && 'bg-primary/10 ring-1 ring-primary/50',
                  isTodayDate && 'bg-primary/5'
                )}
              >
                {/* Day number */}
                <div className={cn(
                  'text-sm font-medium mb-1',
                  isTodayDate ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {format(day, 'd')}
                  {isTodayDate && (
                    <span className="ml-1 text-[10px] text-primary">({t('todo.calendarView.today')})</span>
                  )}
                </div>

                {/* Task indicators */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const category = task.category || 'general';
                    const config = categoryConfig[category] || categoryConfig.general;
                    
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate',
                          config.bg,
                          config.color
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick?.(task.id);
                        }}
                      >
                        <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', priorityDot[task.priority])} />
                        <span className="truncate">{task.name}</span>
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">
                      {t('todo.calendarView.more', { count: dayTasks.length - 3 })}
                    </div>
                  )}
                </div>

                {/* Urgent indicator */}
                {hasUrgent && (
                  <div className="absolute top-1 right-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                    </motion.div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-foreground">
                  {format(selectedDay, 'PPPP', { locale: dateLocale })}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDay(null)}
                  className="text-muted-foreground text-xs"
                >
                  {t('common.close')}
                </Button>
              </div>

              {selectedDayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('todo.calendarView.noTasksForDay')}
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayTasks.map((task) => {
                    const category = task.category || 'general';
                    const config = categoryConfig[category] || categoryConfig.general;
                    const CategoryIcon = config.icon;

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                          'hover:bg-card/50',
                          config.bg,
                          'border-border/50'
                        )}
                        onClick={() => onTaskClick?.(task.id)}
                      >
                        <CategoryIcon className={cn('w-4 h-4 flex-shrink-0', config.color)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-medium',
                              task.priority === 'high' && 'bg-amber-500/20 text-amber-300',
                              task.priority === 'medium' && 'bg-blue-500/20 text-blue-300',
                              task.priority === 'low' && 'bg-emerald-500/20 text-emerald-300'
                            )}>
                              {task.priority.toUpperCase()}
                            </span>
                            {task.is_urgent && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {t('todo.taskCard.urgent')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
