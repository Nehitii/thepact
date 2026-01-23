import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { SoundSettings } from "@/contexts/SoundContext";

const QUERY_KEY = (userId: string | undefined) => ["sound-settings", userId];

function mapRowToSettings(row: any): SoundSettings {
  return {
    masterEnabled: row?.sound_master_enabled ?? true,
    volume: Number(row?.sound_volume ?? 0.35),
    uiEnabled: row?.sound_ui_enabled ?? true,
    successEnabled: row?.sound_success_enabled ?? true,
    progressEnabled: row?.sound_progress_enabled ?? true,
  };
}

export function useSoundSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY(user?.id),
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "sound_master_enabled, sound_volume, sound_ui_enabled, sound_success_enabled, sound_progress_enabled"
        )
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return mapRowToSettings(data);
    },
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (next: SoundSettings) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          sound_master_enabled: next.masterEnabled,
          sound_volume: next.volume,
          sound_ui_enabled: next.uiEnabled,
          sound_success_enabled: next.successEnabled,
          sound_progress_enabled: next.progressEnabled,
        })
        .eq("id", user.id);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(QUERY_KEY(user?.id), next);
    },
  });

  return useMemo(
    () => ({
      settings: query.data,
      isLoading: query.isLoading,
      error: query.error,
      save: mutation.mutateAsync,
      isSaving: mutation.isPending,
      refetch: query.refetch,
    }),
    [mutation.isPending, mutation.mutateAsync, query.data, query.error, query.isLoading, query.refetch]
  );
}
