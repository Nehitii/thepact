import { useState, useCallback, useRef } from "react";
import { Bell, Zap, Volume2, MessageSquare, Gift, AlertCircle, Loader2, Clock } from "lucide-react";
import { useNotificationSettings } from "@/hooks/useNotifications";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SettingsPageShell, CyberPanel, SettingRow, SettingContentRow, SyncIndicator, StickyCommandBar,
} from "@/components/profile/settings-ui";

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: `${String(i).padStart(2, "0")}:00`,
  label: `${String(i).padStart(2, "0")}:00`,
}));

export default function NotificationSettings() {
  const { t } = useTranslation();
  const { settings, isLoading, updateSettings } = useNotificationSettings();
  const [syncingPanel, setSyncingPanel] = useState<number | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>();
  const [latestLog, setLatestLog] = useState<{ text: string; type: "ok" | "warn" | "info" }>({ text: "NOTIFICATION SETTINGS LOADED", type: "info" });

  const markSync = useCallback((panel: number) => {
    setSyncingPanel(panel);
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => setSyncingPanel(null), 2000);
  }, []);

  const handleToggle = useCallback((key: string, value: boolean, panel: number) => {
    updateSettings.mutate({ [key]: value }, {
      onSuccess: () => {
        toast({ title: t("settings.notifications.toasts.updated"), description: t("settings.notifications.toasts.updatedDesc") });
        const labelMap: Record<string, string> = {
          system_enabled: "SYSTEM_ALERTS", progress_enabled: "PROGRESS_ALERTS",
          social_enabled: "SOCIAL_ALERTS", marketing_enabled: "MARKETING_ALERTS",
          push_enabled: "PUSH_SERVICE", focus_mode: "FOCUS_MODE",
        };
        setLatestLog({ text: `${labelMap[key] || key.toUpperCase()}: ${value ? "ENABLED" : "DISABLED"}`, type: value ? "ok" : "warn" });
        markSync(panel);
      },
    });
  }, [updateSettings, t, markSync]);

  const handleQuietHoursChange = useCallback((key: string, value: string | null) => {
    updateSettings.mutate({ [key]: value || null } as any, {
      onSuccess: () => {
        toast({ title: t("common.updated"), description: t("settings.notifications.quietHoursUpdated") || "Heures calmes mises à jour." });
        setLatestLog({ text: `QUIET_HOURS ${key.includes("start") ? "START" : "END"}: ${value || "DISABLED"}`, type: value ? "ok" : "warn" });
        markSync(3);
      },
    });
  }, [updateSettings, t, markSync]);

  const isPending = isLoading || updateSettings.isPending;
  const categoryKeys = ["system_enabled", "progress_enabled", "social_enabled", "marketing_enabled"] as const;
  const activeCount = categoryKeys.filter(k => settings?.[k] ?? true).length;

  const quietStart = (settings as any)?.quiet_hours_start || "";
  const quietEnd = (settings as any)?.quiet_hours_end || "";
  const quietActive = !!quietStart && !!quietEnd;

  if (isLoading) {
    return (
      <SettingsPageShell title={t("settings.notifications.title")} subtitle={t("settings.notifications.subtitle")} icon={<Bell className="h-7 w-7 text-primary" />}>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title={t("settings.notifications.title")}
      subtitle={t("settings.notifications.subtitle")}
      icon={<Bell className="h-7 w-7 text-primary" />}
      stickyBar={<StickyCommandBar latestLog={latestLog} />}
    >
      <CyberPanel title="FLUX D'ALERTES" statusText={<span className={cn(activeCount < 2 ? "text-destructive" : activeCount < 4 ? "text-[hsl(40,100%,50%)]" : "text-muted-foreground")}>{activeCount}/4 ACTIFS</span>}>
        <SettingRow icon={<Zap className="h-4 w-4 text-primary" />} label={t("settings.notifications.system")} description={t("settings.notifications.systemDesc")} checked={settings?.system_enabled ?? true} disabled={isPending} onToggle={(v) => handleToggle("system_enabled", v, 1)} />
        <SettingRow icon={<Volume2 className="h-4 w-4 text-primary" />} label={t("settings.notifications.progress")} description={t("settings.notifications.progressDesc")} checked={settings?.progress_enabled ?? true} disabled={isPending} onToggle={(v) => handleToggle("progress_enabled", v, 1)} />
        <SettingRow icon={<MessageSquare className="h-4 w-4 text-primary" />} label={t("settings.notifications.social")} description={t("settings.notifications.socialDesc")} checked={settings?.social_enabled ?? true} disabled={isPending} onToggle={(v) => handleToggle("social_enabled", v, 1)} />
        <SettingRow icon={<Gift className="h-4 w-4 text-primary" />} label={t("settings.notifications.marketing")} description={t("settings.notifications.marketingDesc")} checked={settings?.marketing_enabled ?? true} disabled={isPending} onToggle={(v) => handleToggle("marketing_enabled", v, 1)} />
      </CyberPanel>

      <CyberPanel title="CONTRÔLES SYSTÈME" statusText={<SyncIndicator syncing={syncingPanel === 2} />}>
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
      </CyberPanel>

      {/* ── PANEL 3: Quiet Hours ── */}
      <CyberPanel title="HEURES CALMES" statusText={<span className={cn(quietActive ? "text-[hsl(195,100%,50%)]" : "text-muted-foreground")}>{quietActive ? "ACTIF" : "INACTIF"}</span>}>
        <SettingContentRow icon={<Clock className="h-4 w-4 text-primary" />} label="Mode Ne Pas Déranger" description="Désactive les notifications push pendant une plage horaire définie">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase tracking-[0.2em] text-primary/40 font-mono font-semibold">Début</span>
              <Select value={quietStart || "none"} onValueChange={(v) => handleQuietHoursChange("quiet_hours_start", v === "none" ? null : v)}>
                <SelectTrigger className="h-9 font-mono text-xs border-primary/20 bg-primary/5 rounded-none">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20 rounded-none">
                  <SelectItem value="none" className="font-mono text-xs">— Désactivé</SelectItem>
                  {HOURS.map((h) => <SelectItem key={h.value} value={h.value} className="font-mono text-xs">{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase tracking-[0.2em] text-primary/40 font-mono font-semibold">Fin</span>
              <Select value={quietEnd || "none"} onValueChange={(v) => handleQuietHoursChange("quiet_hours_end", v === "none" ? null : v)}>
                <SelectTrigger className="h-9 font-mono text-xs border-primary/20 bg-primary/5 rounded-none">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20 rounded-none">
                  <SelectItem value="none" className="font-mono text-xs">— Désactivé</SelectItem>
                  {HOURS.map((h) => <SelectItem key={h.value} value={h.value} className="font-mono text-xs">{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingContentRow>
      </CyberPanel>
    </SettingsPageShell>
  );
}
