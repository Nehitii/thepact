/**
 * Goal detail mutation actions hook.
 *
 * All writes go through React Query mutations with optimistic updates on the
 * ["goal-detail", goalId] cache. The hook reads current goal/steps/costItems
 * from the cache via getQueryData — no local state duplication.
 */
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { synchroniserGroupes } from "@/domaines/objectifs/logique/superGoals";
import { PLAFOND_BRIGADE, recrutable } from "@/domaines/objectifs/logique/brigade";
import {
  basculeDUneEtape, compteDesEtapesTenues, etatDeLHabitude,
} from "@/domaines/objectifs/logique/basculesDuDossier";
import { statutDeLaReprise, statutDuRetour } from "@/domaines/objectifs/logique/statutDuGeste";
import {
  etapesCopiees, objectifCopie, piecesCopiees,
} from "@/domaines/objectifs/logique/duplication";
import { trackStepCompleted, trackGoalCompleted, resynchroniserCompteurs, mesureDeLHonneur } from "@/domaines/succes";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { GoalDetailData, StatutObjectif, StepData } from "@/domaines/objectifs/hooks/useGoalDetail";

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
  const { t } = useTranslation();
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

  /* CE QU IL FAUT RELIRE APRES UN GESTE. Les groupes d abord — leur
     compte depend de ce qu on vient de changer — puis les listes.
     Cinq mutations en avaient chacune leur copie, et les copies ne
     disaient pas la meme chose : la bascule d etape rafraichit aussi
     la liste de souhaits, l etoile ne rafraichit PAS la fiche. Ces
     differences sont maintenant a l appel, ou elles se lisent. */
  const rafraichir = (...clefs: readonly (readonly unknown[])[]) => async () => {
    await repercuterSurGroupes();
    for (const clef of clefs) qc.invalidateQueries({ queryKey: clef });
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
      const newStatus = basculeDUneEtape(currentStatus);
      const validatedAt = newStatus === "completed" ? new Date().toISOString() : null;

      const { error } = await supabase
        .from("steps")
        .update({ status: newStatus, validated_at: validatedAt })
        .eq("id", stepId);
      if (error) throw error;

      const newValidatedCount = compteDesEtapesTenues(detail.steps, stepId, newStatus);
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
        const newStatus = basculeDUneEtape(currentStatus);
        const newSteps = snapshot.steps.map((s) => (s.id === stepId ? { ...s, status: newStatus } : s));
        /* LE MEME COMPTE QUE CELUI QUI SERA ECRIT. Il en existait un
           second ici, qui incluait l etape ultime : cocher l etape
           ultime affichait aussitot un de trop, jusqu a ce que
           l invalidation ramene le compte de la base. */
        const validated = compteDesEtapesTenues(snapshot.steps, stepId, newStatus);
        qc.setQueryData<DetailCache>(detailKey, {
          goal: { ...snapshot.goal, validated_steps: validated },
          steps: newSteps,
        });
      }
      return { snapshot };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(detailKey, ctx.snapshot);
      toast.error(t("common.error"), { description: err?.message ?? t("goals.detail.toasts.stepFailed") });
    },
    onSettled: rafraichir(["goals"], detailKey, ["pact-wishlist"]),
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
            toast.success(t("goals.detail.toasts.stepDone"), {
              description: t("goals.detail.toasts.stepDoneBody"),
              action: {
                label: t("goals.detail.toasts.undo"),
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
      const { coches: newChecks, tenus: completedCount, acheve: isNowComplete, statut: newStatus } =
        etatDeLHabitude(detail.goal.habit_checks, dayIndex, coche, detail.goal.habit_duration_days);
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
        const etat = etatDeLHabitude(
          snapshot.goal.habit_checks, dayIndex, coche, snapshot.goal.habit_duration_days,
        );
        qc.setQueryData<DetailCache>(detailKey, {
          ...snapshot,
          goal: {
            ...snapshot.goal,
            habit_checks: etat.coches,
            validated_steps: etat.tenus,
            status: etat.statut,
          },
        });
      }
      return { snapshot };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(detailKey, ctx.snapshot);
      toast.error(t("common.error"), { description: err?.message ?? t("goals.detail.toasts.habitFailed") });
    },
    onSettled: rafraichir(["goals"], detailKey),
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
            toast.success(t("goals.detail.toasts.dayDone", { jour: dayIndex + 1 }), {
              description: isNowComplete
                ? t("goals.detail.toasts.habitDone")
                : t("goals.detail.toasts.habitProgress", { faits: completedCount, total: detail.goal.habit_duration_days }),
              action: {
                label: t("goals.detail.toasts.undo"),
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
        toast.success(t("goals.detail.toasts.alreadyDone"), { description: t("goals.detail.toasts.alreadyDoneBody") });
        return;
      }
      if (userId) {
        /* Le choix de l instant de depart, et ce que vaut son absence,
           sont dans logique/honneurDuTemps.ts. */
        const mesure = mesureDeLHonneur(goal, new Date());
        setTimeout(() => trackGoalCompleted(userId, mesure), 0);
      }
      toast.success(t("goals.detail.toasts.goalDone"), { description: t("goals.detail.toasts.goalDoneBody") });
    },
    onError: (err) => toast.error(t("common.error"), { description: err?.message ?? t("goals.detail.toasts.completeFailed") }),
    onSettled: rafraichir(["goals"], detailKey),
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
      toast.error(t("common.error"), { description: err?.message ?? t("goals.detail.toasts.statusFailed") });
    },
    onSettled: rafraichir(["goals"], detailKey),
  });

  /* PAUSER, REPRENDRE, ARCHIVER : le meme geste sous trois noms. Il
     pose un statut et propose de revenir a celui d avant. Les trois
     copies ne differaient que par deux mots — et par ce qu elles font
     quand le statut d avant est INCONNU : la pause et l archivage
     n offrent alors pas de retour, la reprise en offre un vers
     « non commence ». Cette difference passe desormais par
     l argument, ou elle se voit. Voir logique/statutDuGeste.ts.

     Le message reste calcule A LA REUSSITE et non au clic : « t » lit
     la langue courante quand on l appelle, et la traduire d avance
     figerait la langue d avant pour un changement en vol. */
  const poserStatut = (
    nouveau: StatutObjectif,
    dire: () => { titre: string; corps: string },
    retour: StatutObjectif | undefined,
  ) => {
    updateStatus.mutate(nouveau, {
      onSuccess: () => {
        const { titre, corps } = dire();
        toast.success(titre, {
          description: corps,
          action: retour
            ? { label: t("goals.detail.toasts.undo"), onClick: () => updateStatus.mutate(retour) }
            : undefined,
        });
      },
    });
  };

  const handlePauseGoal = () =>
    poserStatut("paused",
      () => ({ titre: t("goals.detail.toasts.paused"), corps: t("goals.detail.toasts.pausedBody") }),
      getDetail()?.goal.status ?? undefined);

  const handleResumeGoal = () => {
    const detail = getDetail();
    if (!detail) return;
    poserStatut(statutDeLaReprise(detail.goal.validated_steps),
      () => ({ titre: t("goals.detail.toasts.resumed"), corps: t("goals.detail.toasts.resumedBody") }),
      statutDuRetour(detail.goal.status));
  };

  const handleArchiveGoal = () =>
    poserStatut("archived",
      () => ({ titre: t("goals.detail.toasts.archived"), corps: t("goals.detail.toasts.archivedBody") }),
      getDetail()?.goal.status ?? undefined);

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
        .insert(objectifCopie(goal, pactResult.id, t("goals.detail.toasts.copySuffix")))
        .select()
        .single();
      if (goalError) throw goalError;

      if (goalTagsData.length > 0) {
        const { insertGoalTags } = await import("@/domaines/objectifs/hooks/useGoalTags");
        await insertGoalTags(newGoal.id, goalTagsData.map((t) => t.tag));
      }

      const nouvellesEtapes = etapesCopiees(goal, steps, newGoal.id);
      if (nouvellesEtapes.length > 0) await supabase.from("steps").insert(nouvellesEtapes);

      const nouvellesPieces = piecesCopiees(costItems, newGoal.id);
      if (nouvellesPieces.length > 0) await supabase.from("goal_cost_items").insert(nouvellesPieces);

      return newGoal.id as string;
    },
    onSuccess: async (newId) => {
      await repercuterSurGroupes();
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success(t("goals.detail.toasts.duplicated"), { description: t("goals.detail.toasts.duplicatedBody") });
      navigate(`/goals/${newId}`);
    },
    onError: (err) => toast.error(t("common.error"), { description: err?.message ?? t("goals.detail.toasts.duplicateFailed") }),
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
      toast.success(t("goals.detail.toasts.deleted"), { description: t("goals.detail.toasts.deletedBody") });
      navigate("/goals");
    },
    onError: (err) => toast.error(t("common.error"), { description: err?.message }),
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
        toast.error(t("goals.detail.toasts.brigadeFull", { places: PLAFOND_BRIGADE }));
      } else if (e?.message === "BRIGADE_TYPE") {
        toast.error(t("goals.detail.toasts.brigadeOnlyNormal"));
      }
    },
    onSettled: rafraichir(["goals"]),
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