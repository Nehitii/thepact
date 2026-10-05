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
  max_members: number;
  is_public: boolean;
  banner_url: string | null;
  total_xp: number;
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

export interface GuildAnnouncement {
  id: string;
  guild_id: string;
  author_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

export interface GuildGoal {
  id: string;
  guild_id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  deadline: string | null;
  created_by: string;
  status: string;
  created_at: string;
}

export interface GuildGoalContribution {
  id: string;
  guild_goal_id: string;
  user_id: string;
  amount: number;
  note: string | null;
  created_at: string;
  display_name?: string;
}

export interface GuildInviteCode {
  id: string;
  guild_id: string;
  code: string;
  created_by: string;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GuildActivity {
  id: string;
  guild_id: string;
  user_id: string | null;
  action_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  display_name?: string;
}

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

      const guildIds = memberships.map((m: any) => m.guild_id);
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
      allMembers?.forEach((m: any) => counts.set(m.guild_id, (counts.get(m.guild_id) || 0) + 1));

      return (guilds || []).map((g: any) => ({ ...g, member_count: counts.get(g.id) || 0 }));
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

  // ── Guild Members ──
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

  // ── Announcements ──
  const useAnnouncements = (guildId: string) =>
    useQuery({
      queryKey: ["guild-announcements", guildId],
      queryFn: async (): Promise<GuildAnnouncement[]> => {
        const { data, error } = await supabase
          .from("guild_announcements")
          .select("*")
          .eq("guild_id", guildId)
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!data?.length) return [];
        const authorIds = [...new Set(data.map((a: any) => a.author_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", authorIds);
        const pm = new Map(profiles?.map((p: any) => [p.id, p]) || []);
        return data.map((a: any) => ({ ...a, author_name: pm.get(a.author_id)?.display_name, author_avatar: pm.get(a.author_id)?.avatar_url }));
      },
      enabled: !!guildId,
    });

  // ── Guild Goals ──
  const useGuildGoals = (guildId: string) =>
    useQuery({
      queryKey: ["guild-goals", guildId],
      queryFn: async (): Promise<GuildGoal[]> => {
        const { data, error } = await supabase
          .from("guild_goals")
          .select("*")
          .eq("guild_id", guildId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []) as GuildGoal[];
      },
      enabled: !!guildId,
    });

  // ── Activity Feed ──
  const useGuildActivity = (guildId: string) =>
    useQuery({
      queryKey: ["guild-activity", guildId],
      queryFn: async (): Promise<GuildActivity[]> => {
        const { data, error } = await supabase
          .from("guild_activity_log")
          .select("*")
          .eq("guild_id", guildId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        if (!data?.length) return [];
        const userIds = [...new Set(data.filter((a: any) => a.user_id).map((a: any) => a.user_id))];
        if (!userIds.length) return data as GuildActivity[];
        const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
        const pm = new Map(profiles?.map((p: any) => [p.id, p]) || []);
        return data.map((a: any) => ({ ...a, display_name: pm.get(a.user_id)?.display_name }));
      },
      enabled: !!guildId,
    });

  // ── Invite Codes ──
  const useInviteCodes = (guildId: string) =>
    useQuery({
      queryKey: ["guild-invite-codes", guildId],
      queryFn: async (): Promise<GuildInviteCode[]> => {
        const { data, error } = await supabase
          .from("guild_invite_codes")
          .select("*")
          .eq("guild_id", guildId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []) as GuildInviteCode[];
      },
      enabled: !!guildId,
    });

  // ── Mutations ──

  const createGuild = useMutation({
    mutationFn: async ({ name, description, icon, color, is_public, max_members }: {
      name: string; description?: string; icon?: string; color?: string; is_public?: boolean; max_members?: number;
    }) => {
      const { data, error } = await supabase.rpc("create_guild_with_owner", {
        p_name: name,
        p_description: description || null,
        p_icon: icon || "shield",
        p_color: color || "violet",
        p_is_public: is_public || false,
        p_max_members: max_members || 25,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Failed to create guild");
      return result;
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
        const result = data as any;
        if (!result?.success) throw new Error(result?.error || "Failed to join guild");
      } else {
        const { error } = await supabase
          .from("guild_invites")
          .update({ status: "declined" })
          .eq("id", inviteId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guilds"] });
      qc.invalidateQueries({ queryKey: ["guild-invites"] });
    },
  });

  const joinViaCode = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("join_guild_via_code", { p_code: code });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Failed to join");
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guilds"] }),
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
      const { error: gErr } = await supabase
        .from("guilds")
        .update({ owner_id: newOwnerId } as any)
        .eq("id", guildId);
      if (gErr) throw gErr;
      const { data: members } = await supabase
        .from("guild_members")
        .select("id, user_id, role")
        .eq("guild_id", guildId);
      const oldOwner = members?.find((m: any) => m.user_id === user.id);
      const newOwner = members?.find((m: any) => m.user_id === newOwnerId);
      if (newOwner) await supabase.from("guild_members").update({ role: "owner" } as any).eq("id", newOwner.id);
      if (oldOwner) await supabase.from("guild_members").update({ role: "member" } as any).eq("id", oldOwner.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guilds"] });
      qc.invalidateQueries({ queryKey: ["guild-members"] });
    },
  });

  const updateGuild = useMutation({
    mutationFn: async ({ guildId, updates }: { guildId: string; updates: Partial<Pick<Guild, "name" | "description" | "icon" | "color" | "is_public" | "max_members">> }) => {
      const { error } = await supabase.from("guilds").update(updates as any).eq("id", guildId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guilds"] }),
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
  const createGuildGoal = useMutation({
    mutationFn: async ({ guildId, title, description, targetValue, deadline }: {
      guildId: string; title: string; description?: string; targetValue: number; deadline?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("guild_goals").insert({
        guild_id: guildId, title, description: description || null,
        target_value: targetValue, created_by: user.id,
        deadline: deadline || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["guild-goals", v.guildId] }),
  });

  const contributeToGoal = useMutation({
    mutationFn: async ({ goalId, amount, note, guildId }: { goalId: string; amount: number; note?: string; guildId: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error: cErr } = await supabase.from("guild_goal_contributions").insert({
        guild_goal_id: goalId, user_id: user.id, amount, note: note || null,
      });
      if (cErr) throw cErr;
      // Update current_value
      const { error: uErr } = await supabase.rpc("log_guild_activity", {
        p_guild_id: guildId, p_user_id: user.id, p_action: "goal_contribution",
        p_metadata: { goal_id: goalId, amount },
      });
      if (uErr) console.error("Failed to log activity", uErr);
      // Increment goal value
      const { data: goal } = await supabase.from("guild_goals").select("current_value").eq("id", goalId).single();
      if (goal) {
        await supabase.from("guild_goals").update({ current_value: (goal.current_value || 0) + amount } as any).eq("id", goalId);
      }
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["guild-goals", v.guildId] });
      qc.invalidateQueries({ queryKey: ["guild-activity", v.guildId] });
    },
  });

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
      const { error } = await supabase.from("guild_invite_codes").update({ is_active: false } as any).eq("id", id);
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
    useGuildMembers: membersQuery,
    useAnnouncements,
    useGuildGoals,
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
    createGuildGoal,
    contributeToGoal,
    createInviteCode,
    deactivateInviteCode,
  };
}
