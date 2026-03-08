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
    { id: 'create-goal', title: 'Create your first goal', description: 'Define what you want to achieve', icon: Target, completed: hasGoals, action: () => navigate('/goals/new'), actionLabel: 'Create Goal' },
    { id: 'set-timeline', title: 'Set your project timeline', description: 'Add deadlines to stay on track', icon: Calendar, completed: hasTimeline, action: () => navigate('/profile/pact'), actionLabel: 'Set Dates' },
    { id: 'explore-shop', title: 'Explore the shop', description: 'Unlock modules and cosmetics', icon: ShoppingCart, completed: hasPurchasedModules, action: () => navigate('/shop'), actionLabel: 'Visit Shop' },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  if (completedCount === steps.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("relative", className)}
    >
      <div
        className="relative bg-[var(--nexus-bg)] backdrop-blur-xl border border-[var(--nexus-border)] overflow-hidden nexus-shadow"
        style={{ borderRadius: "4px" }}
      >
        {/* Permanent top highlight */}
        <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top-subtle" />

        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] font-orbitron text-primary">
                Getting Started
              </h3>
              <p className="text-xs text-[var(--nexus-text-dimmer)] font-rajdhani mt-1">
                {completedCount}/{steps.length} steps completed
              </p>
            </div>
            
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="var(--nexus-separator)" strokeWidth="3" fill="none" />
                <circle cx="24" cy="24" r="20" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={`${progress * 1.26} 126`} className="transition-all duration-500" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary font-mono tabular-nums">
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
                    "flex items-center gap-4 p-3 transition-all",
                    step.completed 
                      ? "bg-emerald-500/5 border border-emerald-500/15 dark:bg-[rgba(0,255,136,0.03)] dark:border-[rgba(0,255,136,0.12)]" 
                      : "bg-primary/5 border border-primary/10 hover:border-primary/25 dark:bg-[rgba(0,180,255,0.03)] dark:border-[rgba(0,180,255,0.08)] dark:hover:border-[rgba(0,180,255,0.2)]"
                  )}
                  style={{ borderRadius: "4px" }}
                >
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 flex items-center justify-center",
                    step.completed ? "bg-emerald-500/10 dark:bg-[rgba(0,255,136,0.08)]" : "bg-primary/5 dark:bg-[rgba(0,180,255,0.05)]"
                  )} style={{ borderRadius: "4px" }}>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Icon className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "text-sm font-medium font-orbitron tracking-[0.05em]",
                      step.completed ? "text-emerald-400/80" : "text-primary"
                    )}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-[var(--nexus-text-dimmer)] font-rajdhani truncate">
                      {step.description}
                    </p>
                  </div>
                  
                  {!step.completed && (
                    <Button
                      onClick={step.action}
                      size="sm"
                      variant="ghost"
                      className="flex-shrink-0 text-primary hover:text-primary hover:bg-[var(--nexus-hover-bg)]"
                    >
                      <span className="text-xs font-orbitron uppercase tracking-[0.1em]">{step.actionLabel}</span>
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
