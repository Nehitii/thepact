import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { HUDFrame } from "./HUDFrame";

interface HealthBMIIndicatorProps {
  bmi: number | null;
  category: { label: string; color: string };
}

export function HealthBMIIndicator({ bmi, category }: HealthBMIIndicatorProps) {
  const { t } = useTranslation();

  if (bmi === null) {
    return (
      <HUDFrame className="p-4" variant="default">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Scale className="w-5 h-5" />
          <span className="text-sm font-mono">{t("health.bmi.title")}</span>
        </div>
      </HUDFrame>
    );
  }

  const getPositionPercentage = () => {
    const min = 15;
    const max = 35;
    const clamped = Math.min(Math.max(bmi, min), max);
    return ((clamped - min) / (max - min)) * 100;
  };

  return (
    <HUDFrame className="p-6" variant="chart" scanLine>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-hud-phosphor/10 border border-hud-phosphor/20">
            <Scale className="w-5 h-5 text-hud-phosphor" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{t("health.bmi.title")}</h3>
            <p className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-wider">{t("health.bmi.title")}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-foreground font-orbitron">{bmi.toFixed(1)}</span>
          <p className={cn("text-sm font-medium font-mono", category.color)}>{category.label}</p>
        </div>
      </div>

      {/* Segmented BMI gauge */}
      <div className="relative h-6 mb-2 flex rounded-lg overflow-hidden">
        <div className="flex-1 bg-blue-500/60" />
        <div className="flex-[2] bg-hud-phosphor/60" />
        <div className="flex-1 bg-hud-amber/60" />
        <div className="flex-1 bg-destructive/60" />
        
        <motion.div
          className="absolute top-1/2 -translate-y-1/2"
          initial={{ left: "50%" }}
          animate={{ left: `${getPositionPercentage()}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transform: "translateX(-50%) translateY(-50%)" }}
        >
          <div className="w-4 h-4 bg-foreground rotate-45 shadow-lg rounded-sm" />
        </motion.div>
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
        <span>{t("health.bmi.underweight")}</span>
        <span>{t("health.bmi.normal")}</span>
        <span>{t("health.bmi.overweight")}</span>
        <span>{t("health.bmi.obese")}</span>
      </div>
    </HUDFrame>
  );
}
