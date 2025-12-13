import { cn } from "@/lib/utils";

interface ThemePreviewCardProps {
  name: string;
  bgColor: string;
  accentColor: string;
  glowColor: string;
  className?: string;
}

export function ThemePreviewCard({
  name,
  bgColor,
  accentColor,
  glowColor,
  className,
}: ThemePreviewCardProps) {
  return (
    <div className={cn("w-full aspect-[4/5] rounded-lg overflow-hidden relative", className)}>
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: bgColor }}
      />
      
      {/* Glow orb */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full blur-2xl opacity-60"
        style={{ backgroundColor: glowColor }}
      />

      {/* Mock header */}
      <div className="absolute top-2 left-2 right-2 h-6 rounded-md bg-black/20 backdrop-blur-sm border border-white/10" />

      {/* Mock content cards */}
      <div className="absolute top-12 left-2 right-2 space-y-2">
        <div 
          className="h-8 rounded-md border"
          style={{ 
            backgroundColor: `${accentColor}15`,
            borderColor: `${accentColor}40`
          }}
        />
        <div 
          className="h-6 rounded-md border opacity-70"
          style={{ 
            backgroundColor: `${accentColor}10`,
            borderColor: `${accentColor}30`
          }}
        />
        <div 
          className="h-6 rounded-md border opacity-50"
          style={{ 
            backgroundColor: `${accentColor}10`,
            borderColor: `${accentColor}20`
          }}
        />
      </div>

      {/* Mock nav */}
      <div className="absolute bottom-2 left-2 right-2 h-8 rounded-md bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i}
            className="w-3 h-3 rounded-full"
            style={{ 
              backgroundColor: i === 1 ? accentColor : 'rgba(255,255,255,0.2)'
            }}
          />
        ))}
      </div>

      {/* Theme name overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-12">
        <span className="font-orbitron text-[10px] text-white/80 tracking-wider uppercase">
          {name}
        </span>
      </div>
    </div>
  );
}
