import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCurrencySymbol } from '@/lib/currency';
import type { UserAccount } from '@/types/finance';

const ACCOUNT_TYPES = ['checking', 'savings', 'investment', 'credit', 'cash'] as const;

const BANK_EMOJIS = ['🏦', '💰', '💳', '🏧', '📈', '🪙', '💎', '🏠', '🚗', '💵', '🔒', '🌍'];

const ACCENT_COLORS = [
  '#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa',
  '#fb923c', '#22d3ee', '#f87171', '#4ade80', '#c084fc',
];

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (account: {
    name: string;
    bank_name?: string;
    account_type?: string;
    balance?: number;
    icon_emoji?: string;
    color?: string;
  }) => Promise<void>;
  editingAccount?: UserAccount | null;
  currency: string;
  isPending?: boolean;
}

export function AddAccountModal({ open, onClose, onSave, editingAccount, currency, isPending }: AddAccountModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(editingAccount?.name ?? '');
  const [bankName, setBankName] = useState(editingAccount?.bank_name ?? '');
  const [accountType, setAccountType] = useState(editingAccount?.account_type ?? 'checking');
  const [balance, setBalance] = useState(editingAccount?.balance?.toString() ?? '0');
  const [iconEmoji, setIconEmoji] = useState(editingAccount?.icon_emoji ?? '🏦');
  const [color, setColor] = useState(editingAccount?.color ?? '#60a5fa');

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      bank_name: bankName.trim() || undefined,
      account_type: accountType,
      balance: parseFloat(balance) || 0,
      icon_emoji: iconEmoji,
      color,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md glass-modal rounded-3xl overflow-hidden"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {editingAccount ? t('finance.accounts.editAccount') : t('finance.accounts.addAccount')}
            </h2>
            <button onClick={onClose} className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Emoji picker */}
            <div>
              <Label>{t('finance.accounts.icon')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {BANK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setIconEmoji(emoji)}
                    className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                      iconEmoji === emoji ? 'neu-inset ring-2 ring-primary/50' : 'hover:bg-muted/50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <Label>{t('finance.accounts.color')}</Label>
              <div className="flex gap-2 mt-2">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('finance.accounts.accountName')}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5 finance-input" maxLength={40} placeholder="e.g. Main Account" />
              </div>
              <div>
                <Label>{t('finance.accounts.bankName')}</Label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} className="mt-1.5 finance-input" maxLength={40} placeholder="e.g. BNP Paribas" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('finance.accounts.type')}</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger className="mt-1.5 bg-muted dark:bg-slate-800/60 border-border text-foreground rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-xl">
                    {ACCOUNT_TYPES.map(type => (
                      <SelectItem key={type} value={type} className="text-foreground rounded-lg">
                        {t(`finance.accounts.types.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('finance.accounts.initialBalance')}</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={balance}
                    onChange={e => setBalance(e.target.value.replace(/[^0-9.\-]/g, ''))}
                    className="pl-7 finance-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-12 border-border rounded-xl">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || isPending} className="flex-1 h-12 rounded-xl">
              {editingAccount ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editingAccount ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
