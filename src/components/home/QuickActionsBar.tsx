import { useNavigate } from 'react-router-dom';
import { Plus, CheckSquare, BookOpen, Heart, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuickActionsBarProps {
  ownedModules: {
    todo: boolean;
    journal: boolean;
    health: boolean;
  };
  className?: string;
}

export function QuickActionsBar({ ownedModules, className }: QuickActionsBarProps) {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'new-goal',
      label: 'New Goal',
      icon: Plus,
      onClick: () => navigate('/goals/new'),
      color: 'from-primary to-accent',
      borderColor: 'border-primary/40 hover:border-primary/60',
      glowColor: 'rgba(91,180,255,0.3)',
      always: true,
    },
    {
      id: 'log-todo',
      label: 'Log Todo',
      icon: CheckSquare,
      onClick: () => navigate('/todo'),
      color: 'from-cyan-400 to-teal-400',
      borderColor: 'border-cyan-500/40 hover:border-cyan-400/60',
      glowColor: 'rgba(6,182,212,0.3)',
      always: false,
      owned: ownedModules.todo,
    },
    {
      id: 'journal-entry',
      label: 'Journal',
      icon: BookOpen,
      onClick: () => navigate('/journal'),
      color: 'from-indigo-400 to-purple-400',
      borderColor: 'border-indigo-500/40 hover:border-indigo-400/60',
      glowColor: 'rgba(99,102,241,0.3)',
      always: false,
      owned: ownedModules.journal,
    },
    {
      id: 'health-checkin',
      label: 'Health',
      icon: Heart,
      onClick: () => navigate('/health'),
      color: 'from-teal-400 to-emerald-400',
      borderColor: 'border-teal-500/40 hover:border-teal-400/60',
      glowColor: 'rgba(20,184,166,0.3)',
      always: false,
      owned: ownedModules.health,
    },
  ];

  const visibleActions = actions.filter(a => a.always || a.owned);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={cn(
        "flex items-center justify-center gap-3 flex-wrap",
        "md:flex-nowrap overflow-x-auto scrollbar-hide",
        className
      )}
    >
      {visibleActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 * index }}
          >
            <Button
              onClick={action.onClick}
              variant="outline"
              size="sm"
              className={cn(
                "relative group px-4 py-2 h-auto",
                "bg-card/30 backdrop-blur-xl",
                action.borderColor,
                "transition-all duration-300",
                "hover:shadow-[0_0_20px_var(--glow-color)]"
              )}
              style={{ '--glow-color': action.glowColor } as React.CSSProperties}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn(
                  "w-4 h-4 transition-all",
                  `text-transparent bg-clip-text bg-gradient-to-r ${action.color}`
                )} 
                style={{ 
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
                />
                <span className={cn(
                  "text-xs font-orbitron uppercase tracking-wider",
                  "text-transparent bg-clip-text bg-gradient-to-r",
                  action.color
                )}>
                  {action.label}
                </span>
              </div>
            </Button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
