import { Flame, Clock, Zap, Trophy } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";

interface FocusStatsProps {
  todayCount: number;
  todayMinutes: number;
  streak: number;
  bestSession: number;
  weeklyData: { label: string; minutes: number }[];
}

export function FocusStats({ todayCount, todayMinutes, streak, bestSession, weeklyData }: FocusStatsProps) {
  return (
    <div className="w-full max-w-lg space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={<Flame className="h-3.5 w-3.5 text-primary" />} value={todayCount} label="Today" />
        <StatCard icon={<Clock className="h-3.5 w-3.5 text-accent" />} value={`${todayMinutes}m`} label="Focused" />
        <StatCard icon={<Zap className="h-3.5 w-3.5 text-yellow-400" />} value={streak} label="Streak" />
        <StatCard icon={<Trophy className="h-3.5 w-3.5 text-emerald-400" />} value={`${bestSession}m`} label="Best" />
      </div>

      {/* Weekly sparkline */}
      <div className="p-4 rounded-xl bg-card/40 backdrop-blur border border-border/50">
        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">Weekly Focus</p>
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={weeklyData} barSize={14}>
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
              formatter={(v: number) => [`${v}m`, "Focus"]}
            />
            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="p-3 rounded-xl bg-card/40 backdrop-blur border border-border/50 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-lg font-orbitron font-bold text-foreground">{value}</p>
      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
