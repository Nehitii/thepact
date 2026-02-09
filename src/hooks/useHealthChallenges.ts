/**
 * Hook for managing weekly health challenges.
 * Provides gamified wellness targets with Bond rewards.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format, addDays, startOfWeek } from "date-fns";
import { toast } from "sonner";

export interface HealthChallenge {
  id: string;
  user_id: string;
  challenge_type: "sleep" | "stress" | "hydration" | "activity" | "mood";
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  target_days: number;
  start_date: string;
  end_date: string;
  completed: boolean;
  completed_at: string | null;
  bond_reward: number;
  created_at: string;
  updated_at: string;
}

export type ChallengeType = HealthChallenge["challenge_type"];

interface CreateChallengeInput {
  challenge_type: ChallengeType;
  title: string;
  description?: string;
  target_value: number;
  target_days?: number;
  bond_reward?: number;
}

// Predefined challenge templates
export const CHALLENGE_TEMPLATES: Omit<CreateChallengeInput, "target_days">[] = [
  {
    challenge_type: "sleep",
    title: "Sleep Champion",
    description: "Get 8+ hours of sleep",
    target_value: 8,
    bond_reward: 15,
  },
  {
    challenge_type: "hydration",
    title: "Hydration Hero",
    description: "Drink 8+ glasses of water daily",
    target_value: 8,
    bond_reward: 10,
  },
  {
    challenge_type: "stress",
    title: "Stress Master",
    description: "Keep stress level at 2 or below",
    target_value: 2,
    bond_reward: 15,
  },
  {
    challenge_type: "activity",
    title: "Active Warrior",
    description: "Stay at activity level 4+",
    target_value: 4,
    bond_reward: 12,
  },
  {
    challenge_type: "mood",
    title: "Positive Mindset",
    description: "Maintain mood level 4+",
    target_value: 4,
    bond_reward: 10,
  },
];

/**
 * Fetch user's active and recent challenges
 */
export function useHealthChallenges(userId: string | undefined) {
  return useQuery({
    queryKey: ["health-challenges", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("health_challenges")
        .select("*")
        .eq("user_id", userId)
        .gte("end_date", today)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as HealthChallenge[];
    },
    enabled: !!userId,
  });
}

/**
 * Fetch all challenges including completed ones
 */
export function useHealthChallengeHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ["health-challenges-history", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("health_challenges")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return (data || []) as HealthChallenge[];
    },
    enabled: !!userId,
  });
}

/**
 * Create a new challenge
 */
export function useCreateChallenge(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateChallengeInput) => {
      if (!userId) throw new Error("Not authenticated");
      
      const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const targetDays = input.target_days || 7;
      const endDate = format(addDays(new Date(startDate), targetDays - 1), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("health_challenges")
        .insert({
          user_id: userId,
          challenge_type: input.challenge_type,
          title: input.title,
          description: input.description,
          target_value: input.target_value,
          target_days: targetDays,
          start_date: startDate,
          end_date: endDate,
          bond_reward: input.bond_reward || 10,
          current_value: 0,
          completed: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as HealthChallenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-challenges", userId] });
      toast.success("Challenge started! 💪");
    },
    onError: (error) => {
      console.error("Failed to create challenge:", error);
      toast.error("Failed to create challenge");
    },
  });
}

/**
 * Update challenge progress
 */
export function useUpdateChallengeProgress(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ challengeId, increment }: { challengeId: string; increment: number }) => {
      if (!userId) throw new Error("Not authenticated");
      
      // Get current challenge
      const { data: challenge, error: fetchError } = await supabase
        .from("health_challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!challenge) throw new Error("Challenge not found");
      
      const newValue = challenge.current_value + increment;
      const isCompleted = newValue >= challenge.target_days;
      
      const { data, error } = await supabase
        .from("health_challenges")
        .update({
          current_value: newValue,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq("id", challengeId)
        .select()
        .single();
      
      if (error) throw error;
      return data as HealthChallenge;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["health-challenges", userId] });
      
      if (data.completed) {
        toast.success(`🎉 Challenge completed! +${data.bond_reward} Bonds`);
        // TODO: Award bonds to user
      }
    },
    onError: (error) => {
      console.error("Failed to update challenge:", error);
    },
  });
}

/**
 * Delete a challenge
 */
export function useDeleteChallenge(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (challengeId: string) => {
      if (!userId) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("health_challenges")
        .delete()
        .eq("id", challengeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-challenges", userId] });
      toast.success("Challenge removed");
    },
    onError: (error) => {
      console.error("Failed to delete challenge:", error);
      toast.error("Failed to delete challenge");
    },
  });
}

/**
 * Generate a random challenge for the user
 */
export function getRandomChallengeTemplate(): CreateChallengeInput {
  const template = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
  return {
    ...template,
    target_days: 7, // Weekly by default
  };
}
