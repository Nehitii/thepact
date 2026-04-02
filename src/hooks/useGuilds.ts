import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Guild {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  owner_id: string;
  created_at: string;
  member_count?: number;
}

export interface GuildMember {
  id: string;
  guild_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  display_name?: string;
  avatar_url?: string;
}

export interface GuildInvite {
  id: string;
  guild_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  created_at: string;
  guild_name?: string;
  guild_color?: string;
  inviter_name?: string;
}

export function useGuilds() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const guildsQuery = useQuery({
    queryKey: ["guilds", user?.id],
    queryFn: async (): Promise<Guild[]> => {
      if (!user) return [];
      // Get guilds where user is a member
      const { data: memberships, error: mErr } = await supabase
        .from("guild_members")
        .select("guild_id")
        .eq("user_id", user.id);
      if (mErr) throw mErr;
      if (!memberships?.length) return [];

      const guildIds = memberships.map((m: any) => m.guild_id);
      const { data: guilds, error: gErr } = await supabase
        .from("guilds")
        .select("*")
        .in("id", guildIds)
        .order("created_at", { ascending: false });
      if (gErr) throw gErr;

      // Get member counts
      const { data: allMembers } = await supabase
        .from("guild_members")
        .select("guild_id")
        .in("guild_id", guildIds);

      const counts = new Map<string, number>();
      allMembers?.forEach((m: any) => counts.set(m.guild_id, (counts.get(m.guild_id) || 0) + 1));

      return (guilds || []).map((g: any) => ({ ...g, member_count: counts.get(g.id) || 0 }));
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const membersQuery = (guildId: string) =>
    useQuery({
      queryKey: ["guild-members", guildId],
      queryFn: async (): Promise<GuildMember[]> => {
        const { data: members, error } = await supabase
          .from("guild_members")
          .select("*")
          .eq("guild_id", guildId);
        if (error) throw error;
        if (!members?.length) return [];

        const userIds = members.map((m: any) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
        return members.map((m: any) => ({
          ...m,
          display_name: profileMap.get(m.user_id)?.display_name || "Unknown",
          avatar_url: profileMap.get(m.user_id)?.avatar_url,
        }));
      },
      enabled: !!guildId,
    });

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

      const guildIds = [...new Set(data.map((i: any) => i.guild_id))];
      const inviterIds = [...new Set(data.map((i: any) => i.inviter_id))];

      const [{ data: guilds }, { data: profiles }] = await Promise.all([
        supabase.from("guilds").select("id, name, color").in("id", guildIds),
        supabase.from("profiles").select("id, display_name").in("id", inviterIds),
      ]);

      const guildMap = new Map(guilds?.map((g: any) => [g.id, g]) || []);
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      return data.map((inv: any) => ({
        ...inv,
        guild_name: guildMap.get(inv.guild_id)?.name,
        guild_color: guildMap.get(inv.guild_id)?.color,
        inviter_name: profileMap.get(inv.inviter_id)?.display_name,
      }));
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const createGuild = useMutation({
    mutationFn: async ({ name, description, icon, color }: { name: string; description?: string; icon?: string; color?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data: guild, error: gErr } = await supabase
        .from("guilds")
        .insert({ name, description: description || null, icon: icon || "shield", color: color || "violet", owner_id: user.id })
        .select()
        .single();
      if (gErr) throw gErr;
      // Add owner as member
      const { error: mErr } = await supabase
        .from("guild_members")
        .insert({ guild_id: guild.id, user_id: user.id, role: "owner" });
      if (mErr) throw mErr;
      return guild;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guilds"] });
    },
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
      const { error: uErr } = await supabase
        .from("guild_invites")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", inviteId);
      if (uErr) throw uErr;
      if (accept) {
        const { error: mErr } = await supabase
          .from("guild_members")
          .insert({ guild_id: guildId, user_id: user.id, role: "member" });
        if (mErr) throw mErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guilds"] });
      qc.invalidateQueries({ queryKey: ["guild-invites"] });
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
        .update({ role } as any)
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guild-members"] }),
  });

  const transferOwnership = useMutation({
    mutationFn: async ({ guildId, newOwnerId }: { guildId: string; newOwnerId: string }) => {
      if (!user) throw new Error("Not authenticated");
      // Update guild owner
      const { error: gErr } = await supabase
        .from("guilds")
        .update({ owner_id: newOwnerId } as any)
        .eq("id", guildId);
      if (gErr) throw gErr;
      // Update roles: new owner becomes "owner", old owner becomes "member"
      const { data: members } = await supabase
        .from("guild_members")
        .select("id, user_id, role")
        .eq("guild_id", guildId);
      const oldOwnerMember = members?.find((m: any) => m.user_id === user.id);
      const newOwnerMember = members?.find((m: any) => m.user_id === newOwnerId);
      if (newOwnerMember) {
        await supabase.from("guild_members").update({ role: "owner" } as any).eq("id", newOwnerMember.id);
      }
      if (oldOwnerMember) {
        await supabase.from("guild_members").update({ role: "member" } as any).eq("id", oldOwnerMember.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guilds"] });
      qc.invalidateQueries({ queryKey: ["guild-members"] });
    },
  });

  return {
    guilds: guildsQuery.data || [],
    guildsLoading: guildsQuery.isLoading,
    invites: invitesQuery.data || [],
    invitesLoading: invitesQuery.isLoading,
    useGuildMembers: membersQuery,
    createGuild,
    inviteMember,
    respondToInvite,
    removeMember,
    leaveGuild,
    deleteGuild,
    updateMemberRole,
    transferOwnership,
  };
}
