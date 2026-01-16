import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface ConfirmationToggleProps {
  label: string;
  subtext: string;
  currency: string;
  amount: number;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ConfirmationToggle({
  label,
  subtext,
  currency,
  amount,
  isChecked,
  onChange,
  disabled = false,
}: ConfirmationToggleProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
      onClick={() => !disabled && onChange(!isChecked)}
      disabled={disabled}
      className={`neu-toggle p-5 rounded-2xl border transition-all duration-300 text-left ${
        isChecked
          ? 'active border-emerald-500/30'
          : 'border-white/[0.05]'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center gap-4 mb-3">
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
          isChecked 
            ? 'bg-emerald-500/30 border-emerald-500 shadow-[0_0_15px_hsla(160,80%,50%,0.4)]' 
            : 'border-slate-500'
        }`}>
          {isChecked && <Check className="h-4 w-4 text-emerald-400" />}
        </div>
        <span className="text-base font-semibold text-white">{label}</span>
      </div>
      <p className="text-sm text-slate-400 pl-10">
        {formatCurrency(amount, currency)} {subtext}
      </p>
    </motion.button>
  );
}
