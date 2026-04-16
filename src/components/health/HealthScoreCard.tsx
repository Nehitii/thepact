import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { HUDFrame } from "./HUDFrame";
import { HealthECGLine } from "./HealthECGLine";

interface HealthScoreCardProps {
  score: number;
  trend: "up" | "down" | "stable";
  factors: string[];
}

function getStatusInfo(score: number) {
  if (score >= 80)
    return {
      text: "OPTIMAL",
      code: "[200 OK]",
      color: "text-hud-phosphor",
      glow: "hsl(var(--hud-phosphor))",
      bpm: 72,
    };
  if (score >= 50)
    return {
      text: "ATTENTION",
      code: "[206 PARTIAL]",
      color: "text-hud-amber",
      glow: "hsl(var(--hud-amber))",
      bpm: 88,
    };
  return {
    text: "CRITICAL",
    code: "[503 DEGRADED]",
    color: "text-destructive",
    glow: "hsl(var(--destructive))",
    bpm: 104,
  };
}

export function HealthScoreCard({ score, trend, factors }: HealthScoreCardProps) {
  const { t } = useTranslation();
  const status = getStatusInfo(score);

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-hud-phosphor" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-hud-amber" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const circumference60 = 2 * Math.PI * 60;
  const circumference72 = 2 * Math.PI * 72;
  const circumference84 = 2 * Math.PI * 84;

  // Orbital particles around the disk
  const particles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        angle: (i / 6) * 360,
        delay: i * 0.3,
      })),
    []
  );

  return (
    <HUDFrame className="p-6 lg:p-8" variant="hero" scanLine active={score >= 80} glowColor={status.glow}>
      <div className="relative flex flex-col lg:flex-row items-center gap-8">
        {/* === LEFT: Holographic radar disk === */}
        <div className="relative flex-shrink-0 w-56 h-56">
          {/* Heartbeat pulse rings */}
          <motion.div
            className="absolute inset-0 rounded-full border border-hud-phosphor/15 motion-reduce:hidden"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.05, 0.4] }}
            transition={{
              duration: score >= 80 ? 1.2 : score >= 50 ? 1.8 : 2.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ borderColor: status.glow }}
          />
          <motion.div
            className="absolute inset-3 rounded-full border motion-reduce:hidden"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.05, 0.3] }}
            transition={{
              duration: score >= 80 ? 1.2 : score >= 50 ? 1.8 : 2.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
            style={{ borderColor: status.glow }}
          />

          {/* Orbital particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full motion-reduce:hidden"
              style={{
                background: status.glow,
                boxShadow: `0 0 6px ${status.glow}`,
                transformOrigin: "center",
              }}
              animate={{
                rotate: [p.angle, p.angle + 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
                delay: p.delay,
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: "4px",
                  height: "4px",
                  background: status.glow,
                  boxShadow: `0 0 8px ${status.glow}`,
                  transform: `translateX(98px)`,
                }}
              />
            </motion.div>
          ))}

          {/* Tick marks */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 224 224">
            {Array.from({ length: 24 }, (_, i) => {
              const angle = (i / 24) * 360 - 90;
              const isMajor = i % 6 === 0;
              const inner = isMajor ? 100 : 104;
              const outer = 110;
              const x1 = 112 + Math.cos((angle * Math.PI) / 180) * inner;
              const y1 = 112 + Math.sin((angle * Math.PI) / 180) * inner;
              const x2 = 112 + Math.cos((angle * Math.PI) / 180) * outer;
              const y2 = 112 + Math.sin((angle * Math.PI) / 180) * outer;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={status.glow}
                  strokeWidth={isMajor ? "1.5" : "0.8"}
                  opacity={isMajor ? "0.5" : "0.25"}
                />
              );
            })}
          </svg>

          {/* Inner SVG rings */}
          <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]" viewBox="0 0 200 200">
            {/* Background rings */}
            <circle cx="100" cy="100" r="60" fill="none" stroke={status.glow} strokeWidth="3" opacity="0.08" />
            <circle cx="100" cy="100" r="72" fill="none" stroke={status.glow} strokeWidth="2" opacity="0.06" />
            <circle cx="100" cy="100" r="84" fill="none" stroke={status.glow} strokeWidth="2" opacity="0.04" />

            {/* Score ring (filled by score) */}
            <motion.circle
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke={status.glow}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference60}
              initial={{ strokeDashoffset: circumference60 }}
              animate={{ strokeDashoffset: circumference60 - (circumference60 * score) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              transform="rotate(-90 100 100)"
              style={{ filter: `drop-shadow(0 0 8px ${status.glow})` }}
            />

            {/* Decorative ring 2 */}
            <motion.circle
              cx="100"
              cy="100"
              r="72"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${circumference72 * 0.3} ${circumference72 * 0.05}`}
              initial={{ strokeDashoffset: circumference72 }}
              animate={{ strokeDashoffset: circumference72 * 0.3 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              transform="rotate(-90 100 100)"
            />

            {/* Rotating outer ring */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 100px" }}
            >
              <circle
                cx="100"
                cy="100"
                r="84"
                fill="none"
                stroke={status.glow}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${circumference84 * 0.18} ${circumference84 * 0.08} ${circumference84 * 0.12} ${circumference84 * 0.62}`}
                transform="rotate(-90 100 100)"
              />
            </motion.g>
          </svg>

          {/* Center: number + mini ECG */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.span
              className="font-orbitron font-bold text-5xl tabular-nums leading-none"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{ color: status.glow, textShadow: `0 0 16px ${status.glow}` }}
            >
              {score}
            </motion.span>
            <p className="text-[9px] text-muted-foreground/70 uppercase tracking-[0.25em] font-mono mt-1">
              VITA INDEX
            </p>
            {/* Mini ECG inside */}
            <div className="w-20 mt-1.5">
              <HealthECGLine
                score={score}
                color={status.glow}
                variant="mini"
                showPulse={false}
                grid={false}
              />
            </div>
          </div>
        </div>

        {/* === RIGHT: Telemetry details === */}
        <div className="flex-1 text-center lg:text-left space-y-4 w-full">
          {/* Status header */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span
                className={cn("w-2 h-2 rounded-full", status.color.replace("text-", "bg-"))}
                style={{ boxShadow: `0 0 8px ${status.glow}` }}
              />
              <span className={cn("font-orbitron font-bold text-lg tracking-widest", status.color)}>
                {status.text}
              </span>
              <span className={cn("font-mono text-[10px] tracking-widest", status.color, "opacity-70")}>
                {status.code}
              </span>
            </div>
            <div className="hidden lg:block w-px h-5 bg-hud-phosphor/20" />
            <div className="flex items-center justify-center lg:justify-start gap-2">
              {getTrendIcon()}
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">
                {t("health.scores.weeklyAverage")}
              </span>
            </div>
          </div>

          {/* Telemetry stats grid */}
          <div className="grid grid-cols-3 gap-2 text-left">
            <div className="border border-hud-phosphor/10 rounded-lg p-2 bg-background/40">
              <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">
                BPM
              </p>
              <p
                className="font-orbitron font-bold text-base tabular-nums"
                style={{ color: status.glow, textShadow: `0 0 8px ${status.glow}` }}
              >
                {status.bpm}
              </p>
            </div>
            <div className="border border-hud-phosphor/10 rounded-lg p-2 bg-background/40">
              <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">
                TREND
              </p>
              <p className="font-orbitron font-bold text-base text-foreground uppercase">
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}{" "}
                <span className="text-xs">{trend}</span>
              </p>
            </div>
            <div className="border border-hud-phosphor/10 rounded-lg p-2 bg-background/40">
              <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">
                FACTORS
              </p>
              <p className="font-orbitron font-bold text-base text-foreground tabular-nums">
                {factors.length || "—"}
              </p>
            </div>
          </div>

          {/* Factors badges */}
          {factors.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 justify-center lg:justify-start">
              {factors.map((factor, i) => (
                <motion.span
                  key={factor}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="px-2.5 py-1 text-[10px] font-medium font-mono uppercase tracking-wider bg-hud-phosphor/10 text-hud-phosphor border border-hud-phosphor/20 rounded-md"
                >
                  <Sparkles className="w-2.5 h-2.5 inline mr-1" />
                  {factor}
                </motion.span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 font-mono uppercase tracking-wider">
              {t("health.dailyCheckin")} → {t("health.scores.healthScore")}
            </p>
          )}
        </div>
      </div>
    </HUDFrame>
  );
}
