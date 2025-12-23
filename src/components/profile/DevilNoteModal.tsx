import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface DevilNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showSecretSymbol?: boolean;
}

export function DevilNoteModal({ open, onOpenChange, showSecretSymbol = false }: DevilNoteModalProps) {
  const [revealed, setRevealed] = useState(false);
  const [textGlitch, setTextGlitch] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setRevealed(false);
      // Delayed reveal for dramatic effect
      const timer = setTimeout(() => setRevealed(true), 400);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Subtle breathing animation for the container
  useEffect(() => {
    if (!open) return;
    
    let frame: number;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      setBreathPhase(Math.sin(elapsed * Math.PI / 5) * 0.5 + 0.5);
      frame = requestAnimationFrame(animate);
    };
    
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Random rare text glitch
  useEffect(() => {
    if (!open || !revealed) return;
    
    const glitchInterval = setInterval(() => {
      // 5% chance every 3 seconds
      if (Math.random() < 0.05) {
        setTextGlitch(true);
        setTimeout(() => setTextGlitch(false), 80);
      }
    }, 3000);

    return () => clearInterval(glitchInterval);
  }, [open, revealed]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={containerRef}
        className="max-w-lg border-0 p-0 overflow-hidden bg-transparent shadow-none [&>button]:hidden"
        style={{
          background: 'transparent',
        }}
        aria-describedby={undefined}
      >
        {/* Accessibility: Hidden title for screen readers */}
        <VisuallyHidden>
          <DialogTitle>Devil Note</DialogTitle>
        </VisuallyHidden>

        {/* Main container - ancient artifact feel */}
        <div 
          className="relative"
          style={{
            background: `
              linear-gradient(145deg, 
                rgba(12, 6, 6, 0.98) 0%, 
                rgba(20, 8, 8, 0.96) 30%,
                rgba(15, 5, 5, 0.98) 70%,
                rgba(10, 4, 4, 0.99) 100%
              )
            `,
            boxShadow: `
              0 0 60px rgba(40, 10, 10, 0.5),
              0 0 100px rgba(30, 5, 5, 0.3),
              inset 0 0 80px rgba(0, 0, 0, 0.7),
              inset 0 2px 0 rgba(60, 30, 30, 0.1)
            `,
            border: `1px solid rgba(80, 30, 30, ${0.2 + breathPhase * 0.1})`,
            borderRadius: '4px',
          }}
        >
          {/* Custom close button - styled for dark theme */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-20 p-1.5 rounded-sm transition-all duration-300 
              bg-transparent border-0 outline-none
              hover:bg-[rgba(80,30,30,0.3)] 
              focus:outline-none focus:ring-0 focus:bg-[rgba(100,40,40,0.3)]
              active:bg-[rgba(60,20,20,0.4)]"
            style={{
              boxShadow: 'none',
            }}
            aria-label="Close"
          >
            <X 
              className="h-4 w-4 transition-all duration-300" 
              style={{ 
                color: 'rgba(150, 120, 110, 0.6)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(180, 140, 130, 0.9)';
                e.currentTarget.style.filter = 'drop-shadow(0 0 4px rgba(100, 40, 40, 0.5))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(150, 120, 110, 0.6)';
                e.currentTarget.style.filter = 'none';
              }}
            />
          </button>

          {/* Cracked stone / burned parchment texture */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(ellipse at 15% 20%, rgba(50, 20, 20, 0.2) 0%, transparent 40%),
                radial-gradient(ellipse at 85% 80%, rgba(40, 15, 15, 0.15) 0%, transparent 35%),
                radial-gradient(ellipse at 50% 50%, rgba(30, 10, 10, 0.1) 0%, transparent 60%)
              `,
              mixBlendMode: 'overlay',
            }}
          />

          {/* Inner vignette */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.5) 80%, rgba(0, 0, 0, 0.7) 100%)',
            }}
          />

          {/* Worn frame border - slightly irregular */}
          <div 
            className="absolute inset-2 pointer-events-none transition-all duration-1000"
            style={{
              border: `1px solid rgba(100, 40, 40, ${0.15 + breathPhase * 0.05})`,
              borderRadius: '2px',
              boxShadow: `
                inset 0 0 20px rgba(60, 20, 20, ${0.1 + breathPhase * 0.05}),
                0 0 8px rgba(80, 30, 30, ${0.1 + breathPhase * 0.1})
              `,
            }}
          />

          {/* Corner decorations - subtle runes */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top-left */}
            <div 
              className="absolute top-3 left-3 w-4 h-4 transition-opacity duration-700"
              style={{ 
                opacity: revealed ? 0.2 : 0,
                borderTop: '1px solid rgba(120, 50, 50, 0.5)',
                borderLeft: '1px solid rgba(120, 50, 50, 0.5)',
              }}
            />
            {/* Top-right */}
            <div 
              className="absolute top-3 right-3 w-4 h-4 transition-opacity duration-700"
              style={{ 
                opacity: revealed ? 0.2 : 0,
                borderTop: '1px solid rgba(120, 50, 50, 0.5)',
                borderRight: '1px solid rgba(120, 50, 50, 0.5)',
                transitionDelay: '100ms',
              }}
            />
            {/* Bottom-left */}
            <div 
              className="absolute bottom-3 left-3 w-4 h-4 transition-opacity duration-700"
              style={{ 
                opacity: revealed ? 0.2 : 0,
                borderBottom: '1px solid rgba(120, 50, 50, 0.5)',
                borderLeft: '1px solid rgba(120, 50, 50, 0.5)',
                transitionDelay: '200ms',
              }}
            />
            {/* Bottom-right */}
            <div 
              className="absolute bottom-3 right-3 w-4 h-4 transition-opacity duration-700"
              style={{ 
                opacity: revealed ? 0.2 : 0,
                borderBottom: '1px solid rgba(120, 50, 50, 0.5)',
                borderRight: '1px solid rgba(120, 50, 50, 0.5)',
                transitionDelay: '300ms',
              }}
            />
          </div>

          {/* Content area */}
          <div className="relative z-10 px-8 py-12 min-h-[280px] flex flex-col items-center justify-center">
            {/* Secret symbol overlay - appears after 3 consecutive opens */}
            {showSecretSymbol && (
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                style={{
                  animation: 'secretSymbolReveal 2s ease-out forwards',
                }}
              >
                <span 
                  className="text-4xl"
                  style={{
                    color: 'rgba(180, 60, 60, 0.7)',
                    textShadow: '0 0 20px rgba(180, 60, 60, 0.5), 0 0 40px rgba(120, 30, 30, 0.3)',
                    fontFamily: 'serif',
                  }}
                >
                  ⛧
                </span>
              </div>
            )}

            {/* Main text - "The devil is in the details." */}
            <div 
              className="text-center space-y-8 transition-all duration-1000"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(10px)',
              }}
            >
              {/* Primary phrase */}
              <p 
                className="text-lg md:text-xl leading-relaxed tracking-wider"
                style={{
                  fontFamily: '"Crimson Text", "Playfair Display", Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: textGlitch ? 'rgba(180, 80, 80, 0.9)' : 'rgba(180, 160, 150, 0.85)',
                  textShadow: `
                    0 0 ${textGlitch ? 12 : 6}px rgba(100, 40, 40, 0.4),
                    0 2px 4px rgba(0, 0, 0, 0.5)
                  `,
                  letterSpacing: textGlitch ? '0.2em' : '0.12em',
                  transition: 'all 80ms ease',
                }}
              >
                "The devil is in the details."
              </p>

              {/* Secondary cryptic lines */}
              <div 
                className="space-y-4 transition-all duration-1000"
                style={{
                  transitionDelay: '600ms',
                  opacity: revealed ? 1 : 0,
                }}
              >
                <p 
                  className="text-sm md:text-base leading-relaxed"
                  style={{
                    fontFamily: '"Crimson Text", Georgia, serif',
                    fontWeight: 300,
                    color: 'rgba(140, 120, 110, 0.7)',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                    letterSpacing: '0.08em',
                  }}
                >
                  Once the pact is sealed, the path behind you dissolves.
                </p>
                <p 
                  className="text-sm md:text-base leading-relaxed"
                  style={{
                    fontFamily: '"Crimson Text", Georgia, serif',
                    fontWeight: 300,
                    color: 'rgba(140, 120, 110, 0.7)',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                    letterSpacing: '0.08em',
                  }}
                >
                  What you chose in fire can never be undone.
                </p>
              </div>
            </div>

            {/* Ambient ember particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-0.5 rounded-full"
                  style={{
                    left: `${15 + i * 18}%`,
                    bottom: '15%',
                    backgroundColor: 'rgba(150, 60, 40, 0.5)',
                    boxShadow: '0 0 4px rgba(150, 60, 40, 0.3)',
                    animation: `devilEmber ${2.5 + i * 0.4}s ease-out infinite`,
                    animationDelay: `${i * 0.6}s`,
                    opacity: revealed ? 0.6 : 0,
                    transition: 'opacity 1s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom subtle glow line */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px transition-opacity duration-1000"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(100, 40, 40, ${0.3 + breathPhase * 0.1}), transparent)`,
              opacity: revealed ? 1 : 0,
              transitionDelay: '800ms',
            }}
          />
        </div>

        {/* Keyframe animations */}
        <style>{`
          @keyframes devilEmber {
            0% {
              transform: translateY(0) scale(1);
              opacity: 0;
            }
            15% {
              opacity: 0.5;
            }
            100% {
              transform: translateY(-25px) translateX(5px) scale(0.4);
              opacity: 0;
            }
          }
          
          @keyframes secretSymbolReveal {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            30% {
              opacity: 1;
              transform: scale(1.2);
            }
            60% {
              opacity: 0.8;
              transform: scale(1);
            }
            100% {
              opacity: 0;
              transform: scale(1.1);
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
