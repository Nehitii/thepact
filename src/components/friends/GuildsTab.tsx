import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Plus, Globe, Link, Loader2 } from "lucide-react";
import { GuildCard } from "./GuildCard";
import { GuildCreateModal } from "./GuildCreateModal";
import { GuildInviteCard } from "./GuildInviteCard";
import { GuildInviteCard } from "./GuildInviteCard";
import { CyberLoader, CyberEmpty } from "@/components/ui/cyber-states";
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

  // Filter out guilds user is already in from public list
  const myGuildIds = new Set(guilds.map((g) => g.id));
  const discoverGuilds = publicGuilds.filter((g) => !myGuildIds.has(g.id));

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black font-orbitron uppercase tracking-widest text-muted-foreground">
            {t("friends.yourGuilds")}
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm" variant="outline"
              onClick={() => setShowDiscover(!showDiscover)}
              className="text-xs font-bold uppercase tracking-wider h-8"
            >
              <Globe className="h-3.5 w-3.5 mr-1" /> {t("friends.discover")}
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="text-xs font-bold uppercase tracking-wider h-8"
              aria-label={t("friends.createGuild")}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> {t("common.create")}
            </Button>
          </div>
        </div>

        {/* Join via code */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder={t("friends.enterInviteCode")}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="h-8 text-xs font-mono"
            maxLength={8}
          />
          <Button size="sm" className="h-8 text-xs" onClick={handleJoinViaCode} disabled={!inviteCode.trim() || joiningCode}>
            {joiningCode ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link className="h-3 w-3 mr-1" />}
            {t("friends.join")}
          </Button>
        </div>

        {invites.length > 0 && (
          <div className="space-y-2 mb-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">
              {t("friends.pendingInvites")}
            </h4>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {guilds.map((guild, i) => (
              <motion.div key={guild.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GuildCard guild={guild} isOwner={guild.owner_id === userId} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Discover Public Guilds */}
        {showDiscover && discoverGuilds.length > 0 && (
          <div className="mt-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
              {t("friends.discoverGuilds")}
            </h4>
            <div className="space-y-3">
              {discoverGuilds.map((guild) => (
                <GuildCard key={guild.id} guild={guild} isOwner={false} />
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
      {selectedGuild && (
        <GuildDetailPanel
          open={!!selectedGuild}
          onClose={() => setSelectedGuild(null)}
          guild={selectedGuild}
          userId={userId}
        />
      )}
    </ScrollArea>
  );
}
