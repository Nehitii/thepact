import { useState, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileMenuCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  variant?: "default" | "destructive" | "accent";
  defaultOpen?: boolean;
  onClick?: () => void;
  isClickOnly?: boolean;
}

export function ProfileMenuCard({
  icon,
  title,
  description,
  children,
  variant = "default",
  defaultOpen = false,
  onClick,
  isClickOnly = false,
}: ProfileMenuCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantStyles = {
    default: {
      glow: "bg-primary/5",
      border: "border-primary/30 hover:border-primary/50",
      bg: "bg-card/30",
      title: "text-primary",
      desc: "text-primary/60",
      shadow: "drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]",
      innerBorder: "border-primary/20",
    },
    destructive: {
      glow: "bg-destructive/5",
      border: "border-destructive/30 hover:border-destructive/50",
      bg: "bg-destructive/10",
      title: "text-destructive",
      desc: "text-destructive/60",
      shadow: "drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]",
      innerBorder: "border-destructive/20",
    },
    accent: {
      glow: "bg-accent/5",
      border: "border-accent/30 hover:border-accent/50",
      bg: "bg-accent/10",
      title: "text-accent",
      desc: "text-accent/60",
      shadow: "drop-shadow-[0_0_10px_rgba(147,197,253,0.5)]",
      innerBorder: "border-accent/20",
    },
  };

  const styles = variantStyles[variant];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (!isClickOnly) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative group animate-fade-in">
      {/* Outer glow */}
      <div className={cn(
        "absolute inset-0 rounded-lg blur-xl transition-all duration-300",
        styles.glow,
        isOpen && "blur-2xl"
      )} />
      
      {/* Main card */}
      <Card className={cn(
        "relative backdrop-blur-xl border-2 transition-all duration-300 overflow-hidden cursor-pointer",
        styles.border,
        styles.bg
      )}>
        {/* Inner border frame */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn(
            "absolute inset-[2px] border rounded-[6px]",
            styles.innerBorder
          )} />
        </div>
        
        {/* Scan line effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            "absolute w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent",
            isOpen && "animate-scan"
          )} />
        </div>

        {/* Header - Always visible, clickable */}
        <CardHeader 
          className="relative z-10 cursor-pointer select-none"
          onClick={handleClick}
        >
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              "flex items-center gap-3 font-orbitron uppercase tracking-wider text-lg",
              styles.title,
              styles.shadow
            )}>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                {icon}
              </div>
              {title}
            </CardTitle>
            {!isClickOnly && (
              <div className={cn(
                "p-1 rounded-full border transition-all duration-300",
                isOpen 
                  ? "bg-primary/20 border-primary/40" 
                  : "bg-card/50 border-primary/20"
              )}>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-primary" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-primary/60" />
                )}
              </div>
            )}
          </div>
          <CardDescription className={cn(
            "font-rajdhani mt-1 pl-14",
            styles.desc
          )}>
            {description}
          </CardDescription>
        </CardHeader>

        {/* Content - Expandable (only render if children exists) */}
        {children && (
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          )}>
            <CardContent className="relative z-10 pt-0 space-y-6">
              <div className="border-t border-primary/20 pt-6">
                {children}
              </div>
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  );
}
