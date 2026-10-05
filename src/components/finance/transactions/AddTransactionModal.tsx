import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCurrencySymbol } from '@/lib/currency';
import { useAddTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { EXPENSE_CATEGORIES, detectCategoryFromName, roundMoney } from '@/lib/financeCategories';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';
import type { UserAccount, BankTransaction } from '@/types/finance';

const transactionSchema = z.object({
  description: z.string().trim().min(1, 'Description required').max(100),
  amount: z.number().positive('Amount must be positive').max(999999999),
  transaction_type: z.enum(['debit', 'credit']),
  transaction_date: z.string().min(1),
  category: z.string().optional(),
  note: z.string().max(200).optional(),
  account_id: z.string().optional(),
});

interface Props {
  open: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  currency: string;
  editingTransaction?: BankTransaction | null;
}

export function AddTransactionModal({ open, onClose, accounts, currency, editingTransaction }: Props) {
  const { t } = useTranslation();
  const addTx = useAddTransaction();
  const updateTx = useUpdateTransaction();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<string>('debit');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editingTransaction;

  useEffect(() => {
    if (open && editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setType(editingTransaction.transaction_type);
      setDate(editingTransaction.transaction_date);
      setCategory(editingTransaction.category || '');
      setAccountId(editingTransaction.account_id || '');
      setNote(editingTransaction.note || '');
      setErrors({});
    } else if (open && !editingTransaction) {
      setDescription('');
      setAmount('');
      setType('debit');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setCategory('');
      setAccountId('');
      setNote('');
      setErrors({});
    }
  }, [open, editingTransaction]);

  // Auto-categorization with debounce
  useEffect(() => {
    if (isEditing || !description.trim() || category) return;
    const timer = setTimeout(() => {
      const detected = detectCategoryFromName(description, EXPENSE_CATEGORIES);
      if (detected.value !== 'other') {
        setCategory(detected.value);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [description, isEditing]);

  const handleSubmit = async () => {
    const parsed = transactionSchema.safeParse({
      description: description.trim(),
      amount: parseFloat(amount) || 0,
      transaction_type: type,
      transaction_date: date,
      category: category || undefined,
      note: note || undefined,
      account_id: accountId || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach(e => {
        const field = e.path[0] as string;
        fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    try {
      if (isEditing && editingTransaction) {
        await updateTx.mutateAsync({
          id: editingTransaction.id,
          description: parsed.data.description,
          amount: roundMoney(parsed.data.amount),
          transaction_type: parsed.data.transaction_type,
          transaction_date: parsed.data.transaction_date,
          category: parsed.data.category,
          note: parsed.data.note,
          account_id: parsed.data.account_id,
        });
        toast.success(t('common.updated'));
      } else {
        await addTx.mutateAsync({
          description: parsed.data.description,
          amount: roundMoney(parsed.data.amount),
          transaction_type: parsed.data.transaction_type,
          transaction_date: parsed.data.transaction_date,
          category: parsed.data.category,
          note: parsed.data.note,
          account_id: parsed.data.account_id,
          source: 'manual',
        });
        toast.success(t('finance.transactions.added'));
      }
      onClose();
    } catch {
      toast.error(t('finance.transactions.addFailed'));
    }
  };

  const isPending = addTx.isPending || updateTx.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card dark:bg-gradient-to-br dark:from-[#0d1220] dark:to-[#080c14] border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? t('common.edit') : t('finance.transactions.addTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t('finance.transactions.description')}</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} className={`finance-input ${errors.description ? 'border-rose-500' : ''}`} maxLength={100} placeholder={t('finance.transactions.descriptionPlaceholder')} />
            {errors.description && <p className="text-xs text-rose-400">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('finance.recurring.amount')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                <Input type="text" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className={`pl-7 finance-input ${errors.amount ? 'border-rose-500' : ''}`} placeholder="0" />
              </div>
              {errors.amount && <p className="text-xs text-rose-400">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('finance.transactions.type')}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-muted dark:bg-slate-800/60 border-border rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  <SelectItem value="debit">{t('finance.transactions.debit')}</SelectItem>
                  <SelectItem value="credit">{t('finance.transactions.credit')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('finance.transactions.date')}</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="finance-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('finance.recurring.category')}</Label>
              <Select value={category || 'none'} onValueChange={v => setCategory(v === 'none' ? '' : v)}>
                <SelectTrigger className="bg-muted dark:bg-slate-800/60 border-border rounded-lg"><SelectValue placeholder={t('common.optional')} /></SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  <SelectItem value="none">{t('common.optional')}</SelectItem>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{t(`finance.categories.${c.value}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('finance.transactions.account')}</Label>
              <Select value={accountId || 'none'} onValueChange={v => setAccountId(v === 'none' ? '' : v)}>
                <SelectTrigger className="bg-muted dark:bg-slate-800/60 border-border rounded-lg"><SelectValue placeholder={t('common.optional')} /></SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  <SelectItem value="none">{t('common.optional')}</SelectItem>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.icon_emoji} {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('finance.transactions.note')}</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} className="finance-input" maxLength={200} placeholder={t('finance.transfers.notePlaceholder')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-border">{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
              {isPending ? t('common.saving') : isEditing ? t('common.saveChanges') : t('common.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
