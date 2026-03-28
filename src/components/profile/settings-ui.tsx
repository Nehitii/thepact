import React, { useEffect, useRef, useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { CyberBackground } from "@/components/CyberBackground";

/* ══════════════════════════════════════════════
   Shared cyberpunk UI primitives for settings pages
   ══════════════════════════════════════════════ */

/* ── Settings Page Shell (replaces ProfileSettingsShell with AccountSettings DA) ── */
export function SettingsPageShell({
  icon,
  title,
  subtitle,
  children,
  stickyBar,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  stickyBar?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] relative overflow-hidden selection:bg-primary/30">
      <CyberBackground />
      <div className="relative z-10 px-4 pt-12 pb-6 max-w-4xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 text-center flex flex-col items-center"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-full border border-primary/40 bg-card/50 backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
              {icon}
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4 w-full">
            <div className="flex-1 max-w-[80px] md:max-w-[160px] h-px bg-gradient-to-r from-transparent to-primary/50" />
            <span className="font-mono text-[10px] md:text-xs text-primary/70 tracking-[0.3em] uppercase">
              {subtitle || "SYSTEM CONFIGURATION"}
            </span>
            <div className="flex-1 max-w-[80px] md:max-w-[160px] h-px bg-gradient-to-l from-transparent to-primary/50" />
          </div>
          <h1 className="font-orbitron font-black text-3xl md:text-5xl tracking-[0.15em] uppercase text-foreground drop-shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
            {title}
          </h1>
        </motion.header>
        <main className="space-y-8 relative z-10 pb-32">{children}</main>
      </div>
      {stickyBar}
    </div>
  );
}

/* ── CyberPanel ── */
export function CyberPanel({
  title,
  children,
  accent = "cyan",
  statusText,
}: {
  title: string;
  children: React.ReactNode;
  accent?: "cyan" | "red";
  statusText?: React.ReactNode;
}) {
  const borderColor = accent === "red" ? "border-destructive/30" : "border-primary/20";
  const textColor = accent === "red" ? "text-destructive" : "text-primary";
  const bgGrad = accent === "red" ? "from-destructive/5 to-transparent" : "from-primary/5 to-transparent";
  const dotColor = accent === "red" ? "bg-destructive" : "bg-primary";
  const lineColor = accent === "red" ? "bg-destructive" : "bg-primary";

  return (
    <div
      className={cn("relative border bg-gradient-to-br p-6 md:p-8", borderColor, bgGrad)}
      style={{ clipPath: "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)" }}
    >
      <div className={cn("absolute top-0 left-0 w-8 h-[2px]", lineColor)} />
      <div className="flex items-center gap-3 mb-8 border-b border-foreground/5 pb-4">
        <span className={cn("w-2 h-2 rounded-none animate-pulse", dotColor)} />
        <h3 className={cn("font-orbitron tracking-[0.2em] text-sm uppercase flex-1", textColor)}>{title}</h3>
        {statusText && <span className="font-mono text-[9px] text-muted-foreground tracking-[0.1em]">{statusText}</span>}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

/* ── CyberInput ── */
export function CyberInput({ label, className, ...props }: any) {
  return (
    <div className="space-y-2 group">
      <label className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase group-focus-within:text-primary transition-colors flex items-center gap-2">
        <span className="text-primary/40">{">"}</span> {label}
      </label>
      <div className="relative">
        <Input
          className={cn(
            "bg-foreground/5 border-none border-b-2 border-foreground/10 rounded-none px-4 py-6 font-mono text-sm text-foreground",
            "focus-visible:ring-0 focus-visible:border-primary focus-visible:bg-primary/5 transition-all disabled:opacity-40",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  );
}

/* ── CyberSelect ── */
export function CyberSelect({
  label,
  value,
  onValueChange,
  children,
  placeholder,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2">
        <span className="text-primary/40">{">"}</span> {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="bg-foreground/5 border-none border-b-2 border-foreground/10 rounded-none h-[68px] font-mono text-sm focus:ring-0 focus:border-primary text-foreground transition-colors hover:bg-primary/5">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-card border-primary/30 rounded-none font-mono">
          {children}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ── Settings Tab Bar ── */
export function SettingsTabBar<T extends string>({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: readonly T[];
  activeTab: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div className="flex w-full mb-8 border-b border-foreground/10 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              "flex-1 min-w-[120px] py-4 text-xs font-orbitron tracking-[0.25em] transition-all relative outline-none",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
            )}
          >
            {tab}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Sticky Command Bar ── */
export function StickyCommandBar({
  latestLog,
  hasChanges,
  isSaving,
  onSave,
  saveLabel = "COMMIT OVERRIDE",
  savingLabel = "EXECUTING...",
}: {
  latestLog: { text: string; type: "ok" | "warn" | "info" };
  hasChanges?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  saveLabel?: string;
  savingLabel?: string;
}) {
  return (
    <div className="fixed bottom-0 left-0 w-full z-50">
      <div className="w-full bg-background/95 backdrop-blur-xl border-t border-primary/20 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden w-full md:w-auto">
            <div className="relative flex h-3 w-3 shrink-0">
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                latestLog.type === "warn" ? "bg-amber-500" : latestLog.type === "ok" ? "bg-primary" : "bg-muted-foreground/50",
              )} />
              <span className={cn(
                "relative inline-flex rounded-full h-3 w-3",
                latestLog.type === "warn" ? "bg-amber-500" : latestLog.type === "ok" ? "bg-primary" : "bg-muted-foreground/50",
              )} />
            </div>
            <p className="font-mono text-[10px] tracking-widest uppercase truncate text-muted-foreground">
              <span className="text-muted-foreground/50 mr-2">[{new Date().toLocaleTimeString()}]</span>
              {latestLog.text}
            </p>
          </div>
          <AnimatePresence>
            {onSave && (hasChanges || isSaving) && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={onSave}
                disabled={isSaving}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "shrink-0 w-full md:w-auto h-12 px-8 font-orbitron text-xs tracking-[0.2em] uppercase font-bold",
                  "bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_20px_hsl(var(--primary)/0.4)]",
                  "disabled:opacity-50 flex items-center justify-center gap-3",
                )}
                style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
              >
                {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> {savingLabel}</> : <><Check className="h-4 w-4" /> {saveLabel}</>}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

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

/* ── DataPanel (kept for backward compat, now wraps CyberPanel) ── */
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
    <CyberPanel title={title} statusText={statusText}>
      <div>{children}</div>
      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-primary/10">
          <div className="font-mono text-[9px] text-muted-foreground tracking-[0.1em] flex gap-4">{footerLeft}</div>
          <div className="font-mono text-[9px] text-muted-foreground tracking-[0.1em] flex items-center gap-1.5">{footerRight}</div>
        </div>
      )}
    </CyberPanel>
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
      className="border border-primary/20 bg-card/60 px-4 py-3.5 font-mono text-[10px] text-muted-foreground tracking-wider leading-[1.8] max-h-[100px] overflow-hidden relative"
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
