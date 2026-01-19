import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, Check, Gift } from "lucide-react";
import { BondIcon } from "@/components/ui/bond-icon";

interface UnlockAnimationProps {
  isOpen: boolean;
  onComplete: () => void;
  itemName: string;
  itemType: "cosmetic" | "module" | "bundle";
  rarity?: string;
  playSound?: boolean;
}

const rarityColors: Record<string, { primary: string; glow: string; particle: string }> = {
  common: { primary: "text-slate-400", glow: "shadow-slate-400/50", particle: "#94a3b8" },
  uncommon: { primary: "text-emerald-400", glow: "shadow-emerald-400/50", particle: "#34d399" },
  rare: { primary: "text-blue-400", glow: "shadow-blue-400/50", particle: "#60a5fa" },
  epic: { primary: "text-purple-400", glow: "shadow-purple-400/50", particle: "#c084fc" },
  legendary: { primary: "text-amber-400", glow: "shadow-amber-400/50", particle: "#fbbf24" },
};

export function UnlockAnimation({ 
  isOpen, 
  onComplete, 
  itemName, 
  itemType, 
  rarity = "common",
  playSound = true 
}: UnlockAnimationProps) {
  const [stage, setStage] = useState<"burst" | "reveal" | "complete">("burst");
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);
  
  const colors = rarityColors[rarity] || rarityColors.common;
  
  // Play unlock sound effect
  const playUnlockSound = useCallback(() => {
    if (!playSound) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a triumphant sound
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator1.type = "sine";
      oscillator2.type = "triangle";
      
      // Play a major chord arpeggio
      const now = audioContext.currentTime;
      oscillator1.frequency.setValueAtTime(523.25, now); // C5
      oscillator1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      oscillator1.frequency.setValueAtTime(783.99, now + 0.2); // G5
      oscillator1.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      
      oscillator2.frequency.setValueAtTime(261.63, now); // C4
      oscillator2.frequency.setValueAtTime(329.63, now + 0.15); // E4
      
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialDecayTo?.(0.01, now + 0.8) || gainNode.gain.setValueAtTime(0.01, now + 0.8);
      
      oscillator1.start(now);
      oscillator2.start(now);
      oscillator1.stop(now + 0.5);
      oscillator2.stop(now + 0.6);
    } catch (e) {
      // Audio not supported, silently fail
    }
  }, [playSound]);
  
  useEffect(() => {
    if (isOpen) {
      setStage("burst");
      
      // Generate particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 360 - 180,
        y: Math.random() * 360 - 180,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);
      
      playUnlockSound();
      
      // Progress through stages
      const timer1 = setTimeout(() => setStage("reveal"), 400);
      const timer2 = setTimeout(() => setStage("complete"), 1500);
      const timer3 = setTimeout(onComplete, 2500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen, onComplete, playUnlockSound]);
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Particle burst */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
              style={{ backgroundColor: colors.particle }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: particle.x,
                y: particle.y,
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: particle.delay,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
        
        {/* Central animation */}
        <div className="relative">
          {/* Glow ring */}
          <motion.div
            className={`absolute inset-0 rounded-full blur-3xl ${colors.glow}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: stage === "burst" ? [0, 3, 2] : 2,
              opacity: stage === "burst" ? [0, 0.8, 0.4] : 0.4,
            }}
            transition={{ duration: 0.5 }}
            style={{ boxShadow: `0 0 120px 60px ${colors.particle}` }}
          />
          
          {/* Icon container */}
          <motion.div
            className={`relative z-10 w-32 h-32 rounded-2xl border-2 flex items-center justify-center ${
              rarity === "legendary" 
                ? "border-amber-400 bg-gradient-to-br from-amber-500/30 to-amber-900/30" 
                : rarity === "epic"
                  ? "border-purple-400 bg-gradient-to-br from-purple-500/30 to-purple-900/30"
                  : "border-primary/50 bg-gradient-to-br from-primary/20 to-primary/5"
            }`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: stage === "burst" ? [0, 1.2, 1] : 1,
              rotate: stage === "burst" ? [-180, 10, 0] : 0,
            }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          >
            {itemType === "bundle" ? (
              <Gift className={`w-16 h-16 ${colors.primary}`} />
            ) : itemType === "module" ? (
              <Star className={`w-16 h-16 ${colors.primary}`} />
            ) : (
              <Sparkles className={`w-16 h-16 ${colors.primary}`} />
            )}
            
            {/* Checkmark overlay */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: stage === "complete" ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: stage === "complete" ? 1 : 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              >
                <Check className="w-20 h-20 text-emerald-400" strokeWidth={3} />
              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Item name */}
          <motion.div
            className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-center whitespace-nowrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: stage !== "burst" ? 1 : 0, 
              y: stage !== "burst" ? 0 : 20 
            }}
            transition={{ delay: 0.2 }}
          >
            <div className={`text-sm uppercase tracking-wider mb-1 ${colors.primary}`}>
              {itemType} Unlocked!
            </div>
            <div className="text-2xl font-orbitron font-bold text-foreground">
              {itemName}
            </div>
          </motion.div>
          
          {/* Floating sparkles */}
          {stage !== "burst" && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 80}%`,
                    top: `${50 + Math.sin(i * 60 * Math.PI / 180) * 80}%`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0],
                    y: [0, -20, -40],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    delay: 0.3 + i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                >
                  <Sparkles className={`w-4 h-4 ${colors.primary}`} />
                </motion.div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
