import { CheckSquare, Flame, Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTodoList } from '@/hooks/useTodoList';
import { Button } from '@/components/ui/button';

export function TodoListModule() {
  const navigate = useNavigate();
  const { activeTaskCount, stats, isLoading } = useTodoList();

  return (
    <div className="group relative rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground font-medium">To-Do List</h3>
            <p className="text-xs text-muted-foreground">Execute with clarity</p>
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
        <div className="h-16 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-background/30">
            <div className="text-lg font-light text-foreground">{activeTaskCount}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/30">
            <div className="flex items-center justify-center gap-1">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="text-lg font-light text-foreground">{stats?.score ?? 0}</span>
            </div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/30">
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-lg font-light text-foreground">{stats?.current_streak ?? 0}</span>
            </div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
        </div>
      )}

      {/* Quick action */}
      <Button
        onClick={() => navigate('/todo')}
        className="w-full mt-4 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 text-sm"
      >
        Open To-Do List
      </Button>
    </div>
  );
}
