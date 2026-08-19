import { useTranslation } from "react-i18next";
import { VARIANTES_FOND, type VarianteFond } from "./FocusFond";

const cyberClip = "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

interface FocusConfigPanelProps {
  fond: VarianteFond;
  onFondChange: (v: VarianteFond) => void;
  breakMin: number;
  longBreakMin: number;
  onBreakChange: (v: number) => void;
  onLongBreakChange: (v: number) => void;
}

export function FocusConfigPanel({
  fond,
  onFondChange,
  breakMin,
  longBreakMin,
  onBreakChange,
  onLongBreakChange,
}: FocusConfigPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-lg space-y-3 p-4 bg-card/40 backdrop-blur border border-border/50" style={{ clipPath: cyberClip }}>
      <p className="ds-t-label font-mono uppercase tracking-[0.2em] text-muted-foreground text-center mb-3" aria-hidden="true">
        {t("focus.config.title")}
      </p>
      {/* Le fond se choisit ici, et le changement se voit tout de suite —
          le panneau est ouvert par-dessus la scene qui tourne. */}
      <div
        className="flex flex-col gap-2 p-3 bg-background/50 border border-border/30"
        style={{ clipPath: cyberClip }}
      >
        <span className="text-xs font-mono text-foreground">{t("focus.config.backdrop")}</span>
        <div className="flex flex-wrap gap-2">
          {VARIANTES_FOND.map((v) => (
            <button
              key={v}
              type="button"
              className="cyb cyb--petit"
              aria-pressed={fond === v}
              onClick={() => onFondChange(v)}
            >
              {t("focus.backdrop." + v)}
            </button>
          ))}
        </div>
      </div>

      <DurationRow
        label={t("focus.config.break")}
        options={[3, 5, 10, 15]}
        value={breakMin}
        onChange={onBreakChange}
      />
      <DurationRow
        label={t("focus.config.longBreak")}
        options={[10, 15, 20, 30]}
        value={longBreakMin}
        onChange={onLongBreakChange}
      />
    </div>
  );
}

function DurationRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
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
            type="button"
            className="cyb cyb--petit"
            aria-pressed={value === m}
            onClick={() => onChange(m)}
          >
            {m}′
          </button>
        ))}
      </div>
    </div>
  );
}
