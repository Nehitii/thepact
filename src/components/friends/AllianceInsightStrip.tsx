import { useTranslation } from "react-i18next";

interface AllianceInsightStripProps {
  alliesCount: number;
  onlineCount: number;
  pendingCount: number;
  guildsCount: number;
}

interface VitalSignProps {
  id: string;
  label: string;
  value: number;
  sublabel: string;
  accent?: "primary" | "success" | "critical" | "warning";
  pulse?: boolean;
}

function VitalSign({ id, label, value, sublabel, accent = "primary", pulse = false }: VitalSignProps) {
  const colorVar =
    accent === "success" ? "var(--ds-accent-success)"
    : accent === "critical" ? "var(--ds-accent-critical)"
    : accent === "warning" ? "var(--ds-accent-warning)"
    : "var(--ds-accent-primary)";

  const isEmpty = value === 0;

  return (
    <div
      className="flex flex-col gap-2 py-1"
      role="group"
      aria-label={`${label}: ${value} ${sublabel}`}
    >
      <span className="ds-text-label text-[9px] tracking-[0.28em]">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        {pulse && value > 0 && (
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: `hsl(${colorVar})`,
              boxShadow: `0 0 6px hsl(${colorVar} / 0.7)`,
              animation: "ds-pulse-dot 1.6s ease-in-out infinite",
            }}
          />
        )}
        <span
          className="ds-text-metric"
          style={{
            color: isEmpty ? "hsl(var(--ds-text-disabled))" : `hsl(${colorVar})`,
          }}
          aria-hidden="true"
        >
          {isEmpty ? "—" : String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="ds-text-label text-[9px] tracking-[0.18em] opacity-70">
        {sublabel}
      </span>
    </div>
  );
}

export function AllianceInsightStrip({
  alliesCount,
  onlineCount,
  pendingCount,
  guildsCount,
}: AllianceInsightStripProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4 px-1 py-5 border-b border-[hsl(var(--ds-border-default)/0.15)]">
      <VitalSign
        id="A.01"
        label="ALLIES"
        value={alliesCount}
        sublabel={t("friends.activeAllies", { defaultValue: "active" })}
        accent="primary"
      />
      <VitalSign
        id="A.02"
        label="ONLINE"
        value={onlineCount}
        sublabel={t("friends.liveNow", { defaultValue: "live now" })}
        accent="success"
        pulse
      />
      <VitalSign
        id="A.03"
        label="SIGNALS"
        value={pendingCount}
        sublabel={t("friends.pendingShort", { defaultValue: "pending" })}
        accent="critical"
        pulse
      />
      <VitalSign
        id="A.04"
        label="GUILDS"
        value={guildsCount}
        sublabel={t("friends.joinedShort", { defaultValue: "joined" })}
        accent="warning"
      />
    </div>
  );
}
