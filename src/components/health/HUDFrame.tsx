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
        "relative bg-hud-surface/80 backdrop-blur-md",
        className
      )}
      style={{ clipPath: CLIP_PATH }}
    >
      {/* Border overlay matching clip-path */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: CLIP_PATH,
          boxShadow: `inset 0 0 0 1px ${borderColor}40, 0 0 20px ${borderColor}10`,
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-0 left-[16px] w-5 h-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: borderColor }} />
        <div className="absolute top-0 left-0 w-[2px] h-full" style={{ background: borderColor }} />
      </div>
      <div className="absolute top-0 right-0 w-5 h-5 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-[2px]" style={{ background: borderColor }} />
        <div className="absolute top-0 right-0 w-[2px] h-full" style={{ background: borderColor }} />
      </div>
      <div className="absolute bottom-0 left-0 w-5 h-5 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ background: borderColor }} />
        <div className="absolute bottom-0 left-0 w-[2px] h-full" style={{ background: borderColor }} />
      </div>
      <div className="absolute bottom-0 right-[16px] w-5 h-5 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-full h-[2px]" style={{ background: borderColor }} />
        <div className="absolute bottom-0 right-0 w-[2px] h-full" style={{ background: borderColor }} />
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
