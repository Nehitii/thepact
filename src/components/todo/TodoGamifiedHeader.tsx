import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Target, Zap, Shield, Crown, Activity } from "lucide-react";
import { TodoStats } from "@/hooks/useTodoList";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TodoGamifiedHeaderProps {
  stats: TodoStats | null;
  activeTaskCount: number;
  maxTasks: number;
}

// Système de rangs dynamiques
const GET_RANK_TITLE = (level: number) => {
  if (level >= 50) return { title: "Netrunner Legend", color: "text-amber-400" };
  if (level >= 30) return { title: "Cyber-Sentinel", color: "text-red-400" };
  if (level >= 20) return { title: "System Architect", color: "text-purple-400" };
  if (level >= 10) return { title: "Code Operative", color: "text-cyan-400" };
  if (level >= 5) return { title: "Data Scout", color: "text-emerald-400" };
  return { title: "Initiate", color: "text-slate-400" };
};

export function TodoGamifiedHeader({ stats, activeTaskCount, maxTasks }: TodoGamifiedHeaderProps) {
  const { t } = useTranslation();
  const score = stats?.score ?? 0;
  const streak = stats?.current_streak ?? 0;
  const longestStreak = stats?.longest_streak ?? 0;

  // Calculate level mechanics
  const level = Math.floor(score / 100) + 1;
  const currentXP = score % 100;
  const xpPercentage = currentXP; // Base 100

  const rank = useMemo(() => GET_RANK_TITLE(level), [level]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full"
    >
      {/* Container Principal "Glassmorphism Tech" */}
      <div className="relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* --- Background Effects --- */}
        {/* 1. Scanline Animation */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <motion.div
            className="w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent shadow-[0_0_15px_rgba(var(--primary),0.5)]"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* 2. Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* 3. Corner Accents (Decorations) */}
        <div className="absolute top-0 left-0 p-4 pointer-events-none">
          <div className="w-2 h-2 border-t-2 border-l-2 border-primary/60 rounded-tl-sm" />
        </div>
        <div className="absolute top-0 right-0 p-4 pointer-events-none">
          <div className="w-2 h-2 border-t-2 border-r-2 border-primary/60 rounded-tr-sm" />
        </div>
        <div className="absolute bottom-0 left-0 p-4 pointer-events-none">
          <div className="w-2 h-2 border-b-2 border-l-2 border-primary/60 rounded-bl-sm" />
        </div>
        <div className="absolute bottom-0 right-0 p-4 pointer-events-none">
          <div className="w-2 h-2 border-b-2 border-r-2 border-primary/60 rounded-br-sm" />
        </div>

        {/* --- CONTENT --- */}
        <div className="relative z-10 p-5 md:p-7 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* LEFT: Circular Level HUD */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Outer rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-full border border-dashed border-white/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />

              {/* SVG Progress Circle */}
              <svg className="w-full h-full -rotate-90 transform">
                {/* Track */}
                <circle cx="48" cy="48" r="40" className="stroke-white/5 fill-none" strokeWidth="6" />
                {/* Progress */}
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-primary fill-none drop-shadow-[0_0_8px_rgba(var(--primary),0.6)]"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: `${(xpPercentage / 100) * 251.2} 251.2` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>

              {/* Inner Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">LVL</span>
                <span className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{level}</span>
              </div>
            </div>

            {/* Rank Title */}
            <div
              className={cn(
                "text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-white/5 border border-white/5",
                rank.color,
              )}
            >
              {rank.title}
            </div>
          </div>

          {/* CENTER: XP Bar & Identity */}
          <div className="flex-1 w-full space-y-4">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-mono mb-1">CURRENT_OBJECTIVE // PROGRESS</span>
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>System Online</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-foreground tabular-nums">{currentXP}</span>
                <span className="text-xs text-muted-foreground ml-1">/ 100 XP</span>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-3 w-full flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 h-full rounded-[2px] bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    initial={{ width: "0%" }}
                    animate={{
                      width:
                        xpPercentage >= (i + 1) * 10
                          ? "100%"
                          : xpPercentage > i * 10
                            ? `${(xpPercentage % 10) * 10}%`
                            : "0%",
                    }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Stats Grid */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <StatChip
              icon={Target}
              label={t("todo.header.score")}
              value={score}
              color="text-cyan-400"
              borderColor="border-cyan-500/20"
              bgColor="bg-cyan-500/5"
            />
            <StatChip
              icon={Flame}
              label={t("todo.header.streak")}
              value={streak}
              color="text-orange-400"
              borderColor="border-orange-500/20"
              bgColor="bg-orange-500/5"
              animate={streak >= 3}
            />
            <StatChip
              icon={Trophy}
              label="Best"
              value={longestStreak}
              color="text-amber-400"
              borderColor="border-amber-500/20"
              bgColor="bg-amber-500/5"
            />
            <StatChip
              icon={Zap}
              label="Active"
              value={`${activeTaskCount}/${maxTasks}`}
              color="text-indigo-400"
              borderColor="border-indigo-500/20"
              bgColor="bg-indigo-500/5"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Sub-component for Stats ---

interface StatChipProps {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  borderColor: string;
  bgColor: string;
  animate?: boolean;
}

function StatChip({ icon: Icon, label, value, color, borderColor, bgColor, animate }: StatChipProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
      className={cn(
        "flex flex-col justify-center px-4 py-3 rounded-xl border backdrop-blur-sm min-w-[100px] relative overflow-hidden group",
        borderColor,
        bgColor,
      )}
    >
      <div className="flex items-center justify-between mb-1 relative z-10">
        <Icon className={cn("w-4 h-4", color, animate && "animate-bounce")} />
        {animate && <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping" />}
      </div>
      <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider relative z-10">
        {label}
      </span>
      <span className={cn("text-lg font-black tracking-tight relative z-10", color)}>{value}</span>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent z-0" />
    </motion.div>
  );
}
