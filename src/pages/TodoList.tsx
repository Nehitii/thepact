import { useState } from 'react';
import { CheckSquare, Plus, BarChart3, History, Flame, Trophy, Target } from 'lucide-react';
import { useTodoList } from '@/hooks/useTodoList';
import { TodoTaskCard } from '@/components/todo/TodoTaskCard';
import { TodoCreateForm } from '@/components/todo/TodoCreateForm';
import { TodoStatsPanel } from '@/components/todo/TodoStatsPanel';
import { TodoHistoryPanel } from '@/components/todo/TodoHistoryPanel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ActivePanel = 'none' | 'create' | 'stats' | 'history';

export default function TodoList() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const { 
    tasks, 
    stats, 
    insights,
    isLoading, 
    activeTaskCount, 
    maxTasks,
    canAddTask,
    createTask,
    completeTask,
    postponeTask,
    deleteTask,
  } = useTodoList();

  const handleCreateTask = (input: Parameters<typeof createTask.mutate>[0]) => {
    createTask.mutate(input, {
      onSuccess: () => setActivePanel('none'),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden overflow-y-auto">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <CheckSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-wide text-foreground">To-Do List</h1>
              <p className="text-sm text-muted-foreground">Execution through clarity</p>
            </div>
          </div>

          {/* Quick stats badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border/50 text-sm">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{stats?.score ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border/50 text-sm">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-foreground font-medium">{stats?.current_streak ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border/50 text-sm">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-foreground font-medium">{stats?.longest_streak ?? 0}</span>
            </div>
          </div>
        </header>

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {activeTaskCount} / {maxTasks} active tasks
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActivePanel('history')}
              className="text-muted-foreground hover:text-foreground"
            >
              <History className="w-4 h-4 mr-1.5" />
              History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActivePanel('stats')}
              className="text-muted-foreground hover:text-foreground"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Stats
            </Button>
            <Button
              onClick={() => setActivePanel('create')}
              disabled={!canAddTask}
              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Task
            </Button>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="px-4 py-2.5 rounded-lg bg-card/30 border border-border/30 text-sm text-muted-foreground"
              >
                {insight}
              </div>
            ))}
          </div>
        )}

        {/* Task limit warning */}
        {!canAddTask && (
          <div className="px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
            You've reached the maximum number of active tasks. Complete existing tasks before adding new ones.
          </div>
        )}

        {/* Tasks list */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card/50 border border-border/50 flex items-center justify-center">
                <CheckSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-light text-foreground mb-2">No active tasks</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first task to get started</p>
              <Button
                onClick={() => setActivePanel('create')}
                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Task
              </Button>
            </div>
          ) : (
            tasks.map((task) => (
              <TodoTaskCard
                key={task.id}
                task={task}
                onComplete={() => completeTask.mutate(task.id)}
                onPostpone={(newDeadline) => postponeTask.mutate({ taskId: task.id, newDeadline })}
                onDelete={() => deleteTask.mutate(task.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={activePanel === 'create'} onOpenChange={(open) => !open && setActivePanel('none')}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground font-light tracking-wide">New Task</DialogTitle>
          </DialogHeader>
          <TodoCreateForm
            onSubmit={handleCreateTask}
            onCancel={() => setActivePanel('none')}
            isLoading={createTask.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Stats Panel Dialog */}
      <Dialog open={activePanel === 'stats'} onOpenChange={(open) => !open && setActivePanel('none')}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-light tracking-wide">Statistics</DialogTitle>
          </DialogHeader>
          <TodoStatsPanel />
        </DialogContent>
      </Dialog>

      {/* History Panel Dialog */}
      <Dialog open={activePanel === 'history'} onOpenChange={(open) => !open && setActivePanel('none')}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-light tracking-wide">Task History</DialogTitle>
          </DialogHeader>
          <TodoHistoryPanel />
        </DialogContent>
      </Dialog>
    </div>
  );
}
