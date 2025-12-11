import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PactSettingsCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}

export function PactSettingsCard({
  icon,
  title,
  description,
  children
}: PactSettingsCardProps) {
  return (
    <div className="relative group">
      {/* Outer glow effect */}
      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
      
      {/* Main card */}
      <div className={cn(
        "relative backdrop-blur-xl border border-primary/40 rounded-xl",
        "bg-gradient-to-b from-[#0a1525]/95 to-[#050d18]/98",
        "transition-all duration-300 overflow-hidden",
        "hover:border-primary/60 hover:shadow-[0_0_30px_rgba(91,180,255,0.15)]"
      )}>
        {/* Inner border frame */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[1px] border border-primary/10 rounded-[11px]" />
        </div>
        
        {/* Subtle scan line effect */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(91,180,255,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
        
        {/* Header */}
        <div className="relative z-10 px-5 py-4 border-b border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(91,180,255,0.2)]">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-orbitron uppercase tracking-wider text-sm text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.6)]">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground/80 font-rajdhani mt-0.5 truncate">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-5 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
