import { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { RotatingRing, HexBadge } from "@/components/journal/JournalDecorations";
import { useIsMobile } from "@/hooks/use-mobile";

export interface DSPageHeaderBadge {
  label: string;
  value: string | number;
  color?: string;
}

interface DSPageHeaderProps {
  variant?: "hud" | "sober";
  systemLabel?: string;
  icon?: LucideIcon;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  badges?: DSPageHeaderBadge[];
  actions?: ReactNode;
}

export function DSPageHeader({
  variant = "hud",
  systemLabel,
  icon: Icon,
  title,
  titleAccent,
  subtitle,
  badges = [],
  actions,
}: DSPageHeaderProps) {
  const isMobile = useIsMobile();

  if (variant === "sober") {
    return (
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6 md:mb-8">
        <div className="flex flex-col gap-1.5">
          {systemLabel && (
            <div className="flex items-center gap-2 text-[10px] font-orbitron uppercase tracking-[0.3em] text-muted-foreground/60">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              <span>{systemLabel}</span>
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            {title}
            {titleAccent && <span className="text-primary">{titleAccent}</span>}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
          )}
        </div>
        {(actions || badges.length > 0) && (
          <div className="flex items-center gap-3 flex-wrap">
            {badges.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {badges.map((b) => (
                  <div
                    key={b.label}
                    className="px-2.5 py-1 rounded-md border border-border/60 bg-card/50 text-xs"
                    style={b.color ? { color: b.color, borderColor: `${b.color}40` } : undefined}
                  >
                    <span className="text-muted-foreground mr-1.5 uppercase tracking-wider text-[10px]">
                      {b.label}
                    </span>
                    <span className="font-medium tabular-nums">{b.value}</span>
                  </div>
                ))}
              </div>
            )}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
      </header>
    );
  }

  // HUD variant — original ModuleHeader visuals
  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={isMobile ? "pt-4 pb-3 text-center" : "pt-10 pb-8 text-center"}
    >
      {!isMobile && (
        <div className="relative inline-block mb-5">
          <div className="absolute -inset-10 pointer-events-none hidden dark:block">
            <RotatingRing size={120} color="#00ffe0" duration={20} dasharray="2 12" opacity={0.25} />
          </div>
          <div className="absolute -inset-5 pointer-events-none hidden dark:block">
            <RotatingRing size={80} color="#bf5af2" duration={14} reverse dasharray="4 6" opacity={0.2} />
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto border border-primary/40 bg-primary/10"
            style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.2), inset 0 0 10px hsl(var(--primary) / 0.05)" }}
          >
            <div
              className="w-2 h-2 rounded-full bg-primary"
              style={{ boxShadow: "0 0 10px hsl(var(--primary))", animation: "journal-pulse 2.5s ease-in-out infinite" }}
            />
          </div>
        </div>
      )}

      {systemLabel && (
        <div className="flex items-center justify-center gap-3 mb-2 md:mb-4">
          <div className="flex-1 max-w-[120px] h-px bg-gradient-to-r from-transparent to-primary/25" />
          <span className="ds-text-label text-primary/60 md:text-primary/50">{systemLabel}</span>
          <div className="flex-1 max-w-[120px] h-px bg-gradient-to-r from-primary/25 to-transparent" />
        </div>
      )}

      <h1 className="font-orbitron font-black text-[clamp(24px,5vw,48px)] tracking-[0.08em] leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-b from-foreground/95 to-foreground/50">
        {title}
        {titleAccent && (
          <span className="text-primary" style={{ filter: "drop-shadow(0 0 12px hsl(var(--primary)))" }}>
            {titleAccent}
          </span>
        )}
      </h1>

      {subtitle && (
        <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">{subtitle}</p>
      )}

      {badges.length > 0 && (
        <div className="flex justify-center gap-4 md:gap-6 mt-4 md:mt-6 flex-wrap">
          {badges.map((b) => (
            <HexBadge key={b.label} label={b.label} value={b.value} color={b.color ?? "hsl(var(--primary))"} />
          ))}
        </div>
      )}

      {actions && <div className="mt-4 md:mt-6 flex justify-center gap-3 flex-wrap">{actions}</div>}
    </motion.header>
  );
}