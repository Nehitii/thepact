import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-[1.5px] border-primary/50 bg-[hsl(210_80%_8%/0.9)] backdrop-blur-sm px-4 py-3 text-base text-foreground transition-all duration-200 ease-out",
          "hover:border-primary/70 hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)] hover:bg-[hsl(210_80%_10%/0.95)]",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_20px_hsl(var(--primary)/0.4),0_0_40px_hsl(var(--primary)/0.15)] focus-visible:bg-[hsl(210_80%_10%/0.95)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-[hsl(200_60%_65%)] placeholder:opacity-80",
          "relative z-20",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
