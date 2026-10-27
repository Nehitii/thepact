import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/socle/outils/utils";
import { jouerSon } from "@/socle/outils/son";

import { buttonVariants } from "./buttonVariants";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const onClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      // Respect opt-out
      const target = e.currentTarget as HTMLElement;
      const disableSound = target?.getAttribute?.("data-sound") === "off";
      if (!disableSound && !props.disabled) {
        jouerSon("ui", "soft");
      }
      props.onClick?.(e);
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        onClick={onClick}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
