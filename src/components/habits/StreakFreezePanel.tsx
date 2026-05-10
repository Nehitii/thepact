import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { Snowflake, Loader2 } from "lucide-react";
import { DSPanel } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useHabitLogs,
  useStreakFreezePrice,
  useUseStreakFreeze,
} from "@/hooks/useHabitLogs";
import { useBondBalance } from "@/hooks/useShop";
import { cn } from "@/lib/utils";

interface StreakFreezePanelProps {
  goalId: string;
}

/**
 * Allows the user to spend Bonds to retroactively "freeze" a missed habit day
 * within the last 7 days, preserving streak continuity.
 */
export function StreakFreezePanel({ goalId }: StreakFreezePanelProps) {
  const { user } = useAuth();
  const { data: bondBalance } = useBondBalance(user?.id);
  const { data: logs = [] } = useHabitLogs(goalId);
  const price = useStreakFreezePrice();
  const freeze = useUseStreakFreeze();
  const { toast } = useToast();
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const balance = bondBalance?.balance ?? 0;

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(today, i);
      const key = format(d, "yyyy-MM-dd");
      const log = logs.find((l) => l.log_date === key);
      const counted = !!log && (log.completed || (log as any).is_freeze);
      return {
        key,
        label: format(d, "EEE d"),
        counted,
        isFreeze: !!(log as any)?.is_freeze,
        isToday: i === 0,
      };
    });
  }, [logs]);

  const handleFreeze = async (date: string) => {
    setPendingDate(date);
    try {
      await freeze.mutateAsync({ goalId, date });
      toast({ title: "Day frozen", description: `Streak preserved (${price} Bonds spent)` });
    } catch (e: any) {
      toast({ title: "Freeze failed", description: e.message || "Try again", variant: "destructive" });
    } finally {
      setPendingDate(null);
    }
  };

  return (
    <DSPanel
      title="Streak Freeze"
      id="HBT.FRZ"
      accent="special"
      headerAction={
        <span className="text-[11px] font-mono text-muted-foreground">
          {price} ⛓ / day · Balance {balance}
        </span>
      }
    >
      <p className="text-xs text-muted-foreground mb-3">
        Spend Bonds to retroactively shield a missed day (last 7 days). Streak continuity is preserved.
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const disabled =
            d.counted ||
            d.isToday ||
            balance < price ||
            freeze.isPending;
          return (
            <button
              key={d.key}
              type="button"
              disabled={disabled}
              onClick={() => handleFreeze(d.key)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md border px-1 py-2 text-[10px] font-mono transition-colors",
                d.counted && d.isFreeze
                  ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                  : d.counted
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                  : disabled
                  ? "border-white/5 bg-white/5 text-muted-foreground opacity-50 cursor-not-allowed"
                  : "border-white/10 bg-white/5 text-foreground hover:border-cyan-400/40 hover:bg-cyan-400/10"
              )}
              title={d.counted ? (d.isFreeze ? "Frozen" : "Logged") : `Freeze for ${price} Bonds`}
            >
              <span>{d.label}</span>
              {pendingDate === d.key ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Snowflake className={cn("w-3 h-3", d.isFreeze ? "text-cyan-300" : "")} />
              )}
            </button>
          );
        })}
      </div>
    </DSPanel>
  );
}