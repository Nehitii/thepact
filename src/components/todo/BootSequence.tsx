import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BootSequenceProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  '> INITIALIZING TACTICAL COMMAND...',
  '> LOADING TASK MATRIX... OK',
  '> SYNCING NEURAL INTERFACE...',
  '> SYSTEM READY.',
];

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visibleLines < BOOT_LINES.length) {
      const timer = setTimeout(() => setVisibleLines(v => v + 1), 200);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setDone(true), 300);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  useEffect(() => {
    if (done) {
      const timer = setTimeout(onComplete, 200);
      return () => clearTimeout(timer);
    }
  }, [done, onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <div className="font-mono text-sm space-y-1.5 text-primary max-w-md">
            {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className={i === BOOT_LINES.length - 1 ? 'text-emerald-400' : ''}
              >
                {line}
              </motion.div>
            ))}
            {visibleLines < BOOT_LINES.length && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
