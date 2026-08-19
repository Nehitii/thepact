import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, BarChart3, History, Calendar as CalendarIcon, Pencil, List, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
  defaultDropAnimationSideEffects,
  type DragEndEvent, type DragStartEvent, type DropAnimation,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useTodoList, TodoTask } from '@/hooks/useTodoList';
import { DSPageShell, DSBackground, DSPageLoader } from '@/components/ds';
import { TodoLigne } from '@/components/todo/TodoLigne';
import { TodoTelemetrie } from '@/components/todo/TodoTelemetrie';
import { TodoGamifiedCreateForm } from '@/components/todo/TodoGamifiedCreateForm';
import { TodoAdvancedStats } from '@/components/todo/TodoAdvancedStats';
import { TodoHistoryPanel } from '@/components/todo/TodoHistoryPanel';
import { TodoCalendarView } from '@/components/todo/TodoCalendarView';
import { TodoFilterSort, SortField, SortDirection } from '@/components/todo/TodoFilterSort';
import { TodoEditForm, UpdateTaskInput } from '@/components/todo/TodoEditForm';
import { QuickTaskInput } from '@/components/todo/QuickTaskInput';
import { FocusOverlay } from '@/components/todo/FocusOverlay';
import { TodoCommandInfo } from '@/components/todo/TodoCommandInfo';
import { useTranslation } from 'react-i18next';
import { useDateFnsLocale } from '@/i18n/useDateFnsLocale';
import { useVisibleInterval } from '@/hooks/useVisibleInterval';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import '@/styles/todo.css';

/* TSK.01 — LA CONSOLE D OPERATIONS
 *
 * La page disait ce qu il y a. Elle ne disait pas ce qu il y a a faire :
 * une liste plate, un menu de tri, et cinq de ses fonctions derriere des
 * fenetres modales qui recouvraient tout.
 *
 * Elle devient un releve pose sur une plaque d instrument. Les panneaux
 * — calendrier, statistiques, historique — sont maintenant des VUES de
 * cette plaque, qu on change par la barre : on ne perd plus la liste des
 * yeux pour consulter son historique. Seuls les formulaires restent
 * modaux, parce qu un formulaire doit tenir la main.
 */

type Vue = 'liste' | 'detaillee' | 'calendrier' | 'stats' | 'historique';
const VUES: Vue[] = ['liste', 'detaillee', 'calendrier', 'stats', 'historique'];
const CLE_VUE = 'vowpact.todo.vue';

const ANIMATION_DEPOT: DropAnimation = {
  duration: 220,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.35' } } }),
};

function vueInitiale(): Vue {
  try {
    const v = localStorage.getItem(CLE_VUE) as Vue | null;
    if (v && VUES.includes(v)) return v;
  } catch { /* stockage indisponible */ }
  return 'liste';
}

type LigneTriableProps = {
  task: TodoTask;
  variant: 'liste' | 'detaillee';
  onComplete: () => void;
  onPostpone: (d: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  onFocus: () => void;
};

function LigneTriable({ task, ...reste }: LigneTriableProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: task.id });
  /* La carte entiere portait la poignee, et devenait un role="button"
     contenant cinq boutons. La poignee descend dans la ligne. */
  return (
    <div ref={setNodeRef}>
      <TodoLigne {...reste} task={task} isDragging={isDragging} poignee={{ ...attributes, ...listeners }} />
    </div>
  );
}

export default function TodoList() {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();

  const [vue, setVue] = useState<Vue>(vueInitiale);
  const [typeFiltre, setTypeFiltre] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('manual');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [tacheEditee, setTacheEditee] = useState<TodoTask | null>(null);
  const [formulaire, setFormulaire] = useState<'aucun' | 'creation' | 'edition'>('aucun');
  const [tacheFocus, setTacheFocus] = useState<TodoTask | null>(null);
  const [enVol, setEnVol] = useState<TodoTask | null>(null);

  const [maintenant, setMaintenant] = useState(() => new Date());
  useVisibleInterval(() => setMaintenant(new Date()), 60_000);

  useEffect(() => {
    try { localStorage.setItem(CLE_VUE, vue); } catch { /* sans consequence */ }
  }, [vue]);

  const {
    tasks, stats, insights, isLoading, activeTaskCount, maxTasks, canAddTask,
    createTask, completeTask, postponeTask, deleteTask, updateTask, reorderTasks,
  } = useTodoList();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const estListe = vue === 'liste' || vue === 'detaillee';

  const taches = useMemo(() => {
    const result = tasks.filter((x) => !typeFiltre || x.task_type === typeFiltre);

    /* En rangement manuel on ne trie pas : la requete rend deja les
       taches par position croissante, et c est cet ordre-la que le
       glisser-deposer ecrit. */
    if (sortField === 'manual') return result;

    result.sort((a, b) => {
      let c = 0;
      switch (sortField) {
        case 'created_at': c = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        case 'deadline':
          if (!a.deadline && !b.deadline) c = 0;
          else if (!a.deadline) c = 1;
          else if (!b.deadline) c = -1;
          else c = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case 'priority': {
          const ordre = { high: 3, medium: 2, low: 1 } as const;
          c = ordre[a.priority] - ordre[b.priority];
          break;
        }
        case 'name': c = a.name.localeCompare(b.name); break;
        case 'category': c = (a.category || 'general').localeCompare(b.category || 'general'); break;
        case 'is_urgent': c = (a.is_urgent ? 1 : 0) - (b.is_urgent ? 1 : 0); break;
      }
      return sortDirection === 'asc' ? c : -c;
    });
    return result;
  }, [tasks, typeFiltre, sortField, sortDirection]);

  const enRetard = useMemo(
    () => tasks.filter((x) => x.deadline && new Date(x.deadline) < new Date(new Date().toDateString())).length,
    [tasks],
  );

  const ouvrirEdition = useCallback((task: TodoTask) => {
    setTacheEditee(task);
    setFormulaire('edition');
  }, []);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setEnVol(tasks.find((x) => x.id === e.active.id) ?? null);
  }, [tasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setEnVol(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    /* Deplacer une tache alors qu un tri automatique est actif ne
       pouvait rien donner : on bascule sur le rangement a la main. */
    if (sortField !== 'manual') {
      setSortField('manual');
      toast.info(t('todo.toasts.switchedToManual'));
    }

    const de = taches.findIndex((x) => x.id === active.id);
    const vers = taches.findIndex((x) => x.id === over.id);
    if (de === -1 || vers === -1) return;

    const ordre = [...taches];
    const [deplacee] = ordre.splice(de, 1);
    ordre.splice(vers, 0, deplacee);
    reorderTasks.mutate(ordre.map((x) => x.id));
  }, [reorderTasks, taches, sortField, t]);

  const nomDeVue = t(`todo.views.${vue}`);

  if (isLoading) {
    return <DSPageLoader variant="verbose" message={t('todo.loadingQuests')} />;
  }

  return (
    <>
      {tacheFocus && (
        <FocusOverlay
          task={tacheFocus}
          onComplete={() => { completeTask.mutate(tacheFocus.id); setTacheFocus(null); }}
          onExit={() => setTacheFocus(null)}
        />
      )}

      <DSPageShell width="xl" background={<DSBackground variant="cyber" />}>
        <div className="tsk max-w-6xl mx-auto">
          {/* ── Le bandeau ─────────────────────────────────── */}
          <header className="tsk-plaque mb-3">
            <div className="tsk-rail">
              <b>TSK.01</b>
              <i />
              <span>{format(maintenant, 'EEE d MMM', { locale })}</span>
              <i />
              <b>{format(maintenant, 'HH:mm')}</b>
            </div>
            <div className="px-[18px] pt-4 pb-4">
              <h1 className="font-orbitron font-black uppercase tracking-[0.06em] text-[clamp(24px,4.2vw,40px)] leading-none m-0">
                TASK<span className="text-[hsl(var(--ds-accent-primary))] [text-shadow:0_0_18px_hsl(var(--ds-accent-primary)/0.45)]">OPS</span>
              </h1>
              <p className="mt-2 max-w-[46ch] font-rajdhani text-[15px] text-[hsl(var(--ds-text-secondary))]">
                {t('todo.subtitle')}
              </p>
            </div>
          </header>

          {/* ── L invite ───────────────────────────────────── */}
          <QuickTaskInput
            onSubmit={(input) => createTask.mutate(input)}
            isLoading={createTask.isPending}
            disabled={!canAddTask}
          />

          {/* ── Les commandes ──────────────────────────────── */}
          <div className="tsk-barre mt-3">
            <div className="tsk-groupe" role="group" aria-label={t('todo.views.switcher')}>
              {(['liste', 'detaillee'] as Vue[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vue === v}
                  onClick={() => setVue(v)}
                  className="tsk-onglet"
                  aria-label={t(`todo.views.${v}`)}
                  title={t(`todo.views.${v}`)}
                >
                  {v === 'liste'
                    ? <List className="w-3.5 h-3.5" aria-hidden="true" />
                    : <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />}
                </button>
              ))}
            </div>

            <div className="tsk-groupe" role="group" aria-label={t('todo.views.panels')}>
              {(['calendrier', 'stats', 'historique'] as Vue[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vue === v}
                  onClick={() => setVue(v)}
                  /* Le libelle visible disparait sous md ; l aria-label
                     reste. Deux spans annoncaient « CalendarCalendar ». */
                  aria-label={t(`todo.views.${v}`)}
                  className="tsk-onglet"
                >
                  {v === 'calendrier' && <CalendarIcon className="w-3.5 h-3.5" aria-hidden="true" />}
                  {v === 'stats' && <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />}
                  {v === 'historique' && <History className="w-3.5 h-3.5" aria-hidden="true" />}
                  <span className="hidden md:inline" aria-hidden="true">{t(`todo.views.${v}`)}</span>
                </button>
              ))}
            </div>

            <span className="tsk-espace" />
            <TodoCommandInfo />
            <button
              type="button"
              onClick={() => setFormulaire('creation')}
              disabled={!canAddTask}
              className={cn('tsk-outil', canAddTask ? 'est-primaire' : 'est-inerte')}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              {t('todo.create.new')}
            </button>
          </div>

          {estListe && (
            <TodoFilterSort
              selectedTaskType={typeFiltre}
              sortField={sortField}
              sortDirection={sortDirection}
              onTaskTypeChange={setTypeFiltre}
              onSortChange={(f, d) => { setSortField(f); setSortDirection(d); }}
            />
          )}

          {/* ── La plaque ──────────────────────────────────── */}
          <div className="tsk-corps">
            <div className="tsk-plaque min-w-0">
              <span className="tsk-scan" aria-hidden="true" />
              <div className="tsk-rail">
                <b>TSK.01</b>
                <i />
                <span>{nomDeVue}</span>
                <i />
                <span className="tsk-rail-option">
                  {t('todo.tel.activeCount', { count: activeTaskCount, max: maxTasks })}
                </span>
                <i className="tsk-rail-option" />
                {enRetard > 0
                  ? <b className="tsk-alerte">{t('todo.rail.alert', { count: enRetard })}</b>
                  : <b>{t('todo.rail.nominal')}</b>}
              </div>

              {estListe && insights.map((a) => (
                <p key={a.cle} className="tsk-analyse">{t(a.cle, a.params)}</p>
              ))}

              {estListe && !canAddTask && (
                <p className="tsk-avertissement">{t('todo.questLogFull')}</p>
              )}

              {vue === 'calendrier' && <div className="relative z-[2] p-4"><TodoCalendarView tasks={tasks} /></div>}
              {vue === 'stats' && <div className="relative z-[2] p-4"><TodoAdvancedStats /></div>}
              {vue === 'historique' && <div className="relative z-[2] p-4"><TodoHistoryPanel /></div>}

              {estListe && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={() => setEnVol(null)}
                >
                  <SortableContext items={taches.map((x) => x.id)} strategy={verticalListSortingStrategy}>
                    <div className="tsk-liste">
                      {taches.length === 0 ? (
                        <div className="tsk-vide">
                          <h3>{t('todo.noActiveQuests')}</h3>
                          <p>{t('todo.noActiveQuestsDesc')}</p>
                        </div>
                      ) : (
                        taches.map((task) => (
                          <LigneTriable
                            key={task.id}
                            task={task}
                            variant={vue === 'detaillee' ? 'detaillee' : 'liste'}
                            onComplete={() => completeTask.mutate(task.id)}
                            onPostpone={(d) => postponeTask.mutate({ taskId: task.id, newDeadline: d })}
                            onDelete={() => deleteTask.mutate(task.id)}
                            onEdit={() => ouvrirEdition(task)}
                            onFocus={() => setTacheFocus(task)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>

                  <DragOverlay dropAnimation={ANIMATION_DEPOT}>
                    {enVol && (
                      <div className="tsk" style={{ filter: 'drop-shadow(0 8px 18px hsl(var(--ds-bg-base)/0.8))' }}>
                        <div className="tsk-plaque">
                          <TodoLigne
                            task={enVol}
                            variant={vue === 'detaillee' ? 'detaillee' : 'liste'}
                            onComplete={() => {}}
                            onPostpone={() => {}}
                            onDelete={() => {}}
                            onEdit={() => {}}
                          />
                        </div>
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              )}
            </div>

            <aside className="tsk-flanc">
              <TodoTelemetrie
                tasks={tasks}
                stats={stats}
                maxTasks={maxTasks}
                onOuvrirTache={ouvrirEdition}
              />
            </aside>
          </div>

          {/* ── Les formulaires, seuls a rester modaux ─────── */}
          <Dialog open={formulaire === 'creation'} onOpenChange={(o) => !o && setFormulaire('aucun')}>
            <DialogContent className="tsk tsk-dlg sm:max-w-md max-h-[92vh] border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
              <div className="tsk-dlg-rail">
                <b>TSK.01</b>
                <i />
                <DialogTitle asChild><span>{t('todo.create.title')}</span></DialogTitle>
              </div>
              <div className="tsk-dlg-contenu tsk-form">
                <TodoGamifiedCreateForm
                  onSubmit={(input) => createTask.mutate(input, { onSuccess: () => setFormulaire('aucun') })}
                  onCancel={() => setFormulaire('aucun')}
                  isLoading={createTask.isPending}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={formulaire === 'edition' && tacheEditee !== null}
            onOpenChange={(o) => { if (!o) { setFormulaire('aucun'); setTacheEditee(null); } }}
          >
            <DialogContent className="tsk tsk-dlg sm:max-w-md max-h-[92vh] border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
              <div className="tsk-dlg-rail">
                <b>TSK.01</b>
                <i />
                <DialogTitle asChild><span>{t('todo.editQuest')}</span></DialogTitle>
              </div>
              <div className="tsk-dlg-contenu tsk-form">
                {tacheEditee && (
                  <TodoEditForm
                    task={tacheEditee}
                    onSubmit={(input: UpdateTaskInput) =>
                      updateTask.mutate(input, {
                        onSuccess: () => { setFormulaire('aucun'); setTacheEditee(null); },
                      })}
                    onCancel={() => { setFormulaire('aucun'); setTacheEditee(null); }}
                    isLoading={updateTask.isPending}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DSPageShell>
    </>
  );
}
