/**
 * Goal detail mutation actions hook.
 *
 * All writes go through React Query mutations with optimistic updates on the
 * ["goal-detail", goalId] cache. The hook reads current goal/steps/costItems
 * from the cache via getQueryData — no local state duplication.
 */
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { synchroniserGroupes } from "@/lib/superGoals";
import { PLAFOND_BRIGADE, recrutable } from "@/lib/brigade";
import { trackStepCompleted, trackGoalCompleted, resynchroniserCompteurs } from "@/lib/achievements";
import { toast } from "sonner";
import type { GoalDetailData, StatutObjectif, StepData } from "@/hooks/useGoalDetail";

interface CostItem {
  id: string;
  name: string;
  price: number;
  category: string | null;
  step_id: string | null;
}

interface DetailCache {
  goal: GoalDetailData;
  steps: StepData[];
}

interface Options {
  goalId: string | undefined;
  userId: string | undefined;
  getDifficultyColor: (d: string) => string;
  triggerParticles: (x: number, y: number, color: string) => void;
}

export function useGoalDetailActions({ goalId, userId, getDifficultyColor, triggerParticles }: Options) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const detailKey = ["goal-detail", goalId] as const;
  const costKey = ["cost-items", goalId] as const;

  const getDetail = () => qc.getQueryData<DetailCache>(detailKey) ?? null;
  const getCostItems = () => qc.getQueryData<CostItem[]>(costKey) ?? [];

  /* Un groupe n a ni etape ni jour a cocher : son avancement est
     celui de ses membres, et le declencheur qui derive le statut en
     base lit des compteurs que rien ne renseignait pour lui. Tout
     geste qui franchit, defait ou deplace un objectif peut changer le
     compte d un groupe — y compris la mise en avant, dont une regle
     de groupe automatique peut dependre. On les remet d accord avant
     de rafraichir les listes. */
  const repercuterSurGroupes = async () => {
    const pactId = getDetail()?.goal.pact_id;
    if (pactId) await synchroniserGroupes(pactId);
  };

  /* L eclat partait du centre de la fenetre, quel que soit le geste.
     Sur une grille de cent quatre-vingts jours ou chaque case fait
     quelques pixels, une gerbe au milieu de l ecran n a aucun rapport
     avec ce qu on vient de cocher : elle se lit comme un evenement de
     la page, pas comme la reponse a un clic. Elle part desormais de
     l element touche quand on sait lequel c est. */
  const burstParticles = (color: string, depuis?: Element | null) => {
    const r = depuis?.getBoundingClientRect();
    triggerParticles(
      r ? r.left + r.width / 2 : window.innerWidth / 2,
      r ? r.top + r.height / 2 : window.innerHeight / 2,
      color,
    );
  };

  // ---------- Toggle Step ----------
  const toggleStep = useMutation({
    mutationFn: async ({ stepId, currentStatus }: { stepId: string; currentStatus: string }) => {
      const detail = getDetail();
      if (!detail) throw new Error("Goal not loaded");
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      const validatedAt = newStatus === "completed" ? new Date().toISOString() : null;

      const { error } = await supabase
        .from("steps")
        .update({ status: newStatus, validated_at: validatedAt })
        .eq("id", stepId);
      if (error) throw error;

      /* Le compte ignore l etape ultime — y compris quand c est elle
         qu on vient de cocher : elle ouvre le zenith, elle ne fait pas
         avancer l objectif. */
      const newValidatedCount = detail.steps
        .filter((s) => !s.is_ultimate)
        .filter((s) => (s.id === stepId ? newStatus : s.status) === "completed").length;
      const { error: goalErr } = await supabase
        .from("goals")
        .update({ validated_steps: newValidatedCount })
        .eq("id", detail.goal.id);
      if (goalErr) throw goalErr;

      // Auto-sync wishlist items linked via cost items
      const linked = getCostItems().filter((ci) => ci.step_id === stepId);
      if (linked.length > 0) {
        const isAcquired = newStatus === "completed";
        await Promise.all(
          linked.map((ci) =>
            supabase
              .from("wishlist_items")
              .update({ acquired: isAcquired, acquired_at: isAcquired ? new Date().toISOString() : null })
              .eq("source_goal_cost_id", ci.id),
          ),
        );
      }

      return { newStatus, newValidatedCount };
    },
    onMutate: async ({ stepId, currentStatus }) => {
      await qc.cancelQueries({ queryKey: detailKey });
      const snapshot = qc.getQueryData<DetailCache>(detailKey);
      if (snapshot) {
        const newStatus = currentStatus === "completed" ? "pending" : "completed";
        const newSteps = snapshot.steps.map((s) => (s.id === stepId ? { ...s, status: newStatus } : s));
        const validated = newSteps.filter((s) => s.status === "completed").length;
        qc.setQueryData<DetailCache>(detailKey, {
          goal: { ...snapshot.goal, validated_steps: validated },
          steps: newSteps,
        });
      }
      return { snapshot };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(detailKey, ctx.snapshot);
      toast.error("Error", { description: err?.message ?? "Failed to update step" });
    },
    onSettled: async () => {
      await repercuterSurGroupes();
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: detailKey });
      qc.invalidateQueries({ queryKey: ["pact-wishlist"] });
    },
  });

  const handleToggleStep = (stepId: string, currentStatus: string) => {
    const detail = getDetail();
    if (!detail) return;
    if (currentStatus !== "completed") {
      burstParticles(getDifficultyColor(detail.goal.difficulty ?? "medium"));
    }
    toggleStep.mutate(
      { stepId, currentStatus },
      {
        onSuccess: ({ newStatus }) => {
          if (newStatus === "completed" && userId) {
            setTimeout(() => trackStepCompleted(userId), 0);
            toast.success("Step Completed", {
              description: "You're making progress!",
              action: {
                label: "Undo",
                onClick: () => toggleStep.mutate({ stepId, currentStatus: "completed" }),
              },
            });
          } else if (userId) {
            /* Decocher fait retomber les compteurs. Ils se lisent sur
               les etapes et les objectifs, pas sur le nombre de fois
               qu on les a coches : c est la seule facon qu un objectif
               ne vaille qu une fois, quoi qu on fasse ensuite. */
            setTimeout(() => resynchroniserCompteurs(userId), 0);
          }
        },
      },
    );
  };

  // ---------- Toggle Habit Check ----------
  /* UNE BASCULE NE SE DEDUIT PAS DU CACHE QU ELLE VIENT DE CHANGER.
   *
   * onMutate s execute avant mutationFn : le cache est deja bascule
   * quand la mutation le relit. Elle rebasculait donc, et ecrivait en
   * base exactement l ancienne valeur — puis l invalidation ramenait
   * cette valeur a l ecran. Cocher un jour l allumait puis l eteignait
   * aussitot, et la base n avait jamais rien enregistre d autre que
   * « faux ». Mesure faite avant correction : apres un clic sur le
   * jour 1, habit_checks[1] valait toujours false, mais updated_at
   * venait d etre reecrit — l ecriture avait bien eu lieu, a l envers.
   *
   * La valeur voulue est donc calculee la ou le geste a lieu, avant
   * toute mutation, et transmise. La mutation la pose telle quelle au
   * lieu de la deduire : elle devient idempotente, et l ordre
   * d execution de React Query cesse d avoir la moindre importance.
   * C est ce que fait deja la bascule d etape, qui recoit son
   * « currentStatus » du clic — et c est pourquoi elle, marchait. */
  const toggleHabit = useMutation({
    mutationFn: async ({ dayIndex, coche }: { dayIndex: number; coche: boolean }) => {
      const detail = getDetail();
      if (!detail || !detail.goal.habit_checks) throw new Error("Habit not loaded");
      const newChecks = [...detail.goal.habit_checks];
      newChecks[dayIndex] = coche;
      const completedCount = newChecks.filter(Boolean).length;
      const isNowComplete = completedCount === detail.goal.habit_duration_days;
      const newStatus = isNowComplete ? "fully_completed" : completedCount > 0 ? "in_progress" : "not_started";
      const { error } = await supabase
        .from("goals")
        .update({
          habit_checks: newChecks,
          validated_steps: completedCount,
          status: newStatus,
          completion_date: isNowComplete ? new Date().toISOString() : null,
        })
        .eq("id", detail.goal.id);
      if (error) throw error;
      return { newChecks, completedCount, isNowComplete, dayIndex };
    },
    onMutate: async ({ dayIndex, coche }) => {
      await qc.cancelQueries({ queryKey: detailKey });
      const snapshot = qc.getQueryData<DetailCache>(detailKey);
      if (snapshot?.goal.habit_checks) {
        const newChecks = [...snapshot.goal.habit_checks];
        newChecks[dayIndex] = coche;
        const completedCount = newChecks.filter(Boolean).length;
        const isNowComplete = completedCount === snapshot.goal.habit_duration_days;
        qc.setQueryData<DetailCache>(detailKey, {
          ...snapshot,
          goal: {
            ...snapshot.goal,
            habit_checks: newChecks,
            validated_steps: completedCount,
            status: isNowComplete ? "fully_completed" : completedCount > 0 ? "in_progress" : "not_started",
          },
        });
      }
      return { snapshot };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(detailKey, ctx.snapshot);
      toast.error("Error", { description: err?.message ?? "Failed to update habit" });
    },
    onSettled: async () => {
      await repercuterSurGroupes();
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: detailKey });
    },
  });

  /* La valeur voulue se lit ici, avant toute mutation : c est le seul
     endroit ou le cache dit encore ce qui est a l ecran. L element
     touche sert d origine a l eclat. */
  const handleToggleHabitCheck = (dayIndex: number, depuis?: Element | null) => {
    const detail = getDetail();
    if (!detail || !detail.goal.habit_checks || !userId) return;
    const coche = !detail.goal.habit_checks[dayIndex];
    if (coche) burstParticles(getDifficultyColor(detail.goal.difficulty ?? "medium"), depuis);
    toggleHabit.mutate(
      { dayIndex, coche },
      {
        onSuccess: ({ completedCount, isNowComplete, newChecks }) => {
          if (newChecks[dayIndex] && userId) {
            setTimeout(() => trackStepCompleted(userId), 0);
            toast.success(`Day ${dayIndex + 1} Complete!`, {
              description: isNowComplete
                ? "Congratulations! Habit completed!"
                : `${completedCount}/${detail.goal.habit_duration_days} days done`,
              action: {
                label: "Undo",
                onClick: () => toggleHabit.mutate({ dayIndex, coche: false }),
              },
            });
          } else if (userId) {
            /* Decocher un jour peut faire retomber l habitude de
               « franchie » a « engagee » : le compte d objectifs suit. */
            setTimeout(() => resynchroniserCompteurs(userId), 0);
          }
        },
      },
    );
  };

  // ---------- Fully Complete ----------
  const fullyComplete = useMutation({
    mutationFn: async () => {
      const detail = getDetail();
      if (!detail || !userId) throw new Error("Goal not loaded");
      if (detail.goal.status === "fully_completed") return { skipped: true, goal: detail.goal };

      /* « Tout completer » honore l objectif ; il ne donne pas le
         zenith au passage. L etape ultime reste a faire. */
      const { data: stepsData } = await supabase
        .from("steps")
        .select("id")
        .eq("goal_id", detail.goal.id)
        .eq("is_ultimate", false);
      if (!stepsData) throw new Error("Failed to load steps");

      const now = new Date().toISOString();
      await Promise.all(
        stepsData.map((step) =>
          supabase
            .from("steps")
            .update({ status: "completed", validated_at: now, completion_date: now })
            .eq("id", step.id),
        ),
      );

      const { error: goalError } = await supabase
        .from("goals")
        .update({ validated_steps: detail.goal.total_steps, status: "fully_completed", completion_date: now })
        .eq("id", detail.goal.id);
      if (goalError) throw goalError;

      return { skipped: false, goal: detail.goal };
    },
    onSuccess: ({ skipped, goal }) => {
      if (skipped) {
        toast.success("Already Completed", { description: "This goal is already fully completed." });
        return;
      }
      if (userId) {
        setTimeout(
          () => trackGoalCompleted(userId, goal.difficulty ?? "medium", goal.start_date || new Date().toISOString(), new Date().toISOString()),
          0,
        );
      }
      toast.success("Goal Completed! 🎉", { description: "All steps have been marked as complete" });
    },
    onError: (err) => toast.error("Error", { description: err?.message ?? "Failed to complete goal" }),
    onSettled: async () => {
      await repercuterSurGroupes();
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: detailKey });
    },
  });

  // ---------- Status changes (pause/resume/archive) ----------
  const updateStatus = useMutation({
    mutationFn: async (newStatus: StatutObjectif) => {
      const detail = getDetail();
      if (!detail) throw new Error("Goal not loaded");
      const { error } = await supabase.from("goals").update({ status: newStatus }).eq("id", detail.goal.id);
      if (error) throw error;
      return newStatus;
    },
    onMutate: async (newStatus) => {
      await qc.cancelQueries({ queryKey: detailKey });
      const snapshot = qc.getQueryData<DetailCache>(detailKey);
      if (snapshot) {
        qc.setQueryData<DetailCache>(detailKey, { ...snapshot, goal: { ...snapshot.goal, status: newStatus } });
      }
      return { snapshot };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(detailKey, ctx.snapshot);
      toast.error("Error", { description: err?.message ?? "Failed to update status" });
    },
    onSettled: async () => {
      await repercuterSurGroupes();
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: detailKey });
    },
  });

  const handlePauseGoal = () => {
    const detail = getDetail();
    const previousStatus = detail?.goal.status;
    updateStatus.mutate("paused", {
      onSuccess: () =>
        toast.success("Goal Paused", {
          description: "This goal has been paused.",
          action: previousStatus
            ? { label: "Undo", onClick: () => updateStatus.mutate(previousStatus) }
            : undefined,
        }),
    });
  };

  const handleResumeGoal = () => {
    const detail = getDetail();
    if (!detail) return;
    const previousStatus = detail.goal.status;
    const newStatus = (detail.goal.validated_steps ?? 0) > 0 ? "in_progress" : "not_started";
    updateStatus.mutate(newStatus, {
      onSuccess: () =>
        toast.success("Goal Resumed", {
          description: "This goal is now active again.",
          action: {
            label: "Undo",
            onClick: () => updateStatus.mutate(previousStatus ?? "not_started"),
          },
        }),
    });
  };

  const handleArchiveGoal = () => {
    const detail = getDetail();
    const previousStatus = detail?.goal.status;
    updateStatus.mutate("archived", {
      onSuccess: () =>
        toast.success("Goal Archived", {
          description: "This goal has been archived.",
          action: previousStatus
            ? { label: "Undo", onClick: () => updateStatus.mutate(previousStatus) }
            : undefined,
        }),
    });
  };

  // ---------- Duplicate ----------
  const duplicateGoal = useMutation({
    mutationFn: async (goalTagsData: { tag: string }[]) => {
      const detail = getDetail();
      if (!detail || !userId) throw new Error("Not ready");
      const goal = detail.goal;
      const steps = detail.steps;
      const costItems = getCostItems();

      const { data: pactResult } = await supabase.from("pacts").select("id").eq("user_id", userId).single();
      if (!pactResult) throw new Error("No pact found");

      const { data: newGoal, error: goalError } = await supabase
        .from("goals")
        .insert({
          pact_id: pactResult.id,
          name: `${goal.name} (Copy)`,
          type: goal.type,
          difficulty: goal.difficulty,
          estimated_cost: goal.estimated_cost,
          notes: goal.notes,
          total_steps: goal.total_steps,
          potential_score: goal.potential_score,
          start_date: new Date().toISOString(),
          status: "not_started",
          goal_type: goal.goal_type || "normal",
          habit_duration_days: goal.habit_duration_days,
          habit_checks: goal.goal_type === "habit" ? Array(goal.habit_duration_days || 7).fill(false) : null,
          image_url: goal.image_url,
          deadline: null,
        })
        .select()
        .single();
      if (goalError) throw goalError;

      if (goalTagsData.length > 0) {
        const { insertGoalTags } = await import("@/hooks/useGoalTags");
        await insertGoalTags(newGoal.id, goalTagsData.map((t) => t.tag));
      }

      if (goal.goal_type !== "habit" && goal.goal_type !== "super" && steps.length > 0) {
        await supabase.from("steps").insert(
          steps.map((s, i) => ({
            goal_id: newGoal.id,
            title: s.title,
            order: i + 1,
            status: "pending" as const,
            description: "",
            notes: s.notes || "",
          })),
        );
      }

      if (costItems.length > 0) {
        await supabase.from("goal_cost_items").insert(
          costItems.map((ci) => ({
            goal_id: newGoal.id,
            name: ci.name,
            price: ci.price,
            category: ci.category,
            step_id: null,
          })),
        );
      }

      return newGoal.id as string;
    },
    onSuccess: async (newId) => {
      await repercuterSurGroupes();
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal Duplicated", { description: "A copy of this goal has been created." });
      navigate(`/goals/${newId}`);
    },
    onError: (err) => toast.error("Error", { description: err?.message ?? "Failed to duplicate goal" }),
  });

  // ---------- Delete ----------
  const deleteGoal = useMutation({
    mutationFn: async () => {
      if (!goalId) throw new Error("Missing goal id");
      /* Le pacte se lit avant la suppression : apres, la fiche n est
         plus en cache et les groupes qui comptaient cet objectif
         resteraient sur un total perime. */
      const pactId = getDetail()?.goal.pact_id;
      const { error } = await supabase.from("goals").delete().eq("id", goalId);
      if (error) throw error;
      if (pactId) await synchroniserGroupes(pactId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal Deleted", { description: "This evolution has been removed from your Pact" });
      navigate("/goals");
    },
    onError: (err) => toast.error("Error", { description: err?.message }),
  });

  // ---------- Toggle Focus ----------
  const toggleFocusM = useMutation({
    mutationFn: async () => {
      const detail = getDetail();
      if (!detail) throw new Error("Goal not loaded");
      const rejoint = !detail.goal.is_focus;

      if (rejoint) {
        if (!recrutable(detail.goal)) throw new Error("BRIGADE_TYPE");
        const { count } = await supabase
          .from("goals")
          .select("id", { count: "exact", head: true })
          .eq("pact_id", detail.goal.pact_id!)
          .eq("is_focus", true)
          .eq("goal_type", "normal")
          .not("status", "in", '("fully_completed","validated","archived")');
        if ((count ?? 0) >= PLAFOND_BRIGADE) throw new Error("BRIGADE_PLEINE");
      }

      const { error } = await supabase
        .from("goals")
        .update({ is_focus: rejoint })
        .eq("id", detail.goal.id);
      if (error) throw error;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: detailKey });
      const snapshot = qc.getQueryData<DetailCache>(detailKey);
      if (snapshot) {
        qc.setQueryData<DetailCache>(detailKey, {
          ...snapshot,
          goal: { ...snapshot.goal, is_focus: !snapshot.goal.is_focus },
        });
      }
      return { snapshot };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(detailKey, ctx.snapshot);
      /* Une etoile qui ne s allume pas sans un mot passe pour une
         panne : le refus se dit. */
      if (e?.message === "BRIGADE_PLEINE") {
        toast.error(`La brigade est au complet — relache un objectif d'abord (${PLAFOND_BRIGADE} places).`);
      } else if (e?.message === "BRIGADE_TYPE") {
        toast.error("Seuls les objectifs ordinaires rejoignent la brigade.");
      }
    },
    onSettled: async () => {
      await repercuterSurGroupes();
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const toggleFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFocusM.mutate();
  };

  return {
    handleToggleStep,
    handleToggleHabitCheck,
    handleFullyComplete: () => fullyComplete.mutate(),
    handlePauseGoal,
    handleResumeGoal,
    handleArchiveGoal,
    handleDuplicateGoal: (tags: { tag: string }[]) => duplicateGoal.mutate(tags),
    handleDeleteGoal: () => deleteGoal.mutate(),
    toggleFocus,
    // mutation states for loading UI
    isTogglingStep: toggleStep.isPending,
    isTogglingHabit: toggleHabit.isPending,
    isFullyCompleting: fullyComplete.isPending,
    isUpdatingStatus: updateStatus.isPending,
    isDuplicating: duplicateGoal.isPending,
    isDeleting: deleteGoal.isPending,
  };
}