import { useMemo } from 'react';
import { Flame, Trophy, Target, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { useTodoList, TodoHistory } from '@/hooks/useTodoList';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PRIORITY_COLORS = {
  low: 'hsl(var(--muted-foreground))',
  medium: 'hsl(210, 70%, 60%)',
  high: 'hsl(40, 80%, 60%)',
};

export function TodoStatsPanel() {
  const { stats, history } = useTodoList();

  // Monthly completion data (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: endOfMonth(now) });
    
    return months.map((month) => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const count = history.filter((h) => {
        const date = new Date(h.completed_at);
        return date >= start && date <= end;
      }).length;
      
      return {
        month: format(month, 'MMM'),
        completed: count,
      };
    });
  }, [history]);

  // Priority distribution
  const priorityData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    history.forEach((h) => {
      counts[h.priority]++;
    });
    
    return [
      { name: 'Low', value: counts.low, color: PRIORITY_COLORS.low },
      { name: 'Medium', value: counts.medium, color: PRIORITY_COLORS.medium },
      { name: 'High', value: counts.high, color: PRIORITY_COLORS.high },
    ].filter((d) => d.value > 0);
  }, [history]);

  // Streak history (simplified - last 30 days activity)
  const streakData = useMemo(() => {
    const days: { day: string; active: boolean }[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const hasCompletion = history.some((h) => 
        h.completed_at.split('T')[0] === dateStr
      );
      
      days.push({
        day: format(date, 'd'),
        active: hasCompletion,
      });
    }
    
    return days;
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-5 h-5 text-primary" />}
          label="Total Score"
          value={stats?.score ?? 0}
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          label="Current Streak"
          value={`${stats?.current_streak ?? 0} days`}
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-amber-400" />}
          label="Longest Streak"
          value={`${stats?.longest_streak ?? 0} days`}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          label="This Month"
          value={stats?.tasks_completed_month ?? 0}
        />
      </div>

      {/* Year total */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-card/30 border border-border/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Tasks completed this year</span>
        </div>
        <span className="text-xl font-light text-foreground">{stats?.tasks_completed_year ?? 0}</span>
      </div>

      {/* 30-day activity grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Last 30 Days Activity
        </h3>
        <div className="flex gap-1 flex-wrap">
          {streakData.map((day, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-sm flex items-center justify-center text-[10px] ${
                day.active 
                  ? 'bg-primary/40 text-primary-foreground' 
                  : 'bg-card/50 text-muted-foreground/50'
              }`}
              title={day.active ? 'Tasks completed' : 'No tasks'}
            >
              {day.day}
            </div>
          ))}
        </div>
      </div>

      {/* Monthly completion chart */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Monthly Completions</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#completedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Priority distribution */}
      {priorityData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Priority Distribution</h3>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2">
              {priorityData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                  <span className="text-sm text-foreground font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Complete tasks to see your statistics here.
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-card/30 border border-border/30">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-light text-foreground">{value}</div>
    </div>
  );
}
