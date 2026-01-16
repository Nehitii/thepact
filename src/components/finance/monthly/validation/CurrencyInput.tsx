import { Input } from '@/components/ui/input';
import { getCurrencySymbol } from '@/lib/currency';

interface CurrencyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  currency: string;
  disabled?: boolean;
  placeholder?: string;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  currency,
  disabled = false,
  placeholder = '0',
}: CurrencyInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-400 font-medium">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          {getCurrencySymbol(currency)}
        </span>
        <Input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          disabled={disabled}
          className="pl-8 h-12 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl"
        />
      </div>
    </div>
  );
}
