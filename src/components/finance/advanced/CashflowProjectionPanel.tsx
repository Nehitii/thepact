import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { useCashflowProjection } from "@/hooks/useFinanceAdvanced";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { Loader2 } from "lucide-react";

const RANGES = [3, 6, 12] as const;

export function CashflowProjectionPanel() {
  const [months, setMonths] = useState<3 | 6 | 12>(6);
  const { data = [], isLoading } = useCashflowProjection(months);
  const { currency } = useCurrency();

  const chartData = data.map((d) => ({
    month: format(parseISO(d.month_start), "MMM yy"),
    realistic: Number(d.cumulative_realistic),
    worst: Number(d.cumulative_worst),
    best: Number(d.cumulative_best),
  }));

  const lastReal = data.at(-1)?.cumulative_realistic ?? 0;
  const lastWorst = data.at(-1)?.cumulative_worst ?? 0;
  const lastBest = data.at(-1)?.cumulative_best ?? 0;

  return (
    <section className="aura-glass p-6 sm:p-8 space-y-5">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground/80 mb-1">
            Cashflow projeté
          </h2>
          <p className="text-xs text-muted-foreground/60">
            Scénarios pessimiste / réaliste / optimiste sur {months} mois
          </p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setMonths(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                months === r
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground/70 hover:text-foreground"
              }`}
            >
              {r} mois
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground/70">
          Pas assez de données pour projeter
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pessimiste", value: lastWorst, color: "text-rose-300" },
              { label: "Réaliste", value: lastReal, color: "text-foreground" },
              { label: "Optimiste", value: lastBest, color: "text-emerald-300" },
            ].map((c) => (
              <div key={c.label} className="rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
                  {c.label}
                </div>
                <div className={`mt-1 text-lg font-semibold tabular-nums ${c.color}`}>
                  {formatCurrency(c.value, currency)}
                </div>
              </div>
            ))}
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatCurrency(v, currency)} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => formatCurrency(v, currency)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="worst" stroke="#fb7185" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Pessimiste" />
                <Line type="monotone" dataKey="realistic" stroke="hsl(var(--primary))" strokeWidth={2.2} dot={false} name="Réaliste" />
                <Line type="monotone" dataKey="best" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Optimiste" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
