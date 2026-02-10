import { useAuth } from "@/contexts/AuthContext";
import { useTodayHealth, useHealthHistory } from "@/hooks/useHealth";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useTranslation } from "react-i18next";

export function HealthEnergyCurve() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: today } = useTodayHealth(user?.id);
  const { data: history } = useHealthHistory(user?.id, 7);

  const ext = today as unknown as Record<string, unknown>;
  const todayCurve = [
    { time: t("health.energy.morning"), energy: (ext?.energy_morning as number) ?? null },
    { time: t("health.energy.afternoon"), energy: (ext?.energy_afternoon as number) ?? null },
    { time: t("health.energy.evening"), energy: (ext?.energy_evening as number) ?? null },
  ].filter((p) => p.energy !== null);

  // Avg energy curve across last 7 days
  const avgCurve = (() => {
    if (!history || history.length < 2) return [];
    let mornSum = 0, aftSum = 0, eveSum = 0, mornN = 0, aftN = 0, eveN = 0;
    history.forEach((d) => {
      const e = d as unknown as Record<string, unknown>;
      if (e.energy_morning != null) { mornSum += e.energy_morning as number; mornN++; }
      if (e.energy_afternoon != null) { aftSum += e.energy_afternoon as number; aftN++; }
      if (e.energy_evening != null) { eveSum += e.energy_evening as number; eveN++; }
    });
    if (mornN === 0 && aftN === 0 && eveN === 0) return [];
    return [
      { time: t("health.energy.morning"), energy: mornN ? Math.round((mornSum / mornN) * 10) / 10 : null },
      { time: t("health.energy.afternoon"), energy: aftN ? Math.round((aftSum / aftN) * 10) / 10 : null },
      { time: t("health.energy.evening"), energy: eveN ? Math.round((eveSum / eveN) * 10) / 10 : null },
    ].filter((p) => p.energy !== null);
  })();

  const dataToShow = todayCurve.length >= 2 ? todayCurve : avgCurve;
  const isAvg = todayCurve.length < 2;

  if (dataToShow.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-foreground">{t("health.energy.title")}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t("health.energy.noData")}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-foreground">{t("health.energy.title")}</h3>
        </div>
        {isAvg && (
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            {t("health.energy.weekAvg")}
          </span>
        )}
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataToShow} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                color: "hsl(var(--foreground))",
              }}
            />
            <Line
              type="monotone"
              dataKey="energy"
              stroke="hsl(45, 93%, 47%)"
              strokeWidth={3}
              dot={{ r: 6, fill: "hsl(45, 93%, 47%)" }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
