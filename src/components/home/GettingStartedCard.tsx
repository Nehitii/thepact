import { useNavigate } from 'react-router-dom';
import { Target, Calendar, ShoppingCart, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GettingStartedStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  action: () => void;
  actionLabel: string;
}

interface GettingStartedCardProps {
  hasGoals: boolean;
  hasTimeline: boolean;
  hasPurchasedModules: boolean;
  className?: string;
}

export function GettingStartedCard({ 
  hasGoals, 
  hasTimeline, 
  hasPurchasedModules,
  className 
}: GettingStartedCardProps) {
  const navigate = useNavigate();

  const steps: GettingStartedStep[] = [
    {
      id: 'create-goal',
      title: 'Create your first goal',
      description: 'Define what you want to achieve',
      icon: Target,
      completed: hasGoals,
      action: () => navigate('/goals/new'),
      actionLabel: 'Create Goal',
    },
    {
      id: 'set-timeline',
      title: 'Set your project timeline',
      description: 'Add deadlines to stay on track',
      icon: Calendar,
      completed: hasTimeline,
      action: () => navigate('/profile/pact'),
      actionLabel: 'Set Dates',
    },
    {
      id: 'explore-shop',
      title: 'Explore the shop',
      description: 'Unlock modules and cosmetics',
      icon: ShoppingCart,
      completed: hasPurchasedModules,
      action: () => navigate('/shop'),
      actionLabel: 'Visit Shop',
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  // Hide if all steps completed
  if (completedCount === steps.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative group animate-fade-in",
        className
      )}
    >
      <div className="absolute inset-0 bg-accent/10 rounded-lg blur-2xl" />
      
      <div className="relative bg-card/20 backdrop-blur-xl border-2 border-accent/30 rounded-lg overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-accent/20 rounded-[6px]" />
        </div>
        
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary to-accent">
                Getting Started
              </h3>
              <p className="text-xs text-accent/60 font-rajdhani mt-1">
                {completedCount}/{steps.length} steps completed
              </p>
            </div>
            
            {/* Progress circle */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-card/30"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 1.26} 126`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--accent))" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-accent font-orbitron">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg transition-all",
                    step.completed 
                      ? "bg-health/10 border border-health/20" 
                      : "bg-card/20 border border-primary/20 hover:border-primary/40"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    step.completed 
                      ? "bg-health/20" 
                      : "bg-primary/10"
                  )}>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-health" />
                    ) : (
                      <Icon className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "text-sm font-medium font-orbitron",
                      step.completed ? "text-health/80" : "text-primary"
                    )}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-muted-foreground font-rajdhani truncate">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Action */}
                  {!step.completed && (
                    <Button
                      onClick={step.action}
                      size="sm"
                      variant="ghost"
                      className="flex-shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <span className="text-xs font-orbitron uppercase">{step.actionLabel}</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
