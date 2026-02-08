"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState, useEffect, useRef } from "react";
import { X, Volume2, VolumeX } from "lucide-react";

interface DevilNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showSecretSymbol?: boolean;
}

export function DevilNoteModal({ open, onOpenChange, showSecretSymbol = false }: DevilNoteModalProps) {
  const [revealed, setRevealed] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const ambientSoundRef = useRef<HTMLAudioElement | null>(null);
  const whisperSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialisation et gestion de l'ouverture
  useEffect(() => {
    if (open) {
      setRevealed(false);
      const timer = setTimeout(() => setRevealed(true), 300);

      if (!isMuted) {
        playInfernalSounds();
      }

      return () => {
        clearTimeout(timer);
        stopSounds();
      };
    }
  }, [open]);

  // Boucle de glitch aléatoire
  useEffect(() => {
    if (!open || !revealed) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.07) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [open, revealed]);

  const playInfernalSounds = () => {
    if (ambientSoundRef.current) {
      ambientSoundRef.current.volume = 0.2;
      ambientSoundRef.current.play().catch(() => {});
    }
    if (whisperSoundRef.current) {
      whisperSoundRef.current.volume = 0.1;
      whisperSoundRef.current.play().catch(() => {});
    }
  };

  const stopSounds = () => {
    [ambientSoundRef, whisperSoundRef].forEach((ref) => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) stopSounds();
    else playInfernalSounds();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Sources Audio */}
      <audio ref={ambientSoundRef} loop src="/sounds/fire-crackling.mp3" />
      <audio ref={whisperSoundRef} loop src="/sounds/dark-ambient.mp3" />

      <DialogContent
        className="max-w-lg border-none p-0 overflow-visible bg-transparent shadow-none [&>button]:hidden outline-none focus:ring-0"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Devil Note</DialogTitle>
        </VisuallyHidden>

        {/* L'Artefact Principal */}
        <div
          className={`relative min-h-[350px] w-full transition-all duration-[1200ms] ease-in-out flex flex-col items-center justify-center p-12
            ${revealed ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-90 -rotate-1"}`}
          style={{
            background: "linear-gradient(145deg, #0d0404 0%, #1a0808 45%, #080202 100%)",
            boxShadow: `
              0 0 60px rgba(0,0,0,1),
              inset 0 0 80px rgba(150, 20, 20, 0.1)
            `,
            filter: "url(#devil-distort)",
          }}
        >
          {/* Grain de texture overlay */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

          {/* Contrôles supérieurs */}
          <div className="absolute top-5 right-5 z-50 flex items-center gap-4">
            <button
              onClick={toggleMute}
              className="text-red-900/30 hover:text-red-500 transition-all duration-300"
              title={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="text-red-900/30 hover:text-red-500 hover:rotate-90 transition-all duration-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cadre ornemental discret */}
          <div className="absolute inset-6 border border-red-950/20 pointer-events-none">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-800/40" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-800/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-800/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-800/40" />
          </div>

          {/* Contenu principal */}
          <div
            className={`relative z-10 text-center space-y-8 transition-all duration-500 ${glitch ? "skew-x-2 opacity-80" : ""}`}
          >
            {showSecretSymbol && (
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                <span className="text-[120px] text-red-950/10 font-serif animate-pulse pointer-events-none">⛧</span>
              </div>
            )}

            <h2
              className="text-2xl md:text-3xl tracking-[0.25em] font-serif italic select-none"
              style={{
                color: glitch ? "#ff3333" : "#c4a4a4",
                textShadow: glitch ? "3px 0 #8b0000, -3px 0 #330000" : "0 0 20px rgba(139, 0, 0, 0.4)",
              }}
            >
              "The devil is in the details."
            </h2>

            <div className="space-y-4 max-w-xs mx-auto">
              <p className="text-sm tracking-[0.15em] text-stone-500 font-light leading-relaxed">
                Once the pact is sealed, the path behind you dissolves.
              </p>
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-red-900/50 to-transparent mx-auto" />
              <p className="text-[10px] uppercase tracking-[0.5em] text-red-950 font-bold opacity-80">Aeternum Vale</p>
            </div>
          </div>

          {/* Cendres montantes */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-red-500/10 rounded-full animate-devil-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: "-5%",
                  animationDelay: `${Math.random() * 8}s`,
                  animationDuration: `${4 + Math.random() * 6}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Définition du filtre de distorsion (SVG invisible) */}
        <svg className="absolute w-0 h-0 invisible">
          <defs>
            <filter id="devil-distort">
              <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
            </filter>
          </defs>
        </svg>

        <style>{`
          @keyframes devil-float {
            0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
            20% { opacity: 0.4; }
            100% { transform: translateY(-350px) scale(0.5) rotate(180deg); opacity: 0; }
          }
          .animate-devil-float {
            animation: devil-float linear infinite;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
