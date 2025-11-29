import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-orbitron backdrop-blur",
  {
    variants: {
      variant: {
        default: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60 shadow-[0_0_10px_rgba(91,180,255,0.3)]",
        secondary: "border-secondary/40 bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 hover:border-secondary/60",
        destructive: "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:border-destructive/60 shadow-[0_0_10px_rgba(239,68,68,0.3)]",
        outline: "border-primary/30 text-foreground hover:border-primary/50 backdrop-blur",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
