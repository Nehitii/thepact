import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { cn } from "@/lib/utils";

export interface AvatarFrameProps {
  avatarUrl?: string | null;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  frameImage?: string | null;
  borderColor?: string;
  glowColor?: string;
  className?: string;
  showFallbackOnError?: boolean;
  frameScale?: number;
  frameOffsetX?: number;
  frameOffsetY?: number;
}

const sizeClasses = {
  sm: { container: "w-12 h-12", avatar: "w-10 h-10", frame: "w-14 h-14", inset: "-1", frameThickness: 2 },
  md: { container: "w-16 h-16", avatar: "w-14 h-14", frame: "w-20 h-20", inset: "-2", frameThickness: 3 },
  lg: { container: "w-24 h-24", avatar: "w-20 h-20", frame: "w-28 h-28", inset: "-2", frameThickness: 4 },
  xl: { container: "w-32 h-32", avatar: "w-28 h-28", frame: "w-36 h-36", inset: "-2", frameThickness: 5 },
};

/**
 * AvatarFrame - A layered avatar component where the frame has visual priority
 * 
 * Structure:
 * - Container (relative positioning)
 * - Avatar image (z-index: 1, slightly inset)
 * - Frame overlay (z-index: 2, may extend beyond avatar)
 */
export function AvatarFrame({
  avatarUrl,
  fallback = "?",
  size = "lg",
  frameImage,
  borderColor = "#5bb4ff",
  glowColor = "rgba(91,180,255,0.5)",
  className,
  showFallbackOnError = true,
  frameScale = 1,
  frameOffsetX = 0,
  frameOffsetY = 0,
}: AvatarFrameProps) {
  const [frameError, setFrameError] = useState(false);
  const sizeConfig = sizeClasses[size];

  // If frame image fails to load, fall back to border-based frame
  const hasValidFrameImage = frameImage && !frameError;

  return (
    <div 
      className={cn("relative flex items-center justify-center", className)}
      style={{ 
        width: sizeConfig.frame.replace('w-', '').replace('h-', ''),
      }}
    >
      {/* Glow effect - bottom layer */}
      <div 
        className="absolute inset-0 rounded-full blur-md opacity-60 transition-all duration-300"
        style={{
          backgroundColor: glowColor,
          transform: "scale(1.1)",
        }}
      />
      
      {/* Avatar container - middle layer */}
      <div className="relative z-10 flex items-center justify-center">
        {/* Avatar image with border fallback if no frame image */}
        <div
          className="relative rounded-full overflow-hidden"
          style={{
            boxShadow: hasValidFrameImage 
              ? "none" 
              : `0 0 20px ${glowColor}, inset 0 0 20px ${glowColor}`,
            border: hasValidFrameImage ? "none" : `${sizeConfig.frameThickness}px solid ${borderColor}`,
          }}
        >
          <Avatar className={cn(sizeConfig.avatar)}>
            <AvatarImage 
              src={avatarUrl || undefined} 
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/20 text-primary font-orbitron">
              {fallback.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Frame overlay - top layer (if frame image exists) */}
      {hasValidFrameImage && (
        <div 
          className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
          style={{ 
            transform: `scale(${1.15 * frameScale}) translate(${frameOffsetX}px, ${frameOffsetY}px)`,
          }}
        >
          <img
            src={frameImage}
            alt="Avatar frame"
            className="w-full h-full object-contain"
            onError={() => {
              console.warn("Frame image failed to load:", frameImage);
              setFrameError(true);
            }}
          />
        </div>
      )}

      {/* Decorative ring - animated */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none opacity-40 z-10"
        style={{ 
          border: `1px dashed ${borderColor}40`,
          animation: "spin 20s linear infinite",
          transform: "scale(1.2)",
        }}
      />
    </div>
  );
}

/**
 * Simple frame preview for shop displays
 * Shows just the frame without an avatar
 */
export function FramePreview({
  frameImage,
  borderColor = "#5bb4ff",
  glowColor = "rgba(91,180,255,0.5)",
  size = "md",
  className,
  frameScale = 1,
  frameOffsetX = 0,
  frameOffsetY = 0,
}: Omit<AvatarFrameProps, "avatarUrl" | "fallback">) {
  const [frameError, setFrameError] = useState(false);
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  };
  
  const hasValidFrameImage = frameImage && !frameError;

  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>
      {/* Glow */}
      <div 
        className="absolute inset-0 rounded-full blur-lg opacity-50"
        style={{ backgroundColor: glowColor }}
      />
      
      {/* Frame circle or image */}
      {hasValidFrameImage ? (
        <div className="relative z-10 w-full h-full">
          {/* Sample avatar silhouette */}
          <div 
            className="absolute inset-[15%] rounded-full bg-card/50 z-10"
          />
          {/* Frame image overlay with alignment */}
          <img
            src={frameImage}
            alt="Frame preview"
            className="absolute inset-0 w-full h-full object-contain z-20"
            style={{
              transform: `scale(${frameScale}) translate(${frameOffsetX}px, ${frameOffsetY}px)`,
            }}
            onError={() => setFrameError(true)}
          />
        </div>
      ) : (
        <div 
          className="rounded-full bg-card/50"
          style={{
            width: "85%",
            height: "85%",
            border: `3px solid ${borderColor}`,
            boxShadow: `0 0 20px ${glowColor}`,
          }}
        />
      )}
    </div>
  );
}
