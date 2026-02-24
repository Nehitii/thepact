import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Zap, Volume2, MessageSquare, Gift, AlertCircle, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNotificationSettings } from "@/hooks/useNotifications";
import { toast } from "@/hooks/use-toast";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ── */
interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  variant?: "primary" | "cyan" | "amber";
  onToggle: (v: boolean) => void;
}

/* ── Setting Row ── */
function SettingRow({ icon, label, description, checked, disabled, variant = "primary", onToggle }: SettingRowProps) {
  const variantClasses = {
    primary: {
      iconBorder: "border-primary/20 bg-primary/10",
      iconBorderHover: "group-hover:border-primary group-hover:bg-primary/25 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.4)]",
      label: "text-foreground",
      status: checked ? "text-primary" : "text-muted-foreground",
      bar: "bg-primary",
    },
    cyan: {
      iconBorder: "border-[hsl(195,100%,50%)]/40 bg-[hsl(195,100%,50%)]/10",
      iconBorderHover: "group-hover:border-[hsl(195,100%,50%)] group-hover:bg-[hsl(195,100%,50%)]/25 group-hover:shadow-[0_0_12px_hsl(195,100%,50%,0.4)]",
      label: "text-[hsl(195,100%,50%)]",
      status: checked ? "text-[hsl(195,100%,50%)]" : "text-muted-foreground",
      bar: "bg-[hsl(195,100%,50%)]",
    },
    amber: {
      iconBorder: "border-[hsl(40,100%,50%)]/40 bg-[hsl(40,100%,50%)]/10",
      iconBorderHover: "group-hover:border-[hsl(40,100%,50%)] group-hover:bg-[hsl(40,100%,50%)]/25 group-hover:shadow-[0_0_12px_hsl(40,100%,50%,0.4)]",
      label: "text-[hsl(40,100%,50%)]",
      status: checked ? "text-[hsl(40,100%,50%)]" : "text-muted-foreground",
      bar: "bg-[hsl(40,100%,50%)]",
    },
  };
  const v = variantClasses[variant];

  return (
    <div
      className="group relative flex items-center justify-between gap-4 py-4 px-5 -mx-5 cursor-pointer overflow-hidden border-b border-primary/[0.06] last:border-b-0 transition-colors hover:bg-primary/[0.03]"
      onClick={() => !disabled && onToggle(!checked)}
    >
      {/* Left accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] origin-center scale-y-0 transition-transform group-hover:scale-y-100", v.bar)} />

      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Icon */}
        <div className={cn(
          "w-9 h-9 border flex items-center justify-center flex-shrink-0 transition-all duration-300",
          v.iconBorder, v.iconBorderHover,
          "[clip-path:polygon(8px_0%,100%_0%,100%_calc(100%-8px),calc(100%-8px)_100%,0%_100%,0%_8px)]"
        )}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className={cn("font-rajdhani text-sm font-bold tracking-wider uppercase leading-none mb-1", v.label === "text-foreground" ? "text-foreground" : v.label)}>
            {label}
          </div>
          <div className="text-[11px] text-muted-foreground tracking-wide leading-snug hidden sm:block">
            {description}
          </div>
        </div>
      </div>

      {/* Status text */}
      <span className={cn("font-mono text-[9px] tracking-widest min-w-[50px] text-right hidden sm:block transition-colors", v.status)}>
        {checked ? "ENABLED" : "DISABLED"}
      </span>

      {/* Toggle */}
      <div onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={checked}
          onCheckedChange={(val) => onToggle(val)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/* ── Data Panel ── */
function DataPanel({
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
  footerLeft: React.ReactNode;
  footerRight: React.ReactNode;
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
      <div className="flex items-center justify-between px-5 py-3 border-t border-primary/20 bg-primary/[0.02]">
        <div className="font-mono text-[9px] text-muted-foreground tracking-[0.1em] flex gap-4">
          {footerLeft}
        </div>
        <div className="font-mono text-[9px] text-muted-foreground tracking-[0.1em] flex items-center gap-1.5">
          {footerRight}
        </div>
      </div>
    </div>
  );
}

/* ── Sync indicator ── */
function SyncIndicator({ syncing }: { syncing: boolean }) {
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
function TerminalLog({ lines }: { lines: { text: string; type: "ok" | "warn" | "info" }[] }) {
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
          key={i}
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

/* ── Separator ── */
function CyberSeparator() {
  return (
    <div className="relative h-px mb-7 bg-gradient-to-r from-transparent via-primary to-primary/30 via-40%">
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary text-[8px] bg-background px-2">◆</span>
    </div>
  );
}

/* ── Main Page ── */
export default function NotificationSettings() {
  const { t } = useTranslation();
  const { settings, isLoading, updateSettings } = useNotificationSettings();
  const [syncingPanel, setSyncingPanel] = useState<1 | 2 | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>();

  const [logLines, setLogLines] = useState<{ text: string; type: "ok" | "warn" | "info" }[]>([
    { text: "NOTIFICATION SETTINGS LOADED", type: "info" },
    { text: "ALL CHANNELS ACTIVE", type: "ok" },
    { text: "PUSH SERVICE: CONNECTED", type: "info" },
  ]);

  const addLog = useCallback((text: string, type: "ok" | "warn" | "info") => {
    setLogLines(prev => {
      const next = [...prev, { text, type }];
      return next.length > 5 ? next.slice(-5) : next;
    });
  }, []);

  const handleToggle = useCallback((key: string, value: boolean, panel: 1 | 2) => {
    updateSettings.mutate({ [key]: value }, {
      onSuccess: () => {
        toast({
          title: t("settings.notifications.toasts.updated"),
          description: t("settings.notifications.toasts.updatedDesc"),
        });

        const labelMap: Record<string, string> = {
          system_enabled: "SYSTEM_ALERTS",
          progress_enabled: "PROGRESS_ALERTS",
          social_enabled: "SOCIAL_ALERTS",
          marketing_enabled: "MARKETING_ALERTS",
          push_enabled: "PUSH_SERVICE",
          focus_mode: "FOCUS_MODE",
        };
        addLog(`${labelMap[key] || key.toUpperCase()}: ${value ? "ENABLED" : "DISABLED"}`, value ? "ok" : "warn");

        // Sync indicator
        setSyncingPanel(panel);
        clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => setSyncingPanel(null), 2000);
      },
    });
  }, [updateSettings, t, addLog]);

  const isPending = isLoading || updateSettings.isPending;

  // Computed stats
  const categoryKeys = ["system_enabled", "progress_enabled", "social_enabled", "marketing_enabled"] as const;
  const activeCount = categoryKeys.filter(k => settings?.[k] ?? true).length;

  if (isLoading) {
    return (
      <ProfileSettingsShell
        title={t("settings.notifications.title")}
        subtitle={t("settings.notifications.subtitle")}
        icon={<Bell className="h-7 w-7 text-primary" />}
        containerClassName="max-w-3xl"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProfileSettingsShell>
    );
  }

  return (
    <ProfileSettingsShell
      title={t("settings.notifications.title")}
      subtitle={t("settings.notifications.subtitle")}
      icon={<Bell className="h-7 w-7 text-primary" />}
      containerClassName="max-w-3xl"
    >
      {/* Breadcrumb */}
      <div className="font-mono text-[10px] text-muted-foreground tracking-[0.15em] flex items-center gap-1.5 mb-7">
        ROOT <span className="opacity-40">//</span>
        USER_SETTINGS <span className="opacity-40">//</span>
        <span className="text-primary">NTF.04</span>
      </div>

      <CyberSeparator />

      {/* ── PANEL 1: Alert Categories ── */}
      <DataPanel
        code="MODULE_01"
        title="FLUX D'ALERTES"
        statusText={
          <span className={cn(
            activeCount < 2 ? "text-destructive" : activeCount < 4 ? "text-[hsl(40,100%,50%)]" : "text-muted-foreground"
          )}>
            {activeCount}/4 ACTIFS
          </span>
        }
        footerLeft={
          <>
            <span>ACTIFS: <b className="text-primary">{activeCount}</b></span>
            <span>TOTAL: <b className="text-primary">4</b></span>
          </>
        }
        footerRight={<SyncIndicator syncing={syncingPanel === 1} />}
      >
        <SettingRow
          icon={<Zap className="h-4 w-4 text-primary" />}
          label={t("settings.notifications.system")}
          description={t("settings.notifications.systemDesc")}
          checked={settings?.system_enabled ?? true}
          disabled={isPending}
          onToggle={(v) => handleToggle("system_enabled", v, 1)}
        />
        <SettingRow
          icon={<Volume2 className="h-4 w-4 text-primary" />}
          label={t("settings.notifications.progress")}
          description={t("settings.notifications.progressDesc")}
          checked={settings?.progress_enabled ?? true}
          disabled={isPending}
          onToggle={(v) => handleToggle("progress_enabled", v, 1)}
        />
        <SettingRow
          icon={<MessageSquare className="h-4 w-4 text-primary" />}
          label={t("settings.notifications.social")}
          description={t("settings.notifications.socialDesc")}
          checked={settings?.social_enabled ?? true}
          disabled={isPending}
          onToggle={(v) => handleToggle("social_enabled", v, 1)}
        />
        <SettingRow
          icon={<Gift className="h-4 w-4 text-primary" />}
          label={t("settings.notifications.marketing")}
          description={t("settings.notifications.marketingDesc")}
          checked={settings?.marketing_enabled ?? true}
          disabled={isPending}
          onToggle={(v) => handleToggle("marketing_enabled", v, 1)}
        />
      </DataPanel>

      {/* ── PANEL 2: System Controls ── */}
      <DataPanel
        code="MODULE_02"
        title="CONTRÔLES SYSTÈME"
        footerLeft={
          <>
            <span>PUSH: <b className={cn(settings?.push_enabled !== false ? "text-[hsl(195,100%,50%)]" : "text-muted-foreground")}>{settings?.push_enabled !== false ? "ON" : "OFF"}</b></span>
            <span>FOCUS: <b className={cn(settings?.focus_mode ? "text-[hsl(40,100%,50%)]" : "text-muted-foreground")}>{settings?.focus_mode ? "ON" : "OFF"}</b></span>
          </>
        }
        footerRight={<SyncIndicator syncing={syncingPanel === 2} />}
      >
        <SettingRow
          icon={<Bell className="h-4 w-4 text-[hsl(195,100%,50%)]" />}
          label={t("settings.notifications.pushEnabled")}
          description={t("settings.notifications.pushEnabledDesc")}
          checked={settings?.push_enabled ?? true}
          disabled={isPending}
          variant="cyan"
          onToggle={(v) => handleToggle("push_enabled", v, 2)}
        />
        <SettingRow
          icon={<AlertCircle className="h-4 w-4 text-[hsl(40,100%,50%)]" />}
          label={t("settings.notifications.focusMode")}
          description={t("settings.notifications.focusModeDesc")}
          checked={settings?.focus_mode ?? false}
          disabled={isPending}
          variant="amber"
          onToggle={(v) => handleToggle("focus_mode", v, 2)}
        />

        {/* Focus Mode Alert */}
        <AnimatePresence>
          {settings?.focus_mode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden -mx-5"
            >
              <div className="flex items-center gap-2.5 px-5 py-3 bg-[hsl(40,100%,50%)]/[0.07] border-t border-[hsl(40,100%,50%)]/20">
                <AlertCircle className="h-4 w-4 text-[hsl(40,100%,50%)] animate-pulse flex-shrink-0" />
                <span className="font-mono text-[10px] text-[hsl(40,100%,50%)] tracking-[0.1em]">
                  ⚠ FOCUS MODE ACTIF — TOUTES LES ALERTES SONT SILENCIÉES
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DataPanel>

      {/* ── Terminal Log ── */}
      <TerminalLog lines={logLines} />

      <div className="h-8" />
    </ProfileSettingsShell>
  );
}
