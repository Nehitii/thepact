import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, Check, AlertTriangle } from 'lucide-react';
import { useAddTransactionsBatch } from '@/hooks/useTransactions';
import { toast } from 'sonner';
import type { UserAccount } from '@/types/finance';

interface Props {
  open: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  defaultDateFormat?: string;
  defaultDelimiter?: string;
}

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
}

// Keywords for auto-detecting column roles from headers
const DATE_KEYWORDS = ['date', 'datum', 'jour', 'day', 'valeur', 'opération', 'operation', 'booking'];
const DESC_KEYWORDS = ['description', 'libellé', 'libelle', 'label', 'wording', 'motif', 'référence', 'reference', 'text', 'memo', 'narrative'];
const AMOUNT_KEYWORDS = ['amount', 'montant', 'somme', 'betrag', 'value'];
const DEBIT_KEYWORDS = ['debit', 'débit', 'withdrawal', 'retrait', 'charge', 'soll'];
const CREDIT_KEYWORDS = ['credit', 'crédit', 'deposit', 'versement', 'haben'];

function normalizeHeader(h: string): string {
  return h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function matchesKeywords(header: string, keywords: string[]): boolean {
  const h = normalizeHeader(header);
  return keywords.some(k => h.includes(k));
}

/** Parse an amount string handling French/European formats:
 *  "1 234,56" → 1234.56
 *  "1.234,56" → 1234.56
 *  "-1234.56" → -1234.56
 *  "1,234.56" → 1234.56
 */
function parseAmount(raw: string): number {
  let s = raw.trim().replace(/["']/g, '').replace(/\s/g, '');
  if (!s) return NaN;

  // Detect format: if both . and , exist, the last one is the decimal separator
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma > lastDot) {
    // European: 1.234,56 → remove dots, replace comma with dot
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // US/standard: 1,234.56 → remove commas
    s = s.replace(/,/g, '');
  } else if (lastComma >= 0 && lastDot < 0) {
    // Only comma: 1234,56 → replace comma with dot
    s = s.replace(',', '.');
  }
  // else only dot or no separator — already fine

  return parseFloat(s);
}

function parseDate(raw: string, dateFormat: string): string {
  const cleaned = raw.trim().replace(/["']/g, '');
  if (dateFormat === 'DD/MM/YYYY') {
    const [d, m, y] = cleaned.split(/[/\-.]/);
    if (!d || !m || !y) return '';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (dateFormat === 'MM/DD/YYYY') {
    const [m, d, y] = cleaned.split(/[/\-.]/);
    if (!d || !m || !y) return '';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // YYYY-MM-DD or auto
  const parts = cleaned.split(/[/\-.]/);
  if (parts.length === 3 && parts[0].length === 4) return cleaned;
  // Try DD/MM/YYYY as fallback
  if (parts.length === 3 && parts[2]?.length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return cleaned;
}

/** Split a CSV line respecting quoted fields */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

export function CsvImportModal({ open, onClose, accounts, defaultDateFormat, defaultDelimiter }: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const addBatch = useAddTransactionsBatch();

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [accountId, setAccountId] = useState('');
  const [fileName, setFileName] = useState('');
  const [dateFormat, setDateFormat] = useState<string>(defaultDateFormat || 'DD/MM/YYYY');
  const [delimiterSetting, setDelimiterSetting] = useState<string>(defaultDelimiter || ';');

  const delimiter = delimiterSetting === 'tab' ? '\t' : delimiterSetting;

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { toast.error(t('finance.transactions.csvEmpty')); return; }

      // Parse header to auto-detect columns
      const headers = splitCsvLine(lines[0], delimiter);

      let dateCol = -1;
      let descCol = -1;
      let amountCol = -1;
      let debitCol = -1;
      let creditCol = -1;

      headers.forEach((h, i) => {
        if (dateCol < 0 && matchesKeywords(h, DATE_KEYWORDS)) dateCol = i;
        else if (descCol < 0 && matchesKeywords(h, DESC_KEYWORDS)) descCol = i;
        else if (debitCol < 0 && matchesKeywords(h, DEBIT_KEYWORDS)) debitCol = i;
        else if (creditCol < 0 && matchesKeywords(h, CREDIT_KEYWORDS)) creditCol = i;
        else if (amountCol < 0 && matchesKeywords(h, AMOUNT_KEYWORDS)) amountCol = i;
      });

      // Fallback: if no specific debit/credit found and no amount, try positional
      if (dateCol < 0) dateCol = 0;
      if (descCol < 0) descCol = dateCol === 0 ? 1 : 0;
      const hasDebitCredit = debitCol >= 0 || creditCol >= 0;
      if (amountCol < 0 && !hasDebitCredit) {
        // Use first numeric-looking column after desc
        amountCol = Math.max(dateCol, descCol) + 1;
      }

      const parsed: ParsedRow[] = [];
      let skipped = 0;

      for (let i = 1; i < lines.length && i < 5001; i++) {
        const cols = splitCsvLine(lines[i], delimiter);
        if (cols.length < 2) { skipped++; continue; }

        const dateStr = parseDate(cols[dateCol] || '', dateFormat);
        if (!dateStr || dateStr.includes('NaN') || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { skipped++; continue; }

        const desc = (cols[descCol] || 'Imported').trim();

        let amount: number;
        let txType: 'debit' | 'credit';

        if (hasDebitCredit) {
          const debitVal = debitCol >= 0 ? parseAmount(cols[debitCol] || '') : NaN;
          const creditVal = creditCol >= 0 ? parseAmount(cols[creditCol] || '') : NaN;

          if (!isNaN(debitVal) && Math.abs(debitVal) > 0) {
            amount = Math.abs(debitVal);
            txType = 'debit';
          } else if (!isNaN(creditVal) && Math.abs(creditVal) > 0) {
            amount = Math.abs(creditVal);
            txType = 'credit';
          } else {
            skipped++;
            continue;
          }
        } else {
          amount = parseAmount(cols[amountCol] || '');
          if (isNaN(amount)) { skipped++; continue; }
          txType = amount < 0 ? 'debit' : 'credit';
          amount = Math.abs(amount);
        }

        if (amount === 0) { skipped++; continue; }

        parsed.push({ date: dateStr, description: desc, amount, type: txType });
      }

      setRows(parsed);
      setSkippedCount(skipped);
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
      setSkippedCount(0);
      onClose();
    } catch {
      toast.error(t('finance.transactions.importFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setRows([]); setFileName(''); setSkippedCount(0); onClose(); } }}>
      <DialogContent className="bg-card dark:bg-gradient-to-br dark:from-[#0d1220] dark:to-[#080c14] border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {t('finance.transactions.csvImportTitle')}
          </DialogTitle>
        </DialogHeader>

        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

        <div className="space-y-4 pt-2">
          {/* Settings row always visible */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">{t('finance.settings.csvDateFormat')}</label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger className="mt-1 bg-muted dark:bg-slate-800/60 border-border rounded-lg h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">{t('finance.settings.csvDelimiter')}</label>
              <Select value={delimiterSetting} onValueChange={setDelimiterSetting}>
                <SelectTrigger className="mt-1 bg-muted dark:bg-slate-800/60 border-border rounded-lg h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  <SelectItem value=",">{t('finance.settings.delimiterComma')}</SelectItem>
                  <SelectItem value=";">{t('finance.settings.delimiterSemicolon')}</SelectItem>
                  <SelectItem value="tab">{t('finance.settings.delimiterTab')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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

              {skippedCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-400">{t('finance.transactions.skippedRows', { count: skippedCount })}</p>
                </div>
              )}

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
                    {rows.slice(0, 30).map((r, i) => (
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
                {rows.length > 30 && <p className="p-2 text-xs text-center text-muted-foreground">…{t('common.more')} ({rows.length - 30})</p>}
              </div>

              {/* Re-upload button */}
              <Button variant="outline" size="sm" onClick={() => { setRows([]); setSkippedCount(0); fileRef.current?.click(); }} className="w-full border-border rounded-xl text-xs">
                <Upload className="w-3.5 h-3.5 mr-1.5" /> {t('finance.transactions.chooseAnotherFile')}
              </Button>

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
            <Button variant="outline" onClick={() => { setRows([]); setFileName(''); setSkippedCount(0); onClose(); }} className="flex-1 border-border">{t('common.cancel')}</Button>
            <Button onClick={handleImport} disabled={rows.length === 0 || addBatch.isPending} className="flex-1">
              {addBatch.isPending ? t('common.saving') : t('finance.transactions.importBtn', { count: rows.length })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
