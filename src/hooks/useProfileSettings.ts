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
  accent_color: string;
  font_size: number;

  community_profile_discoverable: boolean;
  show_activity_status: boolean;
  share_goals_progress: boolean;
  share_achievements: boolean;
  community_updates_enabled: boolean;
  achievement_celebrations_enabled: boolean;
};

const PROFILE_SETTINGS_SELECT =
  "id, theme_preference, reduce_motion, particles_enabled, particles_intensity, accent_color, font_size, community_profile_discoverable, show_activity_status, share_goals_progress, share_achievements, community_updates_enabled, achievement_celebrations_enabled";

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

  const CLE = ["profile-settings", user?.id] as const;

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<ProfileSettings>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", user.id);

      if (error) throw error;
    },

    /* LE CACHE PREND LA VALEUR AVANT LE RESEAU.
       Sans cela, `profile` gardait l ancienne valeur pendant tout
       l aller-retour, et deux ecrans s en trouvaient faux :

       — LE THEME CLIGNOTAIT. `setTheme(v)` applique tout de suite,
         puis `ProfilePreferencesSync` relit `theme_preference`, y
         trouve encore l ancien, et remet le theme precedent. Mesure
         sur un clic « Clair » : light a 5 566 ms, dark a 5 621, light
         a 5 694 — 128 ms de theme faux, bien visibles.

       — LES GLISSIERES REVENAIENT EN ARRIERE. `onValueCommit` remet
         l etat local a `null` pour rendre la main a la source ; la
         source etant en retard, la poignee sautait a l ancienne
         position avant de repartir a la bonne. */
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: CLE });
      const precedent = queryClient.getQueryData(CLE);
      queryClient.setQueryData(CLE, (ancien: ProfileSettings | null | undefined) =>
        ancien ? { ...ancien, ...updates } : ancien,
      );
      return { precedent };
    },

    onError: (_e, _updates, contexte) => {
      /* L ecriture a echoue : on rend au cache ce qu il portait, sinon
         l ecran affiche un reglage qui n existe pas en base. */
      const c = contexte as { precedent?: unknown } | undefined;
      if (c && "precedent" in c) queryClient.setQueryData(CLE, c.precedent);
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
