import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DSPageWidth = "sm" | "md" | "lg" | "xl" | "full";

interface DSPageShellProps {
  width?: DSPageWidth;
  padding?: "comfortable" | "tight";
  background?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Skip link target id, default "page-main" */
  mainId?: string;
}

const widthMap: Record<DSPageWidth, string> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  full: "max-w-none",
};

/**
 * Standardized layout shell for every protected page.
 * Handles min-h-screen, background slot, content container with widths, and a11y skip-link.
 */
export function DSPageShell({
  width = "xl",
  padding = "comfortable",
  background,
  children,
  className,
  mainId = "page-main",
}: DSPageShellProps) {
  const paddingClass =
    padding === "tight"
      ? "px-4 pt-4 pb-8"
      : "px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-12 md:pb-24";

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <a href={`#${mainId}`} className="ds-skip-link">
        Skip to content
      </a>
      {background && (
        <div className="absolute inset-0 z-0 pointer-events-none">{background}</div>
      )}
      <main
        id={mainId}
        tabIndex={-1}
        className={cn(
          "relative z-10 mx-auto outline-none",
          widthMap[width],
          paddingClass,
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}