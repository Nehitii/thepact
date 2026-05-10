import { useMemo } from "react";
import { Link2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DSPanel } from "@/components/ds";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface HabitStackPanelProps {
  goalId: string;
  pactId?: string;
  prerequisiteHabitId?: string | null;
}

/**
 * Habit stacking: lets the user pick another habit goal that must be
 * completed the same day before this one can be logged.
 */
export function HabitStackPanel({ goalId, pactId, prerequisiteHabitId }: HabitStackPanelProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: candidates = [] } = useQuery({
    queryKey: ["habit-stack-candidates", user?.id, pactId],
    queryFn: async () => {
      if (!user?.id) return [];
      let q = (supabase as any)
        .from("goals")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("goal_type", "habit")
        .neq("id", goalId);
      if (pactId) q = q.eq("pact_id", pactId);
      const { data, error } = await q.order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as { id: string; name: string }[];
    },
    enabled: !!user?.id,
  });

  const setPrereq = useMutation({
    mutationFn: async (value: string | null) => {
      const { error } = await (supabase as any)
        .from("goals")
        .update({ prerequisite_habit_id: value })
        .eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goal-detail", goalId] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Habit stack updated" });
    },
    onError: (e: any) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const value = prerequisiteHabitId || "none";
  const currentName = useMemo(
    () => candidates.find((c) => c.id === prerequisiteHabitId)?.name,
    [candidates, prerequisiteHabitId]
  );

  return (
    <DSPanel
      title="Habit Stack"
      id="HBT.STK"
      accent="primary"
      headerAction={
        <Link2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
      }
    >
      <p className="text-xs text-muted-foreground mb-3">
        Chain this habit to another. The trigger habit must be completed (or frozen)
        the same day before this one can be logged.
      </p>
      <Select
        value={value}
        onValueChange={(v) => setPrereq.mutate(v === "none" ? null : v)}
      >
        <SelectTrigger className="bg-white/5 border-white/10">
          <SelectValue placeholder="No prerequisite" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No prerequisite</SelectItem>
          {candidates.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentName && (
        <p className="mt-2 text-[11px] font-mono text-muted-foreground">
          Trigger: <span className="text-foreground">{currentName}</span>
        </p>
      )}
    </DSPanel>
  );
}