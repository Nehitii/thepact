import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface HUDFrameProps {
  children: ReactNode;
  className?: string;
  scanLine?: boolean;
  glowColor?: string;
}

const CLIP_PATH = "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)";

export function HUDFrame({ children, className, scanLine = false, glowColor }: HUDFrameProps) {
  const borderColor = glowColor || "hsl(var(--hud-phosphor))";

  return (
    <div
      className={cn(
        "relative bg-hud-surface/80 backdrop-blur-md transition-shadow duration-300 group/hud",
        className
      )}
      style={{
        clipPath: CLIP_PATH,
        boxShadow: `0 0 30px ${borderColor}15`,
      }}
    >
      {/* Border overlay matching clip-path */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300"
        style={{
          clipPath: CLIP_PATH,
          boxShadow: `inset 0 0 0 1px ${borderColor}80, 0 0 25px ${borderColor}12`,
        }}
      />

      {/* Top edge highlight gradient */}
      <div
        className="absolute top-0 left-[16px] right-0 h-[1px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${borderColor}60, transparent)`,
        }}
      />

      {/* Corner brackets - thicker (3px) and brighter */}
      <div className="absolute top-0 left-[16px] w-6 h-6 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: borderColor, opacity: 0.9 }} />
        <div className="absolute top-0 left-0 w-[3px] h-full" style={{ background: borderColor, opacity: 0.9 }} />
      </div>
      <div className="absolute top-0 right-0 w-6 h-6 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-[3px]" style={{ background: borderColor, opacity: 0.9 }} />
        <div className="absolute top-0 right-0 w-[3px] h-full" style={{ background: borderColor, opacity: 0.9 }} />
      </div>
      <div className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-[3px]" style={{ background: borderColor, opacity: 0.9 }} />
        <div className="absolute bottom-0 left-0 w-[3px] h-full" style={{ background: borderColor, opacity: 0.9 }} />
      </div>
      <div className="absolute bottom-0 right-[16px] w-6 h-6 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-full h-[3px]" style={{ background: borderColor, opacity: 0.9 }} />
        <div className="absolute bottom-0 right-0 w-[3px] h-full" style={{ background: borderColor, opacity: 0.9 }} />
      </div>

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
