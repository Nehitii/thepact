import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-[48px] w-full rounded-[10px] border-2 border-[#3B82F6] bg-[#0C0F1A] px-4 py-3 text-base text-[#FFFFFF] transition-all duration-200 ease-out",
          "hover:border-[#60A5FA] hover:shadow-[0_0_8px_#3B82F6]",
          "focus-visible:outline-none focus-visible:border-[#60A5FA] focus-visible:shadow-[0_0_8px_#3B82F6]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white",
          "placeholder:text-[#8FA3C8]",
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
