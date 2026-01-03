import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-11 w-full rounded-xl border-[1.5px] px-4 py-3 text-base transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium relative z-20",
  {
    variants: {
      variant: {
        default: [
          "border-primary/50 bg-[hsl(210_80%_8%/0.9)] backdrop-blur-sm text-[hsl(205_100%_90%)]",
          "hover:border-primary/70 hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)] hover:bg-[hsl(210_80%_10%/0.95)]",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_20px_hsl(var(--primary)/0.4),0_0_40px_hsl(var(--primary)/0.15)] focus-visible:bg-[hsl(210_80%_10%/0.95)]",
          "file:text-[hsl(205_100%_90%)]",
          "placeholder:text-[hsl(200_60%_65%)] placeholder:opacity-80",
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
