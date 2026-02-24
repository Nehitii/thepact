import { useCallback, useRef, useState } from "react";
import { Shield, Eye, Bell, Users, Award, Loader2 } from "lucide-react";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { toast } from "@/hooks/use-toast";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  SettingsBreadcrumb, CyberSeparator, DataPanel, SettingRow, SyncIndicator,
} from "@/components/profile/settings-ui";

export default function PrivacyControl() {
  const { t } = useTranslation();
  const { profile, isLoading, updateProfile } = useProfileSettings();
  const [syncingPanel, setSyncingPanel] = useState<number | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>();

  const markSync = useCallback((panel: number) => {
    setSyncingPanel(panel);
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => setSyncingPanel(null), 2000);
  }, []);

  type PrivacyKey =
    | "community_profile_discoverable"
    | "show_activity_status"
    | "share_goals_progress"
    | "share_achievements"
    | "community_updates_enabled"
    | "achievement_celebrations_enabled";

  const toggle = useCallback((key: PrivacyKey, value: boolean, panel: number) => {
    updateProfile.mutate(
      { [key]: value },
      {
        onSuccess: () => {
          toast({ title: t("settings.privacy.toasts.updated"), description: t("settings.privacy.toasts.updatedDesc") });
          markSync(panel);
        },
      }
    );
  }, [updateProfile, t, markSync]);

  const isPending = isLoading || updateProfile.isPending;

  // Stats
  const visibilityOn = [profile?.community_profile_discoverable ?? true, profile?.show_activity_status ?? true].filter(Boolean).length;
  const sharingOn = [profile?.share_goals_progress ?? true, profile?.share_achievements ?? true].filter(Boolean).length;

  if (isLoading) {
    return (
      <ProfileSettingsShell title={t("settings.privacy.title")} subtitle={t("settings.privacy.subtitle")} icon={<Shield className="h-7 w-7 text-primary" />} containerClassName="max-w-3xl">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </ProfileSettingsShell>
    );
  }

  return (
    <ProfileSettingsShell title={t("settings.privacy.title")} subtitle={t("settings.privacy.subtitle")} icon={<Shield className="h-7 w-7 text-primary" />} containerClassName="max-w-3xl">
      <SettingsBreadcrumb code="PRV.05" />
      <CyberSeparator />

      {/* ── PANEL 1: Community Visibility ── */}
      <DataPanel
        code="MODULE_01" title="VISIBILITÉ COMMUNAUTAIRE"
        statusText={<span className={cn(visibilityOn === 2 ? "text-muted-foreground" : "text-[hsl(40,100%,50%)]")}>{visibilityOn}/2 ACTIFS</span>}
        footerLeft={<span>VISIBLE: <b className="text-primary">{visibilityOn}/2</b></span>}
        footerRight={<SyncIndicator syncing={syncingPanel === 1} />}
      >
        <SettingRow icon={<Users className="h-4 w-4 text-primary" />} label={t("settings.privacy.profileDiscoverable")} description={t("settings.privacy.profileDiscoverableDesc")} checked={profile?.community_profile_discoverable ?? true} disabled={isPending} onToggle={(v) => toggle("community_profile_discoverable", v, 1)} />
        <SettingRow icon={<Eye className="h-4 w-4 text-primary" />} label={t("settings.privacy.showActivityStatus")} description={t("settings.privacy.showActivityStatusDesc")} checked={profile?.show_activity_status ?? true} disabled={isPending} onToggle={(v) => toggle("show_activity_status", v, 1)} />
      </DataPanel>

      {/* ── PANEL 2: Goal Visibility ── */}
      <DataPanel
        code="MODULE_02" title="VISIBILITÉ DES OBJECTIFS"
        statusText={<span className={cn(sharingOn === 2 ? "text-muted-foreground" : "text-[hsl(40,100%,50%)]")}>{sharingOn}/2 ACTIFS</span>}
        footerLeft={<span>PARTAGE: <b className="text-primary">{sharingOn}/2</b></span>}
        footerRight={<SyncIndicator syncing={syncingPanel === 2} />}
      >
        <SettingRow icon={<Eye className="h-4 w-4 text-primary" />} label={t("settings.privacy.shareGoalsProgress")} description={t("settings.privacy.shareGoalsProgressDesc")} checked={profile?.share_goals_progress ?? true} disabled={isPending} onToggle={(v) => toggle("share_goals_progress", v, 2)} />
        <SettingRow icon={<Award className="h-4 w-4 text-primary" />} label={t("settings.privacy.shareAchievements")} description={t("settings.privacy.shareAchievementsDesc")} checked={profile?.share_achievements ?? true} disabled={isPending} onToggle={(v) => toggle("share_achievements", v, 2)} />
      </DataPanel>

      {/* ── PANEL 3: Community Notifications ── */}
      <DataPanel
        code="MODULE_03" title="NOTIFICATIONS COMMUNAUTAIRES"
        footerRight={<SyncIndicator syncing={syncingPanel === 3} />}
      >
        <SettingRow icon={<Bell className="h-4 w-4 text-primary" />} label={t("settings.privacy.communityUpdates")} description={t("settings.privacy.communityUpdatesDesc")} checked={profile?.community_updates_enabled ?? true} disabled={isPending} onToggle={(v) => toggle("community_updates_enabled", v, 3)} />
        <SettingRow icon={<Award className="h-4 w-4 text-primary" />} label={t("settings.privacy.achievementCelebrations")} description={t("settings.privacy.achievementCelebrationsDesc")} checked={profile?.achievement_celebrations_enabled ?? true} disabled={isPending} onToggle={(v) => toggle("achievement_celebrations_enabled", v, 3)} />
      </DataPanel>

      <div className="h-8" />
    </ProfileSettingsShell>
  );
}
