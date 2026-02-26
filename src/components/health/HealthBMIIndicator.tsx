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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <HUDFrame className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Scale className="w-5 h-5" />
            <span className="text-sm font-mono">{t("health.bmi.title")}</span>
          </div>
        </HUDFrame>
      </motion.div>
    );
  }

  const getPositionPercentage = () => {
    const min = 15;
    const max = 35;
    const clamped = Math.min(Math.max(bmi, min), max);
    return ((clamped - min) / (max - min)) * 100;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <HUDFrame className="p-6" scanLine>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-hud-phosphor/20"
              style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}>
              <Scale className="w-5 h-5 text-hud-phosphor" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{t("health.bmi.title")}</h3>
              <p className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-wider">{t("health.disclaimer")}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-foreground font-orbitron">{bmi.toFixed(1)}</span>
            <p className={cn("text-sm font-medium font-mono", category.color)}>{category.label}</p>
          </div>
        </div>

        {/* Segmented BMI gauge */}
        <div className="relative h-6 mb-2 flex">
          <div className="flex-1 bg-blue-500/60" />
          <div className="flex-[2] bg-hud-phosphor/60" />
          <div className="flex-1 bg-hud-amber/60" />
          <div className="flex-1 bg-destructive/60" />
          
          {/* Diamond position indicator */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ left: "50%" }}
            animate={{ left: `${getPositionPercentage()}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ transform: "translateX(-50%) translateY(-50%)" }}
          >
            <div className="w-4 h-4 bg-foreground rotate-45 shadow-lg" />
          </motion.div>
        </div>

        <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          <span>{t("health.bmi.underweight")}</span>
          <span>{t("health.bmi.normal")}</span>
          <span>{t("health.bmi.overweight")}</span>
          <span>{t("health.bmi.obese")}</span>
        </div>

      </HUDFrame>
    </motion.div>
  );
}
