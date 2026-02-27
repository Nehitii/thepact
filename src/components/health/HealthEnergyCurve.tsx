import { useAuth } from "@/contexts/AuthContext";
import { useTodayHealth, useHealthHistory } from "@/hooks/useHealth";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine, Area, AreaChart } from "recharts";
import { useTranslation } from "react-i18next";
import { HUDFrame } from "./HUDFrame";

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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <HUDFrame className="p-6" glowColor="hsl(var(--hud-phosphor))">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-hud-phosphor/20"
              style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}>
              <Zap className="w-5 h-5 text-hud-phosphor" />
            </div>
            <h3 className="font-semibold text-foreground">{t("health.energy.title")}</h3>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{t("health.energy.noData")}</p>
        </HUDFrame>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <HUDFrame className="p-6" scanLine glowColor="hsl(var(--hud-phosphor))">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-hud-phosphor/20"
              style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}>
              <Zap className="w-5 h-5 text-hud-phosphor" />
            </div>
            <h3 className="font-semibold text-foreground">{t("health.energy.title")}</h3>
          </div>
          {isAvg && (
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider bg-muted/50 px-2 py-1">
              {t("health.energy.weekAvg")}
            </span>
          )}
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataToShow} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--hud-phosphor))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--hud-phosphor))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--hud-phosphor) / 0.08)" strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--hud-phosphor) / 0.3)",
                  borderRadius: 0,
                  color: "hsl(var(--foreground))",
                  fontFamily: "monospace",
                }}
              />
              <ReferenceLine y={3} stroke="hsl(var(--hud-phosphor) / 0.2)" strokeDasharray="6 3" label={{ value: "BASELINE", position: "right", fill: "hsl(var(--muted-foreground))", fontSize: 9, fontFamily: "monospace" }} />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="hsl(var(--hud-phosphor))"
                strokeWidth={3}
                fill="url(#energyGradient)"
                dot={{ r: 6, fill: "hsl(var(--hud-phosphor))", stroke: "hsl(var(--hud-phosphor))", strokeWidth: 2 }}
                activeDot={{ r: 8, className: "animate-pulse-dot" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </HUDFrame>
    </motion.div>
  );
}
