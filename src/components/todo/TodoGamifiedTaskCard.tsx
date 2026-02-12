import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, Clock, Trash2, AlertTriangle, Tag, Briefcase, Heart, BookOpen, Cog, User, Sparkles, Pencil, Hourglass, CalendarClock, MapPin, Bell, Crosshair } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns';
import { TodoTask } from '@/hooks/useTodoList';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useParticleEffect } from '@/components/ParticleEffect';
import { useTranslation } from 'react-i18next';
import { useSound } from '@/contexts/SoundContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface TodoGamifiedTaskCardProps {
  task: TodoTask;
  onComplete: () => void;
  onPostpone: (newDeadline: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  onFocus?: () => void;
  variant?: 'expanded' | 'compact';
  isDragging?: boolean;
}

const priorityConfig = {
  low: {
    border: 'border-emerald-500/30',
    bg: 'from-emerald-500/10 via-card/60 to-card/40',
    glow: 'shadow-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    accent: '#10b981',
  },
  medium: {
    border: 'border-blue-500/30',
    bg: 'from-blue-500/10 via-card/60 to-card/40',
    glow: 'shadow-blue-500/10',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    accent: '#3b82f6',
  },
  high: {
    border: 'border-amber-500/30',
    bg: 'from-amber-500/10 via-card/60 to-card/40',
    glow: 'shadow-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    accent: '#f59e0b',
  },
};

const categoryConfig: Record<string, { icon: React.ElementType; color: string }> = {
  work: { icon: Briefcase, color: 'text-blue-400' },
  health: { icon: Heart, color: 'text-red-400' },
  personal: { icon: User, color: 'text-purple-400' },
  study: { icon: BookOpen, color: 'text-emerald-400' },
  admin: { icon: Cog, color: 'text-gray-400' },
  general: { icon: Tag, color: 'text-muted-foreground' },
};

const taskTypeConfig: Record<string, { icon: React.ElementType; color: string; labelKey: string }> = {
  rendezvous: { icon: CalendarClock, color: 'bg-purple-500/20 text-purple-300', labelKey: 'todo.taskTypes.rendezvous' },
  deadline: { icon: Clock, color: 'bg-red-500/20 text-red-300', labelKey: 'todo.taskTypes.deadline' },
  flexible: { icon: Sparkles, color: 'bg-cyan-500/20 text-cyan-300', labelKey: 'todo.taskTypes.flexible' },
  waiting: { icon: Hourglass, color: 'bg-amber-500/20 text-amber-300', labelKey: 'todo.taskTypes.waiting' },
};

const SWIPE_THRESHOLD = 100;

export function TodoGamifiedTaskCard({ task, onComplete, onPostpone, onDelete, onEdit, onFocus, variant = 'expanded', isDragging }: TodoGamifiedTaskCardProps) {
  const { t } = useTranslation();
  const sound = useSound();
  const isMobile = useIsMobile();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [swiped, setSwiped] = useState<'left' | 'right' | null>(null);
  const { trigger, ParticleEffects } = useParticleEffect();
  
  const x = useMotionValue(0);
  const bgRight = useTransform(x, [0, SWIPE_THRESHOLD], ['rgba(16,185,129,0)', 'rgba(16,185,129,0.3)']);
  const bgLeft = useTransform(x, [-SWIPE_THRESHOLD, 0], ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0)']);

  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate);
  
  const config = priorityConfig[task.priority];
  const category = task.category || 'general';
  const taskType = task.task_type || 'flexible';
  const CategoryIcon = categoryConfig[category]?.icon || Tag;
  const categoryColor = categoryConfig[category]?.color || 'text-muted-foreground';
  const typeConfig = taskTypeConfig[taskType] || taskTypeConfig.flexible;
  const TypeIcon = typeConfig.icon;
  
  const formatDeadline = () => {
    if (!deadlineDate) return null;
    if (isToday(deadlineDate)) return t('todo.taskCard.today');
    if (isTomorrow(deadlineDate)) return t('todo.taskCard.tomorrow');
    return format(deadlineDate, 'MMM d');
  };

  const postponeOptions = [
    { label: t('todo.taskCard.tomorrow'), date: addDays(new Date(), 1) },
    { label: t('todo.taskCard.in3Days', { defaultValue: 'In 3 days' }), date: addDays(new Date(), 3) },
    { label: t('todo.taskCard.nextWeek', { defaultValue: 'Next week' }), date: addDays(new Date(), 7) },
  ];

  const handleComplete = useCallback((e: React.MouseEvent) => {
    setIsCompleting(true);
    sound.play('success', 'reward');
    const particleCount = task.priority === 'high' ? 30 : task.priority === 'medium' ? 20 : 15;
    trigger(e, config.accent, particleCount);
    setTimeout(() => onComplete(), 400);
  }, [onComplete, trigger, config.accent, sound, task.priority]);

  const handleSwipeEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      setSwiped('right');
      setTimeout(() => onComplete(), 300);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      setSwiped('left');
      setTimeout(() => onDelete(), 300);
    }
  }, [onComplete, onDelete]);

  // ====== COMPACT VIEW ======
  if (variant === 'compact') {
    return (
      <>
        <ParticleEffects />
        <AnimatePresence>
          {!isCompleting && !swiped && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: swiped === 'right' ? 100 : swiped === 'left' ? -100 : 0 }}
              drag={isMobile ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={handleSwipeEnd}
              style={{ x }}
              className={cn(
                "group relative flex items-center gap-3 h-10 px-3 rounded-lg border transition-all",
                "bg-card/40 backdrop-blur-sm hover:bg-card/60",
                config.border,
                isDragging && "opacity-50",
                isOverdue && "border-red-500/40"
              )}
            >
              {/* Priority dot */}
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.accent }} />
              
              {/* Complete checkbox */}
              <motion.button
                onClick={handleComplete}
                whileTap={{ scale: 0.9 }}
                className="flex-shrink-0 w-5 h-5 rounded border border-primary/30 flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-colors"
              >
                <Check className="w-3 h-3 text-transparent group-hover:text-primary transition-colors" />
              </motion.button>

              {/* Title */}
              <span className="flex-1 text-sm text-foreground truncate font-mono">{task.name}</span>

              {/* Mini badges */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {task.is_urgent && (
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                )}
                <span className={cn("text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border", config.badge)}>
                  {task.priority[0].toUpperCase()}
                </span>
                {deadlineDate && (
                  <span className={cn(
                    "text-[10px] font-mono",
                    isOverdue ? "text-red-400" : "text-muted-foreground"
                  )}>
                    {formatDeadline()}
                  </span>
                )}
              </div>

              {/* Hover actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {onFocus && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={onFocus}>
                    <Crosshair className="w-3 h-3" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={onEdit}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-400" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('todo.taskCard.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('todo.taskCard.deleteDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted text-foreground border-border">{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30">{t('todo.taskCard.delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ====== EXPANDED VIEW ======
  return (
    <>
      <ParticleEffects />
      <AnimatePresence>
        {!isCompleting && !swiped && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -10, x: swiped === 'right' ? 100 : swiped === 'left' ? -100 : 0 }}
            transition={{ duration: 0.3 }}
            drag={isMobile ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={handleSwipeEnd}
            style={{ x }}
            className={cn(
              'group relative rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-300',
              'hover:shadow-xl hover:scale-[1.01]',
              config.border,
              isDragging && 'opacity-50',
              isCompleting && 'scale-95 opacity-50'
            )}
          >
            {/* Swipe backgrounds */}
            {isMobile && (
              <>
                <motion.div className="absolute inset-0 rounded-2xl" style={{ backgroundColor: bgRight }} />
                <motion.div className="absolute inset-0 rounded-2xl" style={{ backgroundColor: bgLeft }} />
              </>
            )}

            {/* Gradient background */}
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', config.bg)} />
            <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-2xl', config.glow)} />
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: config.accent }} />
            
            {task.is_urgent && (
              <motion.div 
                className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-l-[40px] border-t-red-500/80 border-l-transparent"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
            
            <div className="relative p-4 pl-5">
              <div className="flex items-start gap-4">
                {/* Complete button */}
                <motion.button
                  onClick={handleComplete}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-xl border-2 transition-all duration-200 flex items-center justify-center hover:shadow-lg',
                    task.is_urgent 
                      ? 'border-red-400/50 hover:border-red-400 hover:bg-red-500/20 hover:shadow-red-500/20' 
                      : 'border-primary/40 hover:border-primary hover:bg-primary/20 hover:shadow-primary/20'
                  )}
                >
                  <Check className="w-5 h-5 text-transparent group-hover:text-primary transition-colors" />
                </motion.button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-foreground font-semibold text-base leading-snug">{task.name}</p>
                      
                      {task.location && taskType === 'rendezvous' && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{task.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-card/50 border border-border/50', categoryColor)}>
                          <CategoryIcon className="w-3 h-3" />
                          {t(`todo.categories.${category}`)}
                        </span>
                        
                        <span className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border border-transparent', typeConfig.color)}>
                          <TypeIcon className="w-3 h-3" />
                          {t(typeConfig.labelKey)}
                        </span>
                        
                        <span className={cn('px-2 py-1 rounded-lg text-xs font-medium border', config.badge)}>
                          {task.priority.toUpperCase()}
                        </span>
                        
                        {task.reminder_enabled && taskType === 'waiting' && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                            <Bell className="w-3 h-3" />
                            {t('todo.taskCard.reminderActive')}
                          </span>
                        )}
                        
                        {task.is_urgent && (
                          <motion.span 
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/30"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {t('todo.taskCard.urgent')}
                          </motion.span>
                        )}
                        
                        {deadlineDate && (
                          <span className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border',
                            isOverdue ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-muted/30 text-muted-foreground border-border/50'
                          )}>
                            <Clock className="w-3 h-3" />
                            {formatDeadline()}
                            {task.appointment_time && ` • ${task.appointment_time}`}
                          </span>
                        )}
                        
                        {task.postpone_count > 0 && (
                          <span className="text-xs text-muted-foreground/70">↻ {task.postpone_count}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onFocus && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={onFocus}>
                          <Crosshair className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={onEdit}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/50">
                            <Clock className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border">
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">{t('todo.taskCard.postponeTo')}</div>
                          {postponeOptions.map((option) => (
                            <DropdownMenuItem key={option.label} onClick={() => onPostpone(option.date.toISOString())} className="cursor-pointer">
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10" onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('todo.taskCard.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('todo.taskCard.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground border-border">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30">{t('todo.taskCard.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
