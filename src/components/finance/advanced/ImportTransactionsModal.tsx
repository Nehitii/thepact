import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Upload, Loader2, Check } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useAuth } from "@/contexts/AuthContext";
import { useApplyCategorizationRules } from "@/hooks/useFinanceAdvanced";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  category?: string;
  hash: string;
  duplicate?: boolean;
}

const HASH = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return String(h);
};

const DATE_FORMATS = ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"];

function parseDate(raw: string, fmt: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  let y = 0, m = 0, d = 0;
  try {
    if (fmt === "YYYY-MM-DD") {
      const [Y, M, D] = s.split(/[-/.]/).map(Number);
      y = Y; m = M; d = D;
    } else if (fmt === "DD/MM/YYYY") {
      const [D, M, Y] = s.split(/[-/.]/).map(Number);
      y = Y; m = M; d = D;
    } else {
      const [M, D, Y] = s.split(/[-/.]/).map(Number);
      y = Y; m = M; d = D;
    }
    if (!y || !m || !d) return null;
    return `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
  } catch { return null; }
}

export function ImportTransactionsModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { data: accounts = [] } = useAccounts(user?.id);
  const apply = useApplyCategorizationRules();
  const qc = useQueryClient();
  const [accountId, setAccountId] = useState<string>("");
  const [delimiter, setDelimiter] = useState<string>(",");
  const [dateFmt, setDateFmt] = useState<string>("YYYY-MM-DD");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => ({
    total: rows.length,
    valid: rows.filter((r) => !r.duplicate).length,
    dupes: rows.filter((r) => r.duplicate).length,
  }), [rows]);

  const handleFile = async (file: File) => {
    if (!user?.id) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsed: ParsedRow[] = [];
        for (const r of results.data) {
          const dateRaw = r.date || r.Date || r.DATE || r["Transaction Date"] || "";
          const desc = r.description || r.Description || r.label || r.Libellé || r.Memo || "";
          const amtRaw = r.amount || r.Amount || r.montant || r.Montant || "0";
          const cat = r.category || r.Category || undefined;
          const date = parseDate(dateRaw, dateFmt);
          const amt = Number(String(amtRaw).replace(/\s/g, "").replace(",", "."));
          if (!date || !desc || isNaN(amt)) continue;
          const hash = HASH(`${date}|${desc}|${amt}`);
          parsed.push({ date, description: desc, amount: amt, category: cat, hash });
        }
        // Dedup against last 365 days
        if (parsed.length > 0) {
          const minDate = parsed.reduce((m, r) => (r.date < m ? r.date : m), parsed[0].date);
          const { data: existing } = await supabase
            .from("bank_transactions")
            .select("description, amount, transaction_date")
            .eq("user_id", user.id)
            .gte("transaction_date", minDate)
            .limit(2000);
          const set = new Set((existing ?? []).map((e: any) => HASH(`${e.transaction_date}|${e.description}|${Number(e.amount)}`)));
          for (const r of parsed) if (set.has(r.hash)) r.duplicate = true;
        }
        setRows(parsed);
      },
      error: (err) => toast.error(err.message),
    });
  };

  const handleImport = async () => {
    if (!user?.id) return;
    const valid = rows.filter((r) => !r.duplicate);
    if (valid.length === 0) return;
    setImporting(true);
    try {
      const payload = valid.map((r) => ({
        user_id: user.id,
        transaction_date: r.date,
        description: r.description,
        amount: Math.abs(r.amount),
        transaction_type: r.amount < 0 ? "debit" : "credit",
        category: r.category || null,
        account_id: accountId || null,
        source: "csv_import",
      }));
      // Insert in chunks of 500
      for (let i = 0; i < payload.length; i += 500) {
        const chunk = payload.slice(i, i + 500);
        const { error } = await supabase.from("bank_transactions").insert(chunk);
        if (error) throw error;
      }
      toast.success(`${payload.length} transactions importées`);
      qc.invalidateQueries({ queryKey: ["bank_transactions"] });
      // Auto-categorize
      try { await apply.mutateAsync(Math.min(2000, payload.length)); } catch { /* non bloquant */ }
      setRows([]);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer un relevé CSV</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Compte cible</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Séparateur</Label>
            <Select value={delimiter} onValueChange={setDelimiter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value=",">Virgule (,)</SelectItem>
                <SelectItem value=";">Point-virgule (;)</SelectItem>
                <SelectItem value={"\t"}>Tabulation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Format date</Label>
            <Select value={dateFmt} onValueChange={setDateFmt}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border-2 border-dashed border-white/[0.08] p-6 text-center space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button onClick={() => inputRef.current?.click()} variant="secondary">
            <Upload className="w-4 h-4 mr-1" /> Choisir un CSV
          </Button>
          <p className="text-[11px] text-muted-foreground/70">
            Colonnes attendues : <code>date, description, amount</code> (et optionnellement <code>category</code>).
          </p>
        </div>

        {rows.length > 0 && (
          <>
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-3">
                <span><span className="text-muted-foreground/60">Total</span> <span className="tabular-nums">{stats.total}</span></span>
                <span><span className="text-emerald-300/80">À importer</span> <span className="tabular-nums">{stats.valid}</span></span>
                <span><span className="text-amber-300/80">Doublons</span> <span className="tabular-nums">{stats.dupes}</span></span>
              </div>
            </div>
            <div className="max-h-72 overflow-auto rounded-lg border border-white/[0.06]">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-background/95 backdrop-blur">
                  <tr className="text-left text-muted-foreground/70">
                    <th className="px-2 py-1.5">Date</th>
                    <th className="px-2 py-1.5">Description</th>
                    <th className="px-2 py-1.5 text-right">Montant</th>
                    <th className="px-2 py-1.5">État</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r, i) => (
                    <tr key={i} className={`border-t border-white/[0.04] ${r.duplicate ? "opacity-50" : ""}`}>
                      <td className="px-2 py-1 tabular-nums">{r.date}</td>
                      <td className="px-2 py-1 truncate max-w-[280px]">{r.description}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{r.amount.toFixed(2)}</td>
                      <td className="px-2 py-1">{r.duplicate ? "doublon" : "ok"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 100 && (
                <div className="text-center py-1.5 text-[10px] text-muted-foreground/60">+ {rows.length - 100} autres lignes</div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRows([])}>Réinitialiser</Button>
              <Button onClick={handleImport} disabled={importing || stats.valid === 0}>
                {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                Importer {stats.valid}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
