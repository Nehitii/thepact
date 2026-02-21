import { BarChart3, Calendar, Target, Flame, Trophy } from "lucide-react";
import { PactSettingsCard } from "./PactSettingsCard";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useRankXP } from "@/hooks/useRankXP";
import { differenceInDays, format, parseISO, isValid } from "date-fns";

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
    { icon: Calendar, label: "Created", value: createdDate && isValid(createdDate) ? format(createdDate, "MMM d, yyyy") : "—" },
    { icon: Flame, label: "Days Active", value: daysActive.toLocaleString() },
    { icon: Target, label: "Goals", value: `${completedGoals} / ${totalGoals}` },
    { icon: Trophy, label: "Total XP", value: `${(pact.points ?? 0).toLocaleString()} XP` },
  ];

  return (
    <PactSettingsCard icon={<BarChart3 className="h-5 w-5 text-primary" />} title="Pact Overview" description="Your journey at a glance">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-3 rounded-lg bg-card/50 border border-primary/15 hover:border-primary/25 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <span className="text-sm font-semibold text-foreground font-rajdhani">{value}</span>
          </div>
        ))}
      </div>

      {rankData?.currentRank && (
        <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 flex items-center gap-3">
          <Trophy className="h-5 w-5" style={{ color: rankData.currentRank.frame_color || 'hsl(var(--primary))' }} />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-orbitron text-muted-foreground uppercase tracking-wider block">Current Rank</span>
            <span className="text-sm font-orbitron font-semibold uppercase tracking-wide" style={{ color: rankData.currentRank.frame_color || 'hsl(var(--primary))' }}>{rankData.currentRank.name}</span>
          </div>
        </div>
      )}
    </PactSettingsCard>
  );
}
