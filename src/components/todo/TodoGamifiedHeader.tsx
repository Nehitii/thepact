import { motion } from 'framer-motion';
import { Flame, Trophy, Target, Zap, Star, TrendingUp } from 'lucide-react';
import { TodoStats } from '@/hooks/useTodoList';
import { cn } from '@/lib/utils';

interface TodoGamifiedHeaderProps {
  stats: TodoStats | null;
  activeTaskCount: number;
  maxTasks: number;
}

export function TodoGamifiedHeader({ stats, activeTaskCount, maxTasks }: TodoGamifiedHeaderProps) {
  const score = stats?.score ?? 0;
  const streak = stats?.current_streak ?? 0;
  const longestStreak = stats?.longest_streak ?? 0;
  
  // Calculate level based on score (100 points per level)
  const level = Math.floor(score / 100) + 1;
  const progressToNextLevel = (score % 100);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Main HUD Container */}
      <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl overflow-hidden">
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
        
        {/* Grid overlay for sci-fi feel */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }} />
        
        <div className="relative p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left: Level & Progress */}
            <div className="flex items-center gap-4">
              {/* Level badge */}
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                  <div className="relative z-10 text-center">
                    <span className="text-xs text-primary/80 font-medium">LVL</span>
                    <div className="text-2xl font-bold text-primary">{level}</div>
                  </div>
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/60" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/60" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/60" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/60" />
                </div>
              </motion.div>
              
              {/* Progress to next level */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-muted-foreground">Level Progress</span>
                </div>
                <div className="w-32 h-2 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNextLevel}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{progressToNextLevel}/100 XP</span>
              </div>
            </div>
            
            {/* Center: Stats Grid */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Score */}
              <StatBadge
                icon={<Target className="w-4 h-4" />}
                label="Score"
                value={score}
                color="primary"
              />
              
              {/* Current Streak */}
              <StatBadge
                icon={<Flame className="w-4 h-4" />}
                label="Streak"
                value={streak}
                suffix="days"
                color="orange"
                highlight={streak >= 7}
              />
              
              {/* Best Streak */}
              <StatBadge
                icon={<Trophy className="w-4 h-4" />}
                label="Best"
                value={longestStreak}
                suffix="days"
                color="amber"
              />
              
              {/* Tasks */}
              <StatBadge
                icon={<Zap className="w-4 h-4" />}
                label="Tasks"
                value={`${activeTaskCount}/${maxTasks}`}
                color="cyan"
              />
            </div>
            
            {/* Right: Bonus indicator */}
            {streak >= 3 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
              >
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-amber-300">Streak Bonus Active!</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  color: 'primary' | 'orange' | 'amber' | 'cyan' | 'emerald';
  highlight?: boolean;
}

const colorClasses = {
  primary: 'text-primary border-primary/30 bg-primary/10',
  orange: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  amber: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
};

function StatBadge({ icon, label, value, suffix, color, highlight }: StatBadgeProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -1 }}
      className={cn(
        "relative px-4 py-2 rounded-xl border backdrop-blur-sm transition-all",
        colorClasses[color],
        highlight && "ring-1 ring-orange-400/50 shadow-lg shadow-orange-500/20"
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-right">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-bold">
            {value}
            {suffix && <span className="text-xs font-normal ml-1">{suffix}</span>}
          </div>
        </div>
      </div>
      {highlight && (
        <motion.div 
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}
    </motion.div>
  );
}
