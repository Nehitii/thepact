import { motion } from "framer-motion";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp } from "./CountUp";

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

  // Try to extract a numeric portion for animated count-up.
  const rawValue = item.value;
  const numericMatch =
    typeof rawValue === "number"
      ? { num: rawValue, prefix: "", suffix: "" }
      : (() => {
          const m = String(rawValue).match(/^([^\d-]*)(-?[\d.,\s]+)(.*)$/);
          if (!m) return null;
          const num = Number(m[2].replace(/[\s,]/g, ""));
          if (!Number.isFinite(num)) return null;
          return { num, prefix: m[1] || "", suffix: m[3] || "" };
        })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 hover:border-primary/40 hover:shadow-[0_8px_28px_-12px_hsl(var(--primary)/0.4)] transition-all duration-300"
    >
      {/* shimmering accent on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.12), transparent 40%)",
        }}
      />
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary transition-all duration-300 group-hover:scale-110">
          <Icon className="h-4 w-4" />
        </div>
        {hasDelta && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.06 + 0.3, duration: 0.3 }}
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded-md border",
              trend === "up" && "text-emerald-500",
              trend === "down" && "text-rose-500",
              trend === "flat" && "text-muted-foreground",
              trend === "up" && "bg-emerald-500/10 border-emerald-500/30",
              trend === "down" && "bg-rose-500/10 border-rose-500/30",
              trend === "flat" && "bg-muted/40 border-border/60",
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {Math.abs(item.delta!).toFixed(0)}%
          </motion.span>
        )}
      </div>
      <div className="relative text-xs text-muted-foreground mb-1">{item.label}</div>
      <div className="relative text-2xl md:text-[26px] font-semibold tabular-nums tracking-tight">
        {numericMatch ? (
          <>
            {numericMatch.prefix}
            <CountUp
              value={numericMatch.num}
              format={(n) =>
                Number.isInteger(numericMatch.num)
                  ? Math.round(n).toLocaleString()
                  : n.toFixed(1)
              }
            />
            {numericMatch.suffix}
          </>
        ) : (
          rawValue
        )}
      </div>
      {item.hint && (
        <div className="relative text-[11px] text-muted-foreground/70 mt-1">{item.hint}</div>
      )}
    </motion.div>
  );
}