import { cn } from "@/socle/outils/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/socle/ui/avatar";
import { computeFrameTransform } from "@/socle/ui/unified-frame-renderer";

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
  showBorder?: boolean;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-24 w-24",
  xl: "h-28 w-28",
  "2xl": "h-32 w-32",
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
  showBorder = true,
}: AvatarFrameProps) {
  const { transform, transformOrigin } = computeFrameTransform({
    frameScale,
    frameOffsetX,
    frameOffsetY,
  });

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* ── LA LUEUR ARRIÈRE ──────────────────────────────────
          C'ÉTAIT UN DISQUE PLEIN FLOUTÉ À 12 PX, et un flou déborde
          de sa boîte sans l'agrandir : le rendu s'étalait sur 24 px
          alors que le rectangle, lui, ne bougeait pas. Posé à 10 px
          du bas d'une bannière en « overflow: hidden », il se faisait
          trancher net — un trait droit là où le halo aurait dû
          s'éteindre, et l'arrondi coupé. Invisible en sombre, où la
          lueur se fond dans le noir ; flagrant sur du papier.

          Un dégradé radial n'a pas ce défaut : il s'éteint de
          lui-même avant son propre bord, donc rien ne dépasse et rien
          n'a besoin d'être rogné. Il ne coûte pas non plus de couche
          de composition, contrairement à « filter ». */}
      <div
        className={cn("absolute -inset-2 rounded-full transition-all duration-300")}
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, ${glowColor} 34%, transparent 68%)`,
          opacity: 0.55,
        }}
      />

      {/* Main Avatar (L'image ronde) */}
      {/* z-10 assure que l'avatar est au-dessus du fond mais en-dessous du cadre */}
      <Avatar className={cn(showBorder ? "border-2" : "border-0", "relative z-10 bg-background", sizeMap[size])} style={{ borderColor: showBorder ? borderColor : "transparent" }}>
        <AvatarImage src={avatarUrl || undefined} className="object-cover h-full w-full" />
        <AvatarFallback className="bg-muted text-muted-foreground font-orbitron">{fallback}</AvatarFallback>
      </Avatar>

      {/* Cosmetic Frame Overlay (Le cadre décoratif) */}
      {/* z-20 assure que le cadre est PAR DESSUS l'avatar */}
      {frameImage && (
        <div
          className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
          style={{ transform, transformOrigin }}
        >
          <img src={frameImage} alt="" className="w-full h-full object-contain" loading="lazy" decoding="async" />
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
