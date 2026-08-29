/* CE QU ON LIT D UNE GUILDE : ses membres, son activite, ses annonces,
 * ses codes d invitation.
 *
 * Cinq hooks sortis de `useGuilds.ts`, qui en faisait 584 dont 334 pour
 * le seul hook principal. Ceux-ci ne font que LIRE — le fichier
 * d origine garde ce qui ecrit.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import type { Guild, GuildMember, GuildActivity, GuildAnnouncement, GuildInviteCode } from "@/domaines/social/types";

export const useGuildMembers = (guildId: string) =>
  useQuery({
    queryKey: ["guild-members", guildId],
    queryFn: async (): Promise<GuildMember[]> => {
      const { data: members, error } = await supabase
        .from("guild_members")
        .select("*")
        .eq("guild_id", guildId);
      if (error) throw error;
      if (!members?.length) return [];

      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      return members.map((m) => ({
        ...m,
        display_name: profileMap.get(m.user_id)?.display_name || "Unknown",
        avatar_url: profileMap.get(m.user_id)?.avatar_url,
      }));
    },
    enabled: !!guildId,
  });

/* UNE GUILDE PAR SON IDENTIFIANT.
 *
 * La page de guilde la cherchait dans « mes guildes » :
 *   const guild = guilds.find((g) => g.id === id)
 * Ouvrir une guilde trouvee par la decouverte affichait donc
 * « introuvable » — on pouvait la voir dans la liste, pas la
 * consulter. Ici on la demande a la base, et RLS decide : une guilde
 * publique s ouvre, une guilde privee dont on n est pas membre ne
 * s ouvre pas.
 */
export function useGuild(guildId: string | undefined) {
  return useQuery({
    queryKey: ["guild", guildId],
    enabled: !!guildId,
    staleTime: 30_000,
    queryFn: async (): Promise<Guild | null> => {
      const { data, error } = await supabase
        .from("guilds")
        .select("*")
        .eq("id", guildId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { count } = await supabase
        .from("guild_members")
        .select("id", { count: "exact", head: true })
        .eq("guild_id", guildId!);

      return { ...data, member_count: count || 0 } as Guild;
    },
  });
}

// ── Activity Feed ──
export const useGuildActivity = (guildId: string) =>
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
      /* filter() ne retire pas « null » du TYPE : sans predicat de
         garde, la liste reste (string | null)[] et .in() la refuse. */
      const userIds = [...new Set(data.map((a) => a.user_id).filter((i): i is string => !!i))];
      if (!userIds.length) return data as GuildActivity[];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
      const pm = new Map(profiles?.map((p) => [p.id, p]) || []);
      return data.map((a) => ({ ...a, display_name: a.user_id ? pm.get(a.user_id)?.display_name : null }));
    },
    enabled: !!guildId,
  });

// ── Announcements ──
export const useAnnouncements = (guildId: string) =>
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
      const authorIds = [...new Set(data.map((a) => a.author_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", authorIds);
      const pm = new Map(profiles?.map((p) => [p.id, p]) || []);
      return data.map((a) => ({ ...a, author_name: pm.get(a.author_id)?.display_name, author_avatar: pm.get(a.author_id)?.avatar_url }));
    },
    enabled: !!guildId,
  });

// ── Invite Codes ──
export const useInviteCodes = (guildId: string) =>
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
