import React, { useEffect, useRef, useMemo, useState } from "react";
import { Panneau } from "@/components/profile/console-ui";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { DSPageShell, DSBackground } from "@/components/ds";

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
    <DSPageShell
      width="full"
      padding="tight"
      className="!px-0 !pt-0 !pb-0 selection:bg-primary/30"
      background={<DSBackground variant="cyber" />}
    >
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
            <span className="font-mono ds-t-label md:text-xs text-primary/70 tracking-[0.3em] uppercase">
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
    </DSPageShell>
  );
}

/* ── CyberPanel ── */
/* CYBERPANEL DEVIENT UN ADAPTATEUR.
 *
 * Une seconde couche de composants — les six cartes du pacte via
 * `DataPanel`, les reglages du compte, la difficulte sur mesure —
 * dessinait encore ses propres panneaux : angles coupes, degrade,
 * pastille clignotante. Les reecrire un a un aurait touche a leur
 * logique sans necessite ; les faire passer par `Panneau` uniformise
 * tout d un geste, et `DataPanel` suit puisqu il delegue ici.
 *
 * Le titre humain devient l intitule code du panneau : la console le
 * met en majuscules entre crochets, comme les autres. */
export function CyberPanel({
  title,
  children,
  accent = "cyan",
  statusText,
  taille = "pleine",
  rang,
}: {
  title: string;
  children: React.ReactNode;
  accent?: "cyan" | "red";
  statusText?: React.ReactNode;
  /* Les cartes heritees prennent la pleine largeur par defaut : elles
     n ont pas ete dessinees pour une demi-colonne. Celles qui s y
     pretent le declarent. */
  taille?: "demi" | "pleine";
  rang?: "primaire" | "normal" | "discret";
}) {
  return (
    <Panneau
      code={title}
      etat={statusText}
      ton={accent === "red" ? "danger" : "neutre"}
      taille={taille}
      rang={rang}
    >
      <div className="space-y-5 py-2">{children}</div>
    </Panneau>
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
  taille,
  rang,
}: {
  code: string;
  title: string;
  statusText?: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  children: React.ReactNode;
  /* Transmis a `CyberPanel`, donc a `Panneau` : sans ce relais, une
     carte ne pouvait pas demander une demi-colonne. */
  taille?: "demi" | "pleine";
  rang?: "primaire" | "normal" | "discret";
}) {
  return (
    <CyberPanel title={title} statusText={statusText} taille={taille} rang={rang}>
      <div>{children}</div>
      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-primary/10">
          <div className="font-mono ds-t-label text-muted-foreground tracking-[0.1em] flex gap-4">{footerLeft}</div>
          <div className="font-mono ds-t-label text-muted-foreground tracking-[0.1em] flex items-center gap-1.5">{footerRight}</div>
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
          <div className="ds-t-label text-muted-foreground tracking-wide leading-snug hidden sm:block">
            {description}
          </div>
        </div>
      </div>
      <span className={cn("font-mono ds-t-label tracking-widest min-w-[50px] text-right hidden sm:block transition-colors", checked ? v.statusOn : "text-muted-foreground")}>
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
            <div className="ds-t-label text-muted-foreground tracking-wide leading-snug">
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
      className="border border-primary/20 bg-card/60 px-4 py-3.5 font-mono ds-t-label text-muted-foreground tracking-wider leading-[1.8] max-h-[100px] overflow-hidden relative"
    >
      <div className="text-primary ds-t-label opacity-70 mb-1.5">SYSTEM LOG //</div>
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
