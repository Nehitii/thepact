import { Shield, Eye, Bell, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { Card } from "@/components/ui/card";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function PrivacyControl() {
  const { t } = useTranslation();
  const { profile, isLoading, updateProfile } = useProfileSettings();

  const labelStyle = "text-foreground font-rajdhani text-base";
  const descriptionStyle = "text-sm text-muted-foreground font-rajdhani";

  type PrivacyKey = 
    | "community_profile_discoverable" 
    | "show_activity_status" 
    | "share_goals_progress" 
    | "share_achievements" 
    | "community_updates_enabled" 
    | "achievement_celebrations_enabled";

  const toggle = (key: PrivacyKey, value: boolean) => {
    updateProfile.mutate(
      { [key]: value },
      {
        onSuccess: () => {
          toast({
            title: t("settings.privacy.toasts.updated"),
            description: t("settings.privacy.toasts.updatedDesc"),
          });
        },
      }
    );
  };

  return (
    <ProfileSettingsShell
      title={t("settings.privacy.title")}
      subtitle={t("settings.privacy.subtitle")}
      icon={<Shield className="h-7 w-7 text-primary" />}
      containerClassName="max-w-2xl"
    >
      <div className="space-y-6">
        <Card variant="clean" className="shop-card bg-card/70 border-primary/20">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-orbitron font-semibold text-primary">
                {t("settings.privacy.communityVisibility")}
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-primary/10">
                <div className="space-y-1">
                  <Label className={labelStyle}>{t("settings.privacy.profileDiscoverable")}</Label>
                  <p className={descriptionStyle}>{t("settings.privacy.profileDiscoverableDesc")}</p>
                </div>
                <Switch
                  checked={profile?.community_profile_discoverable ?? true}
                  onCheckedChange={(v) => toggle("community_profile_discoverable", v)}
                  disabled={isLoading || updateProfile.isPending}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <Label className={labelStyle}>{t("settings.privacy.showActivityStatus")}</Label>
                  <p className={descriptionStyle}>{t("settings.privacy.showActivityStatusDesc")}</p>
                </div>
                <Switch
                  checked={profile?.show_activity_status ?? true}
                  onCheckedChange={(v) => toggle("show_activity_status", v)}
                  disabled={isLoading || updateProfile.isPending}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card variant="clean" className="shop-card bg-card/70 border-primary/20">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-orbitron font-semibold text-primary">
                {t("settings.privacy.goalVisibility")}
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-primary/10">
                <div className="space-y-1">
                  <Label className={labelStyle}>{t("settings.privacy.shareGoalsProgress")}</Label>
                  <p className={descriptionStyle}>{t("settings.privacy.shareGoalsProgressDesc")}</p>
                </div>
                <Switch
                  checked={profile?.share_goals_progress ?? true}
                  onCheckedChange={(v) => toggle("share_goals_progress", v)}
                  disabled={isLoading || updateProfile.isPending}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <Label className={labelStyle}>{t("settings.privacy.shareAchievements")}</Label>
                  <p className={descriptionStyle}>{t("settings.privacy.shareAchievementsDesc")}</p>
                </div>
                <Switch
                  checked={profile?.share_achievements ?? true}
                  onCheckedChange={(v) => toggle("share_achievements", v)}
                  disabled={isLoading || updateProfile.isPending}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card variant="clean" className="shop-card bg-card/70 border-primary/20">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-orbitron font-semibold text-primary">
                {t("settings.privacy.communityNotifications")}
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-primary/10">
                <div className="space-y-1">
                  <Label className={labelStyle}>{t("settings.privacy.communityUpdates")}</Label>
                  <p className={descriptionStyle}>{t("settings.privacy.communityUpdatesDesc")}</p>
                </div>
                <Switch
                  checked={profile?.community_updates_enabled ?? true}
                  onCheckedChange={(v) => toggle("community_updates_enabled", v)}
                  disabled={isLoading || updateProfile.isPending}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <Label className={labelStyle}>{t("settings.privacy.achievementCelebrations")}</Label>
                  <p className={descriptionStyle}>{t("settings.privacy.achievementCelebrationsDesc")}</p>
                </div>
                <Switch
                  checked={profile?.achievement_celebrations_enabled ?? true}
                  onCheckedChange={(v) => toggle("achievement_celebrations_enabled", v)}
                  disabled={isLoading || updateProfile.isPending}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ProfileSettingsShell>
  );
}
