import { ReactNode } from "react";
import { CyberBackground } from "@/components/CyberBackground";
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
    <div className="min-h-screen bg-[#03060A] relative overflow-hidden selection:bg-[#00F2FF]/30">
      <CyberBackground />

      <div className={cn("relative z-10 page-px pt-8 md:pt-12 pb-6 max-w-5xl mx-auto", containerClassName)}>
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 text-center flex flex-col items-center"
        >
          {/* Halo & Icône centrale */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-[#00F2FF]/20 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-full border border-[#00F2FF]/40 bg-black/50 backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.15)]">
              {icon}
            </div>
          </div>

          {/* Sous-titre (Label Système) avec lignes de visée */}
          <div className="flex items-center justify-center gap-4 mb-4 w-full">
            <div className="flex-1 max-w-[80px] md:max-w-[160px] h-px bg-gradient-to-r from-transparent to-[#00F2FF]/50" />
            <span className="font-mono text-[10px] md:text-xs text-[#00F2FF]/70 tracking-[0.3em] uppercase">
              {subtitle || "SYSTEM CONFIGURATION"}
            </span>
            <div className="flex-1 max-w-[80px] md:max-w-[160px] h-px bg-gradient-to-l from-transparent to-[#00F2FF]/50" />
          </div>

          {/* Titre Principal Massif */}
          <h1 className="font-orbitron font-black text-3xl md:text-5xl tracking-[0.15em] uppercase text-white drop-shadow-[0_0_15px_rgba(0,242,255,0.4)]">
            {title}
          </h1>
        </motion.header>

        <main className="space-y-6 relative z-10">{children}</main>
      </div>

      {floating ? <div className="relative z-20">{floating}</div> : null}
    </div>
  );
}
