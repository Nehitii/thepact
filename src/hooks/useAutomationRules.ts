import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AutomationTriggerType =
  | "streak_broken"
  | "goal_overdue"
  | "budget_exceeded"
  | "low_focus_week"
  | "daily_schedule";

export type AutomationActionType =
  | "send_notification"
  | "coach_insight"
  | "grant_bonds";

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_type: AutomationTriggerType;
  trigger_config: Record<string, unknown>;
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  is_active: boolean;
  last_run_at: string | null;
  last_status: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export type AutomationRuleInput = Omit<
  AutomationRule,
  "id" | "user_id" | "last_run_at" | "last_status" | "run_count" | "created_at" | "updated_at"
>;

export function useAutomationRules() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["automation-rules", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_automation_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AutomationRule[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<AutomationRule> & { id?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const payload = { ...input, user_id: user.id };
      const { data, error } = await (supabase as any)
        .from("user_automation_rules")
        .upsert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data as AutomationRule;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-rules", user?.id] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("user_automation_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-rules", user?.id] }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("user_automation_rules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-rules", user?.id] }),
  });

  return { rules: list.data ?? [], isLoading: list.isLoading, upsert, remove, toggle };
}