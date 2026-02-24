import { BarChart3, Calendar, Target, Flame, Trophy } from "lucide-react";
import { DataPanel } from "./settings-ui";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useRankXP } from "@/hooks/useRankXP";
import { differenceInDays, format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface PactOverviewCardProps {
  userId: string;
}

export function PactOverviewCard({ userId }: PactOverviewCardProps) {
  const { data: pact } = usePact(userId);
  const { data: goals } = useGoals(pact?.id);
  const { data: rankData } = useRankXP(userId, pact?.id);

  if (!pact) return null;

  const createdDate = pact.created_at ? parseISO(pact.created_at) : null;
  const daysActive = createdDate && isValid(createdDate) ? differenceInDays(new Date(), createdDate) : 0;
  const totalGoals = goals?.length ?? 0;
  const completedGoals = goals?.filter(g => g.status === "completed").length ?? 0;

  const stats = [
    { icon: Calendar, label: "CREATED", value: createdDate && isValid(createdDate) ? format(createdDate, "MMM d, yyyy") : "—" },
    { icon: Flame, label: "DAYS_ACTIVE", value: daysActive.toLocaleString() },
    { icon: Target, label: "GOALS", value: `${completedGoals} / ${totalGoals}` },
    { icon: Trophy, label: "TOTAL_XP", value: `${(pact.points ?? 0).toLocaleString()} XP` },
  ];

  return (
    <DataPanel
      code="MODULE_01"
      title="PACT OVERVIEW"
      statusText={<span className="text-muted-foreground">{daysActive}d ACTIVE</span>}
      footerLeft={<><span>GOALS: <b className="text-primary">{totalGoals}</b></span><span>COMPLETED: <b className="text-primary">{completedGoals}</b></span></>}
      footerRight={<span>XP: <b className="text-primary">{(pact.points ?? 0).toLocaleString()}</b></span>}
    >
      <div className="py-4 grid grid-cols-2 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="relative border border-primary/15 bg-primary/[0.03] p-3 transition-colors hover:border-primary/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[9px] font-mono text-primary/40 tracking-[0.15em]">{label}</span>
            </div>
            <span className="text-sm font-bold text-foreground font-rajdhani">{value}</span>
          </div>
        ))}
      </div>

      {rankData?.currentRank && (
        <div className="pb-4">
          <div className="border border-primary/20 bg-primary/[0.04] p-3 flex items-center gap-3">
            <Trophy className="h-5 w-5" style={{ color: rankData.currentRank.frame_color || 'hsl(var(--primary))' }} />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-mono text-primary/40 tracking-[0.15em] block">CURRENT_RANK</span>
              <span className="text-sm font-orbitron font-semibold uppercase tracking-wide" style={{ color: rankData.currentRank.frame_color || 'hsl(var(--primary))' }}>{rankData.currentRank.name}</span>
            </div>
          </div>
        </div>
      )}
    </DataPanel>
  );
}
