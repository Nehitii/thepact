import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

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
    <div className="relative">
      <Card variant="clean" className={cn("shop-card bg-card/70 border-primary/20 overflow-hidden")}> 
        <div className="px-5 py-4 border-b border-primary/15 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-orbitron uppercase tracking-wider text-sm text-primary">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground font-rajdhani mt-0.5 truncate">
                {description}
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </Card>
    </div>
  );
}
