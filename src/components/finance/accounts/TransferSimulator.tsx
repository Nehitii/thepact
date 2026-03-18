import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowDownUp, Check, X, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
import type { UserAccount, AccountTransfer } from '@/types/finance';

interface TransferSimulatorProps {
  accounts: UserAccount[];
  transfers: AccountTransfer[];
  currency: string;
  onTransfer: (params: { from_account_id: string; to_account_id: string; amount: number; note?: string }) => Promise<void>;
  isPending: boolean;
}

export function TransferSimulator({ accounts, transfers, currency, onTransfer, isPending }: TransferSimulatorProps) {
  const { t } = useTranslation();
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const activeAccounts = accounts.filter(a => a.is_active);
  const fromAccount = activeAccounts.find(a => a.id === fromId);
  const toAccount = activeAccounts.find(a => a.id === toId);
  const parsedAmount = parseFloat(amount) || 0;

  const canTransfer = fromId && toId && fromId !== toId && parsedAmount > 0;

  const handleTransfer = async () => {
    if (!canTransfer) return;
    await onTransfer({
      from_account_id: fromId,
      to_account_id: toId,
      amount: parsedAmount,
      note: note.trim() || undefined,
    });
    setAmount('');
    setNote('');
  };

  const accountsById = useMemo(() => {
    const map: Record<string, UserAccount> = {};
    accounts.forEach(a => { map[a.id] = a; });
    return map;
  }, [accounts]);

  return (
    <div className="space-y-6">
      {/* Transfer Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neu-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center">
            <ArrowDownUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{t('finance.transfers.title')}</h3>
            <p className="text-xs text-muted-foreground">{t('finance.transfers.subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end mb-6">
          <div>
            <Label>{t('finance.transfers.from')}</Label>
            <Select value={fromId} onValueChange={setFromId}>
              <SelectTrigger className="mt-1.5 bg-muted dark:bg-slate-800/60 border-border text-foreground rounded-lg h-12">
                <SelectValue placeholder={t('finance.transfers.selectAccount')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border rounded-xl">
                {activeAccounts.map(a => (
                  <SelectItem key={a.id} value={a.id} className="text-foreground rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{a.icon_emoji || '🏦'}</span>
                      <span>{a.name}</span>
                      <span className="text-muted-foreground text-xs ml-auto">{formatCurrency(a.balance, currency)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center pb-1">
            <div className="w-10 h-10 rounded-full neu-inset flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          </div>

          <div>
            <Label>{t('finance.transfers.to')}</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger className="mt-1.5 bg-muted dark:bg-slate-800/60 border-border text-foreground rounded-lg h-12">
                <SelectValue placeholder={t('finance.transfers.selectAccount')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border rounded-xl">
                {activeAccounts.filter(a => a.id !== fromId).map(a => (
                  <SelectItem key={a.id} value={a.id} className="text-foreground rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{a.icon_emoji || '🏦'}</span>
                      <span>{a.name}</span>
                      <span className="text-muted-foreground text-xs ml-auto">{formatCurrency(a.balance, currency)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>{t('finance.transfers.amount')}</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
              <Input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                className="pl-7 h-12 finance-input"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <Label>{t('finance.transfers.note')}</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} className="mt-1.5 h-12 finance-input" maxLength={100} placeholder={t('finance.transfers.notePlaceholder')} />
          </div>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {canTransfer && fromAccount && toAccount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="p-4 rounded-xl neu-inset grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{fromAccount.icon_emoji} {fromAccount.name}</p>
                  <p className="text-sm text-muted-foreground line-through tabular-nums">{formatCurrency(fromAccount.balance, currency)}</p>
                  <p className="text-lg font-bold text-rose-400 tabular-nums">{formatCurrency(fromAccount.balance - parsedAmount, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{toAccount.icon_emoji} {toAccount.name}</p>
                  <p className="text-sm text-muted-foreground line-through tabular-nums">{formatCurrency(toAccount.balance, currency)}</p>
                  <p className="text-lg font-bold text-emerald-400 tabular-nums">{formatCurrency(toAccount.balance + parsedAmount, currency)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleTransfer}
          disabled={!canTransfer || isPending}
          className="w-full h-12 rounded-xl"
        >
          <ArrowDownUp className="w-4 h-4 mr-2" />
          {isPending ? t('common.processing') : t('finance.transfers.execute')}
        </Button>
      </motion.div>

      {/* Transfer History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="neu-card overflow-hidden"
      >
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{t('finance.transfers.history')}</span>
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted/40">{transfers.length}</span>
          </div>
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="px-5 pb-5 space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {transfers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">{t('finance.transfers.noHistory')}</p>
                ) : (
                  transfers.map(tr => {
                    const from = accountsById[tr.from_account_id];
                    const to = accountsById[tr.to_account_id];
                    return (
                      <div key={tr.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                        <span className="text-sm">{from?.icon_emoji || '?'}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-sm">{to?.icon_emoji || '?'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">
                            {from?.name || '?'} → {to?.name || '?'}
                          </p>
                          {tr.note && <p className="text-xs text-muted-foreground truncate">{tr.note}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(tr.amount, currency)}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(tr.transfer_date), 'dd MMM')}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
