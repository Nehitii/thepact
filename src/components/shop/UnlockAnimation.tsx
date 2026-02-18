import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, Check, Gift } from "lucide-react";

interface UnlockAnimationProps {
  isOpen: boolean;
  onComplete: () => void;
  itemName: string;
  itemType: "cosmetic" | "module" | "bundle";
  rarity?: string;
  playSound?: boolean;
}

const rarityColors: Record<string, { primary: string; glow: string; particle: string; confetti: string[] }> = {
  common: { primary: "text-slate-400", glow: "shadow-slate-400/50", particle: "#94a3b8", confetti: ["#94a3b8", "#cbd5e1", "#64748b"] },
  uncommon: { primary: "text-emerald-400", glow: "shadow-emerald-400/50", particle: "#34d399", confetti: ["#34d399", "#6ee7b7", "#10b981"] },
  rare: { primary: "text-blue-400", glow: "shadow-blue-400/50", particle: "#60a5fa", confetti: ["#60a5fa", "#93c5fd", "#3b82f6"] },
  epic: { primary: "text-purple-400", glow: "shadow-purple-400/50", particle: "#c084fc", confetti: ["#c084fc", "#d8b4fe", "#a855f7", "#7c3aed"] },
  legendary: { primary: "text-amber-400", glow: "shadow-amber-400/50", particle: "#fbbf24", confetti: ["#fbbf24", "#fcd34d", "#f59e0b", "#eab308", "#ffffff"] },
};

// Confetti particle component
function ConfettiPiece({ color, delay, index }: { color: string; delay: number; index: number }) {
  const angle = (index / 30) * Math.PI * 2 + (Math.random() - 0.5);
  const distance = 150 + Math.random() * 200;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  const size = 4 + Math.random() * 6;
  const isRect = Math.random() > 0.5;
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{
        backgroundColor: color,
        width: isRect ? size : size / 2,
        height: isRect ? size / 2 : size,
        borderRadius: isRect ? 1 : "50%",
      }}
      initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
      animate={{ x, y: y + 80, scale: [0, 1.2, 0.8], opacity: [1, 1, 0], rotate: Math.random() * 720 - 360 }}
      transition={{ duration: 1.2 + Math.random() * 0.5, delay, ease: "easeOut" }}
    />
  );
}

export function UnlockAnimation({
  isOpen,
  onComplete,
  itemName,
  itemType,
  rarity = "common",
  playSound = true,
}: UnlockAnimationProps) {
  const [stage, setStage] = useState<"flash" | "burst" | "reveal" | "complete">("flash");
  const colors = rarityColors[rarity] || rarityColors.common;

  // Burst particles
  const burstParticles = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.cos((i / 24) * Math.PI * 2) * (120 + Math.random() * 80),
      y: Math.sin((i / 24) * Math.PI * 2) * (120 + Math.random() * 80),
      delay: Math.random() * 0.15,
    })), []);

  // Confetti (rarity-specific)
  const confettiPieces = useMemo(() => {
    const count = rarity === "legendary" ? 40 : rarity === "epic" ? 28 : 16;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      color: colors.confetti[i % colors.confetti.length],
      delay: 0.8 + Math.random() * 0.3,
    }));
  }, [rarity, colors.confetti]);

  const playUnlockSound = useCallback(() => {
    if (!playSound) return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator1.type = "sine";
      oscillator2.type = "triangle";

      const now = audioContext.currentTime;
      // Higher rarity = deeper, richer chord
      const baseFreq = rarity === "legendary" ? 440 : rarity === "epic" ? 493 : 523.25;
      oscillator1.frequency.setValueAtTime(baseFreq, now);
      oscillator1.frequency.setValueAtTime(baseFreq * 1.25, now + 0.1);
      oscillator1.frequency.setValueAtTime(baseFreq * 1.5, now + 0.2);
      oscillator1.frequency.setValueAtTime(baseFreq * 2, now + 0.3);

      oscillator2.frequency.setValueAtTime(baseFreq / 2, now);
      oscillator2.frequency.setValueAtTime(baseFreq * 0.625, now + 0.15);

      const vol = rarity === "legendary" ? 0.2 : 0.15;
      gainNode.gain.setValueAtTime(vol, now);
      gainNode.gain.setValueAtTime(0.01, now + 0.9);

      oscillator1.start(now);
      oscillator2.start(now);
      oscillator1.stop(now + 0.6);
      oscillator2.stop(now + 0.7);
    } catch {
      // Audio not supported
    }
  }, [playSound, rarity]);

  useEffect(() => {
    if (isOpen) {
      setStage("flash");
      playUnlockSound();

      const t1 = setTimeout(() => setStage("burst"), 150);
      const t2 = setTimeout(() => setStage("reveal"), 600);
      const t3 = setTimeout(() => setStage("complete"), 1600);
      const t4 = setTimeout(onComplete, 2800);

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [isOpen, onComplete, playUnlockSound]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Background */}
        <motion.div
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Stage 1: Screen flash + shockwave */}
        {stage === "flash" && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: colors.particle }}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Shockwave ring */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{ border: `2px solid ${colors.particle}`, width: 10, height: 10 }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 40, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Second shockwave (delayed) */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{ border: `1px solid ${colors.particle}`, width: 10, height: 10 }}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 30, opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
        />

        {/* Particle burst */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {burstParticles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.particle }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{ x: p.x, y: p.y, scale: [0, 1.5, 0], opacity: [1, 1, 0] }}
              transition={{ duration: 0.7, delay: p.delay, ease: "easeOut" }}
            />
          ))}
        </div>

        {/* Confetti (Stage 3) */}
        {(stage === "complete" || stage === "reveal") && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confettiPieces.map((c) => (
              <ConfettiPiece key={c.id} color={c.color} delay={c.delay} index={c.id} />
            ))}
          </div>
        )}

        {/* Central element */}
        <div className="relative">
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: stage === "flash" ? 0 : stage === "burst" ? [0, 3.5, 2] : 2,
              opacity: stage === "flash" ? 0 : stage === "burst" ? [0, 0.7, 0.35] : 0.35,
            }}
            transition={{ duration: 0.5 }}
            style={{ boxShadow: `0 0 120px 60px ${colors.particle}` }}
          />

          {/* Icon container with digital assembly effect */}
          <motion.div
            className={`relative z-10 w-32 h-32 rounded-2xl border-2 flex items-center justify-center overflow-hidden ${
              rarity === "legendary"
                ? "border-amber-400 bg-gradient-to-br from-amber-500/30 to-amber-900/30"
                : rarity === "epic"
                  ? "border-purple-400 bg-gradient-to-br from-purple-500/30 to-purple-900/30"
                  : "border-primary/50 bg-gradient-to-br from-primary/20 to-primary/5"
            }`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: stage === "flash" ? 0 : stage === "burst" ? [0, 1.2, 1] : 1,
              rotate: stage === "flash" ? -180 : stage === "burst" ? [-180, 10, 0] : 0,
            }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          >
            {/* Scanline converging effect (Stage 2) */}
            {stage === "reveal" && (
              <>
                <motion.div
                  className="absolute inset-x-0 h-[2px] pointer-events-none"
                  style={{ backgroundColor: colors.particle, top: "50%" }}
                  initial={{ scaleX: 0, opacity: 0.8 }}
                  animate={{ scaleX: [0, 1.2, 0], opacity: [0.8, 0.6, 0], top: ["0%", "50%", "100%"] }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-y-0 w-[2px] pointer-events-none"
                  style={{ backgroundColor: colors.particle, left: "50%" }}
                  initial={{ scaleY: 0, opacity: 0.8 }}
                  animate={{ scaleY: [0, 1.2, 0], opacity: [0.8, 0.6, 0], left: ["0%", "50%", "100%"] }}
                  transition={{ duration: 0.8, ease: "easeInOut", delay: 0.1 }}
                />
              </>
            )}

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

          {/* "+1 [type]" floating text */}
          <motion.div
            className={`absolute -top-12 left-1/2 -translate-x-1/2 font-orbitron text-sm font-bold whitespace-nowrap ${colors.primary}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: stage !== "flash" && stage !== "burst" ? [0, 1, 0] : 0, y: stage !== "flash" && stage !== "burst" ? [10, -20] : 10 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            +1 {itemType}
          </motion.div>

          {/* Item name */}
          <motion.div
            className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-center whitespace-nowrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: stage !== "flash" && stage !== "burst" ? 1 : 0,
              y: stage !== "flash" && stage !== "burst" ? 0 : 20,
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

          {/* Orbiting sparkles */}
          {stage !== "flash" && stage !== "burst" && (
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
                  animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -20, -40] }}
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
