import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SharedPactMembership {
  id: string;
  pact_id: string;
  owner_id: string;
  member_id: string;
  role: string;
  joined_at: string;
  pact_name?: string;
  pact_mantra?: string;
  pact_color?: string;
  member_count?: number;
}

export function useSharedPacts() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const membershipsQuery = useQuery({
    queryKey: ["shared-pacts", user?.id],
    queryFn: async (): Promise<SharedPactMembership[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("shared_pacts")
        .select("*")
        .eq("member_id", user.id);
      if (error) throw error;
      if (!data?.length) return [];

      const pactIds = [...new Set(data.map((s: any) => s.pact_id))];
      const { data: pacts } = await supabase
        .from("pacts")
        .select("id, name, mantra, color")
        .in("id", pactIds);
      const pactMap = new Map(pacts?.map((p: any) => [p.id, p]) || []);

      // Get member counts
      const { data: allMembers } = await supabase
        .from("shared_pacts")
        .select("pact_id")
        .in("pact_id", pactIds);
      const counts = new Map<string, number>();
      allMembers?.forEach((m: any) => counts.set(m.pact_id, (counts.get(m.pact_id) || 0) + 1));

      return data.map((s: any) => {
        const pact = pactMap.get(s.pact_id);
        return {
          ...s,
          pact_name: pact?.name,
          pact_mantra: pact?.mantra,
          pact_color: pact?.color,
          member_count: counts.get(s.pact_id) || 0,
        };
      });
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const createSharedPact = useMutation({
    mutationFn: async ({ pactId, memberIds }: { pactId: string; memberIds: string[] }) => {
      if (!user) throw new Error("Not authenticated");
      // Add owner entry
      const entries = [
        { pact_id: pactId, owner_id: user.id, member_id: user.id, role: "owner" },
        ...memberIds.map((mid) => ({ pact_id: pactId, owner_id: user.id, member_id: mid, role: "member" })),
      ];
      const { error } = await supabase.from("shared_pacts").insert(entries);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shared-pacts"] }),
  });

  const leaveSharedPact = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase.from("shared_pacts").delete().eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shared-pacts"] }),
  });

  return {
    memberships: membershipsQuery.data || [],
    loading: membershipsQuery.isLoading,
    createSharedPact,
    leaveSharedPact,
  };
}
