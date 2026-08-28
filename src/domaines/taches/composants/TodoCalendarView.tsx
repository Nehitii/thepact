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
  addDays,
  endOfWeek,
  parseISO,
} from 'date-fns';
import { TodoTask } from '@/domaines/taches/hooks/useTodoList';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { categorieDe, fondDe } from '@/domaines/taches/logique/categories';
import { useDateFnsLocale } from '@/i18n/useDateFnsLocale';

interface TodoCalendarViewProps {
  tasks: (TodoTask & { category?: string | null; task_type?: string | null })[];
  onTaskClick?: (taskId: string) => void;
}

/* La carte etait ecrite en classes Tailwind — donc impossible a
   generer depuis une teinte, et condamnee a etre tenue a la main a
   cote des trois autres listes. Les couleurs viennent maintenant de la
   liste unique, posees en style : une categorie ajoutee la-bas
   s affiche ici sans une ligne de plus. */

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

  /* La page Calendar commence ses semaines un lundi ; celle-ci les
     commencait un dimanche — deux vues des memes echeances, deux
     calendriers. Les en-tetes viennent maintenant de la locale, ce qui
     evite en plus une liste de jours a maintenir a la main. */
  const dayNames = useMemo(() => {
    const lundi = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(lundi, i), 'EEEEEE', { locale: dateLocale }));
  }, [dateLocale]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, (TodoTask & { category?: string | null; task_type?: string | null })[]>();
    
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
            aria-label={t('calendar.prevPeriod', { period: t('calendar.viewMonth').toLowerCase() })}
            className="tsk-outil est-icone"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            aria-label={t('calendar.nextPeriod', { period: t('calendar.viewMonth').toLowerCase() })}
            className="tsk-outil est-icone"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
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
                    <span className="ml-1 ds-t-label text-primary">({t('todo.calendarView.today')})</span>
                  )}
                </div>

                {/* Task indicators */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const cat = categorieDe(task.category);
                    
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded ds-t-label truncate"
                        style={{ background: fondDe(cat.id, 20), color: cat.couleur }}
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
                    <div className="ds-t-label text-muted-foreground px-1.5">
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
                    const cat = categorieDe(task.category);
                    const CategoryIcon = cat.icone;

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/50 cursor-pointer transition-all hover:brightness-125"
                        style={{ background: fondDe(cat.id, 16) }}
                        onClick={() => onTaskClick?.(task.id)}
                      >
                        <CategoryIcon className="w-4 h-4 flex-shrink-0" style={{ color: cat.couleur }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded ds-t-label font-medium',
                              task.priority === 'high' && 'bg-amber-500/20 text-amber-300',
                              task.priority === 'medium' && 'bg-blue-500/20 text-blue-300',
                              task.priority === 'low' && 'bg-emerald-500/20 text-emerald-300'
                            )}>
                              {task.priority.toUpperCase()}
                            </span>
                            {task.is_urgent && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 ds-t-label">
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
