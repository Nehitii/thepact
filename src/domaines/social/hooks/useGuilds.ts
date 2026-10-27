import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { plafondAffiche } from "@/domaines/social/logique/guilde";
import { useAuth } from "@/socle/contextes/AuthContext";
import type { Json } from "@/socle/supabase/types";
import { trackGuildJoined } from "@/domaines/succes";
import type {
  Guild, GuildMember, GuildInvite, GuildAnnouncement, GuildInviteCode, GuildActivity,
} from "@/domaines/social/types";
import { useGuildMembers, useAnnouncements, useGuildActivity, useInviteCodes } from "@/domaines/social/hooks/useGuildeLecture";
/* Reexportes : les appelants importaient ces formes depuis ce fichier. */
export type {
  Guild, GuildMember, GuildInvite, GuildAnnouncement, GuildInviteCode, GuildActivity,
};

/* CE QUE RENDENT LES TROIS FONCTIONS EN BASE.
   create_guild_with_owner, join_guild_via_code et respond_to_invite
   rendent toutes un jsonb de la meme forme : un drapeau, un message
   d erreur eventuel, et ce qui a ete cree. « as any » sur ces trois
   retours annulait la verification du seul endroit ou elle comptait —
   la lecture de result.success. */
interface ReponseRpc {
  success?: boolean;
  error?: string;
  [autre: string]: unknown;
}

/** Lit le jsonb d une fonction en base, ou echoue avec son message. */
function lireReponse(data: Json): ReponseRpc {
  const r = (data ?? {}) as ReponseRpc;
  if (!r.success) throw new Error(typeof r.error === "string" ? r.error : "Operation refusee");
  return r;
}

/* CE QUE LA BASE REND VRAIMENT.
   Ces interfaces annonçaient obligatoires des colonnes que le schema
   laisse nullables. Les « any » semes dans les map ne cachaient pas
   de la paresse : ils ETEIGNAIENT cet ecart. Une fois retires, le
   compilateur a designe les sept endroits ou la declaration mentait.
   On corrige la declaration, pas la verification. */

/* LES CINQ REQUETES PAR GUILDE, HISSEES.
 *
 * Elles etaient definies DANS useGuilds et rendues par lui. Un hook
 * qui fabrique des hooks pose deux problemes : ils sont recrees a
 * chaque rendu, et rien — ni eslint ni le compilateur — ne peut
 * verifier que leurs appelants respectent les regles des hooks,
 * puisqu ils n existent qu au moment de l execution.
 *
 * Au niveau du module, ce sont des hooks ordinaires, verifiables, et
 * un composant qui n a besoin que des membres n abonne plus son
 * lecteur aux guildes publiques et aux invitations. */

export function useGuilds() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ── My Guilds ──
  const guildsQuery = useQuery({
    queryKey: ["guilds", user?.id],
    queryFn: async (): Promise<Guild[]> => {
      if (!user) return [];
      const { data: memberships, error: mErr } = await supabase
        .from("guild_members")
        .select("guild_id")
        .eq("user_id", user.id);
      if (mErr) throw mErr;
      if (!memberships?.length) return [];

      const guildIds = memberships.map((m) => m.guild_id);
      const { data: guilds, error: gErr } = await supabase
        .from("guilds")
        .select("*")
        .in("id", guildIds)
        .order("created_at", { ascending: false });
      if (gErr) throw gErr;

      const { data: allMembers } = await supabase
        .from("guild_members")
        .select("guild_id")
        .in("guild_id", guildIds);

      const counts = new Map<string, number>();
      allMembers?.forEach((m) => counts.set(m.guild_id, (counts.get(m.guild_id) || 0) + 1));

      return (guilds || []).map((g) => ({ ...g, member_count: counts.get(g.id) || 0 }));
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // ── Public Guilds (discover) ──
  const publicGuildsQuery = useQuery({
    queryKey: ["guilds-public"],
    queryFn: async (): Promise<Guild[]> => {
      const { data, error } = await supabase
        .from("guilds")
        .select("*")
        .eq("is_public", true)
        .order("total_xp", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Guild[];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  /* ── Guild Members ──
     Nomme useGuildMembers comme ses quatre soeurs juste en dessous.
     Sous « membersQuery », eslint ne reconnaissait pas un hook : ni sa
     definition ni ses cinq appels netaient verifies contre les regles
     des hooks. Le motif etait bon, le nom lempechait detre controle. */

  // ── Invites ──
  const invitesQuery = useQuery({
    queryKey: ["guild-invites", user?.id],
    queryFn: async (): Promise<GuildInvite[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("guild_invites")
        .select("*")
        .eq("invitee_id", user.id)
        .eq("status", "pending");
      if (error) throw error;
      if (!data?.length) return [];

      const guildIds = [...new Set(data.map((i) => i.guild_id))];
      const inviterIds = [...new Set(data.map((i) => i.inviter_id))];

      const [{ data: guilds }, { data: profiles }] = await Promise.all([
        supabase.from("guilds").select("id, name, color").in("id", guildIds),
        supabase.from("profiles").select("id, display_name").in("id", inviterIds),
      ]);

      const guildMap = new Map(guilds?.map((g) => [g.id, g]) || []);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((inv) => ({
        ...inv,
        guild_name: guildMap.get(inv.guild_id)?.name,
        guild_color: guildMap.get(inv.guild_id)?.color,
        inviter_name: profileMap.get(inv.inviter_id)?.display_name,
      }));
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // ── Mutations ──

  const createGuild = useMutation({
    mutationFn: async ({ name, description, icon, color, is_public, max_members }: {
      name: string; description?: string; icon?: string; color?: string; is_public?: boolean; max_members?: number;
    }) => {
      const { data, error } = await supabase.rpc("create_guild_with_owner", {
        p_name: name,
        p_description: description || undefined,
        p_icon: icon || "shield",
        p_color: color || "violet",
        p_is_public: is_public || false,
        p_max_members: plafondAffiche(max_members),
      });
      if (error) throw error;
      return lireReponse(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guilds"] }),
  });

  const inviteMember = useMutation({
    mutationFn: async ({ guildId, inviteeId }: { guildId: string; inviteeId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("guild_invites")
        .insert({ guild_id: guildId, inviter_id: user.id, invitee_id: inviteeId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guild-invites"] }),
  });

  const respondToInvite = useMutation({
    mutationFn: async ({ inviteId, guildId, accept }: { inviteId: string; guildId: string; accept: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (accept) {
        const { data, error } = await supabase.rpc("accept_guild_invite", { p_invite_id: inviteId });
        if (error) throw error;
        lireReponse(data);
      } else {
        const { error } = await supabase
          .from("guild_invites")
          .update({ status: "declined" })
          .eq("id", inviteId);
        if (error) throw error;
      }
    },
    onSuccess: (_donnee, variables) => {
      qc.invalidateQueries({ queryKey: ["guilds"] });
      qc.invalidateQueries({ queryKey: ["guild-invites"] });
      /* Rejoindre par invitation ou par code, c'est le même évènement
         pour qui compte les succès. Décliner n'en est pas un — d'où la
         condition sur `accept` plutôt qu'un comptage à l'aveugle. */
      if (variables.accept && user?.id) trackGuildJoined(user.id);
    },
  });

  const joinViaCode = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("join_guild_via_code", { p_code: code });
      if (error) throw error;
      return lireReponse(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guilds"] });
      if (user?.id) trackGuildJoined(user.id);
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({ memberId }: { memberId: string }) => {
      const { error } = await supabase.from("guild_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guilds"] });
      qc.invalidateQueries({ queryKey: ["guild-members"] });
    },
  });

  const leaveGuild = useMutation({
    mutationFn: async (guildId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("guild_members")
        .delete()
        .eq("guild_id", guildId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guilds"] });
      qc.invalidateQueries({ queryKey: ["guild-members"] });
    },
  });

  const deleteGuild = useMutation({
    mutationFn: async (guildId: string) => {
      const { error } = await supabase.from("guilds").delete().eq("id", guildId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guilds"] }),
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from("guild_members")
        .update({ role })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guild-members"] }),
  });

  const transferOwnership = useMutation({
    mutationFn: async ({ guildId, newOwnerId }: { guildId: string; newOwnerId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error: gErr } = await supabase
        .from("guilds")
        .update({ owner_id: newOwnerId })
        .eq("id", guildId);
      if (gErr) throw gErr;
      const { data: members } = await supabase
        .from("guild_members")
        .select("id, user_id, role")
        .eq("guild_id", guildId);
      const oldOwner = members?.find((m) => m.user_id === user.id);
      const newOwner = members?.find((m) => m.user_id === newOwnerId);
      if (newOwner) await supabase.from("guild_members").update({ role: "owner" }).eq("id", newOwner.id);
      if (oldOwner) await supabase.from("guild_members").update({ role: "member" }).eq("id", oldOwner.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guilds"] });
      qc.invalidateQueries({ queryKey: ["guild-members"] });
    },
  });

  const updateGuild = useMutation({
    mutationFn: async ({ guildId, updates }: {
      guildId: string;
      /* La liste s arretait aux six champs du premier formulaire : la
         banniere, l embleme et le mot du jour ne pouvaient donc pas
         etre enregistres, alors que leurs colonnes existent. */
      updates: Partial<Pick<Guild,
        "name" | "description" | "icon" | "color" | "is_public"
        | "max_members" | "banner_url" | "emblem_url" | "motd"
        | "blason_pose" | "emblem_bg">>;
    }) => {
      const { error } = await supabase.from("guilds").update(updates).eq("id", guildId);
      if (error) throw error;
    },
    /* La page de guilde lit useGuild(id), pas la liste : sans invalider
       cette cle-la, un enregistrement ne changeait rien a l ecran. */
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["guilds"] });
      qc.invalidateQueries({ queryKey: ["guild", v.guildId] });
    },
  });

  // ── Announcement mutations ──
  const createAnnouncement = useMutation({
    mutationFn: async ({ guildId, content, pinned }: { guildId: string; content: string; pinned?: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("guild_announcements").insert({
        guild_id: guildId, author_id: user.id, content, pinned: pinned || false,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["guild-announcements", v.guildId] }),
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async ({ id, guildId }: { id: string; guildId: string }) => {
      const { error } = await supabase.from("guild_announcements").delete().eq("id", id);
      if (error) throw error;
      return guildId;
    },
    onSuccess: (guildId) => qc.invalidateQueries({ queryKey: ["guild-announcements", guildId] }),
  });

  // ── Goal mutations ──
  // ── Invite Code mutations ──
  const createInviteCode = useMutation({
    mutationFn: async ({ guildId, maxUses, expiresInHours }: { guildId: string; maxUses?: number; expiresInHours?: number }) => {
      if (!user) throw new Error("Not authenticated");
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
      const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 3600000).toISOString() : null;
      const { error } = await supabase.from("guild_invite_codes").insert({
        guild_id: guildId, code, created_by: user.id,
        max_uses: maxUses || null, expires_at: expiresAt,
      });
      if (error) throw error;
      return code;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["guild-invite-codes", v.guildId] }),
  });

  const deactivateInviteCode = useMutation({
    mutationFn: async ({ id, guildId }: { id: string; guildId: string }) => {
      const { error } = await supabase.from("guild_invite_codes").update({ is_active: false }).eq("id", id);
      if (error) throw error;
      return guildId;
    },
    onSuccess: (guildId) => qc.invalidateQueries({ queryKey: ["guild-invite-codes", guildId] }),
  });

  return {
    guilds: guildsQuery.data || [],
    guildsLoading: guildsQuery.isLoading,
    publicGuilds: publicGuildsQuery.data || [],
    invites: invitesQuery.data || [],
    invitesLoading: invitesQuery.isLoading,
    useGuildMembers,
    useAnnouncements,
    useGuildActivity,
    useInviteCodes,
    createGuild,
    inviteMember,
    respondToInvite,
    joinViaCode,
    removeMember,
    leaveGuild,
    deleteGuild,
    updateMemberRole,
    transferOwnership,
    updateGuild,
    createAnnouncement,
    deleteAnnouncement,
    createInviteCode,
    deactivateInviteCode,
  };
}
/* Reexportes : les appelants importaient ces lectures depuis ce fichier. */
export { useGuild } from "@/domaines/social/hooks/useGuildeLecture";
export { useGuildMembers, useAnnouncements, useGuildActivity, useInviteCodes };
