import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SharedGoalBadgeProps {
  ownerName?: string;
  className?: string;
}

export function SharedGoalBadge({ ownerName, className }: SharedGoalBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
      "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
      className,
    )}>
      <Link2 className="h-3 w-3" />
      <span>{ownerName ? `Shared by ${ownerName}` : "Shared"}</span>
    </div>
  );
}
