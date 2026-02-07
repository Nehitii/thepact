import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type DeadlineType = '24h' | '48h' | '72h' | '1week' | '1month';

export interface ActiveMission {
  id: string;
  user_id: string;
  goal_id: string;
  step_id: string | null;
  step_title: string;
  deadline_type: DeadlineType;
  expires_at: string;
  created_at: string;
  // Joined data
  goal_name?: string;
}

/**
 * Hook to manage the persistent Active Mission system.
 * Ensures only one mission is active at a time per user.
 */
export function useActiveMission() {
  const { user } = useAuth();
  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active mission on mount
  const fetchActiveMission = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('active_missions')
        .select(`
          *,
          goals:goal_id (name)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setActiveMission({
          id: data.id,
          user_id: data.user_id,
          goal_id: data.goal_id,
          step_id: data.step_id,
          step_title: data.step_title,
          deadline_type: data.deadline_type as DeadlineType,
          expires_at: data.expires_at,
          created_at: data.created_at,
          goal_name: (data.goals as any)?.name || 'Unknown Goal',
        });
      } else {
        setActiveMission(null);
      }
    } catch (err) {
      console.error('Error fetching active mission:', err);
      setActiveMission(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchActiveMission();
  }, [fetchActiveMission]);

  // Calculate expiration timestamp from deadline type
  const calculateExpiration = (deadline: DeadlineType): Date => {
    const now = new Date();
    switch (deadline) {
      case '24h':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '48h':
        return new Date(now.getTime() + 48 * 60 * 60 * 1000);
      case '72h':
        return new Date(now.getTime() + 72 * 60 * 60 * 1000);
      case '1week':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '1month':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  };

  // Create a new active mission
  const focusMission = async (
    goalId: string,
    goalName: string,
    stepId: string | null,
    stepTitle: string,
    deadline: DeadlineType
  ): Promise<boolean> => {
    if (!user?.id) {
      toast.error('You must be logged in');
      return false;
    }

    const expiresAt = calculateExpiration(deadline);

    try {
      const { data, error } = await supabase
        .from('active_missions')
        .insert({
          user_id: user.id,
          goal_id: goalId,
          step_id: stepId,
          step_title: stepTitle,
          deadline_type: deadline,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setActiveMission({
        id: data.id,
        user_id: data.user_id,
        goal_id: data.goal_id,
        step_id: data.step_id,
        step_title: data.step_title,
        deadline_type: data.deadline_type as DeadlineType,
        expires_at: data.expires_at,
        created_at: data.created_at,
        goal_name: goalName,
      });

      toast.success('Mission locked in! 🎯');
      return true;
    } catch (err: any) {
      console.error('Error focusing mission:', err);
      if (err.code === '23505') {
        toast.error('You already have an active mission');
      } else {
        toast.error('Failed to focus mission');
      }
      return false;
    }
  };

  // Abandon the active mission
  const abandonMission = async (): Promise<boolean> => {
    if (!user?.id || !activeMission) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('active_missions')
        .delete()
        .eq('id', activeMission.id);

      if (error) throw error;

      setActiveMission(null);
      toast.success('Mission abandoned. Ready for a new one!');
      return true;
    } catch (err) {
      console.error('Error abandoning mission:', err);
      toast.error('Failed to abandon mission');
      return false;
    }
  };

  // Complete the mission step
  const completeMissionStep = async (): Promise<boolean> => {
    if (!activeMission?.step_id) {
      toast.error('No step to complete');
      return false;
    }

    try {
      const { error } = await supabase
        .from('steps')
        .update({ 
          status: 'completed', 
          completion_date: new Date().toISOString() 
        })
        .eq('id', activeMission.step_id);

      if (error) throw error;

      // Delete the mission after completing
      await supabase
        .from('active_missions')
        .delete()
        .eq('id', activeMission.id);

      setActiveMission(null);
      toast.success('Mission complete! +XP earned 🎉');
      return true;
    } catch (err) {
      console.error('Error completing mission step:', err);
      toast.error('Failed to complete step');
      return false;
    }
  };

  return {
    activeMission,
    isLoading,
    hasMission: !!activeMission,
    focusMission,
    abandonMission,
    completeMissionStep,
    refetch: fetchActiveMission,
  };
}
