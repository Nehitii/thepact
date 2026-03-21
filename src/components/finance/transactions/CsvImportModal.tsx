import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, Check } from 'lucide-react';
import { useAddTransactionsBatch } from '@/hooks/useTransactions';
import { toast } from 'sonner';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import type { UserAccount } from '@/types/finance';

interface Props {
  open: boolean;
  onClose: () => void;
  accounts: UserAccount[];
}

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
}

export function CsvImportModal({ open, onClose, accounts }: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const addBatch = useAddTransactionsBatch();
  const { data: profile } = useProfileSettings();

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [accountId, setAccountId] = useState('');
  const [fileName, setFileName] = useState('');

  const delimiter = profile?.finance_csv_delimiter || ',';
  const dateFormat = profile?.finance_csv_date_format || 'YYYY-MM-DD';

  const parseDate = (raw: string): string => {
    const cleaned = raw.trim().replace(/["']/g, '');
    if (dateFormat === 'DD/MM/YYYY') {
      const [d, m, y] = cleaned.split(/[/\-.]/);
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (dateFormat === 'MM/DD/YYYY') {
      const [m, d, y] = cleaned.split(/[/\-.]/);
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return cleaned; // YYYY-MM-DD
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error(t('finance.transactions.csvEmpty')); return; }

      // Skip header
      const parsed: ParsedRow[] = [];
      for (let i = 1; i < lines.length && i < 501; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 3) continue;

        // Try to auto-detect: date, description, amount (or debit/credit cols)
        const dateStr = parseDate(cols[0]);
        const desc = cols[1] || 'Imported';
        let amount = parseFloat(cols[2]?.replace(/[^\d.\-,]/g, '').replace(',', '.') || '0');
        let txType: 'debit' | 'credit' = amount < 0 ? 'debit' : 'credit';

        // If there's a 4th column, it might be credit amount
        if (cols.length >= 4 && cols[3]) {
          const credit = parseFloat(cols[3]?.replace(/[^\d.\-,]/g, '').replace(',', '.') || '0');
          if (credit > 0) {
            amount = credit;
            txType = 'credit';
          } else {
            amount = Math.abs(amount);
            txType = 'debit';
          }
        } else {
          amount = Math.abs(amount);
        }

        if (isNaN(amount) || amount === 0) continue;
        if (!dateStr || dateStr === 'NaN-NaN-NaN') continue;

        parsed.push({ date: dateStr, description: desc, amount, type: txType });
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    try {
      await addBatch.mutateAsync(
        rows.map(r => ({
          description: r.description,
          amount: r.amount,
          transaction_type: r.type,
          transaction_date: r.date,
          account_id: accountId || undefined,
          source: 'csv_import',
        }))
      );
      toast.success(t('finance.transactions.importSuccess', { count: rows.length }));
      setRows([]);
      setFileName('');
      onClose();
    } catch {
      toast.error(t('finance.transactions.importFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setRows([]); setFileName(''); onClose(); } }}>
      <DialogContent className="bg-card dark:bg-gradient-to-br dark:from-[#0d1220] dark:to-[#080c14] border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {t('finance.transactions.csvImportTitle')}
          </DialogTitle>
        </DialogHeader>

        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

        <div className="space-y-4 pt-2">
          {rows.length === 0 ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full p-8 border-2 border-dashed border-border hover:border-primary/50 rounded-2xl flex flex-col items-center gap-3 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('finance.transactions.csvSelectFile')}</span>
              <span className="text-xs text-muted-foreground/60">{t('finance.transactions.csvHint')}</span>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{t('finance.transactions.csvRowsParsed', { count: rows.length })}</p>
                </div>
              </div>

              {/* Preview */}
              <div className="max-h-[200px] overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="p-2 text-left text-muted-foreground">{t('finance.transactions.date')}</th>
                      <th className="p-2 text-left text-muted-foreground">{t('finance.transactions.description')}</th>
                      <th className="p-2 text-right text-muted-foreground">{t('finance.recurring.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="p-2 text-muted-foreground">{r.date}</td>
                        <td className="p-2 text-foreground truncate max-w-[150px]">{r.description}</td>
                        <td className={`p-2 text-right font-medium ${r.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {r.type === 'credit' ? '+' : '-'}{r.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && <p className="p-2 text-xs text-center text-muted-foreground">…{t('common.more')} ({rows.length - 20})</p>}
              </div>

              {/* Account selector */}
              {accounts.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground font-medium">{t('finance.transactions.linkToAccount')}</label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger className="bg-muted dark:bg-slate-800/60 border-border rounded-lg">
                      <SelectValue placeholder={t('common.optional')} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border rounded-xl">
                      {accounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.icon_emoji} {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => { setRows([]); setFileName(''); onClose(); }} className="flex-1 border-border">{t('common.cancel')}</Button>
            <Button onClick={handleImport} disabled={rows.length === 0 || addBatch.isPending} className="flex-1">
              {addBatch.isPending ? t('common.saving') : t('finance.transactions.importBtn', { count: rows.length })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
