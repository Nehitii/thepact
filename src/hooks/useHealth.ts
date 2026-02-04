import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";

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
  height_cm: number | null;
  weight_kg: number | null;
  show_bmi: boolean;
  show_sleep: boolean;
  show_activity: boolean;
  show_stress: boolean;
  show_hydration: boolean;
  show_nutrition: boolean;
  sleep_goal_hours: number | null;
  hydration_goal_glasses: number | null;
  activity_goal_minutes: number | null;
  created_at: string;
  updated_at: string;
}

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
  activity_goal_minutes?: number | null;
}

// Calculate BMI from height (cm) and weight (kg)
export function calculateBMI(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

// Get BMI category (informational only)
export function getBMICategory(bmi: number | null): { label: string; color: string } {
  if (bmi === null) return { label: "Not calculated", color: "text-muted-foreground" };
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400" };
  if (bmi < 25) return { label: "Normal range", color: "text-green-400" };
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-400" };
  return { label: "Obese", color: "text-orange-400" };
}

// Hook: Fetch today's health data
export function useTodayHealth(userId: string | undefined) {
  return useQuery({
    queryKey: ["health-today", userId],
    queryFn: async () => {
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
    },
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

// Hook: Fetch this week's health data
export function useWeeklyHealth(userId: string | undefined) {
  return useQuery({
    queryKey: ["health-weekly", userId],
    queryFn: async () => {
      if (!userId) return [];
      const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("health_data")
        .select("*")
        .eq("user_id", userId)
        .gte("entry_date", start)
        .lte("entry_date", end)
        .order("entry_date", { ascending: true });
      
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
      queryClient.invalidateQueries({ queryKey: ["health-weekly", userId] });
      toast.success("Health data saved");
    },
    onError: (error) => {
      console.error("Failed to save health data:", error);
      toast.error("Failed to save health data");
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-settings", userId] });
      toast.success("Settings saved");
    },
    onError: (error) => {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    },
  });
}

// Hook: Calculate health score (trend-based, indicative)
export function useHealthScore(userId: string | undefined) {
  const { data: weeklyData } = useWeeklyHealth(userId);
  const { data: settings } = useHealthSettings(userId);
  
  // Calculate a simple composite score from 0-100
  const calculateScore = (): { score: number; trend: "up" | "down" | "stable"; factors: string[] } => {
    if (!weeklyData || weeklyData.length === 0) {
      return { score: 0, trend: "stable", factors: [] };
    }
    
    let totalScore = 0;
    let factorCount = 0;
    const factors: string[] = [];
    
    // Average sleep quality
    const sleepScores = weeklyData.filter(d => d.sleep_quality).map(d => d.sleep_quality!);
    if (sleepScores.length > 0) {
      const avgSleep = sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length;
      totalScore += (avgSleep / 5) * 100;
      factorCount++;
      if (avgSleep >= 4) factors.push("Good sleep quality");
      else if (avgSleep <= 2) factors.push("Sleep needs attention");
    }
    
    // Average activity level
    const activityScores = weeklyData.filter(d => d.activity_level).map(d => d.activity_level!);
    if (activityScores.length > 0) {
      const avgActivity = activityScores.reduce((a, b) => a + b, 0) / activityScores.length;
      totalScore += (avgActivity / 5) * 100;
      factorCount++;
      if (avgActivity >= 4) factors.push("Active lifestyle");
    }
    
    // Average stress (inverted - lower is better)
    const stressScores = weeklyData.filter(d => d.stress_level).map(d => d.stress_level!);
    if (stressScores.length > 0) {
      const avgStress = stressScores.reduce((a, b) => a + b, 0) / stressScores.length;
      totalScore += ((6 - avgStress) / 5) * 100; // Invert: 1 stress = 100%, 5 stress = 20%
      factorCount++;
      if (avgStress >= 4) factors.push("High stress detected");
      else if (avgStress <= 2) factors.push("Low stress");
    }
    
    // Hydration consistency
    const hydrationDays = weeklyData.filter(d => d.hydration_glasses && d.hydration_glasses >= (settings?.hydration_goal_glasses || 8));
    if (hydrationDays.length >= 5) {
      factors.push("Consistent hydration");
    }
    
    const finalScore = factorCount > 0 ? Math.round(totalScore / factorCount) : 0;
    
    // Determine trend (compare first half vs second half of week)
    let trend: "up" | "down" | "stable" = "stable";
    if (weeklyData.length >= 4) {
      const mid = Math.floor(weeklyData.length / 2);
      const firstHalf = weeklyData.slice(0, mid);
      const secondHalf = weeklyData.slice(mid);
      
      const firstAvg = firstHalf.reduce((sum, d) => sum + (d.sleep_quality || 3), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + (d.sleep_quality || 3), 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 0.5) trend = "up";
      else if (secondAvg < firstAvg - 0.5) trend = "down";
    }
    
    return { score: finalScore, trend, factors };
  };
  
  return calculateScore();
}
