import { cn } from "@/lib/utils";

interface DSCornerBracketsProps {
  /** Override accent color via CSS color string. Defaults to --ds-accent-primary. */
  color?: string;
  /** Bracket size in px. Default 10 (secondary tier). Use 16 for primary. */
  size?: number;
  className?: string;
}

/**
 * Pacte OS — Corner Brackets utility.
 * Renders 4 absolute-positioned L-shaped corner accents.
 * Parent must have `position: relative`.
 */
export function DSCornerBrackets({ color, size = 10, className }: DSCornerBracketsProps) {
  const style = color ? ({ borderColor: color, width: size, height: size } as React.CSSProperties) : { width: size, height: size };
  return (
    <>
      <span className={cn("ds-corner-bracket tl", className)} style={style} />
      <span className={cn("ds-corner-bracket tr", className)} style={style} />
      <span className={cn("ds-corner-bracket bl", className)} style={style} />
      <span className={cn("ds-corner-bracket br", className)} style={style} />
    </>
  );
}