import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-xl border-[1.5px] px-4 py-3 text-base transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 resize-y relative z-20",
  {
    variants: {
      variant: {
        default: [
          "border-primary/50 bg-[hsl(210_80%_8%/0.9)] backdrop-blur-sm text-[hsl(205_100%_90%)]",
          "hover:border-primary/70 hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)] hover:bg-[hsl(210_80%_10%/0.95)]",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_20px_hsl(var(--primary)/0.4),0_0_40px_hsl(var(--primary)/0.15)] focus-visible:bg-[hsl(210_80%_10%/0.95)]",
          "placeholder:text-[hsl(200_60%_65%)] placeholder:opacity-80",
        ],
        light: [
          "border-border bg-white text-foreground",
          "hover:border-primary/50",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          "placeholder:text-muted-foreground",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
