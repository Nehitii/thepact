/**
 * Hook for managing health check-in streaks.
 * Tracks consecutive check-in days and total check-ins.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";

export interface HealthStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  total_checkins: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch the user's health streak data
 */
export function useHealthStreak(userId: string | undefined) {
  return useQuery({
    queryKey: ["health-streak", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("health_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as HealthStreak | null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update the streak after a check-in is completed.
 * This should be called after successfully saving health data.
 */
export function useUpdateHealthStreak(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Get current streak data
      const { data: currentStreak, error: fetchError } = await supabase
        .from("health_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      let newCurrentStreak = 1;
      let newLongestStreak = 1;
      let newTotalCheckins = 1;
      
      if (currentStreak) {
        newTotalCheckins = currentStreak.total_checkins + 1;
        
        // Check if last check-in was yesterday (continue streak) or today (already counted)
        if (currentStreak.last_checkin_date) {
          const lastDate = parseISO(currentStreak.last_checkin_date);
          const daysDiff = differenceInDays(new Date(), lastDate);
          
          if (daysDiff === 0) {
            // Already checked in today, don't increment
            return currentStreak;
          } else if (daysDiff === 1) {
            // Consecutive day - increment streak
            newCurrentStreak = currentStreak.current_streak + 1;
          } else {
            // Streak broken - reset to 1
            newCurrentStreak = 1;
          }
        }
        
        newLongestStreak = Math.max(newCurrentStreak, currentStreak.longest_streak);
        
        // Update existing record
        const { data, error } = await supabase
          .from("health_streaks")
          .update({
            current_streak: newCurrentStreak,
            longest_streak: newLongestStreak,
            last_checkin_date: today,
            total_checkins: newTotalCheckins,
          })
          .eq("id", currentStreak.id)
          .select()
          .single();
        
        if (error) throw error;
        return data as HealthStreak;
      } else {
        // Create new streak record
        const { data, error } = await supabase
          .from("health_streaks")
          .insert({
            user_id: userId,
            current_streak: 1,
            longest_streak: 1,
            last_checkin_date: today,
            total_checkins: 1,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data as HealthStreak;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["health-streak", userId] });
      
      // Show milestone celebrations
      if (data.current_streak === 7) {
        toast.success("🔥 7-day streak! You're on fire!");
      } else if (data.current_streak === 30) {
        toast.success("🏆 30-day streak! Wellness Warrior!");
      } else if (data.current_streak === 100) {
        toast.success("👑 100-day streak! Legendary!");
      }
    },
    onError: (error) => {
      console.error("Failed to update streak:", error);
    },
  });
}

/**
 * Check if user has checked in today
 */
export function useHasCheckedInToday(userId: string | undefined) {
  const { data: streak } = useHealthStreak(userId);
  
  if (!streak?.last_checkin_date) return false;
  
  const today = format(new Date(), "yyyy-MM-dd");
  return streak.last_checkin_date === today;
}
