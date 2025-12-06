import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-[1.5px] border-[hsl(210_80%_55%)] bg-[rgba(10,15,25,0.65)] backdrop-blur-sm px-4 py-3 text-base text-white transition-all duration-200 ease-out",
          "hover:border-[hsl(205_90%_60%)] hover:shadow-[0_0_12px_hsl(210_80%_55%/0.3)]",
          "focus-visible:outline-none focus-visible:border-[hsl(200_100%_70%)] focus-visible:shadow-[0_0_20px_hsl(200_100%_70%/0.4),0_0_40px_hsl(200_100%_70%/0.15)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
          "placeholder:text-[hsl(215_40%_50%)]",
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
