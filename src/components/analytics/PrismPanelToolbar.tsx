import { Maximize2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrismPanelToolbarProps {
  onExpand?: () => void;
  info?: string;
  className?: string;
}

/**
 * PrismPanelToolbar — fades in on panel hover (parent must have `group`).
 * Provides expand-to-fullscreen + info tooltip.
 */
export function PrismPanelToolbar({ onExpand, info, className }: PrismPanelToolbarProps) {
  return (
    <div
      className={cn(
        "absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity",
        className,
      )}
    >
      {info && (
        <span
          className="relative inline-flex items-center group/info"
          tabIndex={0}
          aria-label={info}
        >
          <span className="touch-target h-7 w-7 inline-flex items-center justify-center rounded-sm border border-[hsl(var(--prism-cyan))]/20 hover:border-[hsl(var(--prism-cyan))]/50 text-muted-foreground hover:text-[hsl(var(--prism-cyan))] transition-colors">
            <Info className="h-3 w-3" />
          </span>
          <span
            className="pointer-events-none absolute right-0 top-full mt-1 max-w-[200px] rounded-sm border border-[hsl(var(--prism-cyan))]/30 bg-[hsl(var(--prism-panel-bg))]/95 backdrop-blur-md px-2 py-1.5 text-[10px] font-mono leading-snug text-muted-foreground opacity-0 group-hover/info:opacity-100 focus-within:opacity-100 transition-opacity z-20"
            style={{ boxShadow: "0 4px 18px -6px hsl(var(--prism-cyan) / 0.4)" }}
          >
            {info}
          </span>
        </span>
      )}
      {onExpand && (
        <button
          type="button"
          onClick={onExpand}
          aria-label="Expand panel"
          className="touch-target h-7 w-7 inline-flex items-center justify-center rounded-sm border border-[hsl(var(--prism-cyan))]/20 hover:border-[hsl(var(--prism-cyan))]/50 text-muted-foreground hover:text-[hsl(var(--prism-cyan))] transition-colors"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}