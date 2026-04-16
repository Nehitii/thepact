import { motion } from "framer-motion";
import { Wind, Calendar, Settings, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthStreak } from "@/hooks/useHealthStreak";
import { useTranslation } from "react-i18next";

interface HealthTacticalReadoutProps {
  onBreathing: () => void;
  onCheckin: () => void;
  onSettings: () => void;
  lastSync: string;
  score: number;
}

export function HealthTacticalReadout({
  onBreathing,
  onCheckin,
  onSettings,
  lastSync,
  score,
}: HealthTacticalReadoutProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: streak } = useHealthStreak(user?.id);
  const currentStreak = streak?.current_streak ?? 0;

  // Status indicators
  const indicators = [
    { label: "BIO_LINK", active: true, color: "bg-hud-phosphor" },
    { label: "TELEMETRY", active: true, color: "bg-hud-phosphor" },
    {
      label: "VITALS",
      active: score >= 50,
      color: score >= 80 ? "bg-hud-phosphor" : score >= 50 ? "bg-hud-amber" : "bg-destructive",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="relative rounded-xl bg-hud-surface/50 backdrop-blur-md border border-hud-phosphor/20 px-4 py-2.5"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: status indicators */}
        <div className="flex items-center gap-3 flex-wrap">
          {indicators.map((ind) => (
            <div key={ind.label} className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${ind.color} ${ind.active ? "animate-pulse" : "opacity-30"}`}
                style={{
                  boxShadow: ind.active
                    ? `0 0 6px hsl(var(--hud-phosphor))`
                    : "none",
                }}
              />
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">
                {ind.label}
              </span>
            </div>
          ))}
        </div>

        {/* Center: streak (hero metric) */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-hud-amber/5 border border-hud-amber/20">
          <Flame className="w-3.5 h-3.5 text-hud-amber" style={{ filter: "drop-shadow(0 0 6px hsl(var(--hud-amber)))" }} />
          <span className="font-orbitron font-bold text-sm text-hud-amber tabular-nums">
            {currentStreak}
          </span>
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">
            DAY{currentStreak !== 1 ? "S" : ""}
          </span>
        </div>

        {/* Right: actions + last sync */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 mr-2">
            SYNC {lastSync}
          </span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBreathing}
                  className="h-8 w-8 text-hud-phosphor hover:bg-hud-phosphor/10 rounded-lg"
                  aria-label={t("health.breathing.title")}
                >
                  <Wind className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="font-mono text-xs">{t("health.breathing.title").toUpperCase()}</span>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCheckin}
                  className="h-8 w-8 text-hud-phosphor hover:bg-hud-phosphor/10 rounded-lg"
                  aria-label={t("health.dailyCheckin")}
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="font-mono text-xs">{t("health.dailyCheckin").toUpperCase()}</span>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSettings}
                  className="h-8 w-8 text-muted-foreground hover:text-hud-phosphor hover:bg-hud-phosphor/10 rounded-lg"
                  aria-label={t("health.settings.title")}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="font-mono text-xs">{t("health.settings.title").toUpperCase()}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
}
