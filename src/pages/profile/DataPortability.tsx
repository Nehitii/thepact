import { Database, Download, BarChart3, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DataPortability() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Fetch pact first
      const { data: pact } = await supabase
        .from("pacts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch goals count
      const { count: goalsCount } = await supabase
        .from("goals")
        .select("*", { count: "exact", head: true })
        .eq("pact_id", pact?.id || "");

      // Fetch completed steps count
      const { data: steps } = await supabase
        .from("steps")
        .select("id, status, goal_id")
        .in(
          "goal_id",
          pact?.id
            ? (
                await supabase
                  .from("goals")
                  .select("id")
                  .eq("pact_id", pact.id)
              ).data?.map((g) => g.id) || []
            : []
        );

      const completedSteps = steps?.filter((s) => s.status === "completed").length || 0;
      const totalSteps = steps?.length || 0;

      // Fetch journal entries count
      const { count: journalCount } = await supabase
        .from("journal_entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch achievements count
      const { count: achievementsCount } = await supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("unlocked_at", "is", null);

      return {
        goalsCreated: goalsCount || 0,
        stepsCompleted: completedSteps,
        totalSteps,
        journalEntries: journalCount || 0,
        achievementsUnlocked: achievementsCount || 0,
      };
    },
    enabled: !!user?.id,
  });

  const handleExportData = async () => {
    if (!user?.id) return;

    try {
      // Fetch pact
      const { data: pact } = await supabase
        .from("pacts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch goals
      const { data: goals } = await supabase
        .from("goals")
        .select("*")
        .eq("pact_id", pact?.id || "");

      // Fetch steps for all goals
      const goalIds = goals?.map((g) => g.id) || [];
      const { data: steps } = await supabase
        .from("steps")
        .select("*")
        .in("goal_id", goalIds);

      // Fetch journal entries
      const { data: journal } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id);

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // Fetch achievements
      const { data: achievements } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          email: user.email,
          id: user.id,
        },
        profile,
        pact,
        goals,
        steps,
        journalEntries: journal,
        achievements,
        stats,
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `the-pact-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#00050B] relative overflow-hidden">
      {/* Deep space background with radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="pt-8 space-y-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-xl blur-lg" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl border border-primary/40 flex items-center justify-center">
                <Database className="h-7 w-7 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.8)]" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron">
                Data & Portability
              </h1>
              <p className="text-primary/70 tracking-wide font-rajdhani">
                Your data, your control
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Your Data Stats */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-primary">
                  Your Data
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card/20 border border-primary/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-orbitron font-bold text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]">
                    {stats?.goalsCreated || 0}
                  </div>
                  <div className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider mt-1">
                    Goals Created
                  </div>
                </div>

                <div className="bg-card/20 border border-primary/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-orbitron font-bold text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]">
                    {stats?.stepsCompleted || 0}
                  </div>
                  <div className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider mt-1">
                    Steps Completed
                  </div>
                </div>

                <div className="bg-card/20 border border-primary/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-orbitron font-bold text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]">
                    {stats?.journalEntries || 0}
                  </div>
                  <div className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider mt-1">
                    Journal Entries
                  </div>
                </div>

                <div className="bg-card/20 border border-primary/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-orbitron font-bold text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]">
                    {stats?.achievementsUnlocked || 0}
                  </div>
                  <div className="text-xs text-muted-foreground font-rajdhani uppercase tracking-wider mt-1">
                    Achievements
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Data */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-primary">
                  Export Your Data
                </h2>
              </div>

              <p className="text-muted-foreground font-rajdhani text-sm">
                Download a complete copy of your data including goals, steps, journal
                entries, and achievements in JSON format.
              </p>

              <Button
                onClick={handleExportData}
                className="w-full bg-primary/20 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider"
              >
                <Download className="mr-2 h-4 w-4" />
                Download My Data
              </Button>
            </div>
          </div>

          {/* Terms & Legal */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-primary">
                  Terms & Legal
                </h2>
              </div>

              <p className="text-muted-foreground font-rajdhani text-sm">
                Review our terms of service, privacy policy, and legal information.
              </p>

              <Link to="/legal">
                <Button
                  className="w-full bg-primary/20 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider"
                >
                  <Scale className="mr-2 h-4 w-4" />
                  View Terms & Legal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
