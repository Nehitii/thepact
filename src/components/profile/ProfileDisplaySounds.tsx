import { Monitor, Volume2, Palette, Sparkles } from "lucide-react";

export function ProfileDisplaySounds() {
  return (
    <div className="space-y-6">
      {/* Visual Settings Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
        <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
            <h2 className="text-xl font-orbitron font-semibold text-primary">
              Visual Settings
            </h2>
          </div>
          
          <p className="text-sm text-muted-foreground font-rajdhani">
            Customize themes, animations, and visual effects.
          </p>
          
          {/* Coming Soon Indicator */}
          <div className="flex items-center justify-center py-6">
            <div className="relative">
              <div className="absolute inset-0 blur-lg bg-primary/20 rounded-full" />
              <span 
                className="relative text-sm font-orbitron font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#5bb4ff] via-[#8ACBFF] to-[#5bb4ff] uppercase tracking-widest"
                style={{
                  textShadow: '0 0 20px rgba(91, 180, 255, 0.4)'
                }}
              >
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sound Settings Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
        <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
            <h2 className="text-xl font-orbitron font-semibold text-primary">
              Sound Settings
            </h2>
          </div>
          
          <p className="text-sm text-muted-foreground font-rajdhani">
            Control audio feedback, notifications, and ambient sounds.
          </p>
          
          {/* Coming Soon Indicator */}
          <div className="flex items-center justify-center py-6">
            <div className="relative">
              <div className="absolute inset-0 blur-lg bg-primary/20 rounded-full" />
              <span 
                className="relative text-sm font-orbitron font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#5bb4ff] via-[#8ACBFF] to-[#5bb4ff] uppercase tracking-widest"
                style={{
                  textShadow: '0 0 20px rgba(91, 180, 255, 0.4)'
                }}
              >
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Effects Settings Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
        <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
            <h2 className="text-xl font-orbitron font-semibold text-primary">
              Particle Effects
            </h2>
          </div>
          
          <p className="text-sm text-muted-foreground font-rajdhani">
            Adjust particle density, glow intensity, and special effects.
          </p>
          
          {/* Coming Soon Indicator */}
          <div className="flex items-center justify-center py-6">
            <div className="relative">
              <div className="absolute inset-0 blur-lg bg-primary/20 rounded-full" />
              <span 
                className="relative text-sm font-orbitron font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#5bb4ff] via-[#8ACBFF] to-[#5bb4ff] uppercase tracking-widest"
                style={{
                  textShadow: '0 0 20px rgba(91, 180, 255, 0.4)'
                }}
              >
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <p className="text-center text-sm text-primary/50 font-rajdhani">
        These features are in development. Stay tuned for updates.
      </p>
    </div>
  );
}