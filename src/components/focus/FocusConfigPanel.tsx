import { useTranslation } from "react-i18next";

const cyberClip = "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

interface FocusConfigPanelProps {
  workMin: number;
  breakMin: number;
  longBreakMin: number;
  onWorkChange: (v: number) => void;
  onBreakChange: (v: number) => void;
  onLongBreakChange: (v: number) => void;
}

export function FocusConfigPanel({
  workMin,
  breakMin,
  longBreakMin,
  onWorkChange,
  onBreakChange,
  onLongBreakChange,
}: FocusConfigPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-lg space-y-3 p-4 bg-card/40 backdrop-blur border border-border/50" style={{ clipPath: cyberClip }}>
      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground text-center mb-3" aria-hidden="true">
        {t("focus.config.title")}
      </p>
      <DurationRow
        label={t("focus.config.work")}
        options={[15, 25, 30, 45]}
        value={workMin}
        onChange={onWorkChange}
        color="primary"
      />
      <DurationRow
        label={t("focus.config.break")}
        options={[3, 5, 10, 15]}
        value={breakMin}
        onChange={onBreakChange}
        color="accent"
      />
      <DurationRow
        label={t("focus.config.longBreak")}
        options={[10, 15, 20, 30]}
        value={longBreakMin}
        onChange={onLongBreakChange}
        color="accent"
      />
    </div>
  );
}

function DurationRow({
  label,
  options,
  value,
  onChange,
  color,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
  color: "primary" | "accent";
}) {
  return (
    <div
      className="flex items-center justify-between p-3 bg-background/50 border border-border/30"
      style={{ clipPath: cyberClip }}
    >
      <span className="text-xs font-mono text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {options.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`px-3 py-1 text-[10px] font-mono transition-all focus-visible:ring-2 focus-visible:ring-primary ${
              value === m
                ? color === "primary"
                  ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                  : "bg-accent text-accent-foreground shadow-[0_0_10px_hsl(var(--accent)/0.3)]"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
            style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
          >
            {m}m
          </button>
        ))}
      </div>
    </div>
  );
}
