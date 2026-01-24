import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type ThemePreference = "system" | "light" | "dark";

export type ProfileSettings = {
  id: string;
  theme_preference: ThemePreference;
  reduce_motion: boolean;
  particles_enabled: boolean;
  particles_intensity: number;

  community_profile_discoverable: boolean;
  show_activity_status: boolean;
  share_goals_progress: boolean;
};

const PROFILE_SETTINGS_SELECT =
  "id, theme_preference, reduce_motion, particles_enabled, particles_intensity, community_profile_discoverable, show_activity_status, share_goals_progress";

export function useProfileSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_SETTINGS_SELECT)
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ProfileSettings | null;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<ProfileSettings>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      queryClient.invalidateQueries({ queryKey: ["victory-reels"] });
    },
  });

  return { profile, isLoading, updateProfile };
}
