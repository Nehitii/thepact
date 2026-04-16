import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayHealth } from "@/hooks/useHealth";
import { format } from "date-fns";
import { Activity } from "lucide-react";
import { HealthECGLine } from "./HealthECGLine";

interface HealthVitalCoreHeroProps {
  score: number;
}

/**
 * VITA CORE — signature hero with live ECG running across full width.
 * Replaces the generic ModuleHeader to give /health a unique identity.
 */
export function HealthVitalCoreHero({ score }: HealthVitalCoreHeroProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: today } = useTodayHealth(user?.id);

  // Live clock for "LAST_PULSE"
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Subject ID from user (deterministic short hash)
  const subjectId = user?.id ? user.id.slice(0, 8).toUpperCase() : "ANON-0000";
  const sessionId = format(new Date(), "yyMMdd") + "-" + (user?.id?.slice(-4).toUpperCase() ?? "0000");

  // Score → BPM display value
  const bpm = score >= 80 ? 72 : score >= 50 ? 88 : 104;
  const bioSign =
    score >= 80
      ? { label: "STABLE", color: "text-hud-phosphor", dot: "bg-hud-phosphor" }
      : score >= 50
        ? { label: "ELEVATED", color: "text-hud-amber", dot: "bg-hud-amber" }
        : { label: "DEGRADED", color: "text-destructive", dot: "bg-destructive" };

  const ecgColor =
    score >= 80
      ? "hsl(var(--hud-phosphor))"
      : score >= 50
        ? "hsl(var(--hud-amber))"
        : "hsl(var(--destructive))";

  return (
    <motion.section
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full"
    >
      {/* Top tactical bar */}
      <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 px-1">
        <div className="flex items-center gap-3">
          <span className="text-hud-phosphor/80">VITA_CORE</span>
          <span className="text-muted-foreground/40">::</span>
          <span>v3.0.1</span>
          <span className="text-muted-foreground/40">::</span>
          <span className="hidden sm:inline">SUBJECT_ID {subjectId}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline">SESSION {sessionId}</span>
          <span className="text-muted-foreground/40">::</span>
          <span className="text-hud-phosphor/80 tabular-nums">{format(now, "HH:mm:ss")}</span>
        </div>
      </div>

      {/* ECG hero strip */}
      <div className="relative rounded-2xl overflow-hidden border border-hud-phosphor/20 bg-hud-surface/60 backdrop-blur-md">
        {/* Top edge highlight */}
        <div
          className="absolute top-0 left-4 right-4 h-[1px] z-10"
          style={{ background: `linear-gradient(90deg, transparent, ${ecgColor}, transparent)` }}
        />

        <div className="relative grid grid-cols-12 gap-0 items-stretch">
          {/* Left vital readout */}
          <div className="col-span-12 sm:col-span-3 lg:col-span-2 p-4 sm:border-r border-hud-phosphor/10 flex flex-col justify-center gap-1">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60">
              BIO_SIGN
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${bioSign.dot}`} style={{ boxShadow: `0 0 8px ${ecgColor}` }} />
              <span className={`font-orbitron font-bold text-sm tracking-wider ${bioSign.color}`}>
                {bioSign.label}
              </span>
            </div>
          </div>

          {/* ECG line — center */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-7 relative min-h-[80px] flex items-center">
            <HealthECGLine
              score={score}
              color={ecgColor}
              variant="hero"
              grid={false}
              showPulse
              className="w-full"
            />
            {/* Title overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h1 className="font-orbitron font-black text-2xl sm:text-3xl lg:text-4xl tracking-[0.15em] text-foreground/30 whitespace-nowrap">
                VITA<span style={{ color: ecgColor, filter: `drop-shadow(0 0 12px ${ecgColor})` }}>·</span>CORE
              </h1>
            </div>
          </div>

          {/* Right BPM readout */}
          <div className="col-span-12 sm:col-span-3 p-4 sm:border-l border-hud-phosphor/10 flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60">
                BPM
              </span>
              <Activity className="w-3 h-3" style={{ color: ecgColor }} />
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={bpm}
                initial={{ opacity: 0.5, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="font-orbitron font-bold text-2xl tabular-nums"
                style={{ color: ecgColor, textShadow: `0 0 12px ${ecgColor}` }}
              >
                {bpm}
              </motion.span>
              <span className="text-[10px] font-mono text-muted-foreground/50 uppercase">/min</span>
            </div>
          </div>
        </div>

        {/* Bottom telemetry strip */}
        <div className="border-t border-hud-phosphor/10 px-4 py-1.5 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-hud-phosphor animate-pulse" />
              TELEMETRY ACTIVE
            </span>
            <span className="text-muted-foreground/30 hidden sm:inline">::</span>
            <span className="hidden sm:inline">
              LAST_ENTRY {today?.created_at ? format(new Date(today.created_at), "HH:mm") : "—"}
            </span>
          </div>
          <span className="text-hud-phosphor/60">[200 OK]</span>
        </div>
      </div>
    </motion.section>
  );
}
