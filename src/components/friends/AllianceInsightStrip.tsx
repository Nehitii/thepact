import { DSPanel } from "@/components/ds";
import { cn } from "@/lib/utils";
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

  return (
    <DSPanel tier="muted" hideBrackets className="!p-3 min-h-[78px] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] tracking-[0.22em] uppercase text-[hsl(var(--ds-text-muted)/0.7)]">
          [{id}]
        </span>
        <span className="font-mono text-[8px] tracking-[0.22em] uppercase text-[hsl(var(--ds-text-muted))]">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        {pulse && value > 0 && (
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              background: `hsl(${colorVar})`,
              boxShadow: `0 0 8px hsl(${colorVar} / 0.8)`,
              animation: "ds-pulse-dot 1.4s ease-in-out infinite",
            }}
          />
        )}
        <span
          className="font-orbitron text-[25px] leading-none tabular-nums tracking-wider"
          style={{ color: `hsl(${colorVar})` }}
        >
          {String(value).padStart(3, "0")}
        </span>
      </div>
      <span className="font-mono text-[9px] uppercase tracking-wider text-[hsl(var(--ds-text-muted)/0.7)]">
        {sublabel}
      </span>
    </DSPanel>
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 sm:px-4 py-3 border-b border-[hsl(var(--ds-border-default)/0.18)] bg-[hsl(var(--ds-surface-2)/0.4)]">
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
