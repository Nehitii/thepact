import { useState, useRef, useEffect, useCallback } from "react";
import { DevilNoteModal } from "./DevilNoteModal";

export function ProfileDevilNote() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showSymbol, setShowSymbol] = useState(false);
  const [textFlicker, setTextFlicker] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  const [breathingIntensity, setBreathingIntensity] = useState(0);
  
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressStartRef = useRef<number>(0);

  // Check if it's late at night (between 11 PM and 4 AM)
  const [isLateNight, setIsLateNight] = useState(false);
  
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsLateNight(hour >= 23 || hour < 4);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Subtle idle breathing effect
  useEffect(() => {
    if (isHovering || isPressed) return;
    
    let frame: number;
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Very slow breathing: 8 second cycle
      const breath = Math.sin(elapsed * Math.PI / 4) * 0.5 + 0.5;
      setBreathingIntensity(breath * 0.15); // Very subtle
      frame = requestAnimationFrame(animate);
    };
    
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isHovering, isPressed]);

  // Handle tap counting for hidden interaction
  const handleTap = useCallback(() => {
    setTapCount(prev => {
      const newCount = prev + 1;
      
      // After 7 taps, trigger the hidden effect
      if (newCount >= 7) {
        setTextFlicker(true);
        setShowSymbol(true);
        setTimeout(() => {
          setTextFlicker(false);
          setShowSymbol(false);
        }, 150);
        return 0; // Reset count
      }
      
      return newCount;
    });

    // Reset tap count after 2 seconds of no tapping
    if (tapResetTimerRef.current) {
      clearTimeout(tapResetTimerRef.current);
    }
    tapResetTimerRef.current = setTimeout(() => {
      setTapCount(0);
    }, 2000);
  }, []);

  const handlePressStart = () => {
    setIsPressed(true);
    longPressStartRef.current = Date.now();
    
    pressTimerRef.current = setTimeout(() => {
      setLongPressActive(true);
      // After 6 seconds, subtle text change
      setTimeout(() => {
        setLongPressActive(false);
      }, 800);
    }, 6000);
  };

  const handlePressEnd = () => {
    setIsPressed(false);
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    
    const pressDuration = Date.now() - longPressStartRef.current;
    
    // If it was a quick tap, increment tap count
    if (pressDuration < 300) {
      handleTap();
    }
    
    // If not a long hold, open the modal
    if (pressDuration < 6000) {
      setModalOpen(true);
    }
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (tapResetTimerRef.current) clearTimeout(tapResetTimerRef.current);
    };
  }, []);

  // Calculate dynamic styles based on state
  const glowIntensity = isPressed ? 0.6 : isHovering ? 0.35 : 0.12 + breathingIntensity;
  const frameGlow = isLateNight ? 'rgba(120, 20, 20, 0.4)' : 'rgba(80, 20, 20, 0.3)';

  return (
    <>
      <button
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); setIsPressed(false); }}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        className="relative group select-none touch-none"
        aria-label="Devil Note"
      >
        {/* Outer containment frame - sealed artifact feel */}
        <div 
          className="relative px-4 py-2.5 transition-all duration-700"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(15, 5, 5, 0.95) 0%, 
                rgba(25, 8, 8, 0.9) 50%, 
                rgba(12, 4, 4, 0.95) 100%
              )
            `,
            boxShadow: `
              inset 0 0 20px rgba(0, 0, 0, 0.8),
              inset 0 1px 0 rgba(80, 30, 30, 0.15),
              0 0 ${isPressed ? 25 : isHovering ? 15 : 8}px ${frameGlow},
              0 0 ${isPressed ? 40 : 20}px rgba(60, 10, 10, ${glowIntensity * 0.5})
            `,
            borderRadius: '3px',
            border: `1px solid rgba(80, 25, 25, ${isHovering ? 0.5 : 0.25})`,
          }}
        >
          {/* Cracked texture overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: `
                radial-gradient(ellipse at 20% 30%, rgba(60, 20, 20, 0.3) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 70%, rgba(40, 15, 15, 0.2) 0%, transparent 40%)
              `,
              mixBlendMode: 'overlay',
            }}
          />

          {/* Vignette inside */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.6) 100%)',
              borderRadius: '2px',
            }}
          />

          {/* Corner rune marks - extremely subtle */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Top-left rune */}
            <div 
              className="absolute top-0.5 left-0.5 w-2 h-2 transition-opacity duration-500"
              style={{ 
                opacity: isHovering ? 0.25 : 0.08,
                borderTop: '1px solid rgba(120, 40, 40, 0.6)',
                borderLeft: '1px solid rgba(120, 40, 40, 0.6)',
              }}
            />
            {/* Bottom-right rune */}
            <div 
              className="absolute bottom-0.5 right-0.5 w-2 h-2 transition-opacity duration-500"
              style={{ 
                opacity: isHovering ? 0.25 : 0.08,
                borderBottom: '1px solid rgba(120, 40, 40, 0.6)',
                borderRight: '1px solid rgba(120, 40, 40, 0.6)',
              }}
            />
          </div>

          {/* Hidden symbol that appears on 7 taps */}
          {showSymbol && (
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              style={{
                animation: 'symbolFlash 150ms ease-out',
              }}
            >
              <span 
                className="text-lg"
                style={{
                  color: 'rgba(180, 60, 60, 0.8)',
                  textShadow: '0 0 10px rgba(180, 60, 60, 0.6)',
                  fontFamily: 'serif',
                }}
              >
                ⛧
              </span>
            </div>
          )}

          {/* Main text container */}
          <div className="relative z-10 flex items-center gap-2">
            {/* The text - serif, ancient feeling */}
            <span 
              className="text-xs tracking-wider transition-all duration-500"
              style={{
                fontFamily: '"Crimson Text", "Times New Roman", serif',
                fontStyle: 'italic',
                fontWeight: longPressActive ? 600 : 400,
                letterSpacing: longPressActive ? '0.15em' : '0.08em',
                color: isPressed 
                  ? 'rgba(200, 180, 170, 0.9)' 
                  : isHovering 
                    ? 'rgba(180, 160, 150, 0.85)' 
                    : 'rgba(150, 130, 120, 0.7)',
                textShadow: `
                  0 0 ${isHovering ? 8 : 4}px rgba(100, 40, 40, ${glowIntensity}),
                  0 1px 2px rgba(0, 0, 0, 0.5)
                `,
                opacity: textFlicker ? 0.3 : 1,
                transform: isPressed ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              Devil Note
            </span>
          </div>

          {/* Ember particles on hover/press */}
          {(isHovering || isPressed) && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-0.5 rounded-full"
                  style={{
                    left: `${20 + i * 30}%`,
                    bottom: '20%',
                    backgroundColor: 'rgba(180, 80, 50, 0.6)',
                    boxShadow: '0 0 3px rgba(180, 80, 50, 0.4)',
                    animation: `emberFloat ${1.5 + i * 0.3}s ease-out infinite`,
                    animationDelay: `${i * 0.4}s`,
                    opacity: isPressed ? 0.8 : 0.5,
                  }}
                />
              ))}
            </div>
          )}

          {/* Long press darkening overlay */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)',
              opacity: longPressActive ? 1 : 0,
              borderRadius: '2px',
            }}
          />
        </div>
      </button>

      <DevilNoteModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Keyframe animations */}
      <style>{`
        @keyframes emberFloat {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-12px) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes symbolFlash {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
