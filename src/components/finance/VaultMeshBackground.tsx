import { motion } from 'framer-motion';

/**
 * VAULT OS — Atmospheric tactical bank background.
 * Layered: base wash, fine grid, ledger diagonals, radial cyan pulse,
 * and 4 slow vertical "data flow" particles. All motion-reduce safe.
 */
export function VaultMeshBackground() {
  return (
    <>
      {/* Base wash */}
      <div className="fixed inset-0 bg-background dark:bg-gradient-to-b dark:from-[#070a10] dark:via-[#0c1018] dark:to-[#080c14]" />
      <div className="fixed inset-0 mesh-gradient-bg opacity-60 dark:opacity-60 opacity-20" />
      <div className="noise-overlay" />

      {/* Fine 80px grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Ledger diagonals — very subtle paper feel */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.018]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, hsl(var(--primary)) 0 1px, transparent 1px 24px)`,
        }}
      />

      {/* Radial cyan pulse */}
      <motion.div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[800px] pointer-events-none motion-reduce:animate-none"
        style={{ background: 'radial-gradient(ellipse at center, hsla(200,100%,60%,0.05) 0%, transparent 60%)' }}
        animate={{ opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Data flow particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden motion-reduce:hidden">
        {[15, 38, 62, 84].map((leftPct, i) => (
          <motion.div
            key={leftPct}
            className="absolute top-0 w-px h-24 bg-gradient-to-b from-transparent via-primary/40 to-transparent"
            style={{ left: `${leftPct}%` }}
            animate={{ y: ['-10%', '110vh'] }}
            transition={{
              duration: 14 + i * 3,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 2.5,
            }}
          />
        ))}
      </div>
    </>
  );
}
