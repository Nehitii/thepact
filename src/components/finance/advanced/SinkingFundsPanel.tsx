import { useState } from "react";
import { Plus, Trash2, PiggyBank, X, Check } from "lucide-react";
import { format, parseISO, differenceInMonths } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import {
  useSinkingFunds,
  useUpsertSinkingFund,
  useDeleteSinkingFund,
  useApplySinkingContribution,
  type SinkingFund,
} from "@/hooks/useFinanceAdvanced";

export function SinkingFundsPanel() {
  const { data: funds = [], isLoading } = useSinkingFunds();
  const upsert = useUpsertSinkingFund();
  const del = useDeleteSinkingFund();
  const contribute = useApplySinkingContribution();
  const { currency } = useCurrency();

  const [editing, setEditing] = useState<Partial<SinkingFund> | null>(null);
  const [contribFor, setContribFor] = useState<SinkingFund | null>(null);
  const [contribAmount, setContribAmount] = useState("");

  return (
    <section className="aura-glass p-6 sm:p-8 space-y-5">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground/80 mb-1">
            Sinking Funds
          </h2>
          <p className="text-xs text-muted-foreground/60">
            Provisions mensuelles vers des objectifs futurs
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setEditing({ name: "", target_amount: 0, monthly_contribution: 0, current_balance: 0, is_active: true })}
        >
          <Plus className="w-4 h-4 mr-1" /> Nouveau fonds
        </Button>
      </header>

      {isLoading ? (
        <div className="h-32 grid place-items-center text-sm text-muted-foreground/70">Chargement…</div>
      ) : funds.length === 0 ? (
        <div className="h-32 grid place-items-center text-sm text-muted-foreground/70">
          Aucun fonds. Créez votre premier objectif d'épargne.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {funds.map((f) => {
            const pct = f.target_amount > 0 ? Math.min(100, (Number(f.current_balance) / Number(f.target_amount)) * 100) : 0;
            const monthsLeft = f.target_date ? Math.max(0, differenceInMonths(parseISO(f.target_date), new Date())) : null;
            const monthlyNeeded =
              f.target_date && f.target_amount > 0 && monthsLeft !== null && monthsLeft > 0
                ? Math.max(0, (Number(f.target_amount) - Number(f.current_balance)) / monthsLeft)
                : 0;
            return (
              <div key={f.id} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl">{f.icon_emoji || "🐖"}</span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{f.name}</div>
                      {f.target_date && (
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
                          Cible {format(parseISO(f.target_date), "MMM yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(f)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">
                      Éditer
                    </button>
                    <button onClick={() => del.mutate(f.id)} className="text-rose-400 hover:text-rose-300 p-1" aria-label="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="tabular-nums">{formatCurrency(Number(f.current_balance), currency)}</span>
                    <span className="text-muted-foreground/70 tabular-nums">
                      / {formatCurrency(Number(f.target_amount), currency)}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
                  <span>
                    Contrib. mensuelle: <span className="text-foreground tabular-nums">{formatCurrency(Number(f.monthly_contribution), currency)}</span>
                  </span>
                  {monthlyNeeded > 0 && (
                    <span className="text-amber-300/80">
                      Besoin: {formatCurrency(monthlyNeeded, currency)}/mois
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setContribFor(f);
                    setContribAmount(String(f.monthly_contribution || ""));
                  }}
                >
                  <PiggyBank className="w-3.5 h-3.5 mr-1" /> Contribuer
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Éditer le fonds" : "Nouveau sinking fund"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Nom</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Emoji</Label>
                  <Input value={editing.icon_emoji ?? ""} onChange={(e) => setEditing({ ...editing, icon_emoji: e.target.value })} placeholder="🐖" />
                </div>
                <div>
                  <Label>Date cible</Label>
                  <Input type="date" value={editing.target_date ?? ""} onChange={(e) => setEditing({ ...editing, target_date: e.target.value || null })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Montant cible</Label>
                  <Input type="number" value={editing.target_amount ?? 0} onChange={(e) => setEditing({ ...editing, target_amount: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Solde actuel</Label>
                  <Input type="number" value={editing.current_balance ?? 0} onChange={(e) => setEditing({ ...editing, current_balance: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Mensuel</Label>
                  <Input type="number" value={editing.monthly_contribution ?? 0} onChange={(e) => setEditing({ ...editing, monthly_contribution: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>
                  <X className="w-4 h-4 mr-1" /> Annuler
                </Button>
                <Button
                  onClick={async () => {
                    if (!editing.name) return;
                    await upsert.mutateAsync(editing as any);
                    setEditing(null);
                  }}
                  disabled={upsert.isPending}
                >
                  <Check className="w-4 h-4 mr-1" /> Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contribute dialog */}
      <Dialog open={!!contribFor} onOpenChange={(o) => !o && setContribFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contribuer à {contribFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Montant</Label>
              <Input type="number" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setContribFor(null)}>
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  if (!contribFor) return;
                  await contribute.mutateAsync({ fundId: contribFor.id, amount: Number(contribAmount) });
                  setContribFor(null);
                  setContribAmount("");
                }}
                disabled={contribute.isPending || !contribAmount}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
