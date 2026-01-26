import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Flame, ListTodo, BookOpen, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LockedModule {
  key: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

interface LockedModulesTeaserProps {
  lockedModules: string[];
  className?: string;
}

const MODULE_INFO: Record<string, LockedModule> = {
  'the-call': {
    key: 'the-call',
    name: 'The Call',
    icon: Flame,
    color: 'text-orange-400',
  },
  'finance': {
    key: 'finance',
    name: 'Finance',
    icon: () => <span className="text-lg">💰</span>,
    color: 'text-amber-400',
  },
  'todo-list': {
    key: 'todo-list',
    name: 'To-Do',
    icon: ListTodo,
    color: 'text-cyan-400',
  },
  'journal': {
    key: 'journal',
    name: 'Journal',
    icon: BookOpen,
    color: 'text-indigo-400',
  },
  'track-health': {
    key: 'track-health',
    name: 'Health',
    icon: Heart,
    color: 'text-teal-400',
  },
  'wishlist': {
    key: 'wishlist',
    name: 'Wishlist',
    icon: ShoppingCart,
    color: 'text-primary',
  },
};

export function LockedModulesTeaser({ lockedModules, className }: LockedModulesTeaserProps) {
  const navigate = useNavigate();
  
  // Filter to only show known locked modules (max 3)
  const visibleModules = lockedModules
    .filter(key => MODULE_INFO[key])
    .slice(0, 3)
    .map(key => MODULE_INFO[key]);
  
  if (visibleModules.length === 0) {
    return null;
  }

  const remainingCount = lockedModules.length - visibleModules.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("relative group", className)}
    >
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl" />
      
      <div className="relative bg-card/20 backdrop-blur-xl border border-primary/20 rounded-lg overflow-hidden hover:border-primary/30 transition-all">
        <div className="p-4 flex items-center justify-between gap-4">
          {/* Locked icons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <Lock className="w-4 h-4 text-primary/40 mr-2" />
              {visibleModules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <div 
                    key={module.key}
                    className={cn(
                      "w-8 h-8 rounded-full bg-card/50 border border-primary/20 flex items-center justify-center",
                      index > 0 && "-ml-2"
                    )}
                    style={{ zIndex: visibleModules.length - index }}
                  >
                    {typeof Icon === 'function' && Icon.toString().includes('span') ? (
                      <Icon />
                    ) : (
                      <Icon className={cn("w-4 h-4", module.color)} />
                    )}
                  </div>
                );
              })}
              {remainingCount > 0 && (
                <div className="w-8 h-8 rounded-full bg-card/50 border border-primary/20 flex items-center justify-center -ml-2 text-xs text-primary/60 font-orbitron">
                  +{remainingCount}
                </div>
              )}
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs text-primary/70 font-orbitron uppercase tracking-wider">
                Unlock More
              </span>
              <span className="text-[10px] text-primary/50 font-rajdhani">
                {lockedModules.length} module{lockedModules.length > 1 ? 's' : ''} available
              </span>
            </div>
          </div>
          
          {/* CTA */}
          <Button
            onClick={() => navigate('/shop')}
            size="sm"
            variant="ghost"
            className="text-primary hover:text-primary hover:bg-primary/10 gap-1"
          >
            <span className="text-xs font-orbitron uppercase tracking-wider">Shop</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
