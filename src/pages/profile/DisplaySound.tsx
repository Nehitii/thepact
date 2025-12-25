import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileDisplaySounds } from "@/components/profile/ProfileDisplaySounds";

export default function DisplaySound() {
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

          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron">
            Display & Sound
          </h1>
          <p className="text-primary/70 tracking-wide font-rajdhani">
            Customize your visual and audio experience
          </p>
        </div>

        {/* Content */}
        <ProfileDisplaySounds />
      </div>
    </div>
  );
}
