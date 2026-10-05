import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-card/30 backdrop-blur border border-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 transition-all duration-1000 relative"
      style={{ 
        transform: `translateX(-${100 - (value || 0)}%)`,
        backgroundColor: 'var(--progress-background, hsl(var(--primary)))',
        boxShadow: '0 0 15px var(--progress-background, hsl(var(--primary)))80'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
