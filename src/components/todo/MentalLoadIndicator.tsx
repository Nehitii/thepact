import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import { TodoTask } from '@/hooks/useTodoList';
import { isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface MentalLoadIndicatorProps {
  tasks: TodoTask[];
}

function computeLoad(tasks: TodoTask[]): { percent: number; label: string; color: string; glowColor: string } {
  let heat = 0;
  for (const t of tasks) {
    if (t.is_urgent) heat += 3;
    if (t.deadline && isPast(new Date(t.deadline)) && !isToday(new Date(t.deadline))) heat += 4;
    else if (t.priority === 'high') heat += 2;
    else if (t.priority === 'medium') heat += 1;
    else heat += 0.5;
  }

  const maxHeat = 40; // ~10 urgent/overdue tasks
  const percent = Math.min(Math.round((heat / maxHeat) * 100), 100);

  if (percent <= 40) return { percent, label: 'NOMINAL', color: 'text-emerald-400', glowColor: 'hsl(142 70% 45%)' };
  if (percent <= 70) return { percent, label: 'ELEVATED', color: 'text-amber-400', glowColor: 'hsl(45 90% 50%)' };
  return { percent, label: 'CRITICAL', color: 'text-red-400', glowColor: 'hsl(0 85% 55%)' };
}

export function MentalLoadIndicator({ tasks }: MentalLoadIndicatorProps) {
  const load = useMemo(() => computeLoad(tasks), [tasks]);

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (load.percent / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm"
    >
      {/* Circular gauge */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
          <circle
            cx="24" cy="24" r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="3"
            opacity="0.3"
          />
          <motion.circle
            cx="24" cy="24" r={radius}
            fill="none"
            stroke={load.glowColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${load.glowColor})` }}
          />
        </svg>
        <Cpu className={cn("absolute w-4 h-4", load.color)} />
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">SYS_LOAD</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-mono font-bold", load.color)}>{load.percent}%</span>
          {load.percent > 70 && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-[10px] font-mono text-red-400"
            >
              {load.label}
            </motion.span>
          )}
          {load.percent <= 70 && (
            <span className={cn("text-[10px] font-mono", load.color)}>{load.label}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
