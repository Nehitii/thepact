import React, { useState, useMemo, useCallback } from 'react';
import { CheckSquare, Plus, BarChart3, History, Calendar as CalendarIcon, Pencil, List, LayoutGrid, Flame } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTodoList, TodoTask } from '@/hooks/useTodoList';
import { DSPageShell, DSPageHeader, DSPageLoader } from '@/components/ds';
import { TodoGamifiedTaskCard } from '@/components/todo/TodoGamifiedTaskCard';
import { TodoGamifiedCreateForm } from '@/components/todo/TodoGamifiedCreateForm';
import { TodoAdvancedStats } from '@/components/todo/TodoAdvancedStats';
import { TodoHistoryPanel } from '@/components/todo/TodoHistoryPanel';
import { TodoCalendarView } from '@/components/todo/TodoCalendarView';
import { TodoFilterSort, SortField, SortDirection } from '@/components/todo/TodoFilterSort';
import { TodoEditForm, UpdateTaskInput } from '@/components/todo/TodoEditForm';
import { QuickTaskInput } from '@/components/todo/QuickTaskInput';
import { FocusOverlay } from '@/components/todo/FocusOverlay';
import { TodoCommandInfo } from '@/components/todo/TodoCommandInfo';

import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ActivePanel = 'none' | 'create' | 'stats' | 'history' | 'calendar' | 'edit';
type ViewMode = 'expanded' | 'compact';

// Sortable wrapper component
type SortableTaskCardProps = {
  task: TodoTask;
  viewMode: ViewMode;
  onComplete: () => void;
  onPostpone: (d: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  onFocus: () => void;
};
const SortableTaskCard = React.forwardRef<HTMLDivElement, SortableTaskCardProps>(function SortableTaskCard(
  { task, viewMode, onComplete, onPostpone, onDelete, onEdit, onFocus },
  ref,
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  /* La carte entiere portait role="button" et tabindex="0" tout en
     contenant cinq boutons : un controle interactif dans un controle
     interactif, que rien ne definit. La poignee descend dans la carte,
     et l enveloppe redevient un simple conteneur. */
  return (
    <div ref={setRefs} style={style}>
      <TodoGamifiedTaskCard
        poignee={{ ...attributes, ...listeners }}
        task={task}
        variant={viewMode}
        onComplete={onComplete}
        onPostpone={onPostpone}
        onDelete={onDelete}
        onEdit={onEdit}
        onFocus={onFocus}
        isDragging={isDragging}
      />
    </div>
  );
});

export default function TodoList() {
  const { t } = useTranslation();
  
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);
  /* Le rangement a la main est l ordre de depart : c est le seul que le
     glisser-deposer puisse honorer. */
  const [sortField, setSortField] = useState<SortField>('manual');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('expanded');
  const [focusTask, setFocusTask] = useState<TodoTask | null>(null);
  
  const { 
    tasks, stats, history, insights, isLoading, activeTaskCount, maxTasks, canAddTask,
    createTask, completeTask, postponeTask, deleteTask, updateTask, reorderTasks,
  } = useTodoList();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleCreateTask = (input: Parameters<typeof createTask.mutate>[0]) => {
    createTask.mutate(input, { onSuccess: () => setActivePanel('none') });
  };

  const handleQuickCreate = (input: Parameters<typeof createTask.mutate>[0]) => {
    createTask.mutate(input);
  };

  const handleEditTask = (task: TodoTask) => {
    setEditingTask(task);
    setActivePanel('edit');
  };

  const handleUpdateTask = (input: UpdateTaskInput) => {
    updateTask.mutate(input, {
      onSuccess: () => { setActivePanel('none'); setEditingTask(null); },
    });
  };

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    const result = tasks.filter(task => {
      if (selectedTaskType && task.task_type !== selectedTaskType) return false;
      return true;
    });

    /* En rangement manuel on ne trie pas : la requete rend deja les
       taches par position croissante, et c est precisement cet ordre-la
       que le glisser-deposer ecrit. */
    if (sortField === 'manual') return result;

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'deadline':
          if (!a.deadline && !b.deadline) comparison = 0;
          else if (!a.deadline) comparison = 1;
          else if (!b.deadline) comparison = -1;
          else comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
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
  }, [tasks, selectedTaskType, sortField, sortDirection]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    /* Deplacer une tache alors qu un tri automatique est actif ne
       pouvait rien donner : on bascule sur le rangement a la main, qui
       est le seul ou le geste a un sens. */
    if (sortField !== 'manual') {
      setSortField('manual');
      toast.info(t('todo.toasts.switchedToManual'));
    }

    const oldIndex = filteredAndSortedTasks.findIndex(t => t.id === active.id);
    const newIndex = filteredAndSortedTasks.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...filteredAndSortedTasks];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    reorderTasks.mutate(newOrder.map(t => t.id));
  }, [reorderTasks, filteredAndSortedTasks, sortField, t]);

  // Boot sequence removed for instant load

  if (isLoading) {
    return <DSPageLoader variant="verbose" message={t('todo.loadingQuests')} />;
  }

  return (
    <>
      {/* Focus Overlay */}
      {focusTask && (
        <FocusOverlay
          task={focusTask}
          onComplete={() => {
            completeTask.mutate(focusTask.id);
            setFocusTask(null);
          }}
          onExit={() => setFocusTask(null)}
        />
      )}

      <DSPageShell
        width="lg"
        className="!p-6"
        background={
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }}
            />
          </div>
        }
      >
        <div className="space-y-6">
          <DSPageHeader
            variant="hud"
            systemLabel="QUEST_ENGINE // SYS.ACTIVE"
            title="TASK "
            titleAccent="OPS"
          />

          {/* Compact Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-center gap-3 text-xs font-mono text-muted-foreground">
              <span className="text-primary font-bold">LVL {Math.floor((stats?.score ?? 0) / 100) + 1}</span>
              <span className="text-foreground/30">·</span>
              <span>{t('todo.scoreLabel')} <span className="text-foreground/80 font-bold">{stats?.score ?? 0}</span></span>
              <span className="text-foreground/30">·</span>
              <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-400" /><span className="text-foreground/80 font-bold">{stats?.current_streak ?? 0}</span></span>
              <span className="text-foreground/30">·</span>
              <span className="text-foreground/80 font-bold">{activeTaskCount}<span className="text-muted-foreground font-normal">/{maxTasks}</span></span>
            </div>
            <div className="relative h-[2px] w-full max-w-md mx-auto bg-border/30 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(stats?.score ?? 0) % 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ boxShadow: "0 0 8px hsl(var(--primary) / 0.5)" }}
              />
            </div>
          </motion.div>

          {/* Neural Input (Quick Command Bar) */}
          <QuickTaskInput
            onSubmit={handleQuickCreate}
            isLoading={createTask.isPending}
            disabled={!canAddTask}
          />

          {/* Unified Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex items-center justify-between flex-wrap gap-2"
          >
            {/* Left: View toggle + Filter chips */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-border/50 bg-card/40">
                <button
                  onClick={() => setViewMode('expanded')}
                  aria-label={t('todo.views.expanded')}
                  aria-pressed={viewMode === 'expanded'}
                  className={cn(
                    "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-colors",
                    viewMode === 'expanded' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  aria-label={t('todo.views.compact')}
                  aria-pressed={viewMode === 'compact'}
                  className={cn(
                    "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md transition-colors",
                    viewMode === 'compact' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Inline type filter chips */}
              <TodoFilterSort
                selectedTaskType={selectedTaskType} sortField={sortField} sortDirection={sortDirection}
                onTaskTypeChange={setSelectedTaskType} onSortChange={handleSortChange}
              />
            </div>

            {/* Right: icon buttons + New */}
            <div className="flex items-center gap-1">
              <TodoCommandInfo />
              <button onClick={() => setActivePanel('calendar')} aria-label={t('todo.panels.calendar')}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <CalendarIcon className="w-4 h-4" aria-hidden="true" />
              </button>
              <button onClick={() => setActivePanel('stats')} aria-label={t('todo.questAnalytics')}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button onClick={() => setActivePanel('history')} aria-label={t('todo.questHistory')}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <History className="w-4 h-4" aria-hidden="true" />
              </button>
              <Button onClick={() => setActivePanel('create')} disabled={!canAddTask} size="sm"
                className="ml-1 min-h-[44px] bg-card/80 backdrop-blur-sm border border-primary/30 text-primary text-xs font-medium hover:border-primary/60 hover:bg-primary/10 hover:shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
              >
                <Plus className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> {t('todo.create.new')}
              </Button>
            </div>
          </motion.div>


          {/* Insights */}
          <AnimatePresence>
            {insights.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2">
                {insights.map((insight) => (
                  <motion.div key={insight.cle} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-card/50 to-card/30 border border-border/30 text-sm text-muted-foreground backdrop-blur-sm font-mono"
                  >
                    <span aria-hidden="true">💡 </span>{t(insight.cle, insight.params)}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Task limit warning */}
          {!canAddTask && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm font-mono"
            >
              ⚠️ {t('todo.questLogFull')}
            </motion.div>
          )}

          {/* Tasks list with DnD */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredAndSortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className={cn("space-y-1", viewMode === 'expanded' && "space-y-3")}>
                <AnimatePresence mode="popLayout">
                  {filteredAndSortedTasks.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50 flex items-center justify-center">
                        <CheckSquare className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-light text-foreground mb-2">{t('todo.noActiveQuests')}</h3>
                      <p className="text-sm text-muted-foreground mb-6">{t('todo.noActiveQuestsDesc')}</p>
                    </motion.div>
                  ) : (
                    filteredAndSortedTasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        viewMode={viewMode}
                        onComplete={() => completeTask.mutate(task.id)}
                        onPostpone={(newDeadline) => postponeTask.mutate({ taskId: task.id, newDeadline })}
                        onDelete={() => deleteTask.mutate(task.id)}
                        onEdit={() => handleEditTask(task)}
                        onFocus={() => setFocusTask(task)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Dialogs */}
        <Dialog open={activePanel === 'create'} onOpenChange={(open) => !open && setActivePanel('none')}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground font-light tracking-wide flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> {t('todo.create.title')}
              </DialogTitle>
            </DialogHeader>
            <TodoGamifiedCreateForm onSubmit={handleCreateTask} onCancel={() => setActivePanel('none')} isLoading={createTask.isPending} />
          </DialogContent>
        </Dialog>

        <Dialog open={activePanel === 'edit' && editingTask !== null} onOpenChange={(open) => { if (!open) { setActivePanel('none'); setEditingTask(null); } }}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground font-light tracking-wide flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" /> {t('todo.editQuest')}
              </DialogTitle>
            </DialogHeader>
            {editingTask && <TodoEditForm task={editingTask} onSubmit={handleUpdateTask} onCancel={() => { setActivePanel('none'); setEditingTask(null); }} isLoading={updateTask.isPending} />}
          </DialogContent>
        </Dialog>

        <Dialog open={activePanel === 'stats'} onOpenChange={(open) => !open && setActivePanel('none')}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground font-light tracking-wide flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> {t('todo.questAnalytics')}
              </DialogTitle>
            </DialogHeader>
            <TodoAdvancedStats />
          </DialogContent>
        </Dialog>

        <Dialog open={activePanel === 'history'} onOpenChange={(open) => !open && setActivePanel('none')}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground font-light tracking-wide flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> {t('todo.questHistory')}
              </DialogTitle>
            </DialogHeader>
            <TodoHistoryPanel />
          </DialogContent>
        </Dialog>

        <Dialog open={activePanel === 'calendar'} onOpenChange={(open) => !open && setActivePanel('none')}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground font-light tracking-wide flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" aria-hidden="true" /> {t('todo.panels.calendar')}
              </DialogTitle>
            </DialogHeader>
            <TodoCalendarView tasks={tasks} />
          </DialogContent>
        </Dialog>
      </DSPageShell>
    </>
  );
}
