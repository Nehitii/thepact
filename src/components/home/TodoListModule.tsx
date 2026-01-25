import { CheckSquare, Flame, Target, ArrowRight, Clock, Calendar, CalendarClock, Hourglass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTodoList } from '@/hooks/useTodoList';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export function TodoListModule() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tasks, stats, isLoading } = useTodoList();

  // Count by task type
  const typeCounts = {
    flexible: tasks.filter(t => t.task_type === 'flexible' || !t.task_type).length,
    waiting: tasks.filter(t => t.task_type === 'waiting').length,
    rendezvous: tasks.filter(t => t.task_type === 'rendezvous').length,
    deadline: tasks.filter(t => t.task_type === 'deadline').length,
  };

  const totalActive = tasks.length;

  return (
    <div className="group relative rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground font-medium">{t('todo.title', 'To-Do List')}</h3>
            <p className="text-xs text-muted-foreground">{t('todo.subtitle', 'Execute with clarity')}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/todo')}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="h-20 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">{t('common.loading', 'Loading...')}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Task type breakdown */}
          <div className="grid grid-cols-2 gap-2">
            <TypeCount 
              icon={<Clock className="w-3.5 h-3.5" />} 
              label={t('todo.taskTypes.flexible', 'Flexible')} 
              count={typeCounts.flexible}
              color="text-blue-400"
            />
            <TypeCount 
              icon={<Hourglass className="w-3.5 h-3.5" />} 
              label={t('todo.taskTypes.waiting', 'Waiting')} 
              count={typeCounts.waiting}
              color="text-amber-400"
            />
            <TypeCount 
              icon={<CalendarClock className="w-3.5 h-3.5" />} 
              label={t('todo.taskTypes.rendezvous', 'Rendez-vous')} 
              count={typeCounts.rendezvous}
              color="text-purple-400"
            />
            <TypeCount 
              icon={<Calendar className="w-3.5 h-3.5" />} 
              label={t('todo.taskTypes.deadline', 'Deadline')} 
              count={typeCounts.deadline}
              color="text-red-400"
            />
          </div>

          {/* Score and streak row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-medium text-foreground">{stats?.score ?? 0}</span>
                <span className="text-xs text-muted-foreground">{t('todo.score', 'pts')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-sm font-medium text-foreground">{stats?.current_streak ?? 0}</span>
                <span className="text-xs text-muted-foreground">{t('todo.streak', 'streak')}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {totalActive} {t('todo.active', 'active')}
            </span>
          </div>
        </div>
      )}

      {/* Quick action */}
      <Button
        onClick={() => navigate('/todo')}
        className="w-full mt-4 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 text-sm"
      >
        {t('todo.openTodoList', 'Open To-Do List')}
      </Button>
    </div>
  );
}

interface TypeCountProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}

function TypeCount({ icon, label, count, color }: TypeCountProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/30">
      <span className={color}>{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{count}</span>
    </div>
  );
}
