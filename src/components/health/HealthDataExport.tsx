import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function HealthDataExport() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const exportCSV = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("health_data")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info(t("health.export.noData"));
        return;
      }

      const headers = [
        "Date",
        "Sleep Hours",
        "Sleep Quality",
        "Wake Energy",
        "Activity Level",
        "Movement Minutes",
        "Stress Level",
        "Mental Load",
        "Hydration Glasses",
        "Meal Balance",
        "Mood Level",
        "Energy Morning",
        "Energy Afternoon",
        "Energy Evening",
        "Notes",
      ];

      const rows = data.map((d: Record<string, unknown>) => [
        d.entry_date,
        d.sleep_hours ?? "",
        d.sleep_quality ?? "",
        d.wake_energy ?? "",
        d.activity_level ?? "",
        d.movement_minutes ?? "",
        d.stress_level ?? "",
        d.mental_load ?? "",
        d.hydration_glasses ?? "",
        d.meal_balance ?? "",
        d.mood_level ?? "",
        d.energy_morning ?? "",
        d.energy_afternoon ?? "",
        d.energy_evening ?? "",
        `"${String(d.notes ?? "").replace(/"/g, '""')}"`,
      ]);

      const csv = [headers.join(","), ...rows.map((r: unknown[]) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `health-data-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("health.export.success"));
    } catch (err) {
      console.error("Export error:", err);
      toast.error(t("health.export.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportCSV}
      disabled={loading}
      className="border-muted text-muted-foreground hover:text-foreground"
    >
      <Download className="w-4 h-4 mr-2" />
      {loading ? t("common.loading") : t("health.export.button")}
    </Button>
  );
}
