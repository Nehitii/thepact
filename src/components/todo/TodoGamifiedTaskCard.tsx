import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Trash2, AlertTriangle, Calendar, Tag, Briefcase, Heart, BookOpen, Cog, User, Sparkles, Pencil } from 'lucide-react';
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

interface TodoGamifiedTaskCardProps {
  task: TodoTask & { category?: string; task_type?: string };
  onComplete: () => void;
  onPostpone: (newDeadline: string) => void;
  onDelete: () => void;
  onEdit: () => void;
}

// Priority styles with game-like colors
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

// Category icons and colors
const categoryConfig: Record<string, { icon: React.ElementType; color: string }> = {
  work: { icon: Briefcase, color: 'text-blue-400' },
  health: { icon: Heart, color: 'text-red-400' },
  personal: { icon: User, color: 'text-purple-400' },
  study: { icon: BookOpen, color: 'text-emerald-400' },
  admin: { icon: Cog, color: 'text-gray-400' },
  general: { icon: Tag, color: 'text-muted-foreground' },
};

// Task type badges
const taskTypeConfig: Record<string, { icon: React.ElementType; color: string; labelKey: string }> = {
  appointment: { icon: Calendar, color: 'bg-purple-500/20 text-purple-300', labelKey: 'todo.taskTypes.appointment' },
  deadline: { icon: Clock, color: 'bg-red-500/20 text-red-300', labelKey: 'todo.taskTypes.deadline' },
  flexible: { icon: Sparkles, color: 'bg-cyan-500/20 text-cyan-300', labelKey: 'todo.taskTypes.flexible' },
};

export function TodoGamifiedTaskCard({ task, onComplete, onPostpone, onDelete, onEdit }: TodoGamifiedTaskCardProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { trigger, ParticleEffects } = useParticleEffect();
  
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
    
    // Trigger particle effect based on priority
    const particleCount = task.priority === 'high' ? 30 : task.priority === 'medium' ? 20 : 15;
    trigger(e, config.accent, particleCount);
    
    // Delay the actual completion to show animation
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [onComplete, trigger, config.accent, task.priority]);

  return (
    <>
      <ParticleEffects />
      <AnimatePresence>
        {!isCompleting && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'group relative rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-300',
              'hover:shadow-xl hover:scale-[1.01]',
              config.border,
              isCompleting && 'scale-95 opacity-50'
            )}
          >
            {/* Gradient background */}
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', config.bg)} />
            
            {/* Hover glow effect */}
            <div className={cn(
              'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-2xl',
              config.glow
            )} />
            
            {/* Priority indicator line */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: config.accent }}
            />
            
            {/* Urgent indicator */}
            {task.is_urgent && (
              <motion.div 
                className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-l-[40px] border-t-red-500/80 border-l-transparent"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
            
            <div className="relative p-4 pl-5">
              <div className="flex items-start gap-4">
                {/* Complete button - Game style */}
                <motion.button
                  onClick={handleComplete}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-xl border-2 transition-all duration-200',
                    'flex items-center justify-center',
                    'hover:shadow-lg',
                    task.is_urgent 
                      ? 'border-red-400/50 hover:border-red-400 hover:bg-red-500/20 hover:shadow-red-500/20' 
                      : 'border-primary/40 hover:border-primary hover:bg-primary/20 hover:shadow-primary/20'
                  )}
                  style={{
                    boxShadow: `0 0 0 0 ${config.accent}40`,
                  }}
                >
                  <Check className="w-5 h-5 text-transparent group-hover:text-primary transition-colors" />
                </motion.button>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-foreground font-semibold text-base leading-snug">{task.name}</p>
                      
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {/* Category badge */}
                        <span className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-card/50 border border-border/50', categoryColor)}>
                          <CategoryIcon className="w-3 h-3" />
                          {t(`todo.categories.${category}`)}
                        </span>
                        
                        {/* Task type badge */}
                        <span className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border border-transparent', typeConfig.color)}>
                          <TypeIcon className="w-3 h-3" />
                          {t(typeConfig.labelKey)}
                        </span>
                        
                        {/* Priority badge */}
                        <span className={cn('px-2 py-1 rounded-lg text-xs font-medium border', config.badge)}>
                          {task.priority.toUpperCase()}
                        </span>
                        
                        {/* Urgent badge */}
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
                        
                        {/* Deadline */}
                        {deadlineDate && (
                          <span className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border',
                            isOverdue 
                              ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                              : 'bg-muted/30 text-muted-foreground border-border/50'
                          )}>
                            <Clock className="w-3 h-3" />
                            {formatDeadline()}
                          </span>
                        )}
                        
                        {/* Postpone count */}
                        {task.postpone_count > 0 && (
                          <span className="text-xs text-muted-foreground/70">
                            ↻ {task.postpone_count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Edit button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={onEdit}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      {/* Postpone dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/50"
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border">
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">{t('todo.taskCard.postponeTo')}</div>
                          {postponeOptions.map((option) => (
                            <DropdownMenuItem
                              key={option.label}
                              onClick={() => onPostpone(option.date.toISOString())}
                              className="cursor-pointer"
                            >
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Delete button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
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

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('todo.taskCard.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('todo.taskCard.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground border-border">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDelete}
              className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
            >
              {t('todo.taskCard.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
