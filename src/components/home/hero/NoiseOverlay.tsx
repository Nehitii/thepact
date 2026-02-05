import { cn } from '@/lib/utils';

interface NoiseOverlayProps {
  opacity?: number;
  className?: string;
}

/**
 * Reusable SVG noise texture overlay for adding depth to glassmorphism elements.
 * Uses fractal noise filter for subtle grain effect.
 */
export function NoiseOverlay({ opacity = 0.2, className }: NoiseOverlayProps) {
  return (
    <div 
      className={cn(
        "absolute inset-0 mix-blend-soft-light pointer-events-none",
        className
      )}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
      }}
    />
  );
}
