import { Shield, Users, Crown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { DSPanel } from "@/components/ds";
import type { Guild } from "@/hooks/useGuilds";

const iconMap: Record<string, any> = { shield: Shield, crown: Crown, users: Users };

const COLOR_HSL: Record<string, string> = {
  violet: "var(--ds-accent-special)",
  emerald: "var(--ds-accent-success)",
  amber: "var(--ds-accent-warning)",
  rose: "var(--ds-accent-critical)",
  cyan: "var(--ds-accent-primary)",
};

interface GuildNodeCardProps {
  guild: Guild;
  isOwner: boolean;
  onClick?: () => void;
}

export function GuildNodeCard({ guild, isOwner, onClick }: GuildNodeCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const Icon = iconMap[guild.icon] || Shield;
  const colorVar = COLOR_HSL[guild.color] || COLOR_HSL.violet;

  const memberCount = guild.member_count || 1;
  const max = guild.max_members || 25;
  const fillPct = Math.min(100, Math.round((memberCount / max) * 100));

  const handleClick = () => {
    if (onClick) onClick();
    else navigate(`/guild/${guild.id}`);
  };

  return (
    <DSPanel
      tier={isOwner ? "primary" : "secondary"}
      accent={isOwner ? "success" : "primary"}
      className="!p-0 group cursor-pointer transition-transform duration-200 hover:-translate-y-px overflow-hidden"
    >
      <button
        onClick={handleClick}
        className="relative w-full text-left flex items-stretch"
      >
        {/* Stripe latéral 3px */}
        <span
          className="w-[3px] shrink-0"
          style={{ background: `hsl(${colorVar})` }}
          aria-hidden="true"
        />

        <div className="flex-1 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-sm border flex items-center justify-center shrink-0"
              style={{
                borderColor: `hsl(${colorVar} / 0.45)`,
                background: `hsl(${colorVar} / 0.08)`,
                boxShadow: `inset 0 0 12px hsl(${colorVar} / 0.15)`,
              }}
            >
              <Icon className="h-5 w-5" style={{ color: `hsl(${colorVar})` }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-[hsl(var(--ds-text-primary))]">
                  {guild.name}
                </h3>
                {isOwner && (
                  <span
                    className="inline-flex items-center font-mono text-[8px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-[2px] border"
                    style={{
                      color: "hsl(var(--ds-accent-success))",
                      borderColor: "hsl(var(--ds-accent-success) / 0.45)",
                      background: "hsl(var(--ds-accent-success) / 0.08)",
                    }}
                  >
                    [OWNER]
                  </span>
                )}
                {guild.is_public && (
                  <span
                    className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-[2px] border"
                    style={{
                      color: "hsl(var(--ds-accent-primary))",
                      borderColor: "hsl(var(--ds-accent-primary) / 0.45)",
                      background: "hsl(var(--ds-accent-primary) / 0.08)",
                    }}
                  >
                    <Globe className="h-2.5 w-2.5" />
                    PUB
                  </span>
                )}
              </div>

              {/* Member fill bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-[6px] rounded-[2px] overflow-hidden bg-[hsl(var(--ds-surface-3)/0.6)] border border-[hsl(var(--ds-border-subtle)/0.15)]">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${fillPct}%`,
                      background: `linear-gradient(90deg, hsl(${colorVar} / 0.5), hsl(${colorVar}))`,
                      boxShadow: `0 0 6px hsl(${colorVar} / 0.6)`,
                    }}
                  />
                </div>
                <span className="font-mono text-[9px] tabular-nums uppercase tracking-wider text-[hsl(var(--ds-text-muted))] shrink-0">
                  {memberCount}/{max}
                </span>
              </div>

              {guild.description && (
                <p className="text-xs text-[hsl(var(--ds-text-muted))] mt-2 line-clamp-1 font-rajdhani">
                  {guild.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </button>
    </DSPanel>
  );
}
