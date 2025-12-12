import { ProfileMenuCard } from "./ProfileMenuCard";
import { Monitor } from "lucide-react";

export function ProfileDisplaySounds() {
  return (
    <ProfileMenuCard
      icon={<Monitor className="h-5 w-5 text-primary" />}
      title="Display & Sounds"
      description="Customize your visual and audio experience"
    >
      <div className="flex flex-col items-center justify-center py-8 px-4">
        {/* Coming Soon Container */}
        <div className="relative">
          {/* Glow effect behind text */}
          <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
          
          {/* Main text */}
          <h3 
            className="relative text-2xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#5bb4ff] via-[#8ACBFF] to-[#5bb4ff] uppercase tracking-widest"
            style={{
              textShadow: '0 0 30px rgba(91, 180, 255, 0.6), 0 0 60px rgba(91, 180, 255, 0.3)'
            }}
          >
            Coming Soon
          </h3>
        </div>
        
        {/* Subtitle */}
        <p className="mt-4 text-[#6b9ec4] text-sm font-rajdhani tracking-wide text-center">
          Visual themes, sound effects, and more
        </p>
        
        {/* Animated scan line */}
        <div className="mt-6 w-32 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse" />
      </div>
    </ProfileMenuCard>
  );
}
