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
  return <div className="relative group">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-xl blur-xl bg-primary/5 transition-all duration-300" />
      
      {/* Main card */}
      <div className={cn("relative backdrop-blur-xl border-2 border-primary/30 rounded-xl", "bg-card/40 transition-all duration-300 overflow-hidden", "hover:border-primary/50")}>
        {/* Inner border frame */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/15 rounded-[10px]" />
        </div>
        
        {/* Header */}
        <div className="relative z-10 p-5 border-b border-primary/20 bg-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/25">
              {icon}
            </div>
            <div>
            <h3 className="font-orbitron uppercase tracking-wider text-base text-primary">
              {title}
            </h3>
              <p className="text-sm text-primary/60 font-rajdhani mt-0.5">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-5 space-y-5">
          {children}
        </div>
      </div>
    </div>;
}