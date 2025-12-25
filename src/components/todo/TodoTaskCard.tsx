import { useState } from 'react';
import { Check, Clock, Trash2, AlertTriangle, ChevronDown } from 'lucide-react';
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

interface TodoTaskCardProps {
  task: TodoTask;
  onComplete: () => void;
  onPostpone: (newDeadline: string) => void;
  onDelete: () => void;
}

const priorityStyles = {
  low: 'border-border/50 bg-card/30',
  medium: 'border-border/70 bg-card/40',
  high: 'border-primary/30 bg-primary/5',
};

const priorityBadge = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-500/20 text-blue-300',
  high: 'bg-amber-500/20 text-amber-300',
};

export function TodoTaskCard({ task, onComplete, onPostpone, onDelete }: TodoTaskCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate);
  
  const formatDeadline = () => {
    if (!deadlineDate) return null;
    if (isToday(deadlineDate)) return 'Today';
    if (isTomorrow(deadlineDate)) return 'Tomorrow';
    return format(deadlineDate, 'MMM d');
  };

  const postponeOptions = [
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'In 3 days', date: addDays(new Date(), 3) },
    { label: 'Next week', date: addDays(new Date(), 7) },
  ];

  return (
    <>
      <div
        className={cn(
          'group relative rounded-xl border p-4 transition-all duration-200',
          'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
          priorityStyles[task.priority],
          task.is_urgent && 'ring-1 ring-red-500/30'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Complete button */}
          <button
            onClick={onComplete}
            className={cn(
              'flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 transition-all duration-200',
              'flex items-center justify-center',
              'hover:bg-primary/20 hover:border-primary',
              task.is_urgent 
                ? 'border-red-400/50 hover:border-red-400' 
                : 'border-border hover:border-primary'
            )}
          >
            <Check className="w-3.5 h-3.5 text-transparent group-hover:text-primary transition-colors" />
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-foreground font-medium leading-snug">{task.name}</p>
                
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* Priority badge */}
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', priorityBadge[task.priority])}>
                    {task.priority}
                  </span>
                  
                  {/* Urgent badge */}
                  {task.is_urgent && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Urgent
                    </span>
                  )}
                  
                  {/* Deadline */}
                  {deadlineDate && (
                    <span className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                      isOverdue 
                        ? 'bg-red-500/20 text-red-300' 
                        : 'bg-muted text-muted-foreground'
                    )}>
                      <Clock className="w-3 h-3" />
                      {formatDeadline()}
                    </span>
                  )}
                  
                  {/* Postpone count */}
                  {task.postpone_count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Postponed {task.postpone_count}×
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Postpone dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Clock className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">Postpone to...</div>
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
                  className="h-8 w-8 text-muted-foreground hover:text-red-400"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the task. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDelete}
              className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
