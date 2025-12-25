import { useState } from 'react';
import { Trash2, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useTodoList } from '@/hooks/useTodoList';
import { Button } from '@/components/ui/button';
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

const priorityBadge = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-500/20 text-blue-300',
  high: 'bg-amber-500/20 text-amber-300',
};

export function TodoHistoryPanel() {
  const { history, clearHistory, historyLoading } = useTodoList();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearHistory = () => {
    clearHistory.mutate();
    setShowClearConfirm(false);
  };

  if (historyLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-card/50 border border-border/50 flex items-center justify-center">
          <Clock className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No completed tasks yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clear history button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowClearConfirm(true)}
          className="text-muted-foreground hover:text-red-400"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Clear History
        </Button>
      </div>

      {/* History list */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 p-3 rounded-lg bg-card/20 border border-border/20"
          >
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm truncate">{item.task_name}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={cn('px-2 py-0.5 rounded text-xs', priorityBadge[item.priority])}>
                  {item.priority}
                </span>
                {item.was_urgent && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    Urgent
                  </span>
                )}
                {item.postpone_count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Postponed {item.postpone_count}×
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(item.completed_at), 'MMM d, HH:mm')}
            </div>
          </div>
        ))}
      </div>

      {/* Clear confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear task history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your task history. Your score will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearHistory}
              className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
            >
              Clear History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
