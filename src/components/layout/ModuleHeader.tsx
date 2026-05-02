import { ReactNode } from "react";
import { motion } from "framer-motion";
import { RotatingRing, HexBadge } from "@/components/journal/JournalDecorations";
import { useIsMobile } from "@/hooks/use-mobile";

export interface ModuleHeaderBadge {
  label: string;
  value: string | number;
  color: string;
}

interface ModuleHeaderProps {
  systemLabel: string;
  title: string;
  titleAccent: string;
  badges?: ModuleHeaderBadge[];
  children?: ReactNode;
}

export function ModuleHeader({ systemLabel, title, titleAccent, badges = [], children }: ModuleHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <motion.header
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={isMobile ? "pt-4 pb-3 text-center" : "pt-10 pb-8 text-center"}
    >
      {/* Rotating rings — desktop dark only */}
      {!isMobile && (
        <div className="relative inline-block mb-5">
          <div className="absolute -inset-10 pointer-events-none hidden dark:block">
            <RotatingRing size={120} color="#00ffe0" duration={20} dasharray="2 12" opacity={0.25} />
          </div>
          <div className="absolute -inset-5 pointer-events-none hidden dark:block">
            <RotatingRing size={80} color="#bf5af2" duration={14} reverse dasharray="4 6" opacity={0.2} />
          </div>
          {/* Central orb */}
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

      {/* System label */}
      <div className="flex items-center justify-center gap-3 mb-2 md:mb-4">
        <div className="flex-1 max-w-[120px] h-px bg-gradient-to-r from-transparent to-primary/25" />
        <span className="ds-text-label text-primary/60 md:text-primary/50">
          {systemLabel}
        </span>
        <div className="flex-1 max-w-[120px] h-px bg-gradient-to-r from-primary/25 to-transparent" />
      </div>

      {/* Title */}
      <h1 className="font-orbitron font-black text-[clamp(24px,5vw,48px)] tracking-[0.08em] leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-b from-foreground/95 to-foreground/50">
        {title}<span className="text-primary" style={{ filter: "drop-shadow(0 0 12px hsl(var(--primary)))" }}>{titleAccent}</span>
      </h1>

      {/* Stats hexagons */}
      {badges.length > 0 && (
        <div className="flex justify-center gap-4 md:gap-6 mt-4 md:mt-6 flex-wrap">
          {badges.map((b) => (
            <HexBadge key={b.label} label={b.label} value={b.value} color={b.color} />
          ))}
        </div>
      )}

      {/* Action slot */}
      {children && <div className="mt-4 md:mt-6 flex justify-center gap-3 flex-wrap">{children}</div>}
    </motion.header>
  );
}