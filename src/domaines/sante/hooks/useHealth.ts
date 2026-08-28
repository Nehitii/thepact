import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import i18next from "i18next";
import type { UniteHydratation } from "@/domaines/sante/logique/hydratation";

export interface HealthData {
  id: string;
  user_id: string;
  entry_date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  wake_energy: number | null;
  activity_level: number | null;
  movement_minutes: number | null;
  stress_level: number | null;
  mental_load: number | null;
  hydration_glasses: number | null;
  meal_balance: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthSettings {
  id: string;
  user_id: string;
  /* CE QUI AGIT. */
  height_cm: number | null;
  weight_kg: number | null;
  /* Ouvre ou ferme l etape nutrition du releve. */
  show_nutrition: boolean;
  hydration_goal_glasses: number | null;

  /* CE QUI NE COMMANDE PLUS RIEN.

     Les six suivantes ont perdu leur consommateur avec la refonte du
     module : les interrupteurs « afficher les metriques » pilotaient
     les cartes d un tableau de bord qui n existe plus, et le choix
     entre aujourd hui et hier a disparu quand le releve est passe a la
     veille. Le panneau de reglages a ete nettoye en consequence ;
     elles restent en base avec leurs valeurs.

     Elles sont declarees ici parce que la ligne les rend, pas parce
     qu elles sont reglables. Ne pas les recabler sans verifier qu il
     existe encore quelque chose a commander. */
  show_bmi: boolean;
  show_sleep: boolean;
  show_activity: boolean;
  show_stress: boolean;
  show_hydration: boolean;
  sleep_goal_hours: number | null;
  /* L unite d AFFICHAGE. Le stockage reste en verres — voir
     `lib/hydratation.ts` pour pourquoi. */
  hydration_unit: UniteHydratation;
  activity_goal_minutes: number | null;
  checkin_mode: "today" | "yesterday";
  created_at: string;
  updated_at: string;
}

/**
 * CE QUE LE RELEVE PEUT ECRIRE.
 *
 * Ce type ignorait mood_level et les trois energy_*, alors que le
 * formulaire les enregistre depuis toujours. Pour les faire passer, les
 * appelants transtypaient en Record<string, unknown> — et un objet a
 * signature d index fait echouer RejectExcessProperties de Supabase,
 * qui ne peut plus prouver l absence de proprietes en trop. D ou les
 * erreurs TS2345 que l on retrouve ailleurs dans le projet.
 *
 * Le trou etait dans le type, pas dans l appel : on le comble, et le
 * transtypage disparait de lui-meme.
 */
export interface HealthDataInput {
  entry_date?: string;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  wake_energy?: number | null;
  activity_level?: number | null;
  movement_minutes?: number | null;
  stress_level?: number | null;
  mental_load?: number | null;
  hydration_glasses?: number | null;
  meal_balance?: number | null;
  mood_level?: number | null;
  energy_morning?: number | null;
  energy_afternoon?: number | null;
  energy_evening?: number | null;
  notes?: string | null;
}

export interface HealthSettingsInput {
  height_cm?: number | null;
  weight_kg?: number | null;
  show_bmi?: boolean;
  show_sleep?: boolean;
  show_activity?: boolean;
  show_stress?: boolean;
  show_hydration?: boolean;
  show_nutrition?: boolean;
  sleep_goal_hours?: number | null;
  hydration_goal_glasses?: number | null;
  hydration_unit?: UniteHydratation;
  activity_goal_minutes?: number | null;
  checkin_mode?: "today" | "yesterday";
}

// Hook: Fetch health data by specific date
export function useHealthByDate(userId: string | undefined, date: string) {
  return useQuery({
    queryKey: ["health-date", userId, date],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("health_data")
        .select("*")
        .eq("user_id", userId)
        .eq("entry_date", date)
        .maybeSingle();
      if (error) throw error;
      return data as HealthData | null;
    },
    enabled: !!userId && !!date,
  });
}

// Reusable fetcher — used by useTodayHealth and by background prefetch.
export async function fetchTodayHealth(userId: string | undefined): Promise<HealthData | null> {
  if (!userId) return null;
  const today = format(new Date(), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("health_data")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", today)
    .maybeSingle();
  if (error) throw error;
  return data as HealthData | null;
}

// Hook: Fetch today's health data
export function useTodayHealth(userId: string | undefined) {
  return useQuery({
    queryKey: ["health-today", userId],
    queryFn: () => fetchTodayHealth(userId),
    enabled: !!userId,
  });
}

// Hook: Fetch health data for a date range
export function useHealthHistory(userId: string | undefined, days: number = 7) {
  return useQuery({
    queryKey: ["health-history", userId, days],
    queryFn: async () => {
      if (!userId) return [];
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("health_data")
        .select("*")
        .eq("user_id", userId)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate)
        .order("entry_date", { ascending: false });
      
      if (error) throw error;
      return (data || []) as HealthData[];
    },
    enabled: !!userId,
  });
}

// Hook: Fetch health settings
export function useHealthSettings(userId: string | undefined) {
  return useQuery({
    queryKey: ["health-settings", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("health_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as HealthSettings | null;
    },
    enabled: !!userId,
  });
}

// Hook: Upsert today's health data
export function useUpsertHealthData(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: HealthDataInput) => {
      if (!userId) throw new Error("Not authenticated");
      
      const entryDate = input.entry_date || format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("health_data")
        .upsert({
          user_id: userId,
          entry_date: entryDate,
          ...input,
        }, {
          onConflict: "user_id,entry_date",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as HealthData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-today", userId] });
      queryClient.invalidateQueries({ queryKey: ["health-history", userId] });
      /* Voir useTheCall : le pouls de la barre systeme compte ce geste. */
      queryClient.invalidateQueries({ queryKey: ["pouls-du-jour"] });
      toast.success(i18next.t("health.checkin.saved", "Relevé enregistré"));
    },
    onError: (error) => {
      console.error("Failed to save health data:", error);
      toast.error(i18next.t("health.checkin.saveError", "Le relevé n’a pas pu être enregistré"));
    },
  });
}

// Hook: Upsert health settings
export function useUpsertHealthSettings(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: HealthSettingsInput) => {
      if (!userId) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("health_settings")
        .upsert({
          user_id: userId,
          ...input,
        }, {
          onConflict: "user_id",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as HealthSettings;
    },
    /* PAS DE BULLE SUR LE SUCCES.

       Elle disait « Settings saved », en anglais, et surgissait a
       chaque geste — un interrupteur, un cran de curseur. La console
       signale autrement : une ligne de journal en pied de panneau,
       qui dit CE QUI a change au lieu de repeter que quelque chose a
       change. Les bulles restent pour les echecs. */
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-settings", userId] });
    },
    onError: (error) => {
      console.error("Failed to save settings:", error);
      toast.error(i18next.t("common.error", "Erreur"), {
        description: i18next.t("settings.health.saveError", "Le réglage n’a pas pu être enregistré."),
      });
    },
  });
}
