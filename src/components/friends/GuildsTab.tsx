import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Plus, Globe, Loader2, Zap } from "lucide-react";
import { GuildNodeCard } from "./GuildNodeCard";
import { GuildCreateModal } from "./GuildCreateModal";
import { GuildInviteCard } from "./GuildInviteCard";
import { CyberLoader, CyberEmpty } from "@/components/ui/cyber-states";
import { DSPanel, DSDivider } from "@/components/ds";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Guild, GuildInvite } from "@/hooks/useGuilds";
import { useGuilds } from "@/hooks/useGuilds";

interface GuildsTabProps {
  guilds: Guild[];
  guildsLoading: boolean;
  invites: GuildInvite[];
  userId: string;
  createGuild: { mutateAsync: (data: any) => Promise<any>; isPending: boolean };
  respondToInvite: { mutateAsync: (data: any) => Promise<void> };
}

export function GuildsTab({ guilds, guildsLoading, invites, userId, createGuild, respondToInvite }: GuildsTabProps) {
  const { t } = useTranslation();
  const { publicGuilds, joinViaCode } = useGuilds();
  const [createOpen, setCreateOpen] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);

  const handleRespondInvite = async (inviteId: string, guildId: string, accept: boolean) => {
    try {
      await respondToInvite.mutateAsync({ inviteId, guildId, accept });
      toast.success(accept ? t("friends.guildJoined") : t("friends.inviteDeclined"));
    } catch {
      toast.error(t("friends.inviteResponseFailed"));
    }
  };

  const handleJoinViaCode = async () => {
    if (!inviteCode.trim()) return;
    setJoiningCode(true);
    try {
      await joinViaCode.mutateAsync(inviteCode.trim());
      toast.success(t("friends.guildJoined"));
      setInviteCode("");
    } catch (err: any) {
      toast.error(err?.message || t("common.error"));
    } finally {
      setJoiningCode(false);
    }
  };

  const myGuildIds = new Set(guilds.map((g) => g.id));
  const discoverGuilds = publicGuilds.filter((g) => !myGuildIds.has(g.id));

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h3 className="font-mono text-[10px] tracking-[0.22em] uppercase text-[hsl(var(--ds-accent-warning))] shrink-0">
              [ ACTIVE FACTIONS ]
            </h3>
            <DSDivider accent="warning" />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => setShowDiscover(!showDiscover)}
              variant="hud-primary"
              className={`h-8 ${showDiscover ? "bg-[hsl(var(--ds-accent-primary)/0.18)]" : ""}`}
            >
              <Globe className="h-3.5 w-3.5 mr-1" /> {t("friends.discover")}
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              variant="hud-success"
              className="h-8"
              aria-label={t("friends.createGuild")}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> {t("common.create")}
            </Button>
          </div>
        </div>

        {/* Join via code */}
        <div className="mb-5 flex flex-col gap-2">
          <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-[hsl(var(--ds-accent-primary))]">
            [ JACK_IN VIA CODE ]
          </span>
          <DSPanel tier="muted" hideBrackets className="!p-3">
          <div className="flex gap-2">
            <Input
              placeholder={t("friends.enterInviteCode")}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="h-9 text-xs font-mono uppercase tracking-[0.2em] bg-[hsl(var(--ds-surface-2)/0.5)] border-[hsl(var(--ds-border-default)/0.3)]"
              maxLength={8}
            />
            <Button
              size="sm"
              onClick={handleJoinViaCode}
              disabled={!inviteCode.trim() || joiningCode}
              variant="hud-primary"
              className="h-9"
            >
              {joiningCode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Zap className="h-3.5 w-3.5 mr-1" />JACK_IN</>}
            </Button>
          </div>
          </DSPanel>
        </div>

        {invites.length > 0 && (
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-mono text-[10px] tracking-[0.22em] uppercase text-[hsl(var(--ds-accent-special))] shrink-0">
                [ PENDING INVITES ]
              </h4>
              <DSDivider accent="special" />
            </div>
            {invites.map((inv) => (
              <GuildInviteCard
                key={inv.id}
                invite={inv}
                onAccept={() => handleRespondInvite(inv.id, inv.guild_id, true)}
                onDecline={() => handleRespondInvite(inv.id, inv.guild_id, false)}
              />
            ))}
          </div>
        )}

        {guildsLoading ? (
          <CyberLoader rows={3} label={t("common.loading")} />
        ) : guilds.length === 0 ? (
          <CyberEmpty
            icon={Shield}
            title={t("friends.noGuildsTitle")}
            subtitle={t("friends.noGuildsDesc")}
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
            {guilds.map((guild, i) => (
              <motion.div
                key={guild.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <GuildNodeCard guild={guild} isOwner={guild.owner_id === userId} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {showDiscover && discoverGuilds.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="font-mono text-[10px] tracking-[0.22em] uppercase text-[hsl(var(--ds-accent-primary))] shrink-0">
                [ PUBLIC NETWORK ]
              </h4>
              <DSDivider accent="primary" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {discoverGuilds.map((guild) => (
                <GuildNodeCard key={guild.id} guild={guild} isOwner={false} />
              ))}
            </div>
          </div>
        )}
      </div>

      <GuildCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (data) => { await createGuild.mutateAsync(data); }}
        loading={createGuild.isPending}
      />
    </ScrollArea>
  );
}
