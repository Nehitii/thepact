import { ArrowLeft, Bell, Volume2, MessageSquare, Gift, Zap, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNotificationSettings } from "@/hooks/useNotifications";
import { toast } from "@/hooks/use-toast";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { settings, isLoading, updateSettings } = useNotificationSettings();

  const labelStyle = "text-[#e0f0ff] font-rajdhani text-base drop-shadow-[0_0_4px_rgba(224,240,255,0.3)]";
  const descriptionStyle = "text-sm text-[#8ACBFF]/80 font-rajdhani";

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
    <div className="min-h-screen bg-[#00050B] relative overflow-hidden">
      {/* Deep space background with radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="pt-8 space-y-4 animate-fade-in">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 text-primary/70 hover:text-primary transition-colors font-rajdhani"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Profile</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-xl blur-lg" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl border border-primary/40 flex items-center justify-center">
                <Bell className="h-7 w-7 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.8)]" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron">
                Notifications
              </h1>
              <p className="text-primary/70 tracking-wide font-rajdhani">
                Control how you receive updates
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Focus Mode */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-primary/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-amber-500/30 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-amber-400">
                  Focus Mode
                </h2>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <Label className={labelStyle}>
                    Enable Focus Mode
                  </Label>
                  <p className={descriptionStyle}>
                    Only critical notifications will come through. Everything else queues silently.
                  </p>
                </div>
                <Switch
                  checked={settings?.focus_mode ?? false}
                  onCheckedChange={(checked) => handleToggle("focus_mode", checked)}
                  disabled={isLoading || updateSettings.isPending}
                />
              </div>
            </div>
          </div>

          {/* Notification Categories */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-primary">
                  Notification Categories
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary/70 mt-0.5" />
                    <div className="space-y-1">
                      <Label className={labelStyle}>
                        System Notifications
                      </Label>
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
                      <Label className={labelStyle}>
                        Progress & Engagement
                      </Label>
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
                    <MessageSquare className="h-5 w-5 text-violet-400 mt-0.5" />
                    <div className="space-y-1">
                      <Label className={labelStyle}>
                        Social Notifications
                      </Label>
                      <p className={descriptionStyle}>
                        Private messages, replies, mentions
                      </p>
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
                    <Gift className="h-5 w-5 text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <Label className={labelStyle}>
                        Marketing & Gifts
                      </Label>
                      <p className={descriptionStyle}>
                        Promo codes, gifts, special offers
                      </p>
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
          </div>

          {/* Delivery Channels */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-primary">
                  Delivery Channels
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                  <div className="space-y-1">
                    <Label className={labelStyle}>
                      In-App Notifications
                    </Label>
                    <p className={descriptionStyle}>
                      Always enabled — badges and hub entries
                    </p>
                  </div>
                  <Switch checked disabled className="opacity-50" />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="space-y-1">
                    <Label className={labelStyle}>
                      Push Notifications
                    </Label>
                    <p className={descriptionStyle}>
                      Receive notifications on your device
                    </p>
                  </div>
                  <Switch
                    checked={settings?.push_enabled ?? false}
                    onCheckedChange={(checked) => handleToggle("push_enabled", checked)}
                    disabled={isLoading || updateSettings.isPending}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info Notice */}
          <div className="text-center py-4 text-sm text-primary/50 font-rajdhani">
            <p>Email notifications for security events will be added in a future update.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
