import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useGoalTags, useSaveGoalTags } from "@/hooks/useGoalTags";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useGoalContracts } from "@/hooks/useGoalContracts";
import { useGoalDetail } from "@/hooks/useGoalDetail";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { useParticleEffect } from "@/components/ParticleEffect";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/lib/utils";
import { useCostItems, useSaveCostItems } from "@/hooks/useCostItems";
import { useCreatePactWishlistItem } from "@/hooks/usePactWishlist";
import { useUserShop } from "@/hooks/useShop";
import { useSocialFeatures } from "@/hooks/useSocialFeatures";
import { DSPageShell, DSBackground, DSPageLoader } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { ShareGoalModal } from "@/components/goals/ShareGoalModal";
import { GoalContractsPanel } from "@/components/goals/GoalContractsPanel";
import { FileText, Handshake } from "lucide-react";
import type { CostItemData } from "@/components/goals/CostItemsEditor";
import type { EditStepItem } from "@/components/goals/EditStepsList";
import {
  DIFFICULTY_OPTIONS, getDifficultyLabel as getCentralizedDifficultyLabel,
  getStatusLabel as getCentralizedStatusLabel, mapToValidTag,
} from "@/lib/goalConstants";
import {
  computeSuperGoalProgress, filterGoalsByRule,
  type SuperGoalRule, type SuperGoalChildInfo,
} from "@/components/goals/super";
import { membresDuGroupe, estFranchi, estPretAHonorer, synchroniserGroupes } from "@/lib/superGoals";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useGoalDetailActions } from "@/hooks/useGoalDetailActions";
import { GoalDetailEditOverlay } from "@/components/goals/detail";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DossierBandeau, DossierEtapes, DossierRegistre, DossierHabitude,
  DossierCourbe, DossierMembres, DossierPli,
} from "@/components/goals/detail/dossier";
import "@/styles/cyberpunk.css";
import "@/styles/goal-dossier.css";

import type { GoalDetailData as Goal } from "@/hooks/useGoalDetail";

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const { isModulePurchased } = useUserShop(user?.id);
  const social = useSocialFeatures();
  const queryClient = useQueryClient();
  const createWishlistItem = useCreatePactWishlistItem();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [steps, setSteps] = useState<{ id: string; title: string; order: number; status: string | null; due_date: string | null; notes?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSteps, setEditSteps] = useState(0);
  const [editStartDate, setEditStartDate] = useState("");
  const [editCompletionDate, setEditCompletionDate] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editCostItems, setEditCostItems] = useState<CostItemData[]>([]);
  const [editStepItems, setEditStepItems] = useState<EditStepItem[]>([]);
  const [editDeadline, setEditDeadline] = useState("");
  /* LA COMPOSITION D UN GROUPE EST UN CHAMP COMME LES AUTRES.
   *
   * La fiche d un groupe portait deux boutons « Modifier » : celui du
   * bandeau ouvrait l atelier — nom, palier, etiquettes, dates, notes,
   * registre — et celui du volet des membres ouvrait une modale a
   * part, pour la composition. Deux fois le meme mot, deux editeurs
   * differents, et l atelier qui renvoyait a la fiche pour ce qu il ne
   * savait pas faire.
   *
   * La composition rejoint donc l atelier, au meme endroit que les
   * etapes d un objectif ordinaire : c est ce que le groupe demande,
   * comme les etapes sont ce que l objectif demande. Un seul
   * « Modifier », un seul editeur — et la creation le faisait deja
   * ainsi. */
  const [editMembresIds, setEditMembresIds] = useState<string[]>([]);
  const [editRegle, setEditRegle] = useState<SuperGoalRule>({});
  const [editVivant, setEditVivant] = useState(false);
  const [editModeGroupe, setEditModeGroupe] = useState<"manual" | "auto">("manual");
  /* La duree d une habitude se modifie dans l atelier, comme les
     etapes d un objectif et les astres d une constellation. Elle n y
     etait pas : l atelier savait tout changer sauf ce que le type
     demande vraiment. */
  const [editDuree, setEditDuree] = useState(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  /* Decocher une etape d un objectif honore le fait retomber, et
     entraine avec lui les groupes qui le comptent. Un clic sur une
     case ne doit pas suffire. */
  const [etapeADefaire, setEtapeADefaire] = useState<{ id: string; titre: string } | null>(null);

  const { trigger: triggerParticles, ParticleEffects } = useParticleEffect();
  const editInitialStateRef = useRef<string>("");

  const { data: costItems = [] } = useCostItems(id);
  const saveCostItems = useSaveCostItems();
  const { data: goalTagsData = [] } = useGoalTags(id);
  const saveGoalTags = useSaveGoalTags();
  const { data: profile } = useProfile(user?.id);
  const customDifficultyName = profile?.custom_difficulty_name || "";
  const customDifficultyColor = profile?.custom_difficulty_color || "#a855f7";
  const customDifficultyActive = profile?.custom_difficulty_active || false;

  const { data: goalDetailData, isLoading: goalDetailLoading } = useGoalDetail(id, user?.id);
  const { data: pact } = usePact(user?.id);
  const { data: allGoals = [] } = useGoals(pact?.id, { includeStepCounts: true });

  /* Le pli des contrats affiche son compte sans etre deplie, et se
     retire tout seul quand le drapeau est baisse : un pli vide n aurait
     rien a ouvrir. */
  const { enabled: contratsActifs } = useFeatureFlag("goal_contracts");
  const { data: contrats = [] } = useGoalContracts(id);

  const getDifficultyColor = useCallback(
    (d: string) => getUnifiedDifficultyColor(d, customDifficultyColor),
    [customDifficultyColor],
  );

  // Actions hook — reads/writes the React Query cache directly.
  const actions = useGoalDetailActions({
    goalId: id,
    userId: user?.id,
    triggerParticles,
    getDifficultyColor,
  });

  // Sync goal detail from React Query into local state
  useEffect(() => {
    if (goalDetailData) {
      const g = goalDetailData.goal;
      setGoal(g);
      setEditName(g.name);
      setEditSteps(g.total_steps || 0);
      setEditStartDate(g.start_date?.split("T")[0] || "");
      setEditCompletionDate(g.completion_date?.split("T")[0] || "");
      setEditImage(g.image_url || "");
      setEditDifficulty(g.difficulty || "medium");
      setEditNotes(g.notes || "");
      setEditDeadline((g as any).deadline || "");
      setSteps(goalDetailData.steps);
      setEditStepItems(goalDetailData.steps.map((s) => ({ dbId: s.id, name: s.title, key: `db-${s.id}`, excludeFromSpin: (s as any).exclude_from_spin ?? false, estUltime: (s as any).is_ultimate ?? false })));
      setEditMembresIds(g.child_goal_ids || []);
      setEditRegle((g.super_goal_rule as SuperGoalRule) || {});
      setEditVivant(!!g.is_dynamic_super);
      /* Le mode se lit sur ce qui est enregistre : une regle presente
         veut dire qu on a compose par regle. */
      setEditModeGroupe(g.super_goal_rule ? "auto" : "manual");
      setEditDuree(g.habit_duration_days || (g.habit_checks?.length ?? 1));
      setLoading(false);
    }
  }, [goalDetailData]);

  useEffect(() => {
    if (!goalDetailLoading && !goalDetailData) setLoading(false);
  }, [goalDetailLoading, goalDetailData]);

  /* Membres d un groupe. La composition suit la regle partagee ; ne
     restent ici que les identifiants declares qui ne designent plus
     rien — un objectif supprime laisse un lien casse, et mieux vaut le
     montrer que le faire disparaitre. Ils ne comptent dans aucun
     total. */
  const childGoalsInfo: SuperGoalChildInfo[] = useMemo(() => {
    if (!goal || goal.goal_type !== "super") return [];
    const membres = membresDuGroupe(goal, allGoals);
    const casses = goal.is_dynamic_super
      ? []
      : (goal.child_goal_ids || []).filter((cid) => !allGoals.some((g) => g.id === cid));

    return [
      ...membres.map((m) => {
        const total = m.totalStepsCount ?? m.total_steps ?? 0;
        const faits = m.completedStepsCount ?? m.validated_steps ?? 0;
        return {
          id: m.id, name: m.name, difficulty: m.difficulty, status: m.status,
          progress: total > 0 ? Math.round((faits / total) * 100) : 0,
          isCompleted: estFranchi(m), isMissing: false,
        };
      }),
      ...casses.map((cid) => ({
        id: cid, name: t("goals.detail.missingGoal", "Objectif introuvable"),
        difficulty: "medium", status: "not_started", progress: 0,
        isCompleted: false, isMissing: true,
      })),
    ];
  }, [goal, allGoals, t]);

  // Sync tags
  useEffect(() => {
    if (goalTagsData.length > 0) setEditTags(goalTagsData.map((t) => t.tag));
    else if (goal?.type) setEditTags([mapToValidTag(goal.type)]);
  }, [goalTagsData, goal?.type]);

  // Sync cost items
  useEffect(() => {
    if (costItems.length > 0) {
      setEditCostItems(costItems.map((item) => ({ id: item.id, name: item.name, price: item.price, category: item.category || undefined, stepId: item.step_id })));
    }
  }, [costItems]);

  // Edit overlay unsaved changes guard
  useEffect(() => {
    if (editDialogOpen) {
      editInitialStateRef.current = JSON.stringify({ editName, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate, editImage, editStepItems: editStepItems.map((s) => ({ dbId: s.dbId, name: s.name })), editCostItems, editMembresIds, editRegle, editVivant, editDuree });
    }
  }, [editDialogOpen]);

  const hasUnsavedChanges = useCallback(() => {
    if (!editInitialStateRef.current) return false;
    const current = JSON.stringify({ editName, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate, editImage, editStepItems: editStepItems.map((s) => ({ dbId: s.dbId, name: s.name })), editCostItems, editMembresIds, editRegle, editVivant, editDuree });
    return current !== editInitialStateRef.current;
  }, [editName, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate, editImage, editStepItems, editCostItems, editMembresIds, editRegle, editVivant, editDuree]);

  const handleCloseEdit = useCallback(() => {
    if (hasUnsavedChanges() && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    setEditDialogOpen(false);
  }, [hasUnsavedChanges]);

  const toggleEditTag = useCallback((tagValue: string) => {
    setEditTags((prev) => (prev.includes(tagValue) ? prev.filter((t) => t !== tagValue) : [...prev, tagValue]));
  }, []);

  const getDifficultyLabel = useCallback(
    (d: string) => getCentralizedDifficultyLabel(d, t, customDifficultyName),
    [customDifficultyName, t],
  );
  const getStatusLabel = useCallback((s: string) => getCentralizedStatusLabel(s, t), [t]);

  // Handle save
  const handleEditGoal = useCallback(async () => {
    if (!goal || saving) return;
    setSaving(true);
    try {
      const { handleUpdateGoal } = await import("@/lib/goalDetailHandlers");
      const updates: Record<string, unknown> = {};
      if (editName !== goal.name) updates.name = editName;
      /* L etape ultime ne compte pas dans l avancement : le total
         qu on ecrit est celui des etapes ordinaires. */
      const totalOrdinaire = editStepItems.filter((i) => !i.estUltime).length;
      if (goal.goal_type === "normal" && totalOrdinaire !== goal.total_steps) {
        updates.total_steps = totalOrdinaire;
      } else if (goal.goal_type !== "normal" && editSteps !== goal.total_steps) {
        updates.total_steps = editSteps;
      }
      if (editDifficulty !== goal.difficulty) updates.difficulty = editDifficulty;
      const primaryTag = editTags[0] || "personal";
      if (primaryTag !== goal.type) updates.type = primaryTag;
      if (editNotes !== (goal.notes || "")) updates.notes = editNotes || null;
      if (editStartDate && editStartDate !== goal.start_date?.split("T")[0]) updates.start_date = new Date(editStartDate).toISOString();
      if (editCompletionDate && editCompletionDate !== goal.completion_date?.split("T")[0]) updates.completion_date = new Date(editCompletionDate).toISOString();
      if (editImage !== goal.image_url) updates.image_url = editImage;
      const currentDeadline = (goal as any).deadline || "";
      if (editDeadline !== currentDeadline) updates.deadline = editDeadline || null;

      /* CHANGER LA DUREE D UNE HABITUDE REDIMENSIONNE SES CASES.
         Le tableau de cases et la duree doivent rester de meme taille :
         sinon le dernier jour n est plus le dernier, et l habitude ne
         peut plus se franchir. Allonger ajoute des jours vides ;
         raccourcir coupe la fin — l atelier previent de ce que cela
         efface avant qu on enregistre. Les compteurs suivent, et le
         declencheur en base en tire le statut. */
      if (goal.goal_type === "habit" && editDuree !== (goal.habit_duration_days ?? 0)) {
        const anciennes = goal.habit_checks ?? [];
        const coches = Array.from({ length: editDuree }, (_, i) => anciennes[i] ?? false);
        const tenus = coches.filter(Boolean).length;
        updates.habit_duration_days = editDuree;
        updates.habit_checks = coches;
        updates.total_steps = editDuree;
        updates.validated_steps = tenus;
        if (tenus < editDuree) updates.completion_date = null;
      }

      /* La composition d un groupe part avec le reste : c est un champ
         de l atelier, plus une modale separee. En mode « regle », la
         liste declaree n est figee que si le groupe ne vit pas — un
         groupe vivant rejoue sa regle et n a donc pas de liste. */
      if (goal.goal_type === "super") {
        if (editModeGroupe === "manual") {
          updates.child_goal_ids = editMembresIds;
          updates.super_goal_rule = null;
          updates.is_dynamic_super = false;
        } else {
          const apparies = filterGoalsByRule(
            allGoals.filter((g) => g.id !== goal.id && g.goal_type !== "super"),
            editRegle,
          ).map((g) => g.id);
          updates.child_goal_ids = editVivant ? null : apparies;
          updates.super_goal_rule = editRegle;
          updates.is_dynamic_super = editVivant;
        }
      }

      if (id) {
        try { const newTotal = await saveCostItems.mutateAsync({ goalId: id, items: editCostItems }); updates.estimated_cost = newTotal; } catch { toast.error("Error", { description: "Failed to save cost items" }); }
        try { await saveGoalTags.mutateAsync({ goalId: id, tags: editTags }); } catch { toast.error("Error", { description: "Failed to save tags" }); }
      }

      handleUpdateGoal(goal.id, goal.total_steps ?? 0, updates as any, async () => {
        const { data: updatedGoal } = await supabase.from("goals").select("*").eq("id", goal.id).single();
        if (updatedGoal) { setGoal(updatedGoal); setEditName(updatedGoal.name); setEditSteps(updatedGoal.total_steps || 0); setEditNotes(updatedGoal.notes || ""); }

        if (goal.goal_type !== "habit" && goal.goal_type !== "super" && id) {
          const existingIds = new Set(steps.map((s) => s.id));
          const keptDbIds = new Set(editStepItems.filter((i) => i.dbId).map((i) => i.dbId!));
          const idsToDelete = steps.filter((s) => !keptDbIds.has(s.id)).map((s) => s.id);
          if (idsToDelete.length > 0) await supabase.from("steps").delete().in("id", idsToDelete);

          const updatePromises: Promise<unknown>[] = [];
          const newStepsToInsert: { goal_id: string; title: string; description: string; notes: string; order: number; exclude_from_spin: boolean; is_ultimate: boolean }[] = [];
          for (let i = 0; i < editStepItems.length; i++) {
            const item = editStepItems[i];
            const title = item.name?.trim() || `Step ${i + 1}`;
            if (item.dbId && existingIds.has(item.dbId)) {
              updatePromises.push(Promise.resolve(supabase.from("steps").update({ title, order: i + 1, exclude_from_spin: item.excludeFromSpin ?? false, is_ultimate: item.estUltime ?? false }).eq("id", item.dbId)));
            } else {
              newStepsToInsert.push({ goal_id: id, title, description: "", notes: "", order: i + 1, exclude_from_spin: item.excludeFromSpin ?? false, is_ultimate: item.estUltime ?? false });
            }
          }
          await Promise.all([...updatePromises, ...(newStepsToInsert.length > 0 ? [supabase.from("steps").insert(newStepsToInsert)] : [])]);
        }

        const { data: updatedSteps } = await supabase.from("steps").select("*").eq("goal_id", goal.id).order("order", { ascending: true });
        if (updatedSteps) { setSteps(updatedSteps); setEditStepItems(updatedSteps.map((s: any) => ({ dbId: s.id, name: s.title, key: `db-${s.id}`, excludeFromSpin: s.exclude_from_spin ?? false, estUltime: s.is_ultimate ?? false }))); }

        /* La modification peut retirer les etapes qui restaient : le
           declencheur en base fait alors basculer l objectif, et les
           groupes qui le comptent doivent suivre. */
        await synchroniserGroupes(goal.pact_id);
        queryClient.invalidateQueries({ queryKey: ["goals"] });
        queryClient.invalidateQueries({ queryKey: ["goal-detail", id] });
        setEditDialogOpen(false);
        setSaving(false);
        toast.success("Goal Updated", { description: "Changes saved successfully" });
      }, (message) => { setSaving(false); toast.error("Error", { description: message }); });
    } catch { setSaving(false); }
  }, [goal, saving, editName, editSteps, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate, editImage, editDeadline, editStepItems, editCostItems, editMembresIds, editRegle, editVivant, editModeGroupe, editDuree, allGoals, id, steps, saveCostItems, saveGoalTags, queryClient, toast]);

  // Handle super goal save

  // Loading / Not found
  if (loading) {
    return <DSPageLoader />;
  }
  if (!goal) {
    return (
      <DSPageShell width="sm" background={<DSBackground variant="cyber" />}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground font-rajdhani">Goal not found</p>
            <Button onClick={() => navigate("/goals")} variant="hud" className="mt-4 rounded-lg">Back to Goals</Button>
          </div>
        </div>
      </DSPageShell>
    );
  }

  const isHabitGoal = goal.goal_type === "habit";
  const isSuperGoal = goal.goal_type === "super";

  let completedStepsCount: number;
  let totalStepsCount: number;
  let progress: number;
  if (isSuperGoal) {
    const sp = computeSuperGoalProgress(childGoalsInfo);
    completedStepsCount = sp.completedCount; totalStepsCount = sp.totalCount; progress = sp.percentage;
  } else if (isHabitGoal) {
    completedStepsCount = goal.habit_checks?.filter(Boolean).length || 0;
    totalStepsCount = goal.habit_duration_days || 1;
    progress = (completedStepsCount / totalStepsCount) * 100;
  } else {
    completedStepsCount = steps.filter((s) => s.status === "completed").length;
    totalStepsCount = steps.length || 1;
    progress = (completedStepsCount / totalStepsCount) * 100;
  }

  const difficultyColor = getDifficultyColor(goal.difficulty ?? "medium");
  const isCompleted = goal.status === "fully_completed";
  const displayTags = goalTagsData.length > 0 ? goalTagsData.map((t) => t.tag) : goal.type ? [mapToValidTag(goal.type)] : [];

  /* Le montant qu une etape traine derriere elle : le rail l affiche
     en bout de ligne, ce qui evite d aller le chercher dans le
     registre d en face. */
  const coutParEtape = new Map<string, number>();
  for (const poste of costItems) {
    if (!poste.step_id) continue;
    coutParEtape.set(poste.step_id, (coutParEtape.get(poste.step_id) ?? 0) + Number(poste.price || 0));
  }

  const wishlistHandler = isModulePurchased("wishlist")
    ? (item: CostItemData) => {
        if (!user?.id) return;
        const name = (item.name || "").trim();
        if (!name) { toast.error("Name required", { description: "Give this cost item a name first." }); return; }
        createWishlistItem.mutate({ userId: user.id, name, estimatedCost: Number(item.price) || 0, itemType: "required", category: item.category ?? goal.type ?? null, goalId: goal.id });
      }
    : undefined;

  /* Cocher est sans consequence ; decocher un objectif deja honore le
     defait, et defait le compte des groupes qui le portent. On ne
     retient que ce geste-la. */
  const estHonore = goal.status === "fully_completed" || goal.status === "validated";
  /* Le zenith se deduit : c est le fait que l etape ultime soit
     franchie. Aucune colonne a tenir d accord avec elle. */
  const auZenith = steps.some((e) => (e as any).is_ultimate && e.status === "completed");

  const groupesPorteurs = allGoals
    .filter((g) => g.goal_type === "super")
    .filter((g) => membresDuGroupe(g, allGoals).some((m) => m.id === goal.id))
    .map((g) => g.name);

  const demanderBascule = (stepId: string, statut: string) => {
    if (statut === "completed" && estHonore) {
      setEtapeADefaire({ id: stepId, titre: steps.find((e) => e.id === stepId)?.title ?? "" });
      return;
    }
    actions.handleToggleStep(stepId, statut);
  };

  const uniteAvancement = isSuperGoal
    ? t("goals.detail.unitGoals", "objectifs")
    : isHabitGoal
      ? t("goals.detail.unitDays", "jours")
      : t("goals.detail.unitSteps", "étapes");

  return (
    <DSPageShell
      width="xl"
      background={<DSBackground variant="cyber" />}
      className="!px-4 md:!px-6 !pt-8 !pb-24"
    >
      {/* Particles overlay — preserved at root level */}
      <ParticleEffects />

      <div className="gd">
        <DossierBandeau
          goal={goal}
          teinte={difficultyColor}
          progression={progress}
          faites={completedStepsCount}
          total={totalStepsCount}
          uniteAvancement={uniteAvancement}
          libellePalier={getDifficultyLabel(goal.difficulty ?? "medium")}
          /* Un groupe au seuil n'est pas « en cours » : tout est fait,
             il n'attend que le geste. La fiche le nomme, comme le
             registre et les cartes. */
          libelleEtat={
            estPretAHonorer(goal, allGoals)
              ? t("goals.detail.toHonour", "À honorer")
              : getStatusLabel(goal.status ?? "not_started")
          }
          etiquettes={displayTags}
          estHonore={isCompleted}
          auZenith={auZenith}
          partageActif={!!social.sharing}
          onRetour={() => navigate("/goals")}
          onModifier={() => setEditDialogOpen(true)}
          onToutValider={actions.handleFullyComplete}
          onPause={actions.handlePauseGoal}
          onReprendre={actions.handleResumeGoal}
          onArchiver={actions.handleArchiveGoal}
          onDupliquer={() => actions.handleDuplicateGoal(goalTagsData)}
          onSupprimer={actions.handleDeleteGoal}
          onBasculerFocus={actions.toggleFocus}
          onPartager={() => setShareModalOpen(true)}
          onBasculerVerrou={async () => {
            const newLocked = !goal.is_locked;
            const { error } = await supabase.from("goals").update({ is_locked: newLocked }).eq("id", goal.id);
            if (!error) {
              setGoal({ ...goal, is_locked: newLocked });
              queryClient.invalidateQueries({ queryKey: ["goals"] });
              toast.success(newLocked ? t("goals.detail.locked", "Objectif verrouillé") : t("goals.detail.unlocked", "Objectif déverrouillé"));
            }
          }}
        />

        {/* Le corps : a gauche ce qu on fait, a droite ce que ca coute.
            Un groupe n a ni etapes ni postes propres — il occupe alors
            toute la largeur avec ses membres. */}
        <div className={`gd-corps${isSuperGoal && costItems.length === 0 ? " gd-corps--seul" : ""}`}>
          {isSuperGoal ? (
            <DossierMembres
              membres={childGoalsInfo}
              teintePar={getDifficultyColor}
              dynamique={!!goal.is_dynamic_super}
              onOuvrir={(childId) => navigate(`/goals/${childId}`)}
              auSeuil={totalStepsCount > 0 && completedStepsCount >= totalStepsCount && !isCompleted}
              onHonorer={actions.handleFullyComplete}
              onEclat={triggerParticles}
            />
          ) : isHabitGoal ? (
            <DossierHabitude
              coches={goal.habit_checks || []}
              duree={goal.habit_duration_days || 0}
              teinte={difficultyColor}
              onBasculer={actions.handleToggleHabitCheck}
            />
          ) : (
            <DossierEtapes
              etapes={steps}
              teinte={difficultyColor}
              coutParEtape={coutParEtape}
              devise={currency}
              onBasculer={demanderBascule}
              onOuvrir={(stepId) => navigate(`/step/${stepId}`)}
            />
          )}

          {isHabitGoal ? (
            <DossierCourbe coches={goal.habit_checks || []} depuis={goal.created_at ?? new Date().toISOString()} />
          ) : (isSuperGoal && costItems.length === 0) ? null : (
            <DossierRegistre
              postes={costItems}
              etapes={steps}
              teinte={difficultyColor}
              devise={currency}
              coutEstime={goal.estimated_cost || 0}
            />
          )}
        </div>

        {/* Le pied ne se dessine que s il porte quelque chose : sans
            cela il consomme un espacement de la colonne pour rien. */}
        {(goal.notes || contratsActifs) && (
        <div className="gd-pied">
          {goal.notes && (
            <DossierPli nom={t("goals.detail.notes", "Notes")} icone={FileText} ouvertParDefaut>
              <p className="gd-notes">{goal.notes}</p>
            </DossierPli>
          )}

          {contratsActifs && (
            <DossierPli nom={t("goals.detail.contracts", "Contrats")} icone={Handshake} compte={contrats.length}>
              <div className="gd-annexe">
                <GoalContractsPanel goalId={goal.id} goalName={goal.name} />
              </div>
            </DossierPli>
          )}

        </div>
        )}
      </div>

      <GoalDetailEditOverlay
        isOpen={editDialogOpen}
        goal={goal}
        userId={user?.id}
        steps={steps}
        editName={editName} setEditName={setEditName}
        editDifficulty={editDifficulty} setEditDifficulty={setEditDifficulty}
        editTags={editTags} toggleEditTag={toggleEditTag}
        editNotes={editNotes} setEditNotes={setEditNotes}
        editStartDate={editStartDate} setEditStartDate={setEditStartDate}
        editCompletionDate={editCompletionDate} setEditCompletionDate={setEditCompletionDate}
        editDeadline={editDeadline} setEditDeadline={setEditDeadline}
        editImage={editImage} setEditImage={setEditImage}
        editStepItems={editStepItems}
        onStepItemsChange={(items) => { setEditStepItems(items); setEditSteps(items.length); }}
        editCostItems={editCostItems} setEditCostItems={setEditCostItems}
        allGoals={allGoals}
        editMembresIds={editMembresIds} setEditMembresIds={setEditMembresIds}
        editRegle={editRegle} setEditRegle={setEditRegle}
        editVivant={editVivant} setEditVivant={setEditVivant}
        editModeGroupe={editModeGroupe} setEditModeGroupe={setEditModeGroupe}
        editDuree={editDuree} setEditDuree={setEditDuree}
        customDifficultyActive={customDifficultyActive}
        customDifficultyName={customDifficultyName}
        customDifficultyColor={customDifficultyColor}
        saving={saving}
        onSave={handleEditGoal}
        onClose={handleCloseEdit}
        onAddToWishlist={wishlistHandler}
      />


      <AlertDialog open={!!etapeADefaire} onOpenChange={(ouvert) => !ouvert && setEtapeADefaire(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("goals.detail.undoTitle", "Défaire cet objectif ?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("goals.detail.undoBody", {
                defaultValue:
                  "« {{etape}} » est décochée, et cet objectif honoré retombe en cours.",
                etape: etapeADefaire?.titre ?? "",
              })}
              {groupesPorteurs.length > 0 && (
                <>
                  {" "}
                  {t("goals.detail.undoGroups", {
                    defaultValue: "Le compte de {{groupes}} suivra.",
                    groupes: groupesPorteurs.join(", "),
                  })}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Annuler")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (etapeADefaire) actions.handleToggleStep(etapeADefaire.id, "completed");
                setEtapeADefaire(null);
              }}
            >
              {t("goals.detail.undoConfirm", "Décocher")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {goal && (
        <ShareGoalModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          goalId={goal.id}
          goalName={goal.name}
        />
      )}
    </DSPageShell>
  );
}
