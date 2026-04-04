import { ReactNode } from "react";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  height?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function ChartCard({
  title,
  children,
  className = "",
  height = "md",
  isLoading = false,
  isEmpty = false,
  emptyMessage = "NO_DATA_FOUND",
}: ChartCardProps) {
  const heightClass = { sm: "h-40", md: "h-56", lg: "h-72" };

  return (
    <div
      className={cn("relative p-5 bg-[#0a0a0c]/90 border border-cyan-900/30 font-mono backdrop-blur-sm", className)}
      style={{ clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))" }}
    >
      {/* Top Scanner Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/50 via-transparent to-transparent" />

      <h3 className="text-xs text-cyan-500 mb-4 flex items-center gap-2">
        <Terminal className="w-3 h-3" />
        {title.toUpperCase()} <span className="animate-pulse">_</span>
      </h3>

      <div className={heightClass[height]}>
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-cyan-500/50 text-xs gap-2">
            <span className="animate-pulse">DECRYPTING_STREAM...</span>
            <div className="w-32 h-1 bg-cyan-900/30 overflow-hidden">
              <div className="w-1/2 h-full bg-cyan-500 animate-pulse" />
            </div>
          </div>
        ) : isEmpty ? (
          <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-red-900/30 bg-red-950/10 text-red-500/50 text-xs">
            <span>[ ERR_404: {emptyMessage.toUpperCase()} ]</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
