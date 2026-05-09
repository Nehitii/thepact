import { useMemo } from "react";
import { TrendingUp, TrendingDown, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNetWorthSnapshots, useTakeNetWorthSnapshot } from "@/hooks/useNetWorthSnapshots";

function formatMoney(n: number, currency?: string | null) {
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "EUR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${Math.round(n)} ${currency ?? ""}`;
  }
}

export function NetWorthHistoryPanel() {
  const { data: snapshots = [], isLoading } = useNetWorthSnapshots(36);
  const take = useTakeNetWorthSnapshot();

  const stats = useMemo(() => {
    if (!snapshots.length) return null;
    const last = snapshots[snapshots.length - 1];
    const first = snapshots[0];
    const delta = Number(last.total_balance) - Number(first.total_balance);
    const pct = first.total_balance ? (delta / Number(first.total_balance)) * 100 : 0;
    const max = Math.max(...snapshots.map(s => Number(s.total_balance)));
    const min = Math.min(...snapshots.map(s => Number(s.total_balance)));
    return { last, first, delta, pct, max, min };
  }, [snapshots]);

  // Sparkline path
  const path = useMemo(() => {
    if (!snapshots.length || !stats) return "";
    const w = 600, h = 80;
    const range = stats.max - stats.min || 1;
    return snapshots.map((s, i) => {
      const x = snapshots.length > 1 ? (i / (snapshots.length - 1)) * w : w / 2;
      const y = h - ((Number(s.total_balance) - stats.min) / range) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  }, [snapshots, stats]);

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Patrimoine net — historique</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => take.mutate(undefined)}
          disabled={take.isPending}
          className="h-7 gap-1.5"
        >
          <Camera className="h-3 w-3" />
          Snapshot
        </Button>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground">Chargement…</div>
      ) : !snapshots.length ? (
        <div className="text-xs text-muted-foreground italic">
          Aucun snapshot. Clique sur "Snapshot" pour capturer ton patrimoine actuel.
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold tabular-nums">
              {formatMoney(Number(stats!.last.total_balance), stats!.last.currency)}
            </div>
            <div className={`flex items-center gap-1 text-xs ${stats!.delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {stats!.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {stats!.delta >= 0 ? "+" : ""}{formatMoney(stats!.delta, stats!.last.currency)} ({stats!.pct.toFixed(1)}%)
            </div>
          </div>

          <svg viewBox="0 0 600 80" preserveAspectRatio="none" className="w-full h-20">
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} L 600 80 L 0 80 Z`} fill="url(#nwGrad)" />
            <path d={path} stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" />
          </svg>

          <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>{snapshots[0].snapshot_date}</span>
            <span>{snapshots.length} pts</span>
            <span>{snapshots[snapshots.length - 1].snapshot_date}</span>
          </div>
        </>
      )}
    </div>
  );
}
