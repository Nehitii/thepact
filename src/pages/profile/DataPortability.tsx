import { useState } from "react";
import { Database, Download, BarChart3, Scale, Target, BookOpen, Wallet, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  SettingsBreadcrumb, CyberSeparator, DataPanel, SettingContentRow,
} from "@/components/profile/settings-ui";

type ExportCategory = "all" | "goals-steps" | "journal" | "finance";

export default function DataPortability() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [exportCategory, setExportCategory] = useState<ExportCategory>("all");
  const [isExporting, setIsExporting] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: pact } = await supabase.from("pacts").select("id").eq("user_id", user.id).maybeSingle();
      const { count: goalsCount } = await supabase.from("goals").select("*", { count: "exact", head: true }).eq("pact_id", pact?.id || "");
      const { data: steps } = await supabase.from("steps").select("id, status, goal_id").in("goal_id", pact?.id ? (await supabase.from("goals").select("id").eq("pact_id", pact.id)).data?.map((g) => g.id) || [] : []);
      const completedSteps = steps?.filter((s) => s.status === "completed").length || 0;
      const { count: journalCount } = await supabase.from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: achievementsCount } = await supabase.from("user_achievements").select("*", { count: "exact", head: true }).eq("user_id", user.id).not("unlocked_at", "is", null);
      return { goalsCreated: goalsCount || 0, stepsCompleted: completedSteps, totalSteps: steps?.length || 0, journalEntries: journalCount || 0, achievementsUnlocked: achievementsCount || 0 };
    },
    enabled: !!user?.id,
  });

  const handleExportData = async () => {
    if (!user?.id) return;
    setIsExporting(true);
    try {
      let exportData: Record<string, unknown> = { exportedAt: new Date().toISOString(), category: exportCategory, user: { email: user.email, id: user.id } };
      const { data: pact } = await supabase.from("pacts").select("*").eq("user_id", user.id).maybeSingle();
      if (exportCategory === "all" || exportCategory === "goals-steps") {
        const { data: goals } = await supabase.from("goals").select("*").eq("pact_id", pact?.id || "");
        const goalIds = goals?.map((g) => g.id) || [];
        const { data: steps } = await supabase.from("steps").select("*").in("goal_id", goalIds.length > 0 ? goalIds : ["none"]);
        exportData = { ...exportData, goals, steps };
      }
      if (exportCategory === "all" || exportCategory === "journal") {
        const { data: journal } = await supabase.from("journal_entries").select("*").eq("user_id", user.id);
        exportData = { ...exportData, journalEntries: journal };
      }
      if (exportCategory === "all" || exportCategory === "finance") {
        const { data: profile } = await supabase.from("profiles").select("project_funding_target, project_monthly_allocation, already_funded, salary_payment_day").eq("id", user.id).maybeSingle();
        const { data: recurringIncome } = await supabase.from("recurring_income").select("*").eq("user_id", user.id);
        const { data: recurringExpenses } = await supabase.from("recurring_expenses").select("*").eq("user_id", user.id);
        const { data: financeRecords } = await supabase.from("finance").select("*").eq("user_id", user.id);
        const { data: monthlyValidations } = await supabase.from("monthly_finance_validations").select("*").eq("user_id", user.id);
        const { data: pactSpending } = await supabase.from("pact_spending").select("*").eq("user_id", user.id);
        exportData = { ...exportData, finance: { settings: profile, recurringIncome, recurringExpenses, monthlyRecords: financeRecords, monthlyValidations, pactSpending } };
      }
      if (exportCategory === "all") {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        const { data: achievements } = await supabase.from("user_achievements").select("*").eq("user_id", user.id);
        exportData = { ...exportData, profile, pact, achievements, stats };
      }
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const filename = `the-pact-${exportCategory === "all" ? "all" : exportCategory}-${dateStr}.json`;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast({ title: t("profile.data.exportComplete"), description: t("profile.data.exportSuccess", { category: getCategoryLabel(exportCategory).toLowerCase() }) });
    } catch {
      toast({ title: t("profile.data.exportFailed"), description: t("profile.data.exportError"), variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const getCategoryLabel = (category: ExportCategory): string => {
    switch (category) {
      case "all": return t("profile.data.categories.all");
      case "goals-steps": return t("profile.data.categories.goalsSteps");
      case "journal": return t("profile.data.categories.journal");
      case "finance": return t("profile.data.categories.finance");
      default: return t("profile.data.categories.data");
    }
  };

  const exportOptions: { value: ExportCategory; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "all", label: t("profile.data.categories.all"), icon: <Database className="h-4 w-4" />, desc: t("profile.data.allDesc") },
    { value: "goals-steps", label: t("profile.data.categories.goalsSteps"), icon: <Target className="h-4 w-4" />, desc: t("profile.data.goalsDesc") },
    { value: "journal", label: t("profile.data.categories.journal"), icon: <BookOpen className="h-4 w-4" />, desc: t("profile.data.journalDesc") },
    { value: "finance", label: t("profile.data.categories.finance"), icon: <Wallet className="h-4 w-4" />, desc: t("profile.data.financeDesc") },
  ];

  const statItems = [
    { value: stats?.goalsCreated || 0, label: t("profile.data.stats.goalsCreated") },
    { value: stats?.stepsCompleted || 0, label: t("profile.data.stats.stepsCompleted") },
    { value: stats?.journalEntries || 0, label: t("profile.data.stats.journalEntries") },
    { value: stats?.achievementsUnlocked || 0, label: t("profile.data.stats.achievements") },
  ];

  return (
    <ProfileSettingsShell title={t("profile.data.title")} subtitle={t("profile.data.subtitle")} icon={<Database className="h-7 w-7 text-primary" />} containerClassName="max-w-3xl">
      <SettingsBreadcrumb code="DAT.06" />
      <CyberSeparator />

      {/* ── PANEL 1: Stats ── */}
      <DataPanel
        code="MODULE_01" title="VOS DONNÉES"
        footerLeft={<span>RECORDS: <b className="text-primary">{statItems.reduce((a, s) => a + s.value, 0)}</b></span>}
      >
        <div className="py-4 grid grid-cols-2 gap-3">
          {statItems.map((s) => (
            <div key={s.label} className="border border-primary/15 bg-primary/[0.03] p-4 text-center [clip-path:polygon(8px_0%,100%_0%,100%_calc(100%-8px),calc(100%-8px)_100%,0%_100%,0%_8px)]">
              <div className="text-2xl font-orbitron font-bold text-primary">{s.value}</div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </DataPanel>

      {/* ── PANEL 2: Export ── */}
      <DataPanel code="MODULE_02" title="EXPORT DE DONNÉES">
        <div className="py-4 space-y-4">
          <p className="text-[11px] text-muted-foreground tracking-wide">{t("profile.data.exportDesc")}</p>

          <RadioGroup value={exportCategory} onValueChange={(v) => setExportCategory(v as ExportCategory)} className="grid grid-cols-2 gap-3">
            {exportOptions.map((opt) => (
              <Label
                key={opt.value}
                htmlFor={opt.value}
                className={cn(
                  "relative flex flex-col gap-2 p-3.5 cursor-pointer transition-all duration-200 border",
                  "[clip-path:polygon(8px_0%,100%_0%,100%_calc(100%-8px),calc(100%-8px)_100%,0%_100%,0%_8px)]",
                  exportCategory === opt.value
                    ? "border-primary/40 bg-primary/10"
                    : "border-primary/15 bg-card/50 hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={opt.value} className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                  <span className={cn("text-xs font-orbitron uppercase tracking-wide", exportCategory === opt.value ? "text-primary" : "text-primary/70")}>{opt.label}</span>
                  <span className={cn("ml-auto", exportCategory === opt.value ? "text-primary" : "text-primary/60")}>{opt.icon}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono pl-6">{opt.desc}</span>
              </Label>
            ))}
          </RadioGroup>

          <Button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full bg-primary/20 border border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider disabled:opacity-50 [clip-path:polygon(8px_0%,100%_0%,calc(100%-8px)_100%,0%_100%)]"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? t("profile.data.exporting") : t("profile.data.download", { category: getCategoryLabel(exportCategory) })}
          </Button>
        </div>
      </DataPanel>

      {/* ── PANEL 3: Legal ── */}
      <DataPanel code="MODULE_03" title="MENTIONS LÉGALES">
        <div className="py-4 space-y-3">
          <p className="text-[11px] text-muted-foreground tracking-wide">{t("profile.data.termsDesc")}</p>
          <Link to="/legal">
            <Button className="w-full bg-primary/20 border border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider [clip-path:polygon(8px_0%,100%_0%,calc(100%-8px)_100%,0%_100%)]">
              <Scale className="mr-2 h-4 w-4" />
              {t("profile.data.viewTerms")}
            </Button>
          </Link>
        </div>
      </DataPanel>

      <div className="h-8" />
    </ProfileSettingsShell>
  );
}
