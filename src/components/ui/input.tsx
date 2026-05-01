import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-10 w-full rounded-sm border px-3.5 py-2.5 text-sm transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium relative z-20",
  {
    variants: {
      variant: {
        default: [
          "border-[hsl(var(--ds-border-default)/0.35)] bg-[hsl(var(--ds-surface-2)/0.65)] backdrop-blur-sm text-[hsl(var(--ds-text-primary))]",
          "hover:border-[hsl(var(--ds-accent-primary)/0.55)] hover:bg-[hsl(var(--ds-surface-2)/0.85)]",
          "focus-visible:outline-none focus-visible:border-[hsl(var(--ds-accent-primary))] focus-visible:shadow-[var(--ds-glow-focus)] focus-visible:bg-[hsl(var(--ds-surface-2)/0.9)]",
          "file:text-[hsl(var(--ds-text-primary))]",
          "placeholder:text-[hsl(var(--ds-text-muted)/0.7)]",
        ],
        light: [
          "border-border bg-white text-foreground",
          "hover:border-primary/50",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          "file:text-foreground",
          "placeholder:text-muted-foreground",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
