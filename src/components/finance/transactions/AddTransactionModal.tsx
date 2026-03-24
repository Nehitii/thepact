import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCurrencySymbol } from '@/lib/currency';
import { useAddTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { EXPENSE_CATEGORIES } from '@/lib/financeCategories';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { UserAccount } from '@/types/finance';

interface Props {
  open: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  currency: string;
  editingTransaction?: {
    id: string;
    description: string;
    amount: number;
    transaction_type: string;
    transaction_date: string;
    category?: string | null;
    note?: string | null;
    account_id?: string | null;
  } | null;
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

  const isEditing = !!editingTransaction;

  // Reset form when modal opens or editingTransaction changes
  useEffect(() => {
    if (open && editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setType(editingTransaction.transaction_type);
      setDate(editingTransaction.transaction_date);
      setCategory(editingTransaction.category || '');
      setAccountId(editingTransaction.account_id || '');
      setNote(editingTransaction.note || '');
    } else if (open && !editingTransaction) {
      setDescription('');
      setAmount('');
      setType('debit');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setCategory('');
      setAccountId('');
      setNote('');
    }
  }, [open, editingTransaction]);

  const handleSubmit = async () => {
    if (!description.trim() || !amount) return;
    try {
      if (isEditing && editingTransaction) {
        await updateTx.mutateAsync({
          id: editingTransaction.id,
          description: description.trim(),
          amount: parseFloat(amount),
          transaction_type: type,
          transaction_date: date,
          category: category || undefined,
          note: note || undefined,
          account_id: accountId || undefined,
        });
        toast.success(t('common.updated'));
      } else {
        await addTx.mutateAsync({
          description: description.trim(),
          amount: parseFloat(amount),
          transaction_type: type,
          transaction_date: date,
          category: category || undefined,
          note: note || undefined,
          account_id: accountId || undefined,
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
            <Input value={description} onChange={e => setDescription(e.target.value)} className="finance-input" maxLength={100} placeholder={t('finance.transactions.descriptionPlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('finance.recurring.amount')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(currency)}</span>
                <Input type="text" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="pl-7 finance-input" placeholder="0" />
              </div>
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
            <Button onClick={handleSubmit} disabled={!description.trim() || !amount || isPending} className="flex-1">
              {isPending ? t('common.saving') : isEditing ? t('common.saveChanges') : t('common.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
