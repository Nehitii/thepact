import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useSound } from "@/contexts/SoundContext";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-orbitron uppercase tracking-widest transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "rounded-sm bg-primary text-primary-foreground border-2 border-primary-glow shadow-[0_0_15px_rgba(91,180,255,0.4)] hover:shadow-[0_0_30px_rgba(91,180,255,0.6)] hover:bg-primary-glow before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        destructive:
          "rounded-sm bg-destructive text-destructive-foreground border-2 border-destructive shadow-[0_0_15px_rgba(var(--destructive)/0.4)] hover:shadow-[0_0_25px_rgba(var(--destructive)/0.6)] hover:bg-destructive/90",
        outline:
          "rounded-sm border-2 border-primary/50 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_20px_rgba(91,180,255,0.3)] text-foreground",
        secondary:
          "rounded-sm bg-secondary/80 text-secondary-foreground hover:bg-secondary backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(91,180,255,0.2)]",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground backdrop-blur-sm rounded-sm",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-glow hover:drop-shadow-[0_0_8px_rgba(91,180,255,0.6)]",
        hud: "rounded-lg bg-transparent border border-primary/40 text-primary backdrop-blur-md shadow-[0_0_12px_rgba(91,180,255,0.15),inset_0_1px_0_rgba(91,180,255,0.1)] hover:border-primary/70 hover:shadow-[0_0_20px_rgba(91,180,255,0.3),inset_0_1px_0_rgba(91,180,255,0.2)] hover:text-primary-glow active:scale-[0.98] before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-primary/5 before:to-transparent before:pointer-events-none",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const sound = useSound();
    const Comp = asChild ? Slot : "button";

    const onClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      // Respect opt-out
      const target = e.currentTarget as HTMLElement;
      const disableSound = target?.getAttribute?.("data-sound") === "off";
      if (!disableSound && !props.disabled) {
        sound.play("ui", "soft");
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

export { Button, buttonVariants };
