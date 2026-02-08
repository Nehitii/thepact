import { motion } from "framer-motion";
import { Scale, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface HealthBMIIndicatorProps {
  bmi: number | null;
  category: { label: string; color: string };
}

export function HealthBMIIndicator({ bmi, category }: HealthBMIIndicatorProps) {
  const { t } = useTranslation();

  if (bmi === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/30 dark:bg-card/30 backdrop-blur-xl border border-border rounded-2xl p-4"
      >
        <div className="flex items-center gap-3 text-muted-foreground">
          <Scale className="w-5 h-5" />
          <span className="text-sm">
            {t("health.bmi.title")}
          </span>
        </div>
      </motion.div>
    );
  }

  // Calculate position on the scale (18.5 to 30 range centered)
  const getPositionPercentage = () => {
    const min = 15;
    const max = 35;
    const clamped = Math.min(Math.max(bmi, min), max);
    return ((clamped - min) / (max - min)) * 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/30 dark:bg-card/30 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{t("health.bmi.title")}</h3>
            <p className="text-xs text-muted-foreground/70">{t("health.disclaimer")}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-foreground font-orbitron">
            {bmi.toFixed(1)}
          </span>
          <p className={cn("text-sm font-medium", category.color)}>
            {category.label}
          </p>
        </div>
      </div>

      {/* BMI Scale visualization */}
      <div className="relative h-8 mb-2">
        {/* Background gradient scale */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div 
            className="h-full"
            style={{
              background: `linear-gradient(to right, 
                #3b82f6 0%, 
                #3b82f6 17.5%, 
                #22c55e 17.5%, 
                #22c55e 50%, 
                #eab308 50%, 
                #eab308 75%, 
                #f97316 75%, 
                #f97316 100%
              )`
            }}
          />
        </div>
        
        {/* Position indicator */}
        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-foreground rounded-full shadow-lg"
          initial={{ left: "50%" }}
          animate={{ left: `${getPositionPercentage()}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transform: "translateX(-50%)" }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rounded-full shadow-md" />
        </motion.div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t("health.bmi.underweight")}</span>
        <span>{t("health.bmi.normal")}</span>
        <span>{t("health.bmi.overweight")}</span>
        <span>{t("health.bmi.obese")}</span>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 mt-4 p-3 bg-muted/20 dark:bg-muted/10 rounded-lg">
        <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground/70">
          {t("health.disclaimer")}
        </p>
      </div>
    </motion.div>
  );
}