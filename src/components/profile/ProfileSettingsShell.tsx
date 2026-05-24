import { ReactNode } from "react";
import { DSPageShell, DSBackground } from "@/components/ds";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProfileSettingsShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon: ReactNode;
  children: ReactNode;
  /** Optional floating elements (e.g. fixed overlays) rendered above the background. */
  floating?: ReactNode;
  /** Defaults to Shop-like width. */
  containerClassName?: string;
}

export function ProfileSettingsShell({
  title,
  subtitle,
  icon,
  children,
  floating,
  containerClassName,
}: ProfileSettingsShellProps) {
  return (
    <DSPageShell
      width="full"
      padding="tight"
      className={cn(
        "selection:bg-primary/30 !p-0",
      )}
      background={
        <>
          {/* Settings-specific deep navy floor preserved via background slot for visual fidelity */}
          <div className="absolute inset-0" style={{ background: "#03060A" }} />
          <DSBackground variant="cyber" />
        </>
      }
    >
      <div className={cn("page-px pt-8 md:pt-12 pb-6 max-w-5xl mx-auto", containerClassName)}>
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 text-center flex flex-col items-center"
        >
          {/* Halo & Icône centrale */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-full border border-primary/40 bg-black/50 backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
              {icon}
            </div>
          </div>

          {/* Sous-titre (Label Système) avec lignes de visée */}
          <div className="flex items-center justify-center gap-4 mb-4 w-full">
            <div className="flex-1 max-w-[80px] md:max-w-[160px] h-px bg-gradient-to-r from-transparent to-primary/50" />
            <span className="font-mono text-[10px] md:text-xs text-primary/70 tracking-[0.3em] uppercase">
              {subtitle || "SYSTEM CONFIGURATION"}
            </span>
            <div className="flex-1 max-w-[80px] md:max-w-[160px] h-px bg-gradient-to-l from-transparent to-primary/50" />
          </div>

          {/* Titre Principal Massif */}
          <h1 className="font-orbitron font-black text-3xl md:text-5xl tracking-[0.15em] uppercase text-white drop-shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
            {title}
          </h1>
        </motion.header>

        <section className="space-y-6 relative z-10">{children}</section>

        {floating ? <div className="relative z-20">{floating}</div> : null}
      </div>
    </DSPageShell>
  );
}
