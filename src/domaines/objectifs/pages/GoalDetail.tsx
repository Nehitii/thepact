import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useAtelierDObjectif } from "@/domaines/objectifs/hooks/useAtelierDObjectif";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useCurrency } from "@/socle/contextes/CurrencyContext";
import { supabase } from "@/socle/supabase/client";
import type { Json, TablesUpdate } from "@/socle/supabase/types";

import { useGoalTags, useSaveGoalTags } from "@/domaines/objectifs/hooks/useGoalTags";
import { useFeatureFlag } from "@/socle/hooks/useFeatureFlag";
import { useGoalContracts } from "@/domaines/objectifs/hooks/useGoalContracts";
import { useGoalDetail , type StepData, type Difficulte } from "@/domaines/objectifs/hooks/useGoalDetail";
import { useProfile } from "@/domaines/profil";
import { toast } from "sonner";
import { useParticleEffect } from "@/socle/hooks/useParticleEffect";
import { getDifficultyColor as getUnifiedDifficultyColor } from "@/socle/outils/utils";
import { useCostItems, useSaveCostItems, useAcquerirPieces } from "@/domaines/objectifs/hooks/useCostItems";
import { useCreatePactWishlistItem } from "@/domaines/souhaits";
import { useUserShop } from "@/domaines/boutique";
import { useSocialFeatures } from "@/socle/hooks/useSocialFeatures";
import { DSPageShell, DSBackground, DSPageLoader } from "@/socle/ds";
import { Button } from "@/socle/ui/button";
import { ShareGoalModal } from "@/domaines/objectifs/composants/ShareGoalModal";
import { GoalContractsPanel } from "@/domaines/objectifs/composants/GoalContractsPanel";
import { FileText, Handshake } from "lucide-react";
import type { CostItemData } from "@/domaines/objectifs/composants/CostItemsEditor";
import type { EditStepItem } from "@/domaines/objectifs/composants/EditStepsList";
import {
  DIFFICULTY_OPTIONS, getDifficultyLabel as getCentralizedDifficultyLabel,
  getStatusLabel as getCentralizedStatusLabel, mapToValidTag,
} from "@/domaines/objectifs/logique/goalConstants";
import {
  computeSuperGoalProgress, filterGoalsByRule,
  type SuperGoalRule, type SuperGoalChildInfo,
} from "@/domaines/objectifs/composants/super";
import { membresDuGroupe, estFranchi, estPretAHonorer, synchroniserGroupes } from "@/domaines/objectifs/logique/superGoals";
import {
  membresEtLiensCasses, coutParEtape as coutsParEtape, estHonore, auZenith, groupesPorteurs,
} from "@/domaines/objectifs/logique/detailDuPacte";
import { usePact } from "@/domaines/objectifs/hooks/usePact";
import { useGoals } from "@/domaines/objectifs/hooks/useGoals";
import { useVoisinsDObjectif } from "@/domaines/objectifs/hooks/useVoisinsDObjectif";
import { DossierNavigation } from "@/domaines/objectifs/composants/DossierNavigation";
import { useGoalDetailActions } from "@/domaines/objectifs/hooks/useGoalDetailActions";
import { GoalDetailEditOverlay } from "@/domaines/objectifs/composants/detail";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/socle/ui/alert-dialog";
import {
  DossierBandeau, DossierEtapes, DossierRegistre, DossierHabitude,
  DossierCourbe, DossierMembres, DossierPli,
} from "@/domaines/objectifs/composants/detail/dossier";
import "@/socle/ds/cyberpunk.css";
import "@/domaines/objectifs/goal-dossier.css";

import type { GoalDetailData as Goal } from "@/domaines/objectifs/hooks/useGoalDetail";

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
  /* StepData plutot qu un type anonyme de six champs : l etat etait
     alimente par goalDetailData.steps, qui est deja un StepData[]
     complet. Le retrecir jetait is_ultimate et exclude_from_spin, que
     le code reprenait ensuite par transtypage. */
  const [steps, setSteps] = useState<StepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  /* Decocher une etape d un objectif honore le fait retomber, et
     entraine avec lui les groupes qui le comptent. Un clic sur une
     case ne doit pas suffire. */
  const [etapeADefaire, setEtapeADefaire] = useState<{ id: string; titre: string } | null>(null);

  const { trigger: triggerParticles, ParticleEffects } = useParticleEffect();

  const { data: costItems = [] } = useCostItems(id);
  /* Acheter une piece ne demande pas de valider son etape : on
     achete l epilateur avant de commencer a s epiler. */
  const acquerirPieces = useAcquerirPieces();
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

  /* ALLER A L OBJECTIF D A COTE.
     Le hook rejoue le tri et les filtres de la liste — ils vivent en
     localStorage — pour que la fleche suive l ordre qu on regardait, et
     pose lui-meme l ecoute clavier. */
  const voisins = useVoisinsDObjectif(allGoals, id);

  const getDifficultyLabel = useCallback(
    (d: string) => getCentralizedDifficultyLabel(d, t, customDifficultyName),
    [customDifficultyName, t],
  );
  const getStatusLabel = useCallback((s: string) => getCentralizedStatusLabel(s, t), [t]);

  /* L atelier d edition vit dans `hooks/useAtelierDObjectif.ts` :
     dix-huit champs, la photographie d ouverture, le garde-fou des
     modifications non enregistrees et la sauvegarde. */
  const {
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
  } = useAtelierDObjectif({
    goal, steps, allGoals, id, goalTagsData, costItems,
    saveCostItems, saveGoalTags, queryClient, customDifficultyName, goalDetailData,
    onObjectifEnregistre: setGoal,
    onEtapesEnregistrees: setSteps,
  });

  /* LE GLISSEMENT EST UN GESTE TACTILE, PAS UNE HABITUDE DE BUREAU.
     Rendre toute la fiche deplacable a la souris empecherait de
     selectionner du texte, pour un geste que personne ne tenterait au
     pointeur. Sur ecran tactile il est au contraire attendu ; au
     clavier et a la souris, ce sont les fleches et les deux boutons
     nommes qui servent. */
  const [tactile, setTactile] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const m = window.matchMedia("(pointer: coarse)");
    const lire = () => setTactile(m.matches);
    lire();
    m.addEventListener("change", lire);
    return () => m.removeEventListener("change", lire);
  }, []);

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
      setSteps(goalDetailData.steps);
      setLoading(false);
    }
  }, [goalDetailData]);

  useEffect(() => {
    if (!goalDetailLoading && !goalDetailData) setLoading(false);
  }, [goalDetailLoading, goalDetailData]);

  const childGoalsInfo = useMemo(
    () => membresEtLiensCasses(goal, allGoals, t("goals.detail.missingGoal", "Objectif introuvable")),
    [goal, allGoals, t],
  );

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

  const coutParEtape = coutsParEtape(costItems);

  const wishlistHandler = isModulePurchased("wishlist")
    ? (item: CostItemData) => {
        if (!user?.id) return;
        const name = (item.name || "").trim();
        if (!name) { toast.error("Name required", { description: "Give this cost item a name first." }); return; }
        createWishlistItem.mutate({ userId: user.id, name, estimatedCost: Number(item.price) || 0, itemType: "required", category: item.category ?? goal.type ?? null, goalId: goal.id });
      }
    : undefined;

  /* Cocher est sans consequence ; decocher un objectif deja honore le
     defait, et defait le compte des groupes qui le portent. */
  const honore = estHonore(goal);
  const zenith = auZenith(steps);
  const porteurs = groupesPorteurs(goal.id, allGoals);

  const demanderBascule = (stepId: string, statut: string) => {
    if (statut === "completed" && honore) {
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

      {/* Cent vingt pixels : assez pour qu un glissement soit
          intentionnel, pas assez pour qu il soit penible. En dessous,
          la fiche revient d elle-meme a sa place. */}
      <motion.div
        className="gd"
        drag={tactile ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.14}
        onDragEnd={(_, info) => {
          if (info.offset.x < -120) voisins.allerAuSuivant();
          else if (info.offset.x > 120) voisins.allerAuPrecedent();
        }}
      >
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
          auZenith={zenith}
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
              objectifTermine={
                /* Un statut absent nest pas un objectif termine : on
                   ne devine pas, on repond non. */
                goal.status !== null && goal.status !== undefined
                && ["completed", "fully_completed", "validated"].includes(goal.status)
              }
              onAcquerir={(id, acquis) => acquerirPieces.mutate({ ids: [id], acquis })}
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

        <DossierNavigation
          precedent={voisins.precedent}
          suivant={voisins.suivant}
          rang={voisins.rang}
          total={voisins.total}
          onPrecedent={voisins.allerAuPrecedent}
          onSuivant={voisins.allerAuSuivant}
        />
      </motion.div>

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
              {porteurs.length > 0 && (
                <>
                  {" "}
                  {t("goals.detail.undoGroups", {
                    defaultValue: "Le compte de {{groupes}} suivra.",
                    groupes: porteurs.join(", "),
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
