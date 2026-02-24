import { useState, useCallback, useRef } from "react";
import { Bell, Zap, Volume2, MessageSquare, Gift, AlertCircle, Loader2 } from "lucide-react";
import { useNotificationSettings } from "@/hooks/useNotifications";
import { toast } from "@/hooks/use-toast";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  SettingsBreadcrumb, CyberSeparator, DataPanel, SettingRow, SyncIndicator, TerminalLog,
} from "@/components/profile/settings-ui";

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
        toast({ title: t("settings.notifications.toasts.updated"), description: t("settings.notifications.toasts.updatedDesc") });
        const labelMap: Record<string, string> = {
          system_enabled: "SYSTEM_ALERTS", progress_enabled: "PROGRESS_ALERTS",
          social_enabled: "SOCIAL_ALERTS", marketing_enabled: "MARKETING_ALERTS",
          push_enabled: "PUSH_SERVICE", focus_mode: "FOCUS_MODE",
        };
        addLog(`${labelMap[key] || key.toUpperCase()}: ${value ? "ENABLED" : "DISABLED"}`, value ? "ok" : "warn");
        setSyncingPanel(panel);
        clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => setSyncingPanel(null), 2000);
      },
    });
  }, [updateSettings, t, addLog]);

  const isPending = isLoading || updateSettings.isPending;
  const categoryKeys = ["system_enabled", "progress_enabled", "social_enabled", "marketing_enabled"] as const;
  const activeCount = categoryKeys.filter(k => settings?.[k] ?? true).length;

  if (isLoading) {
    return (
      <ProfileSettingsShell title={t("settings.notifications.title")} subtitle={t("settings.notifications.subtitle")} icon={<Bell className="h-7 w-7 text-primary" />} containerClassName="max-w-3xl">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </ProfileSettingsShell>
    );
  }

  return (
    <ProfileSettingsShell title={t("settings.notifications.title")} subtitle={t("settings.notifications.subtitle")} icon={<Bell className="h-7 w-7 text-primary" />} containerClassName="max-w-3xl">
      <SettingsBreadcrumb code="NTF.04" />
      <CyberSeparator />

      <DataPanel
        code="MODULE_01" title="FLUX D'ALERTES"
        statusText={<span className={cn(activeCount < 2 ? "text-destructive" : activeCount < 4 ? "text-[hsl(40,100%,50%)]" : "text-muted-foreground")}>{activeCount}/4 ACTIFS</span>}
        footerLeft={<><span>ACTIFS: <b className="text-primary">{activeCount}</b></span><span>TOTAL: <b className="text-primary">4</b></span></>}
        footerRight={<SyncIndicator syncing={syncingPanel === 1} />}
      >
        <SettingRow icon={<Zap className="h-4 w-4 text-primary" />} label={t("settings.notifications.system")} description={t("settings.notifications.systemDesc")} checked={settings?.system_enabled ?? true} disabled={isPending} onToggle={(v) => handleToggle("system_enabled", v, 1)} />
        <SettingRow icon={<Volume2 className="h-4 w-4 text-primary" />} label={t("settings.notifications.progress")} description={t("settings.notifications.progressDesc")} checked={settings?.progress_enabled ?? true} disabled={isPending} onToggle={(v) => handleToggle("progress_enabled", v, 1)} />
        <SettingRow icon={<MessageSquare className="h-4 w-4 text-primary" />} label={t("settings.notifications.social")} description={t("settings.notifications.socialDesc")} checked={settings?.social_enabled ?? true} disabled={isPending} onToggle={(v) => handleToggle("social_enabled", v, 1)} />
        <SettingRow icon={<Gift className="h-4 w-4 text-primary" />} label={t("settings.notifications.marketing")} description={t("settings.notifications.marketingDesc")} checked={settings?.marketing_enabled ?? true} disabled={isPending} onToggle={(v) => handleToggle("marketing_enabled", v, 1)} />
      </DataPanel>

      <DataPanel
        code="MODULE_02" title="CONTRÔLES SYSTÈME"
        footerLeft={<><span>PUSH: <b className={cn(settings?.push_enabled !== false ? "text-[hsl(195,100%,50%)]" : "text-muted-foreground")}>{settings?.push_enabled !== false ? "ON" : "OFF"}</b></span><span>FOCUS: <b className={cn(settings?.focus_mode ? "text-[hsl(40,100%,50%)]" : "text-muted-foreground")}>{settings?.focus_mode ? "ON" : "OFF"}</b></span></>}
        footerRight={<SyncIndicator syncing={syncingPanel === 2} />}
      >
        <SettingRow icon={<Bell className="h-4 w-4 text-[hsl(195,100%,50%)]" />} label={t("settings.notifications.pushEnabled")} description={t("settings.notifications.pushEnabledDesc")} checked={settings?.push_enabled ?? true} disabled={isPending} variant="cyan" onToggle={(v) => handleToggle("push_enabled", v, 2)} />
        <SettingRow icon={<AlertCircle className="h-4 w-4 text-[hsl(40,100%,50%)]" />} label={t("settings.notifications.focusMode")} description={t("settings.notifications.focusModeDesc")} checked={settings?.focus_mode ?? false} disabled={isPending} variant="amber" onToggle={(v) => handleToggle("focus_mode", v, 2)} />
        <AnimatePresence>
          {settings?.focus_mode && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden -mx-5">
              <div className="flex items-center gap-2.5 px-5 py-3 bg-[hsl(40,100%,50%)]/[0.07] border-t border-[hsl(40,100%,50%)]/20">
                <AlertCircle className="h-4 w-4 text-[hsl(40,100%,50%)] animate-pulse flex-shrink-0" />
                <span className="font-mono text-[10px] text-[hsl(40,100%,50%)] tracking-[0.1em]">⚠ FOCUS MODE ACTIF — TOUTES LES ALERTES SONT SILENCIÉES</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DataPanel>

      <TerminalLog lines={logLines} />
      <div className="h-8" />
    </ProfileSettingsShell>
  );
}
