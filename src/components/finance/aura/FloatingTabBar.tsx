import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface TabItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface FloatingTabBarProps {
  items: TabItem[];
  active: string;
  onChange: (v: string) => void;
  rightSlot?: React.ReactNode;
}

export function FloatingTabBar({ items, active, onChange, rightSlot }: FloatingTabBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="sticky top-2 z-30"
    >
      <div className="aura-glass flex items-center gap-1 p-1.5 mx-auto max-w-3xl">
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
          {items.map((item) => {
            const isActive = active === item.value;
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => onChange(item.value)}
                className={`relative flex-1 min-w-fit flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-[14px] text-xs sm:text-sm font-medium transition-colors duration-200 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground/70 hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="aura-tab-bg"
                    className="absolute inset-0 rounded-[14px]"
                    style={{
                      background:
                        'linear-gradient(135deg, hsl(var(--aura-electric) / 0.12), hsl(var(--aura-mint) / 0.08))',
                      boxShadow:
                        '0 0 0 1px hsl(var(--aura-electric) / 0.25) inset, 0 0 18px hsl(var(--aura-mint) / 0.18)',
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {isActive && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--aura-mint))]"
                      style={{ boxShadow: '0 0 8px hsl(var(--aura-mint))' }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </button>
            );
          })}
        </div>
        {rightSlot && (
          <div className="flex items-center gap-0.5 pl-1.5 ml-1.5 border-l border-white/[0.06] shrink-0">
            {rightSlot}
          </div>
        )}
      </div>
    </motion.div>
  );
}
