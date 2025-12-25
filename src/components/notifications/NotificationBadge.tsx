import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  size?: "sm" | "md";
}

export function NotificationBadge({ count, className, size = "md" }: NotificationBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "absolute flex items-center justify-center font-bold rounded-full bg-destructive text-destructive-foreground shadow-[0_0_8px_rgba(239,68,68,0.6)]",
        size === "sm" ? "text-[9px] min-w-[14px] h-[14px] px-1 -top-1 -right-1" : "text-[10px] min-w-[18px] h-[18px] px-1 -top-1.5 -right-1.5",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
