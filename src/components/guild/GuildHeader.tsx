import { Shield, Crown, Users, ArrowLeft, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GuildXPBar } from "./GuildXPBar";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Guild } from "@/hooks/useGuilds";

const iconMap: Record<string, React.ElementType> = { shield: Shield, crown: Crown, users: Users };
const colorMap: Record<string, string> = {
  violet: "from-violet-600/40 to-violet-900/20 border-violet-500/30",
  emerald: "from-emerald-600/40 to-emerald-900/20 border-emerald-500/30",
  amber: "from-amber-600/40 to-amber-900/20 border-amber-500/30",
  rose: "from-rose-600/40 to-rose-900/20 border-rose-500/30",
  cyan: "from-cyan-600/40 to-cyan-900/20 border-cyan-500/30",
};

interface Props {
  guild: Guild;
  memberCount: number;
}

export function GuildHeader({ guild, memberCount }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const Icon = iconMap[guild.icon] || Shield;
  const gradient = colorMap[guild.color] || colorMap.violet;

  return (
    <div className={`relative rounded-xl border bg-gradient-to-r ${gradient} p-6 overflow-hidden`}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAyMCAwIEwgMCAwIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      
      <div className="relative z-10">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-xs" onClick={() => navigate("/friends")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {t("common.back")}
        </Button>

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-background/30 backdrop-blur border border-white/10 flex items-center justify-center shrink-0">
            <Icon className="h-8 w-8 text-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black font-orbitron tracking-wide truncate">{guild.name}</h1>
              {guild.is_public && (
                <Badge variant="outline" className="text-[9px] font-bold uppercase gap-1">
                  <Globe className="h-2.5 w-2.5" /> {t("friends.public")}
                </Badge>
              )}
            </div>
            {guild.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{guild.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {memberCount} {t("friends.members").toLowerCase()}
              </span>
            </div>
            <div className="mt-3">
              <GuildXPBar totalXp={guild.total_xp} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
