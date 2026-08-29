import { useCallback, useEffect, useRef, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/socle/supabase/client";
import { empreinteDeLAtelier, quelqueChoseAPerdre } from "@/domaines/objectifs/logique/empreinteDeLAtelier";
import {
  getDifficultyLabel as getCentralizedDifficultyLabel,
  getStatusLabel as getCentralizedStatusLabel, mapToValidTag,
} from "@/domaines/objectifs/logique/goalConstants";
import { synchroniserGroupes } from "@/domaines/objectifs/logique/superGoals";
import type { GoalDetailData } from "@/domaines/objectifs/hooks/useGoalDetail";
import type { StepData, Difficulte } from "@/domaines/objectifs/hooks/useGoalDetail";
import type { CostItemData, EditStepItem } from "@/domaines/objectifs/types";
import type { Json, Tables, TablesUpdate } from "@/socle/supabase/types";
import type { Goal } from "@/domaines/objectifs/types";
import { filterGoalsByRule, type SuperGoalRule } from "@/domaines/objectifs/types";

/* LES DEUX COLONNES SONT DES ENUMS POSTGRES, PAS DES CHAINES.
   Le « as any » sur le lot de mises a jour laissait passer n importe
   quoi : difficulty venait d un useState("") libre, et type du PREMIER
   TAG de l objectif — du texte saisi par l utilisateur. Une valeur hors
   liste etait refusee par la base a l execution, sans que rien ne
   l annonce. Les valeurs viennent de pg_enum. */
type TypeObjectif = NonNullable<TablesUpdate<"goals">["type"]>;

const TYPES_OBJECTIF = [
  "personal", "professional", "health", "creative",
  "financial", "learning", "other", "relationship", "diy",
] as const satisfies readonly TypeObjectif[];

const estTypeObjectif = (t: string): t is TypeObjectif =>
  (TYPES_OBJECTIF as readonly string[]).includes(t);

/** Ce que l atelier recoit de la page : les donnees deja lues, et de
 *  quoi ecrire. Il ne les relit pas — la page les a. */
export interface AtelierContexte {
  goal: GoalDetailData | null;
  /** La lecture brute : l atelier s en remplit a l ouverture. */
  goalDetailData: { goal: GoalDetailData; steps: StepData[] } | null | undefined;
  steps: StepData[];
  allGoals: Goal[];
  id: string | undefined;
  goalTagsData: { tag: string }[];
  costItems: { id: string; name: string; price: number; category?: string | null; step_id?: string | null }[];
  /** Rend le nouveau cout total de l objectif. */
  saveCostItems: { mutateAsync: (v: { goalId: string; items: CostItemData[] }) => Promise<number> };
  saveGoalTags: { mutateAsync: (v: { goalId: string; tags: string[] }) => Promise<unknown> };
  queryClient: QueryClient;
  /** Ce que la page fait de l objectif reecrit. */
  onObjectifEnregistre: (g: Tables<"goals"> & GoalDetailData) => void;
  /** Les etapes reecrites, que la page reaffiche. */
  onEtapesEnregistrees: (e: StepData[]) => void;
  /** Le nom du palier « sur mesure », lu du profil par la page. */
  customDifficultyName: string;
}

/* L ATELIER D EDITION D UN OBJECTIF.
 *
 * Dix-huit champs, la photographie prise a l ouverture, le garde-fou
 * des modifications non enregistrees, et cent vingt lignes de
 * sauvegarde. Le tout vivait dans la page, devant trois cents lignes
 * de rendu.
 *
 * LA MACHINE A ETATS D UN FORMULAIRE N EST PAS SON DESSIN — et ici
 * moins qu ailleurs : cet atelier reecrit un objectif, ses etapes, ses
 * pieces chiffrees et ses etiquettes, en cinq ecritures qui doivent
 * toutes reussir.
 */
export function useAtelierDObjectif(ctx: AtelierContexte) {
  const {
    goal, steps, allGoals, id, goalTagsData, costItems,
    saveCostItems, saveGoalTags, queryClient, customDifficultyName, onObjectifEnregistre, onEtapesEnregistrees, goalDetailData,
  } = ctx;
  const { t } = useTranslation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSteps, setEditSteps] = useState(0);
  const [editStartDate, setEditStartDate] = useState("");
  const [editCompletionDate, setEditCompletionDate] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<Difficulte | "">("");
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

  const editInitialStateRef = useRef<string>("");

  /* REMPLIR L ATELIER DEPUIS L OBJECTIF CHARGE.
     Cet effet vivait dans la page, mele a celui qui posait l objectif
     et ses etapes. Le lint le disait a sa facon : quatorze setters
     manquants dans un tableau de dependances. Deux effets sur le meme
     declencheur valent mieux qu un seul qui fait deux choses. */
  useEffect(() => {
    if (!goalDetailData) return;
    const g = goalDetailData.goal;
    setEditName(g.name);
    setEditSteps(g.total_steps || 0);
    setEditStartDate(g.start_date?.split("T")[0] || "");
    setEditCompletionDate(g.completion_date?.split("T")[0] || "");
    setEditImage(g.image_url || "");
    setEditDifficulty(g.difficulty || "medium");
    setEditNotes(g.notes || "");
    setEditDeadline(g.deadline || "");
    setEditStepItems(goalDetailData.steps.map((s) => ({ dbId: s.id, name: s.title, key: `db-${s.id}`, excludeFromSpin: s.exclude_from_spin ?? false, estUltime: s.is_ultimate ?? false })));
    setEditMembresIds(g.child_goal_ids || []);
    setEditRegle((g.super_goal_rule as SuperGoalRule) || {});
    setEditVivant(!!g.is_dynamic_super);
    /* Le mode se lit sur ce qui est enregistre : une regle presente
       veut dire qu on a compose par regle. */
    setEditModeGroupe(g.super_goal_rule ? "auto" : "manual");
    setEditDuree(g.habit_duration_days || (g.habit_checks?.length ?? 1));
  }, [goalDetailData]);

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

  /* LA PHOTOGRAPHIE DE DEPART, ET RIEN D AUTRE.
   *
   * Cet effet fige l etat du formulaire AU MOMENT OU L ON OUVRE, pour
   * pouvoir comparer ensuite et savoir si quelque chose a bouge.
   *
   * Le linter reclame les treize champs edit* en dependances. Les
   * ajouter reprendrait la photo a chaque frappe : l etat « initial »
   * suivrait l etat courant, ils seraient toujours egaux, et le
   * garde-fou des modifications non enregistrees ne se declencherait
   * PLUS JAMAIS. L omission n est pas un oubli, c est le mecanisme. */
  useEffect(() => {
    if (editDialogOpen) {
      editInitialStateRef.current = empreinteDeLAtelier({
      editName, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate,
      editImage, editStepItems, editCostItems, editMembresIds, editRegle, editVivant, editDuree,
    });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editDialogOpen]);

  const hasUnsavedChanges = useCallback(() => {
    return quelqueChoseAPerdre(
      editInitialStateRef.current,
      empreinteDeLAtelier({
        editName, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate,
        editImage, editStepItems, editCostItems, editMembresIds, editRegle, editVivant, editDuree,
      }),
    );
  }, [editName, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate, editImage, editStepItems, editCostItems, editMembresIds, editRegle, editVivant, editDuree]);

  const handleCloseEdit = useCallback(() => {
    if (hasUnsavedChanges() && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    setEditDialogOpen(false);
  }, [hasUnsavedChanges]);

  const toggleEditTag = useCallback((tagValue: string) => {
    setEditTags((prev) => (prev.includes(tagValue) ? prev.filter((t) => t !== tagValue) : [...prev, tagValue]));
  }, []);

  // Handle save
  const handleEditGoal = useCallback(async () => {
    if (!goal || saving) return;
    setSaving(true);
    try {
      const { handleUpdateGoal } = await import("@/domaines/objectifs/logique/goalDetailHandlers");
      const updates: TablesUpdate<"goals"> = {};
      if (editName !== goal.name) updates.name = editName;
      /* L etape ultime ne compte pas dans l avancement : le total
         qu on ecrit est celui des etapes ordinaires. */
      const totalOrdinaire = editStepItems.filter((i) => !i.estUltime).length;
      if (goal.goal_type === "normal" && totalOrdinaire !== goal.total_steps) {
        updates.total_steps = totalOrdinaire;
      } else if (goal.goal_type !== "normal" && editSteps !== goal.total_steps) {
        updates.total_steps = editSteps;
      }
      if (editDifficulty && editDifficulty !== goal.difficulty) updates.difficulty = editDifficulty;
      const primaryTag = editTags[0] || "personal";
      /* Un tag qui ne correspond a aucun type connu n est pas ecrit :
         la base le refuserait de toute facon. */
      if (primaryTag !== goal.type && estTypeObjectif(primaryTag)) updates.type = primaryTag;
      if (editNotes !== (goal.notes || "")) updates.notes = editNotes || null;
      if (editStartDate && editStartDate !== goal.start_date?.split("T")[0]) updates.start_date = new Date(editStartDate).toISOString();
      if (editCompletionDate && editCompletionDate !== goal.completion_date?.split("T")[0]) updates.completion_date = new Date(editCompletionDate).toISOString();
      if (editImage !== goal.image_url) updates.image_url = editImage;
      const currentDeadline = goal.deadline || "";
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
          /* La colonne est du Json ; la forme est validee en amont. */
          updates.super_goal_rule = editRegle as unknown as Json;
          updates.is_dynamic_super = editVivant;
        }
      }

      if (id) {
        try { const newTotal = await saveCostItems.mutateAsync({ goalId: id, items: editCostItems }); updates.estimated_cost = newTotal; } catch { toast.error("Error", { description: "Failed to save cost items" }); }
        try { await saveGoalTags.mutateAsync({ goalId: id, tags: editTags }); } catch { toast.error("Error", { description: "Failed to save tags" }); }
      }

      handleUpdateGoal(goal.id, goal.total_steps ?? 0, updates, async () => {
        const { data: updatedGoal } = await supabase.from("goals").select("*").eq("id", goal.id).single();
        if (updatedGoal) { onObjectifEnregistre(updatedGoal); setEditName(updatedGoal.name); setEditSteps(updatedGoal.total_steps || 0); setEditNotes(updatedGoal.notes || ""); }

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
        if (updatedSteps) { onEtapesEnregistrees(updatedSteps); setEditStepItems(updatedSteps.map((s) => ({ dbId: s.id, name: s.title, key: `db-${s.id}`, excludeFromSpin: s.exclude_from_spin ?? false, estUltime: s.is_ultimate ?? false }))); }

        /* La modification peut retirer les etapes qui restaient : le
           declencheur en base fait alors basculer l objectif, et les
           groupes qui le comptent doivent suivre. */
        await synchroniserGroupes(goal.pact_id ?? undefined);
        queryClient.invalidateQueries({ queryKey: ["goals"] });
        queryClient.invalidateQueries({ queryKey: ["goal-detail", id] });
        /* TROIS CACHES LISENT LA TABLE DES ETAPES, PAS UN.
           Renommer une etape ici la mettait a jour dans cette page et
           nulle part ailleurs : le Registre de la page Objectifs lit
           « goal-steps » et le calendrier lit « calendar-steps », deux
           clefs qu aucune invalidation ne touchait. Avec une fraicheur
           d une minute, l ancien nom restait affiche jusqu a
           soixante secondes apres l enregistrement — constate.
           Une seule main ecrit dans « steps » ; il faut prevenir tous
           ceux qui la lisent. */
        queryClient.invalidateQueries({ queryKey: ["goal-steps"] });
        queryClient.invalidateQueries({ queryKey: ["calendar-steps"] });
        setEditDialogOpen(false);
        setSaving(false);
        toast.success("Goal Updated", { description: "Changes saved successfully" });
      }, (message) => { setSaving(false); toast.error("Error", { description: message }); });
    } catch { setSaving(false); }
  }, [goal, saving, editName, editSteps, editDifficulty, editTags, editNotes, editStartDate, editCompletionDate, editImage, editDeadline, editStepItems, editCostItems, editMembresIds, editRegle, editVivant, editModeGroupe, editDuree, allGoals, id, steps, saveCostItems, saveGoalTags, queryClient, onObjectifEnregistre, onEtapesEnregistrees]);
  return {
    editDialogOpen, setEditDialogOpen, saving,
    editName, setEditName, editSteps, setEditSteps,
    editStartDate, setEditStartDate, editCompletionDate, setEditCompletionDate,
    editImage, setEditImage, editDifficulty, setEditDifficulty,
    editTags, setEditTags, editNotes, setEditNotes,
    editCostItems, setEditCostItems, editStepItems, setEditStepItems,
    editDeadline, setEditDeadline,
    editMembresIds, setEditMembresIds, editRegle, setEditRegle,
    editVivant, setEditVivant, editModeGroupe, setEditModeGroupe,
    editDuree, setEditDuree,
    hasUnsavedChanges, handleCloseEdit, handleEditGoal, toggleEditTag,
  };
}
