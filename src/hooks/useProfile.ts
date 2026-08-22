/**
 * Profile data hook.
 *
 * Fetches user profile settings including custom difficulty configuration,
 * display name, and avatar URL. Shared across sidebar and other components
 * to avoid duplicate queries.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileSettings {
  display_name: string | null;
  avatar_url: string | null;
  custom_difficulty_name: string | null;
  custom_difficulty_color: string | null;
  custom_difficulty_active: boolean | null;
  timezone: string | null;
  language: string | null;
  currency: string | null;
  birthday: string | null;
  country: string | null;
  goal_unlock_code: string | null;
  /* Le pacte actif choisi par l utilisateur. Il manquait a la fois de
     cette interface ET du select ci-dessous : ProtectedRoute le lisait
     donc a travers un « as any » sur un objet qui ne l a jamais porte,
     et la condition « pas encore choisi » etait toujours vraie. */
  active_pact_id: string | null;
  /* Les familles de questions du journal retenues. Null = jamais
     choisi, tableau vide = tout decoche : famillesRetenues() traite
     les deux comme « toutes ». */
  journal_prompt_families: string[] | null;
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, custom_difficulty_name, custom_difficulty_color, custom_difficulty_active, timezone, language, currency, birthday, country, goal_unlock_code, active_pact_id, journal_prompt_families")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as ProfileSettings | null;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}
