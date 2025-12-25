import { ArrowLeft, Shield, Eye, Bell, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function PrivacyControl() {
  const navigate = useNavigate();

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
                <Shield className="h-7 w-7 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.8)]" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron">
                Privacy & Control
              </h1>
              <p className="text-primary/70 tracking-wide font-rajdhani">
                Manage your visibility and notifications
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Community Visibility */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-primary">
                  Community Visibility
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                  <div className="space-y-1">
                    <Label className="text-foreground font-rajdhani text-base">
                      Profile Discoverable
                    </Label>
                    <p className="text-sm text-muted-foreground font-rajdhani">
                      Allow others to find your profile in community
                    </p>
                  </div>
                  <Switch disabled />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                  <div className="space-y-1">
                    <Label className="text-foreground font-rajdhani text-base">
                      Show Activity Status
                    </Label>
                    <p className="text-sm text-muted-foreground font-rajdhani">
                      Display when you're active
                    </p>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </div>
          </div>

          {/* Goal Visibility */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-primary">
                  Goal Visibility
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                  <div className="space-y-1">
                    <Label className="text-foreground font-rajdhani text-base">
                      Share Goals Progress
                    </Label>
                    <p className="text-sm text-muted-foreground font-rajdhani">
                      Allow community members to see your goals
                    </p>
                  </div>
                  <Switch disabled />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                  <div className="space-y-1">
                    <Label className="text-foreground font-rajdhani text-base">
                      Share Achievements
                    </Label>
                    <p className="text-sm text-muted-foreground font-rajdhani">
                      Display earned achievements publicly
                    </p>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Controls */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-primary">
                  Community Notifications
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-primary/10">
                  <div className="space-y-1">
                    <Label className="text-foreground font-rajdhani text-base">
                      Community Updates
                    </Label>
                    <p className="text-sm text-muted-foreground font-rajdhani">
                      Receive updates from community members
                    </p>
                  </div>
                  <Switch disabled />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="space-y-1">
                    <Label className="text-foreground font-rajdhani text-base">
                      Achievement Celebrations
                    </Label>
                    <p className="text-sm text-muted-foreground font-rajdhani">
                      Get notified of others' achievements
                    </p>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="text-center py-6 text-sm text-primary/50 font-rajdhani">
            <p>These features are coming soon. Settings will be saved when available.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
