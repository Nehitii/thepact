import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface HudActionButtonProps {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  className?: string;
}

export function HudActionButton({ label, icon: Icon, onClick, className }: HudActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-40 h-14 px-4",
        "border-[3px] border-primary rounded-md",
        "bg-transparent text-foreground",
        "font-bold text-sm font-orbitron uppercase tracking-wider",
        "cursor-pointer transition-all duration-300",
        "flex items-center justify-center gap-2",
        "hover:shadow-[inset_0_0_25px_hsl(var(--primary)/0.5)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      style={{
        borderStyle: 'ridge',
      }}
    >
      {/* Top pseudo-element overlay */}
      <span 
        className="absolute top-[-10px] left-[3%] w-[95%] h-[40%] bg-background transition-transform duration-500 origin-center hover-target-top"
        aria-hidden="true"
      />
      {/* Bottom pseudo-element overlay */}
      <span 
        className="absolute top-[80%] left-[3%] w-[95%] h-[40%] bg-background transition-transform duration-500 origin-center hover-target-bottom"
        aria-hidden="true"
      />
      
      {/* Content - always visible above overlays */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
      </span>
      
      {/* CSS for hover effects */}
      <style>{`
        button:hover .hover-target-top,
        button:hover .hover-target-bottom {
          transform: scale(0);
        }
      `}</style>
    </button>
  );
}
