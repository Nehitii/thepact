import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Ajout de "2xl" dans les types
interface AvatarFrameProps {
  avatarUrl: string | null;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl"; // <--- Ajouté ici
  frameImage?: string | null;
  borderColor?: string;
  glowColor?: string;
  className?: string;
  frameScale?: number;
  frameOffsetX?: number;
  frameOffsetY?: number;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
  "2xl": "h-40 w-40", // <--- Ajouté ici (160px)
};

const frameSizeMap = {
  sm: "scale-[1.2]",
  md: "scale-[1.3]",
  lg: "scale-[1.35]",
  xl: "scale-[1.4]",
  "2xl": "scale-[1.45]", // <--- Ajouté ici
};

export function AvatarFrame({
  avatarUrl,
  fallback,
  size = "md",
  frameImage,
  borderColor = "transparent",
  glowColor = "transparent",
  className,
  frameScale = 1,
  frameOffsetX = 0,
  frameOffsetY = 0,
}: AvatarFrameProps) {
  // Calculer l'échelle combinée (celle par défaut + celle personnalisée)
  const baseScale = parseFloat(frameSizeMap[size].replace("scale-[", "").replace("]", ""));
  const finalScale = baseScale * (frameScale || 1);

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Glow effect behind */}
      <div
        className={cn("absolute inset-0 rounded-full blur-md transition-all duration-300")}
        style={{ backgroundColor: glowColor, opacity: 0.5 }}
      />

      {/* Main Avatar */}
      <Avatar className={cn("border-2 relative z-10", sizeMap[size])} style={{ borderColor }}>
        <AvatarImage src={avatarUrl || undefined} className="object-cover" />
        <AvatarFallback className="bg-background text-muted-foreground">{fallback}</AvatarFallback>
      </Avatar>

      {/* Cosmetic Frame Overlay */}
      {frameImage && (
        <div
          className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
          style={{
            transform: `scale(${finalScale}) translate(${frameOffsetX}px, ${frameOffsetY}px)`,
          }}
        >
          <img src={frameImage} alt="" className="w-full h-full object-contain" />
        </div>
      )}
    </div>
  );
}

export function FramePreview({
  size = "md",
  frameImage,
  borderColor,
  glowColor,
  frameScale = 1,
  frameOffsetX = 0,
  frameOffsetY = 0,
}: Omit<AvatarFrameProps, "avatarUrl" | "fallback">) {
  return (
    <AvatarFrame
      avatarUrl={null}
      fallback=""
      size={size}
      frameImage={frameImage}
      borderColor={borderColor}
      glowColor={glowColor}
      frameScale={frameScale}
      frameOffsetX={frameOffsetX}
      frameOffsetY={frameOffsetY}
    />
  );
}
