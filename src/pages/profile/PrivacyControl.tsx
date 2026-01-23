import { Shield, Eye, Bell, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { Card } from "@/components/ui/card";

export default function PrivacyControl() {

  // Luminous label style for consistency and readability
  const labelStyle = "text-foreground font-rajdhani text-base";
  const descriptionStyle = "text-sm text-muted-foreground font-rajdhani";

  return (
    <ProfileSettingsShell
      title="Privacy & Control"
      subtitle="Manage your visibility and notifications"
      icon={<Shield className="h-7 w-7 text-primary" />}
      containerClassName="max-w-2xl"
    >
      <div className="space-y-6">
        <Card variant="clean" className="shop-card bg-card/70 border-primary/20">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-orbitron font-semibold text-primary">Community Visibility</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-primary/10">
                <div className="space-y-1">
                  <Label className={labelStyle}>Profile Discoverable</Label>
                  <p className={descriptionStyle}>Allow others to find your profile in community</p>
                </div>
                <Switch disabled />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <Label className={labelStyle}>Show Activity Status</Label>
                  <p className={descriptionStyle}>Display when you're active</p>
                </div>
                <Switch disabled />
              </div>
            </div>
          </div>
        </Card>

        <Card variant="clean" className="shop-card bg-card/70 border-primary/20">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-orbitron font-semibold text-primary">Goal Visibility</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-primary/10">
                <div className="space-y-1">
                  <Label className={labelStyle}>Share Goals Progress</Label>
                  <p className={descriptionStyle}>Allow community members to see your goals</p>
                </div>
                <Switch disabled />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <Label className={labelStyle}>Share Achievements</Label>
                  <p className={descriptionStyle}>Display earned achievements publicly</p>
                </div>
                <Switch disabled />
              </div>
            </div>
          </div>
        </Card>

        <Card variant="clean" className="shop-card bg-card/70 border-primary/20">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-orbitron font-semibold text-primary">Community Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-primary/10">
                <div className="space-y-1">
                  <Label className={labelStyle}>Community Updates</Label>
                  <p className={descriptionStyle}>Receive updates from community members</p>
                </div>
                <Switch disabled />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <Label className={labelStyle}>Achievement Celebrations</Label>
                  <p className={descriptionStyle}>Get notified of others' achievements</p>
                </div>
                <Switch disabled />
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center py-2 text-sm text-muted-foreground font-rajdhani">
          <p>These features are coming soon. Settings will be saved when available.</p>
        </div>
      </div>
    </ProfileSettingsShell>
  );
}