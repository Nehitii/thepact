import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Target, CheckCircle2, Calendar, TrendingUp, PieChart as PieChartIcon, BarChart3, Clock } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, getDay, getHours, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useTodoList, TodoHistory, TodoTask } from '@/hooks/useTodoList';
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
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useDateFnsLocale } from '@/i18n/useDateFnsLocale';

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#3b82f6',
  high: '#f59e0b',
};

const CATEGORY_COLORS: Record<string, string> = {
  work: '#3b82f6',
  health: '#ef4444',
  personal: '#a855f7',
  study: '#10b981',
  admin: '#6b7280',
  general: '#8b5cf6',
};

export function TodoAdvancedStats() {
  const { t } = useTranslation();
  const dateLocale = useDateFnsLocale();
  const { stats, history, tasks } = useTodoList();

  const dayNames = (t('common.daysShort', { returnObjects: true }) as unknown as string[]) || ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

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
        month: format(month, 'MMM', { locale: dateLocale }),
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
      { name: t('todo.difficulty.low'), value: counts.low, color: PRIORITY_COLORS.low },
      { name: t('todo.difficulty.medium'), value: counts.medium, color: PRIORITY_COLORS.medium },
      { name: t('todo.difficulty.high'), value: counts.high, color: PRIORITY_COLORS.high },
    ].filter((d) => d.value > 0);
  }, [history, t]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach((h: TodoHistory & { category?: string }) => {
      const cat = h.category || 'general';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({
      name: t(`todo.categories.${name}`),
      value,
      color: CATEGORY_COLORS[name] || '#8b5cf6',
    }));
  }, [history, t]);

  // Day of week analysis
  const dayOfWeekData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    history.forEach((h) => {
      const day = getDay(new Date(h.completed_at));
      counts[day]++;
    });
    
    return dayNames.map((name, i) => ({
      day: name,
      tasks: counts[i] ?? 0,
    }));
  }, [history, dayNames]);

  // Time of day analysis
  const timeOfDayData = useMemo(() => {
    const periods = {
      [t('todo.advanced.morning', { defaultValue: 'Morning (6-12)' })]: 0,
      [t('todo.advanced.afternoon', { defaultValue: 'Afternoon (12-18)' })]: 0,
      [t('todo.advanced.evening', { defaultValue: 'Evening (18-24)' })]: 0,
      [t('todo.advanced.night', { defaultValue: 'Night (0-6)' })]: 0,
    };
    
    history.forEach((h) => {
      const hour = getHours(new Date(h.completed_at));
      const keys = Object.keys(periods);
      const morning = keys[0];
      const afternoon = keys[1];
      const evening = keys[2];
      const night = keys[3];
      if (hour >= 6 && hour < 12) (periods as any)[morning]++;
      else if (hour >= 12 && hour < 18) (periods as any)[afternoon]++;
      else if (hour >= 18) (periods as any)[evening]++;
      else (periods as any)[night]++;
    });
    
    return Object.entries(periods).map(([period, count]) => ({
      period,
      tasks: count,
      fullMark: Math.max(...Object.values(periods)) + 5,
    }));
  }, [history, t]);

  // 30-day activity grid
  const activityGrid = useMemo(() => {
    const days: { day: string; date: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = history.filter((h) => 
        h.completed_at.split('T')[0] === dateStr
      ).length;
      
      days.push({
        day: format(date, 'd'),
        date: format(date, 'MMM d'),
        count,
      });
    }
    
    return days;
  }, [history]);

  // Completion rate
  const completionRate = useMemo(() => {
    if (history.length === 0) return 0;
    const last30Days = history.filter((h) => {
      const date = new Date(h.completed_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo;
    }).length;
    return last30Days;
  }, [history]);

  return (
    <div className="space-y-8">
      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-5 h-5 text-primary" />}
          label={t('todo.advanced.totalScore')}
          value={stats?.score ?? 0}
          color="primary"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          label={t('todo.advanced.currentStreak')}
          value={`${stats?.current_streak ?? 0} ${t('todo.header.days')}`}
          color="orange"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-amber-400" />}
          label={t('todo.advanced.bestStreak')}
          value={`${stats?.longest_streak ?? 0} ${t('todo.header.days')}`}
          color="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          label={t('todo.advanced.thisMonth')}
          value={stats?.tasks_completed_month ?? 0}
          color="emerald"
        />
      </div>

      {/* Year stats */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-card/50 to-card/30 border border-border/30"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('todo.advanced.tasksCompletedYear')}</span>
            <div className="text-2xl font-bold text-foreground">{stats?.tasks_completed_year ?? 0}</div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm text-muted-foreground">{t('todo.advanced.last30Days')}</span>
          <div className="text-xl font-semibold text-foreground">{completionRate}</div>
        </div>
      </motion.div>

      {/* 30-day activity grid */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          {t('todo.advanced.activity30')}
        </h3>
        <div className="flex gap-1 flex-wrap">
          {activityGrid.map((day, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={cn(
                'w-7 h-7 rounded-md flex items-center justify-center text-[10px] transition-all cursor-default',
                day.count === 0 && 'bg-card/30 text-muted-foreground/30',
                day.count === 1 && 'bg-primary/20 text-primary/80',
                day.count === 2 && 'bg-primary/40 text-primary',
                day.count >= 3 && 'bg-primary/60 text-primary-foreground'
              )}
              title={`${day.date}: ${t('todo.advanced.tasksTooltip', { count: day.count })}`}
            >
              {day.day}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly completion chart */}
        {history.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3 p-4 rounded-2xl bg-card/30 border border-border/30"
          >
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {t('todo.advanced.monthlyCompletions')}
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    width={25}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
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
          </motion.div>
        )}

        {/* Day of week distribution */}
        {history.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3 p-4 rounded-2xl bg-card/30 border border-border/30"
          >
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('todo.advanced.mostProductiveDays')}
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    width={25}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar 
                    dataKey="tasks" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Priority distribution */}
        {priorityData.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 p-4 rounded-2xl bg-card/30 border border-border/30"
          >
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              {t('todo.advanced.difficultyDistribution')}
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
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
          </motion.div>
        )}

        {/* Category distribution */}
        {categoryData.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-3 p-4 rounded-2xl bg-card/30 border border-border/30"
          >
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              {t('todo.advanced.categoryBreakdown')}
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                {categoryData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                    <span className="text-sm text-foreground font-medium">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Time of day radar */}
        {history.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 p-4 rounded-2xl bg-card/30 border border-border/30 md:col-span-2"
          >
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('todo.advanced.productivityByTime')}
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={timeOfDayData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="period" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Radar
                    name="Tasks"
                    dataKey="tasks"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {history.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {t('todo.advanced.completeToSee')}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'primary' | 'orange' | 'amber' | 'emerald';
}

const colorClasses = {
  primary: 'from-primary/20 to-primary/5 border-primary/30',
  orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
};

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "p-4 rounded-2xl bg-gradient-to-br border transition-all",
        colorClasses[color]
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </motion.div>
  );
}
