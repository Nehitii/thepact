/**
 * Profile data hook.
 * 
 * Fetches user profile settings including custom difficulty configuration.
 * For full profile management, see useProfileSettings.ts
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
export interface ProfileSettings {
  custom_difficulty_name: string | null;
  custom_difficulty_color: string | null;
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("custom_difficulty_name, custom_difficulty_color")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as ProfileSettings | null;
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
}
