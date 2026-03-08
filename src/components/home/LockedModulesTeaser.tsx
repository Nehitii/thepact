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
  'the-call': { key: 'the-call', name: 'The Call', icon: Flame, color: 'text-orange-400' },
  'finance': { key: 'finance', name: 'Finance', icon: () => <span className="text-lg">💰</span>, color: 'text-amber-400' },
  'todo-list': { key: 'todo-list', name: 'To-Do', icon: ListTodo, color: 'text-cyan-400' },
  'journal': { key: 'journal', name: 'Journal', icon: BookOpen, color: 'text-indigo-400' },
  'track-health': { key: 'track-health', name: 'Health', icon: Heart, color: 'text-teal-400' },
  'wishlist': { key: 'wishlist', name: 'Wishlist', icon: ShoppingCart, color: 'text-primary' },
};

export function LockedModulesTeaser({ lockedModules, className }: LockedModulesTeaserProps) {
  const navigate = useNavigate();
  
  const visibleModules = lockedModules
    .filter(key => MODULE_INFO[key])
    .slice(0, 3)
    .map(key => MODULE_INFO[key]);
  
  if (visibleModules.length === 0) return null;

  const remainingCount = lockedModules.length - visibleModules.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("relative group", className)}
    >
      <div
        className="relative bg-[var(--nexus-bg)] backdrop-blur-xl border border-[var(--nexus-border)] overflow-hidden hover:border-[var(--nexus-hover-border)] transition-all nexus-shadow"
        style={{ borderRadius: "4px" }}
      >
        <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top-subtle" />

        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <Lock className="w-4 h-4 text-[var(--nexus-text-dimmer)] mr-2" />
              {visibleModules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <div 
                    key={module.key}
                    className={cn(
                      "w-8 h-8 bg-[var(--nexus-inner-bg)] border border-[var(--nexus-border)] flex items-center justify-center",
                      index > 0 && "-ml-2"
                    )}
                    style={{ zIndex: visibleModules.length - index, borderRadius: "4px" }}
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
                <div
                  className="w-8 h-8 bg-[var(--nexus-inner-bg)] border border-[var(--nexus-border)] flex items-center justify-center -ml-2 text-xs text-[var(--nexus-text-dimmer)] font-mono"
                  style={{ borderRadius: "4px" }}
                >
                  +{remainingCount}
                </div>
              )}
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs text-[var(--nexus-text-dim)] font-orbitron uppercase tracking-[0.15em]">
                Unlock More
              </span>
              <span className="text-[10px] text-[var(--nexus-text-dimmer)] font-rajdhani">
                {lockedModules.length} module{lockedModules.length > 1 ? 's' : ''} available
              </span>
            </div>
          </div>
          
          <Button
            onClick={() => navigate('/shop')}
            size="sm"
            variant="ghost"
            className="text-primary hover:text-primary hover:bg-[var(--nexus-hover-bg)] gap-1"
          >
            <span className="text-xs font-orbitron uppercase tracking-[0.15em]">Shop</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
