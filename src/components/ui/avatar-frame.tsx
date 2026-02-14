import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarFrameProps {
  avatarUrl: string | null;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
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
  xl: "h-28 w-28", // Ajusté
  "2xl": "h-32 w-32", // Réduit de 40 à 32 (128px) pour mieux s'intégrer
};

const frameSizeMap = {
  sm: "scale-[1.2]",
  md: "scale-[1.3]",
  lg: "scale-[1.35]",
  xl: "scale-[1.4]",
  "2xl": "scale-[1.4]", // Scale standardisé pour éviter que ça "flotte" trop
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
  // Calcul de l'échelle : on part de la map et on multiplie par l'ajustement manuel
  const baseScale = parseFloat(frameSizeMap[size].replace("scale-[", "").replace("]", ""));
  const finalScale = baseScale * (frameScale || 1);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* Glow effect behind (Lueur arrière) */}
      <div
        className={cn("absolute inset-0 rounded-full blur-md transition-all duration-300")}
        style={{ backgroundColor: glowColor, opacity: 0.6 }}
      />

      {/* Main Avatar (L'image ronde) */}
      {/* z-10 assure que l'avatar est au-dessus du fond mais en-dessous du cadre */}
      <Avatar className={cn("border-2 relative z-10 bg-background", sizeMap[size])} style={{ borderColor }}>
        <AvatarImage src={avatarUrl || undefined} className="object-cover h-full w-full" />
        <AvatarFallback className="bg-muted text-muted-foreground font-orbitron">{fallback}</AvatarFallback>
      </Avatar>

      {/* Cosmetic Frame Overlay (Le cadre décoratif) */}
      {/* z-20 assure que le cadre est PAR DESSUS l'avatar */}
      {frameImage && (
        <div
          className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
          style={{
            // On applique la transformation sur un conteneur qui fait exactement la taille du parent
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
