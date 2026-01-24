import { Bell, Volume2, MessageSquare, Gift, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNotificationSettings } from "@/hooks/useNotifications";
import { toast } from "@/hooks/use-toast";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { Card } from "@/components/ui/card";

export default function NotificationSettings() {
  const { settings, isLoading, updateSettings } = useNotificationSettings();

  const labelStyle = "text-foreground font-rajdhani text-base";
  const descriptionStyle = "text-sm text-muted-foreground font-rajdhani";

  const handleToggle = (key: string, value: boolean) => {
    updateSettings.mutate({ [key]: value }, {
      onSuccess: () => {
        toast({
          title: "Settings updated",
          description: "Your notification preferences have been saved.",
        });
      },
    });
  };

  return (
    <ProfileSettingsShell
      title="Notifications"
      subtitle="Control how you receive updates"
      icon={<Bell className="h-7 w-7 text-primary" />}
      containerClassName="max-w-2xl"
    >
      <div className="space-y-6">
        <Card variant="clean" className="shop-card bg-card/70 border-primary/20">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-orbitron font-semibold text-primary">
                Notification Categories
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-primary/10">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary/70 mt-0.5" />
                  <div className="space-y-1">
                    <Label className={labelStyle}>System Notifications</Label>
                    <p className={descriptionStyle}>
                      Updates, new features, patch notes, system notices
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings?.system_enabled ?? true}
                  onCheckedChange={(checked) => handleToggle("system_enabled", checked)}
                  disabled={isLoading || updateSettings.isPending}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-primary/10">
                <div className="flex items-start gap-3">
                  <Volume2 className="h-5 w-5 text-primary/70 mt-0.5" />
                  <div className="space-y-1">
                    <Label className={labelStyle}>Progress & Engagement</Label>
                    <p className={descriptionStyle}>
                      Achievements, goal completions, streaks, milestones
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings?.progress_enabled ?? true}
                  onCheckedChange={(checked) => handleToggle("progress_enabled", checked)}
                  disabled={isLoading || updateSettings.isPending}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-primary/10">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-primary/70 mt-0.5" />
                  <div className="space-y-1">
                    <Label className={labelStyle}>Social Notifications</Label>
                    <p className={descriptionStyle}>Private messages, replies, mentions</p>
                  </div>
                </div>
                <Switch
                  checked={settings?.social_enabled ?? true}
                  onCheckedChange={(checked) => handleToggle("social_enabled", checked)}
                  disabled={isLoading || updateSettings.isPending}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-start gap-3">
                  <Gift className="h-5 w-5 text-primary/70 mt-0.5" />
                  <div className="space-y-1">
                    <Label className={labelStyle}>Marketing & Gifts</Label>
                    <p className={descriptionStyle}>Promo codes, gifts, special offers</p>
                  </div>
                </div>
                <Switch
                  checked={settings?.marketing_enabled ?? true}
                  onCheckedChange={(checked) => handleToggle("marketing_enabled", checked)}
                  disabled={isLoading || updateSettings.isPending}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ProfileSettingsShell>
  );
}
