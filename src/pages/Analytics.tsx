import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Target, Heart, Wallet, CheckSquare, Timer, TrendingUp, Flame } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-card/60 backdrop-blur border border-border/50">
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
    <div className="p-5 rounded-xl bg-card/60 backdrop-blur border border-border/50">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">{title}</h3>
      <div className="h-52">{children}</div>
    </div>
  );
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("pact");
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
    <div className="min-h-screen max-w-5xl mx-auto px-4 pb-16">
      {/* Module Header */}
      <ModuleHeader
        title="ANALY"
        titleAccent="TICS"
        systemLabel="PERFORMANCE // INSIGHTS"
        badges={[]}
      />

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-6 bg-card/60 backdrop-blur border border-border/50 p-1 rounded-xl">
          <TabsTrigger
            value="pact"
            className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all"
          >
            <Flame className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-wider">Pact & Goals</span>
          </TabsTrigger>
          <TabsTrigger
            value="modules"
            className="flex items-center gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent-foreground rounded-lg transition-all"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-wider">Modules</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: PACT & GOALS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="pact" className="space-y-6 mt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard icon={Target} label="Goals Completed" value={summary.completedGoals} sub={`of ${summary.totalGoals} total`} color="text-primary" />
            <StatCard icon={TrendingUp} label="Completion Rate" value={summary.totalGoals ? `${Math.round((summary.completedGoals / summary.totalGoals) * 100)}%` : "—"} color="text-cyan-400" />
            <StatCard icon={BarChart3} label="Total Goals" value={summary.totalGoals} color="text-violet-400" />
          </div>

          <ChartCard title="Goals Created vs Completed">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="created" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} name="Created" />
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Completed" />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: MODULES PERFORMANCE */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="modules" className="space-y-6 mt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Heart} label="Health Avg" value={`${summary.avgHealthScore}%`} color="text-emerald-400" />
            <StatCard icon={Wallet} label="Total Saved" value={`€${summary.totalSaved.toLocaleString()}`} color="text-blue-400" />
            <StatCard icon={CheckSquare} label="Todos Done" value={todoStats.reduce((a, t) => a + t.completed, 0)} color="text-amber-400" />
            <StatCard icon={Timer} label="Focus Time" value={`${Math.round(summary.pomodoroMinutes / 60)}h`} sub={`${summary.pomodoroMinutes}min total`} color="text-violet-400" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
