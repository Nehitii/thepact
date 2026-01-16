import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeadlinePromptProps {
  daysUntilDeadline: number;
  onValidate: () => void;
}

export function DeadlinePrompt({ daysUntilDeadline, onValidate }: DeadlinePromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, hsla(200,100%,60%,0.15) 0%, hsla(200,100%,50%,0.05) 100%)',
        border: '1px solid hsla(200,100%,60%,0.3)',
        boxShadow: '0 0 40px hsla(200,100%,60%,0.15)',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsla(200,100%,60%,0.2),transparent_70%)]" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-primary" />
            </motion.div>
          </div>
          <div>
            <p className="font-bold text-white text-lg">Time to validate!</p>
            <p className="text-sm text-slate-400">{daysUntilDeadline} days until salary day</p>
          </div>
        </div>
        <Button
          onClick={onValidate}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 h-auto shadow-[0_0_30px_hsla(200,100%,60%,0.3)]"
        >
          Validate Month
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
