import { motion } from "framer-motion";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KPIItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: number;
  hint?: string;
}

interface Props {
  items: KPIItem[];
}

export function CleanKPIGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {items.map((item, i) => (
        <CleanKPI key={item.label} item={item} index={i} />
      ))}
    </div>
  );
}

function CleanKPI({ item, index }: { item: KPIItem; index: number }) {
  const Icon = item.icon;
  const hasDelta = typeof item.delta === "number" && Number.isFinite(item.delta);
  const trend: "up" | "down" | "flat" = !hasDelta
    ? "flat"
    : item.delta! > 0.5
      ? "up"
      : item.delta! < -0.5
        ? "down"
        : "flat";
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="group rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 hover:border-border transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground group-hover:text-primary transition-colors">
          <Icon className="h-4 w-4" />
        </div>
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
              trend === "up" && "text-emerald-500",
              trend === "down" && "text-rose-500",
              trend === "flat" && "text-muted-foreground",
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {Math.abs(item.delta!).toFixed(0)}%
          </span>
        )}
      </div>
      <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight">{item.value}</div>
      {item.hint && (
        <div className="text-[11px] text-muted-foreground/70 mt-1">{item.hint}</div>
      )}
    </motion.div>
  );
}