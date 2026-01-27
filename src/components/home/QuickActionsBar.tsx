import { useNavigate } from 'react-router-dom';
import { Plus, CheckSquare, BookOpen, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { HudActionButton } from './HudActionButton';

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
      always: true,
    },
    {
      id: 'log-todo',
      label: 'Log Todo',
      icon: CheckSquare,
      onClick: () => navigate('/todo'),
      always: false,
      owned: ownedModules.todo,
    },
    {
      id: 'journal-entry',
      label: 'Journal',
      icon: BookOpen,
      onClick: () => navigate('/journal'),
      always: false,
      owned: ownedModules.journal,
    },
    {
      id: 'health-checkin',
      label: 'Health',
      icon: Heart,
      onClick: () => navigate('/health'),
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
        "flex items-center justify-center gap-4 flex-wrap",
        "md:flex-nowrap overflow-x-auto scrollbar-hide py-2",
        className
      )}
    >
      {visibleActions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 * index }}
        >
          <HudActionButton
            label={action.label}
            icon={action.icon}
            onClick={action.onClick}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
