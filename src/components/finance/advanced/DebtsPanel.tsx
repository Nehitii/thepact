import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import {
  useDebts,
  useUpsertDebt,
  useDeleteDebt,
  useDebtSchedule,
  type Debt,
} from "@/hooks/useFinanceAdvanced";

const TYPES = [
  { value: "loan", label: "Prêt" },
  { value: "mortgage", label: "Hypothèque" },
  { value: "credit_card", label: "Carte de crédit" },
  { value: "personal", label: "Personnelle" },
  { value: "other", label: "Autre" },
];

export function DebtsPanel() {
  const { data: debts = [], isLoading } = useDebts();
  const upsert = useUpsertDebt();
  const del = useDeleteDebt();
  const { currency } = useCurrency();

  const [editing, setEditing] = useState<Partial<Debt> | null>(null);
  const [openSchedule, setOpenSchedule] = useState<string | null>(null);

  const totalBalance = debts.reduce((s, d) => s + Number(d.current_balance || 0), 0);
  const totalMonthly = debts.reduce((s, d) => s + Number(d.monthly_payment || 0), 0);

  return (
    <section className="aura-glass p-6 sm:p-8 space-y-5">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground/80 mb-1">
            Dettes
          </h2>
          <p className="text-xs text-muted-foreground/60">
            Solde total: <span className="text-foreground tabular-nums">{formatCurrency(totalBalance, currency)}</span>{" "}
            · Mensuel:{" "}
            <span className="text-foreground tabular-nums">{formatCurrency(totalMonthly, currency)}</span>
          </p>
        </div>
        <Button
          size="sm"
          onClick={() =>
            setEditing({
              name: "",
              debt_type: "loan",
              principal: 0,
              current_balance: 0,
              interest_rate: 0,
              monthly_payment: 0,
              start_date: new Date().toISOString().slice(0, 10),
              is_active: true,
            })
          }
        >
          <Plus className="w-4 h-4 mr-1" /> Nouvelle dette
        </Button>
      </header>

      {isLoading ? (
        <div className="h-32 grid place-items-center text-sm text-muted-foreground/70">Chargement…</div>
      ) : debts.length === 0 ? (
        <div className="h-32 grid place-items-center text-sm text-muted-foreground/70">
          Aucune dette enregistrée.
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((d) => {
            const paidPct =
              d.principal > 0 ? Math.max(0, Math.min(100, ((d.principal - d.current_balance) / d.principal) * 100)) : 0;
            return (
              <div key={d.id} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{d.name}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
                      {TYPES.find((t) => t.value === d.debt_type)?.label || d.debt_type} · {d.interest_rate}% / an
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(d)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">
                      Éditer
                    </button>
                    <button onClick={() => del.mutate(d.id)} className="text-rose-400 hover:text-rose-300 p-1" aria-label="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="tabular-nums">{formatCurrency(Number(d.current_balance), currency)} restant</span>
                    <span className="text-muted-foreground/70 tabular-nums">
                      {formatCurrency(Number(d.principal), currency)} initial
                    </span>
                  </div>
                  <Progress value={paidPct} className="h-1.5" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
                  <span>
                    Mensualité: <span className="text-foreground tabular-nums">{formatCurrency(Number(d.monthly_payment), currency)}</span>
                  </span>
                  <button
                    onClick={() => setOpenSchedule(openSchedule === d.id ? null : d.id)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Échéancier {openSchedule === d.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
                {openSchedule === d.id && <DebtScheduleTable debtId={d.id} />}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Éditer la dette" : "Nouvelle dette"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Nom</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={editing.debt_type ?? "loan"} onValueChange={(v) => setEditing({ ...editing, debt_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Taux annuel (%)</Label>
                  <Input type="number" step="0.01" value={editing.interest_rate ?? 0} onChange={(e) => setEditing({ ...editing, interest_rate: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Capital initial</Label>
                  <Input type="number" value={editing.principal ?? 0} onChange={(e) => setEditing({ ...editing, principal: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Solde restant</Label>
                  <Input type="number" value={editing.current_balance ?? 0} onChange={(e) => setEditing({ ...editing, current_balance: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Mensualité</Label>
                  <Input type="number" value={editing.monthly_payment ?? 0} onChange={(e) => setEditing({ ...editing, monthly_payment: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Date de début</Label>
                <Input type="date" value={editing.start_date ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
                <Button
                  onClick={async () => {
                    if (!editing.name) return;
                    await upsert.mutateAsync(editing as any);
                    setEditing(null);
                  }}
                  disabled={upsert.isPending}
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function DebtScheduleTable({ debtId }: { debtId: string }) {
  const { currency } = useCurrency();
  const { data = [], isLoading } = useDebtSchedule(debtId);
  if (isLoading) return <div className="py-4 grid place-items-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;
  if (data.length === 0) return <div className="py-3 text-xs text-muted-foreground/70">Renseigne taux & mensualité pour voir l'échéancier.</div>;
  return (
    <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-white/[0.05]">
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-background/95 backdrop-blur">
          <tr className="text-muted-foreground/70 text-left">
            <th className="px-2 py-1.5">#</th>
            <th className="px-2 py-1.5">Date</th>
            <th className="px-2 py-1.5 text-right">Paiement</th>
            <th className="px-2 py-1.5 text-right">Intérêts</th>
            <th className="px-2 py-1.5 text-right">Capital</th>
            <th className="px-2 py-1.5 text-right">Restant</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.installment} className="border-t border-white/[0.04] tabular-nums">
              <td className="px-2 py-1">{r.installment}</td>
              <td className="px-2 py-1">{format(parseISO(r.due_date), "MMM yy")}</td>
              <td className="px-2 py-1 text-right">{formatCurrency(Number(r.payment), currency)}</td>
              <td className="px-2 py-1 text-right text-rose-300/80">{formatCurrency(Number(r.interest), currency)}</td>
              <td className="px-2 py-1 text-right text-emerald-300/80">{formatCurrency(Number(r.principal_paid), currency)}</td>
              <td className="px-2 py-1 text-right">{formatCurrency(Number(r.remaining_balance), currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
