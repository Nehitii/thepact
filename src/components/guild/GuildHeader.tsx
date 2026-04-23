import { Shield, Crown, Users, ArrowLeft, Globe } from "lucide-react";
import { GuildXPBar } from "./GuildXPBar";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DSPanel } from "@/components/ds";
import type { Guild } from "@/hooks/useGuilds";

const iconMap: Record<string, React.ElementType> = { shield: Shield, crown: Crown, users: Users };

const COLOR_HSL: Record<string, string> = {
  violet: "var(--ds-accent-special)",
  emerald: "var(--ds-accent-success)",
  amber: "var(--ds-accent-warning)",
  rose: "var(--ds-accent-critical)",
  cyan: "var(--ds-accent-primary)",
};

const ACCENT_KEY: Record<string, "special" | "success" | "warning" | "critical" | "primary"> = {
  violet: "special",
  emerald: "success",
  amber: "warning",
  rose: "critical",
  cyan: "primary",
};

interface Props {
  guild: Guild;
  memberCount: number;
}

export function GuildHeader({ guild, memberCount }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const Icon = iconMap[guild.icon] || Shield;
  const colorVar = COLOR_HSL[guild.color] || COLOR_HSL.violet;
  const accent = ACCENT_KEY[guild.color] || "special";
  const factionId = guild.id.slice(0, 8).toUpperCase();
  const max = guild.max_members || 25;
  const isOwner = false; // visual only — real owner badge depends on guild metadata

  return (
    <DSPanel tier="primary" accent={accent} className="!p-0 overflow-hidden">
      <div className="relative flex items-stretch">
        {/* Stripe latéral 3px */}
        <span
          className="w-[3px] shrink-0"
          style={{ background: `hsl(${colorVar})` }}
          aria-hidden="true"
        />

        <div className="flex-1 p-4 sm:p-5">
          {/* Top row: faction id + back */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <span
              className="font-mono text-[9px] uppercase tracking-[0.22em] truncate"
              style={{ color: `hsl(${colorVar} / 0.85)` }}
            >
              [ FACTION · {factionId} ]
            </span>
            <button
              onClick={() => navigate("/friends")}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--ds-text-muted))] hover:text-[hsl(var(--ds-accent-primary))] transition-colors shrink-0"
              aria-label={t("common.back")}
            >
              <ArrowLeft className="h-3 w-3" />
              <span className="hidden sm:inline">/friends</span>
            </button>
          </div>

          <div className="flex items-start gap-4">
            {/* Icon block — GuildNodeCard style */}
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-sm border flex items-center justify-center shrink-0"
              style={{
                borderColor: `hsl(${colorVar} / 0.5)`,
                background: `hsl(${colorVar} / 0.08)`,
                boxShadow: `inset 0 0 18px hsl(${colorVar} / 0.2)`,
              }}
            >
              <Icon className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: `hsl(${colorVar})` }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black font-orbitron tracking-[0.12em] uppercase truncate text-[hsl(var(--ds-text-primary))]">
                  {guild.name}
                </h1>

                {guild.is_public && (
                  <span
                    className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-[2px] border"
                    style={{
                      color: "hsl(var(--ds-accent-primary))",
                      borderColor: "hsl(var(--ds-accent-primary) / 0.45)",
                      background: "hsl(var(--ds-accent-primary) / 0.08)",
                    }}
                  >
                    <Globe className="h-2.5 w-2.5" />
                    PUBLIC
                  </span>
                )}

                <span
                  className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-[2px] border tabular-nums"
                  style={{
                    color: "hsl(var(--ds-text-muted))",
                    borderColor: "hsl(var(--ds-border-default) / 0.4)",
                    background: "hsl(var(--ds-surface-3) / 0.4)",
                  }}
                >
                  <Users className="h-2.5 w-2.5" />
                  MBR · {memberCount}/{max}
                </span>
              </div>

              {guild.description && (
                <p className="text-xs text-[hsl(var(--ds-text-muted))] mt-1.5 line-clamp-2 font-rajdhani">
                  {guild.description}
                </p>
              )}
            </div>
          </div>

          {/* XP Bar in muted panel */}
          <div className="mt-4">
            <DSPanel tier="muted" hideBrackets className="!p-3">
              <GuildXPBar totalXp={guild.total_xp} />
            </DSPanel>
          </div>
        </div>
      </div>
    </DSPanel>
  );
}
