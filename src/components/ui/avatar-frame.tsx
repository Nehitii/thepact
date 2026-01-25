import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { cn } from "@/lib/utils";
import { computeFrameTransform } from "./unified-frame-renderer";

export interface AvatarFrameProps {
  avatarUrl?: string | null;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  frameImage?: string | null;
  borderColor?: string;
  glowColor?: string;
  className?: string;
  showFallbackOnError?: boolean;
  /** Scale multiplier for the frame (1.0 = 100%) */
  frameScale?: number;
  /** Horizontal offset as percentage of container width */
  frameOffsetX?: number;
  /** Vertical offset as percentage of container height */
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
 * 
 * Transform model uses percentage-based offsets for consistency across all sizes.
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

  // Use unified transform calculation - no hardcoded multipliers
  const frameTransform = computeFrameTransform({
    frameScale,
    frameOffsetX,
    frameOffsetY,
  });

  return (
    <div 
      className={cn("relative flex items-center justify-center", sizeConfig.frame, className)}
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
          style={frameTransform}
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
 * 
 * Uses the same unified transform model as AvatarFrame for consistency.
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

  // Use unified transform calculation
  const frameTransform = computeFrameTransform({
    frameScale,
    frameOffsetX,
    frameOffsetY,
  });

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
          {/* Frame image overlay with unified transform */}
          <img
            src={frameImage}
            alt="Frame preview"
            className="absolute inset-0 w-full h-full object-contain z-20"
            style={frameTransform}
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

/**
 * Inline frame preview for admin tool - matches exact container size for WYSIWYG
 */
export interface InlineFramePreviewProps {
  frameImage: string;
  frameScale?: number;
  frameOffsetX?: number;
  frameOffsetY?: number;
  glowColor?: string;
  containerSize: number;
  showGuides?: boolean;
  label?: string;
}

export function InlineFramePreview({
  frameImage,
  frameScale = 1,
  frameOffsetX = 0,
  frameOffsetY = 0,
  glowColor = "rgba(91,180,255,0.5)",
  containerSize,
  showGuides = false,
  label,
}: InlineFramePreviewProps) {
  const [frameError, setFrameError] = useState(false);
  
  const frameTransform = computeFrameTransform({
    frameScale,
    frameOffsetX,
    frameOffsetY,
  });

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[10px] text-primary/50 uppercase tracking-wider">{label}</span>
      )}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Glow */}
        <div 
          className="absolute inset-0 rounded-full blur-md opacity-60"
          style={{ backgroundColor: glowColor }}
        />
        
        {/* Avatar placeholder */}
        <div 
          className="absolute rounded-full bg-card/50 z-10 flex items-center justify-center"
          style={{ 
            width: containerSize * 0.7, 
            height: containerSize * 0.7,
          }}
        >
          <span className="text-primary/40 font-orbitron" style={{ fontSize: containerSize * 0.2 }}>A</span>
        </div>
        
        {/* Frame overlay */}
        {!frameError && (
          <img
            src={frameImage}
            alt="Frame preview"
            className="absolute inset-0 w-full h-full object-contain z-20"
            style={frameTransform}
            onError={() => setFrameError(true)}
          />
        )}
        
        {/* Crosshair guides */}
        {showGuides && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="w-full h-px bg-primary/20" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="w-px h-full bg-primary/20" />
            </div>
          </>
        )}
      </div>
      <span className="text-[10px] text-primary/40">{containerSize}px</span>
    </div>
  );
}
