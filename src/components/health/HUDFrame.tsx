import { cn } from "@/lib/utils";
import { ReactNode, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface HUDFrameProps {
  children: ReactNode;
  className?: string;
  scanLine?: boolean;
  glowColor?: string;
  active?: boolean;
}

const CLIP_PATH = "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)";

/* Inline SVG noise as data-URI (tiny, cached) */
const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

const bracketVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 0.9, scale: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function HUDFrame({ children, className, scanLine = false, glowColor, active = false }: HUDFrameProps) {
  const borderColor = glowColor || "hsl(var(--hud-phosphor))";
  const glowIntensity = active ? "25" : "15";
  const borderOpacity = active ? "cc" : "80";

  return (
    <div
      className={cn(
        "relative bg-hud-surface/80 backdrop-blur-md transition-all duration-300 group/hud",
        active && "ring-1 ring-hud-phosphor/30",
        className
      )}
      style={{
        clipPath: CLIP_PATH,
        boxShadow: `0 0 30px ${borderColor}${glowIntensity}`,
      }}
    >
      {/* Inner gradient for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: CLIP_PATH,
          background: `linear-gradient(180deg, ${borderColor}08 0%, transparent 40%)`,
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-soft-light"
        style={{
          clipPath: CLIP_PATH,
          backgroundImage: NOISE_BG,
          opacity: 0.025,
        }}
      />

      {/* Border overlay matching clip-path */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300 group-hover/hud:shadow-[inset_0_0_0_1px_currentColor]"
        style={{
          clipPath: CLIP_PATH,
          boxShadow: `inset 0 0 0 1px ${borderColor}${borderOpacity}, 0 0 25px ${borderColor}12`,
        }}
      />

      {/* Top edge highlight gradient */}
      <div
        className="absolute top-0 left-[16px] right-0 h-[1px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${borderColor}60, transparent)`,
        }}
      />

      {/* Animated corner brackets */}
      {[
        { pos: "top-0 left-[16px]", bT: "top", bL: "left" },
        { pos: "top-0 right-0", bT: "top", bL: "right" },
        { pos: "bottom-0 left-0", bT: "bottom", bL: "left" },
        { pos: "bottom-0 right-[16px]", bT: "bottom", bL: "right" },
      ].map(({ pos, bT, bL }, i) => (
        <motion.div
          key={i}
          className={cn("absolute w-6 h-6 pointer-events-none", pos)}
          variants={bracketVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: i * 0.06 }}
        >
          <div
            className={cn("absolute w-full h-[3px]", bT === "top" ? "top-0" : "bottom-0", bL === "left" ? "left-0" : "right-0")}
            style={{ background: borderColor, opacity: 0.9 }}
          />
          <div
            className={cn("absolute w-[3px] h-full", bT === "top" ? "top-0" : "bottom-0", bL === "left" ? "left-0" : "right-0")}
            style={{ background: borderColor, opacity: 0.9 }}
          />
        </motion.div>
      ))}

      {/* Scan line */}
      {scanLine && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute left-0 right-0 h-[2px] animate-hud-scan"
            style={{
              background: `linear-gradient(90deg, transparent, ${borderColor}80, transparent)`,
              boxShadow: `0 0 10px ${borderColor}60`,
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
