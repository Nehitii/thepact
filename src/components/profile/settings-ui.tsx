import React, { useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════════
   Shared cyberpunk UI primitives for settings pages
   ══════════════════════════════════════════════ */

/* ── Breadcrumb ── */
export function SettingsBreadcrumb({ code }: { code: string }) {
  return (
    <div className="font-mono text-[10px] text-muted-foreground tracking-[0.15em] flex items-center gap-1.5 mb-7">
      ROOT <span className="opacity-40">//</span>
      USER_SETTINGS <span className="opacity-40">//</span>
      <span className="text-primary">{code}</span>
    </div>
  );
}

/* ── Separator ── */
export function CyberSeparator() {
  return (
    <div className="relative h-px mb-7 bg-gradient-to-r from-transparent via-primary to-primary/30 via-40%">
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary text-[8px] bg-background px-2">◆</span>
    </div>
  );
}

/* ── Data Panel ── */
export function DataPanel({
  code,
  title,
  statusText,
  footerLeft,
  footerRight,
  children,
}: {
  code: string;
  title: string;
  statusText?: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative border border-primary/20 bg-gradient-to-br from-[hsl(var(--card)/0.95)] to-[hsl(var(--background)/0.98)] transition-colors hover:border-primary/35 mb-4">
      {/* Corner brackets */}
      <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-primary opacity-60 pointer-events-none" />
      <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-primary opacity-60 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/20 bg-primary/[0.03]">
        <span className="font-mono text-[9px] text-primary tracking-[0.15em] opacity-70 min-w-[70px]">{code}</span>
        <span className="font-orbitron text-[13px] font-bold tracking-[0.12em] text-primary flex-1">{title}</span>
        {statusText && <span className="font-mono text-[9px] text-muted-foreground tracking-[0.1em]">{statusText}</span>}
      </div>

      {/* Body */}
      <div className="px-5">{children}</div>

      {/* Footer */}
      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-primary/20 bg-primary/[0.02]">
          <div className="font-mono text-[9px] text-muted-foreground tracking-[0.1em] flex gap-4">
            {footerLeft}
          </div>
          <div className="font-mono text-[9px] text-muted-foreground tracking-[0.1em] flex items-center gap-1.5">
            {footerRight}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Setting Row (toggle) ── */
export type SettingRowVariant = "primary" | "cyan" | "amber";

const variantMap = {
  primary: {
    iconBorder: "border-primary/20 bg-primary/10",
    iconBorderHover: "group-hover:border-primary group-hover:bg-primary/25 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.4)]",
    label: "text-foreground",
    statusOn: "text-primary",
    bar: "bg-primary",
  },
  cyan: {
    iconBorder: "border-[hsl(195,100%,50%)]/40 bg-[hsl(195,100%,50%)]/10",
    iconBorderHover: "group-hover:border-[hsl(195,100%,50%)] group-hover:bg-[hsl(195,100%,50%)]/25 group-hover:shadow-[0_0_12px_hsl(195,100%,50%,0.4)]",
    label: "text-[hsl(195,100%,50%)]",
    statusOn: "text-[hsl(195,100%,50%)]",
    bar: "bg-[hsl(195,100%,50%)]",
  },
  amber: {
    iconBorder: "border-[hsl(40,100%,50%)]/40 bg-[hsl(40,100%,50%)]/10",
    iconBorderHover: "group-hover:border-[hsl(40,100%,50%)] group-hover:bg-[hsl(40,100%,50%)]/25 group-hover:shadow-[0_0_12px_hsl(40,100%,50%,0.4)]",
    label: "text-[hsl(40,100%,50%)]",
    statusOn: "text-[hsl(40,100%,50%)]",
    bar: "bg-[hsl(40,100%,50%)]",
  },
};

export function SettingRow({
  icon,
  label,
  description,
  checked,
  disabled,
  variant = "primary",
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  variant?: SettingRowVariant;
  onToggle: (v: boolean) => void;
}) {
  const v = variantMap[variant];
  return (
    <div
      className="group relative flex items-center justify-between gap-4 py-4 px-5 -mx-5 cursor-pointer overflow-hidden border-b border-primary/[0.06] last:border-b-0 transition-colors hover:bg-primary/[0.03]"
      onClick={() => !disabled && onToggle(!checked)}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] origin-center scale-y-0 transition-transform group-hover:scale-y-100", v.bar)} />
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className={cn(
          "w-9 h-9 border flex items-center justify-center flex-shrink-0 transition-all duration-300",
          v.iconBorder, v.iconBorderHover,
          "[clip-path:polygon(8px_0%,100%_0%,100%_calc(100%-8px),calc(100%-8px)_100%,0%_100%,0%_8px)]"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn("font-rajdhani text-sm font-bold tracking-wider uppercase leading-none mb-1", v.label)}>
            {label}
          </div>
          <div className="text-[11px] text-muted-foreground tracking-wide leading-snug hidden sm:block">
            {description}
          </div>
        </div>
      </div>
      <span className={cn("font-mono text-[9px] tracking-widest min-w-[50px] text-right hidden sm:block transition-colors", checked ? v.statusOn : "text-muted-foreground")}>
        {checked ? "ENABLED" : "DISABLED"}
      </span>
      <div onClick={(e) => e.stopPropagation()}>
        <Switch checked={checked} onCheckedChange={onToggle} disabled={disabled} />
      </div>
    </div>
  );
}

/* ── Generic content row (no toggle, for sliders / custom content) ── */
export function SettingContentRow({
  icon,
  label,
  description,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative py-4 px-5 -mx-5 border-b border-primary/[0.06] last:border-b-0">
      <div className="flex items-start gap-3.5 mb-3">
        <div className={cn(
          "w-9 h-9 border flex items-center justify-center flex-shrink-0 transition-all duration-300",
          "border-primary/20 bg-primary/10",
          "[clip-path:polygon(8px_0%,100%_0%,100%_calc(100%-8px),calc(100%-8px)_100%,0%_100%,0%_8px)]"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-rajdhani text-sm font-bold tracking-wider uppercase leading-none mb-1 text-foreground">
            {label}
          </div>
          {description && (
            <div className="text-[11px] text-muted-foreground tracking-wide leading-snug">
              {description}
            </div>
          )}
        </div>
      </div>
      <div className="pl-[52px]">{children}</div>
    </div>
  );
}

/* ── Sync Indicator ── */
export function SyncIndicator({ syncing }: { syncing: boolean }) {
  return (
    <>
      <AnimatePresence>
        {syncing && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
          />
        )}
      </AnimatePresence>
      <span className={cn(syncing ? "text-[hsl(40,100%,50%)]" : "text-muted-foreground")}>
        {syncing ? "PENDING SYNC..." : "CONFIG SYNC'D"}
      </span>
    </>
  );
}

/* ── Terminal Log ── */
export function TerminalLog({ lines }: { lines: { text: string; type: "ok" | "warn" | "info" }[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  return (
    <div
      ref={scrollRef}
      className="border border-primary/20 bg-black/60 px-4 py-3.5 font-mono text-[10px] text-muted-foreground tracking-wider leading-[1.8] max-h-[100px] overflow-hidden relative"
    >
      <div className="text-primary text-[9px] opacity-70 mb-1.5">SYSTEM LOG //</div>
      {lines.map((line, i) => (
        <motion.div
          key={`${i}-${line.text}`}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="whitespace-nowrap"
        >
          <span className={cn(
            line.type === "ok" && "text-primary",
            line.type === "warn" && "text-[hsl(40,100%,50%)]",
            line.type === "info" && "text-[hsl(195,100%,50%)]",
          )}>
            {line.type === "ok" ? "✓ " : line.type === "warn" ? "⚠ " : "» "}
          </span>
          {line.text}
        </motion.div>
      ))}
    </div>
  );
}
