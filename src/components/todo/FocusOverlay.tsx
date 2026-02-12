import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Check, Timer } from 'lucide-react';
import { TodoTask } from '@/hooks/useTodoList';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FocusOverlayProps {
  task: TodoTask;
  onComplete: () => void;
  onExit: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FocusOverlay({ task, onComplete, onExit }: FocusOverlayProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const toggle = useCallback(() => setRunning(p => !p), []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
      >
        {/* Scan lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.1) 2px, hsl(var(--primary) / 0.1) 4px)',
          }}
        />

        {/* Exit button */}
        <button
          onClick={onExit}
          className="absolute top-6 right-6 p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Focus mode label */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">HYPERFOCUS ACTIVE</span>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </motion.div>

        {/* Task name */}
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-3xl md:text-5xl font-bold text-foreground text-center max-w-3xl px-8 leading-tight"
        >
          {task.name}
        </motion.h1>

        {/* Category & Priority badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 mt-6"
        >
          <span className="px-3 py-1 rounded-lg bg-card/50 border border-border/50 text-xs font-mono text-muted-foreground uppercase">
            {task.category || 'general'}
          </span>
          <span className={cn(
            "px-3 py-1 rounded-lg text-xs font-mono uppercase border",
            task.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
            task.priority === 'low' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
            'bg-blue-500/20 text-blue-300 border-blue-500/30'
          )}>
            {task.priority}
          </span>
        </motion.div>

        {/* Timer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider">ELAPSED</span>
          </div>
          <span className="text-5xl md:text-7xl font-mono font-bold text-foreground tabular-nums tracking-wider"
            style={{ textShadow: '0 0 30px hsl(var(--primary) / 0.3)' }}
          >
            {formatTime(elapsed)}
          </span>

          {/* Timer controls */}
          <div className="flex items-center gap-3 mt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="w-12 h-12 rounded-full border border-primary/30 text-primary hover:bg-primary/10"
            >
              {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
          </div>
        </motion.div>

        {/* Complete button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <Button
            onClick={onComplete}
            className="px-8 py-6 text-lg font-mono uppercase tracking-wider bg-gradient-to-r from-primary/20 to-emerald-500/20 hover:from-primary/30 hover:to-emerald-500/30 text-primary border border-primary/40 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all"
          >
            <Check className="w-5 h-5 mr-2" />
            Mission Complete
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
