import { Clock, Sparkles, ChevronDown, ArrowDown, ArrowUp, List, Hourglass, CalendarClock, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';

/* LE REGLAGE
 *
 * Cinq pastilles de type, un menu de tri et un bouton de sens tenaient
 * une barre entiere au-dessus de la liste — pour un reglage qu on
 * touche une fois par semaine. Tout rentre dans un seul bouton, qui
 * porte son etat en clair : « TOUTES · MANUEL ».
 *
 * Le rangement a la main n etait proposable nulle part : on pouvait
 * deplacer une tache, sa position partait en base, et la liste la
 * reecrasait aussitot par date de creation. Il reste l option de
 * depart. */
export type SortField = 'manual' | 'created_at' | 'deadline' | 'priority' | 'name' | 'category' | 'is_urgent';
export type SortDirection = 'asc' | 'desc';

interface TodoFilterSortProps {
  selectedTaskType: string | null;
  sortField: SortField;
  sortDirection: SortDirection;
  onTaskTypeChange: (taskType: string | null) => void;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const TRIS: SortField[] = ['manual', 'created_at', 'deadline', 'priority', 'name', 'category', 'is_urgent'];

const FILTRES = [
  { id: null as string | null, cle: 'todo.filters.types.all', icone: List },
  { id: 'flexible', cle: 'todo.filters.types.flexible', icone: Sparkles },
  { id: 'waiting', cle: 'todo.filters.types.waiting', icone: Hourglass },
  { id: 'rendezvous', cle: 'todo.filters.types.rendezvous', icone: CalendarClock },
  { id: 'deadline', cle: 'todo.filters.types.deadline', icone: Clock },
];

export function TodoFilterSort({
  selectedTaskType, sortField, sortDirection, onTaskTypeChange, onSortChange,
}: TodoFilterSortProps) {
  const { t } = useTranslation();

  const filtreActif = FILTRES.find((f) => f.id === selectedTaskType) ?? FILTRES[0];
  const resume = `${t(filtreActif.cle)} · ${t(`todo.filters.sortOptions.${sortField}`)}`;
  /* Un filtre pose n est pas un detail : le bouton le dit. */
  const estFiltre = selectedTaskType !== null || sortField !== 'manual';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('todo.filters.settings', { value: resume })}
          className={cn('tsk-outil', estFiltre && 'est-actif')}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{resume}</span>
          <ChevronDown className="w-3 h-3 opacity-60" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="tsk tsk-panneau w-64 p-0 rounded-none border-[hsl(var(--ds-border-default)/0.22)] bg-[hsl(var(--ds-surface-1))]"
      >
        <div className="tsk-dlg-rail">
          <b>FLT.</b>
          <i />
          <span>{t('todo.filters.taskType')}</span>
        </div>
        <div className="p-2 flex flex-col gap-1" role="group" aria-label={t('todo.filters.taskType')}>
          {FILTRES.map(({ id, cle, icone: Icone }) => (
            <button
              key={id ?? 'all'}
              type="button"
              aria-pressed={selectedTaskType === id}
              onClick={() => onTaskTypeChange(id)}
              className="tsk-choix"
            >
              <Icone className="w-3.5 h-3.5" aria-hidden="true" />
              {t(cle)}
            </button>
          ))}
        </div>

        <div className="tsk-dlg-rail">
          <b>ORD.</b>
          <i />
          <button
            type="button"
            onClick={() => onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
            disabled={sortField === 'manual'}
            aria-label={t('todo.filters.direction')}
            className={cn('tsk-sens', sortField === 'manual' && 'est-inerte')}
          >
            {sortDirection === 'asc'
              ? <ArrowUp className="w-3 h-3" aria-hidden="true" />
              : <ArrowDown className="w-3 h-3" aria-hidden="true" />}
          </button>
        </div>
        <div className="p-2 flex flex-col gap-1" role="group" aria-label={t('todo.filters.sort')}>
          {TRIS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={sortField === f}
              onClick={() => onSortChange(f, sortDirection)}
              className="tsk-choix"
            >
              {t(`todo.filters.sortOptions.${f}`)}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
