import { Clock, Sparkles, ChevronRight, List, Hourglass, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

/* Le rangement a la main n etait proposable nulle part : on pouvait
   deplacer une tache, sa position partait en base, et la liste la
   reecrasait aussitot par date de creation. Le tri manuel est desormais
   une option — et celle de depart. */
export type SortField = 'manual' | 'created_at' | 'deadline' | 'priority' | 'name' | 'category' | 'is_urgent';
export type SortDirection = 'asc' | 'desc';

interface TodoFilterSortProps {
  selectedTaskType: string | null;
  sortField: SortField;
  sortDirection: SortDirection;
  onTaskTypeChange: (taskType: string | null) => void;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const sortOptions: SortField[] = ['manual', 'created_at', 'deadline', 'priority', 'name', 'category', 'is_urgent'];

const filtres = [
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

  return (
    <div className="tsk-barre">
      <div className="tsk-groupe" role="group" aria-label={t('todo.filters.taskType')}>
        {filtres.map(({ id, cle, icone: Icone }) => (
          <button
            key={id ?? 'all'}
            type="button"
            aria-pressed={selectedTaskType === id}
            onClick={() => onTaskTypeChange(id)}
            className="tsk-onglet"
          >
            <Icone className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t(cle)}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Select value={sortField} onValueChange={(v) => onSortChange(v as SortField, sortDirection)}>
          <SelectTrigger className="tsk-outil w-[164px]" aria-label={t('todo.filters.sort')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="tsk bg-[hsl(var(--ds-surface-1))] border-[hsl(var(--ds-border-default)/0.2)]">
            {sortOptions.map((f) => (
              <SelectItem key={f} value={f} className="font-mono text-xs">
                {t(`todo.filters.sortOptions.${f}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Un rangement a la main n a pas de sens croissant. */}
        <button
          type="button"
          onClick={() => onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
          disabled={sortField === 'manual'}
          aria-label={t('todo.filters.direction')}
          className={cn('tsk-outil est-icone', sortField === 'manual' && 'est-inerte')}
        >
          <ChevronRight
            className={cn('w-3.5 h-3.5 transition-transform', sortDirection === 'asc' ? '-rotate-90' : 'rotate-90')}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
