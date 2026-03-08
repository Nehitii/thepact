import { motion } from "framer-motion";
import { BarChart3, Target, Heart, Wallet, CheckSquare, Timer, TrendingUp } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-card border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-orbitron font-bold text-foreground">{value}</p>
      {sub && <p className="text-[10px] font-mono text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-lg bg-card border border-border/50">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">{title}</h3>
      <div className="h-52">{children}</div>
    </div>
  );
}

export default function Analytics() {
  const { data, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, goalsOverTime, healthTrend, financeTrend, todoStats } = data;

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-black font-orbitron text-foreground tracking-wide">Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground font-mono">Cross-module performance insights</p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard icon={Target} label="Goals" value={summary.completedGoals} sub={`of ${summary.totalGoals} total`} color="text-primary" />
        <StatCard icon={Heart} label="Health Avg" value={`${summary.avgHealthScore}%`} color="text-emerald-400" />
        <StatCard icon={Wallet} label="Total Saved" value={`€${summary.totalSaved.toLocaleString()}`} color="text-blue-400" />
        <StatCard icon={CheckSquare} label="Todos Done" value={todoStats.reduce((a, t) => a + t.completed, 0)} color="text-amber-400" />
        <StatCard icon={Timer} label="Focus Time" value={`${Math.round(summary.pomodoroMinutes / 60)}h`} sub={`${summary.pomodoroMinutes}min total`} color="text-violet-400" />
        <StatCard icon={TrendingUp} label="Completion" value={summary.totalGoals ? `${Math.round((summary.completedGoals / summary.totalGoals) * 100)}%` : "—"} color="text-cyan-400" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Goals Over Time */}
        <ChartCard title="Goals Created vs Completed">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={goalsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="created" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Health Trend */}
        <ChartCard title="Health Score Trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={healthTrend.slice(-30)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="hsl(160, 80%, 50%)" fill="hsl(160, 80%, 50%, 0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Finance Trend */}
        <ChartCard title="Income vs Expenses">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={financeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="income" stroke="hsl(142, 70%, 50%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="hsl(0, 80%, 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="savings" stroke="hsl(212, 90%, 50%)" strokeWidth={2} dot={false} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Todos Completed */}
        <ChartCard title="Tasks Completed by Month">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={todoStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="completed" fill="hsl(43, 100%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
