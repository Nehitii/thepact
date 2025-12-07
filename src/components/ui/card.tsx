import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md border-2 border-primary/30 bg-card/90 text-card-foreground backdrop-blur-xl",
        "relative overflow-hidden",
        "shadow-lg",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-transparent before:pointer-events-none",
        "after:absolute after:inset-[-1px] after:rounded-md after:bg-gradient-to-br after:from-transparent after:via-primary/5 after:to-transparent after:pointer-events-none after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300",
        "transition-all duration-300 hover:border-primary/50",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 p-6 relative z-10",
        "border-b border-primary/20",
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-xl font-bold leading-none tracking-widest uppercase font-orbitron",
        "text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-primary",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "text-sm text-muted-foreground font-rajdhani tracking-wide",
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0 relative z-10", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0 relative z-10", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
