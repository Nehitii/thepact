import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  isEmpty?: boolean;
  emptyContent?: ReactNode;
  height?: "sm" | "md" | "lg" | "xl";
}

const HEIGHTS: Record<NonNullable<Props["height"]>, string> = {
  sm: "h-[180px]",
  md: "h-[240px]",
  lg: "h-[300px]",
  xl: "h-[360px]",
};

export function CleanCard({
  title,
  subtitle,
  action,
  children,
  className,
  isEmpty,
  emptyContent,
  height = "lg",
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 flex flex-col overflow-hidden hover:border-primary/30 hover:shadow-[0_10px_30px_-15px_hsl(var(--primary)/0.35)] transition-all duration-300",
        className,
      )}
    >
      {/* top accent line on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />
      <header className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
            <span className="inline-block w-1 h-3 rounded-sm bg-primary/70 group-hover:bg-primary transition-colors" />
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </header>
      <div className={cn("relative flex-1 min-h-0", HEIGHTS[height])}>
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground/70 text-center px-6">
            {emptyContent ?? "Pas encore de données"}
          </div>
        ) : (
          children
        )}
      </div>
    </motion.section>
  );
}