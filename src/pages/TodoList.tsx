import { useState, useMemo } from 'react';
import { CheckSquare, Plus, BarChart3, History, Calendar as CalendarIcon, Filter, Pencil } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTodoList, TodoTask } from '@/hooks/useTodoList';
import { TodoGamifiedHeader } from '@/components/todo/TodoGamifiedHeader';
import { TodoGamifiedTaskCard } from '@/components/todo/TodoGamifiedTaskCard';
import { TodoGamifiedCreateForm } from '@/components/todo/TodoGamifiedCreateForm';
import { TodoAdvancedStats } from '@/components/todo/TodoAdvancedStats';
import { TodoHistoryPanel } from '@/components/todo/TodoHistoryPanel';
import { TodoCalendarView } from '@/components/todo/TodoCalendarView';
import { TodoFilterSort, SortField, SortDirection } from '@/components/todo/TodoFilterSort';
import { TodoEditForm, UpdateTaskInput } from '@/components/todo/TodoEditForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ActivePanel = 'none' | 'create' | 'stats' | 'history' | 'calendar' | 'edit';

export default function TodoList() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  
  const { 
    tasks, 
    stats, 
    history,
    insights,
    isLoading, 
    activeTaskCount, 
    maxTasks,
    canAddTask,
    createTask,
    completeTask,
    postponeTask,
    deleteTask,
    updateTask,
  } = useTodoList();

  const handleCreateTask = (input: Parameters<typeof createTask.mutate>[0]) => {
    createTask.mutate(input, {
      onSuccess: () => setActivePanel('none'),
    });
  };

  const handleEditTask = (task: TodoTask) => {
    setEditingTask(task);
    setActivePanel('edit');
  };

  const handleUpdateTask = (input: UpdateTaskInput) => {
    updateTask.mutate(input, {
      onSuccess: () => {
        setActivePanel('none');
        setEditingTask(null);
      },
    });
  };

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = tasks.filter(task => {
      if (selectedCategory && task.category !== selectedCategory) return false;
      if (selectedTaskType && task.task_type !== selectedTaskType) return false;
      return true;
    });

    // Sort tasks
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'deadline':
          // Tasks without deadline go last
          if (!a.deadline && !b.deadline) comparison = 0;
          else if (!a.deadline) comparison = 1;
          else if (!b.deadline) comparison = -1;
          else comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = (a.category || 'general').localeCompare(b.category || 'general');
          break;
        case 'is_urgent':
          comparison = (a.is_urgent ? 1 : 0) - (b.is_urgent ? 1 : 0);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, selectedCategory, selectedTaskType, sortField, sortDirection]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading quests...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden overflow-y-auto">
      {/* Ambient background with game-like effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-6">
        {/* Gamified Header */}
        <TodoGamifiedHeader
          stats={stats}
          activeTaskCount={activeTaskCount}
          maxTasks={maxTasks}
        />

        {/* Action bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {activeTaskCount} / {maxTasks} active quests
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filters & Sort
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActivePanel('calendar')}
              className="text-muted-foreground hover:text-foreground"
            >
              <CalendarIcon className="w-4 h-4 mr-1.5" />
              Calendar
            </Button>
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
              className="bg-gradient-to-r from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 text-primary border border-primary/30"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Quest
            </Button>
          </div>
        </motion.div>

        {/* Filter & Sort Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <TodoFilterSort
                selectedCategory={selectedCategory}
                selectedTaskType={selectedTaskType}
                sortField={sortField}
                sortDirection={sortDirection}
                onCategoryChange={setSelectedCategory}
                onTaskTypeChange={setSelectedTaskType}
                onSortChange={handleSortChange}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Insights */}
        <AnimatePresence>
          {insights.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-card/50 to-card/30 border border-border/30 text-sm text-muted-foreground backdrop-blur-sm"
                >
                  💡 {insight}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task limit warning */}
        {!canAddTask && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm"
          >
            ⚠️ Quest log full! Complete existing quests to unlock new ones.
          </motion.div>
        )}

        {/* Tasks list */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50 flex items-center justify-center">
                  <CheckSquare className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-light text-foreground mb-2">No active quests</h3>
                <p className="text-sm text-muted-foreground mb-6">Begin your journey by creating a new quest</p>
                <Button
                  onClick={() => setActivePanel('create')}
                  className="bg-gradient-to-r from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 text-primary border border-primary/30"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  New Quest
                </Button>
              </motion.div>
            ) : (
              filteredAndSortedTasks.map((task) => (
                <TodoGamifiedTaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => completeTask.mutate(task.id)}
                  onPostpone={(newDeadline) => postponeTask.mutate({ taskId: task.id, newDeadline })}
                  onDelete={() => deleteTask.mutate(task.id)}
                  onEdit={() => handleEditTask(task)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={activePanel === 'create'} onOpenChange={(open) => !open && setActivePanel('none')}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground font-light tracking-wide flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              New Quest
            </DialogTitle>
          </DialogHeader>
          <TodoGamifiedCreateForm
            onSubmit={handleCreateTask}
            onCancel={() => setActivePanel('none')}
            isLoading={createTask.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog 
        open={activePanel === 'edit' && editingTask !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setActivePanel('none');
            setEditingTask(null);
          }
        }}
      >
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground font-light tracking-wide flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit Quest
            </DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TodoEditForm
              task={editingTask}
              onSubmit={handleUpdateTask}
              onCancel={() => {
                setActivePanel('none');
                setEditingTask(null);
              }}
              isLoading={updateTask.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Panel Dialog */}
      <Dialog open={activePanel === 'stats'} onOpenChange={(open) => !open && setActivePanel('none')}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-light tracking-wide flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Quest Analytics
            </DialogTitle>
          </DialogHeader>
          <TodoAdvancedStats />
        </DialogContent>
      </Dialog>

      {/* History Panel Dialog */}
      <Dialog open={activePanel === 'history'} onOpenChange={(open) => !open && setActivePanel('none')}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-light tracking-wide flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Quest History
            </DialogTitle>
          </DialogHeader>
          <TodoHistoryPanel />
        </DialogContent>
      </Dialog>

      {/* Calendar View Dialog */}
      <Dialog open={activePanel === 'calendar'} onOpenChange={(open) => !open && setActivePanel('none')}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-light tracking-wide flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Quest Calendar
            </DialogTitle>
          </DialogHeader>
          <TodoCalendarView tasks={tasks} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
