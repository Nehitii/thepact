import * as React from "react";
import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pacte OS — Canonical icon wrapper.
 *
 * Locks two of the largest sources of visual drift in the audit:
 *   1. strokeWidth — defaults to 1.75 across the entire product (lucide ships 2)
 *   2. size — 4-step scale only (xs/sm/md/lg)
 *
 * Always pass a Lucide icon component. Never restyle stroke directly.
 *
 * <Icon as={Sparkles} size="md" />
 */
export type IconSize = "xs" | "sm" | "md" | "lg";

const SIZE_PX: Record<IconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
};

export interface IconProps extends Omit<LucideProps, "size" | "ref"> {
  as: LucideIcon;
  size?: IconSize;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ as: Component, size = "md", strokeWidth = 1.75, className, ...rest }, ref) => {
    const px = SIZE_PX[size];
    return (
      <Component
        ref={ref as any}
        width={px}
        height={px}
        strokeWidth={strokeWidth}
        className={cn("shrink-0", className)}
        {...rest}
      />
    );
  },
);
Icon.displayName = "Icon";

export const ICON_SIZE_PX = SIZE_PX;