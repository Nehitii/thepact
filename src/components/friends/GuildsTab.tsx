import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Shield, Plus } from "lucide-react";
import { GuildCard } from "./GuildCard";
import { GuildCreateModal } from "./GuildCreateModal";
import { GuildDetailPanel } from "./GuildDetailPanel";
import { GuildInviteCard } from "./GuildInviteCard";
import { CyberLoader, CyberEmpty } from "@/components/ui/cyber-states";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Guild, GuildInvite } from "@/hooks/useGuilds";

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
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);

  const handleRespondInvite = async (inviteId: string, guildId: string, accept: boolean) => {
    try {
      await respondToInvite.mutateAsync({ inviteId, guildId, accept });
      toast.success(accept ? t("friends.guildJoined") : t("friends.inviteDeclined"));
    } catch {
      toast.error(t("friends.inviteResponseFailed"));
    }
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black font-orbitron uppercase tracking-widest text-muted-foreground">
            {t("friends.yourGuilds")}
          </h3>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="text-xs font-bold uppercase tracking-wider h-8"
            aria-label={t("friends.createGuild")}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> {t("common.create")}
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
                <GuildCard guild={guild} isOwner={guild.owner_id === userId} onClick={() => setSelectedGuild(guild)} />
              </motion.div>
            ))}
          </motion.div>
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
