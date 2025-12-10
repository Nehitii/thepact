import { Navigation } from "@/components/Navigation";
import { CyberBackground } from "@/components/CyberBackground";
import { Users, Sparkles } from "lucide-react";

export default function Community() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-24">
        {/* Glowing orb container */}
        <div className="relative mb-8">
          {/* Outer glow */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150" />
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-125 animate-pulse" />
          
          {/* Icon container */}
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/40 flex items-center justify-center shadow-[0_0_60px_rgba(91,180,255,0.3)]">
            <div className="absolute inset-[3px] rounded-full border border-primary/20" />
            <Users className="w-14 h-14 text-primary drop-shadow-[0_0_20px_rgba(91,180,255,0.8)]" />
            
            {/* Floating sparkles */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary/60 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-primary/40 animate-pulse delay-300" />
          </div>
        </div>

        {/* Text content */}
        <div className="text-center space-y-4">
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-foreground tracking-wider">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(91,180,255,0.5)]">
              COMMUNITY
            </span>
          </h1>
          
          <div className="relative">
            <p className="font-orbitron text-lg md:text-xl text-primary/80 tracking-[0.3em] uppercase">
              Coming Soon
            </p>
            {/* Underline accent */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          </div>
          
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mt-6 leading-relaxed">
            Connect with fellow seekers. Together, we rise beyond limits.
          </p>
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
        <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
        <div className="absolute bottom-24 left-8 w-16 h-16 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
        <div className="absolute bottom-24 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-lg" />
      </div>

      <Navigation />
    </div>
  );
}
