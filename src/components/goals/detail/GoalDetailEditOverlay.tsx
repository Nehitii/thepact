/**
 * L ATELIER — modifier un objectif.
 *
 * Il reprend le chassis du dossier et sa disposition : a gauche ce
 * qu est l objectif, a droite ce qu il demande. Les deux listes qui
 * se font face dans la fiche se font face ici aussi — on modifie au
 * meme endroit qu on lit, dans la meme langue.
 *
 * Trois choses ont change au-dela de l apparence.
 *
 * La barre de commande ne defile plus. Quitter et enregistrer etaient
 * en bas de deux mille pixels de formulaire ; ils sont maintenant a
 * portee ou qu on soit.
 *
 * Le type d objectif ne s affiche plus en trois grandes cartes dont
 * une seule est vraie : il se fixe a la creation, un releve d une
 * ligne suffit a le dire.
 *
 * L image rejoint la vignette de l identite, a la place qu elle
 * occupe dans la fiche, au lieu d une section a elle seule.
 */
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { Difficulte } from "@/hooks/useGoalDetail";
import {
  ArrowLeft, Check, X, Target, Tag, ListOrdered, Calendar, Receipt,
  StickyNote, Sparkles, Crown, Filter, HandIcon, Zap, TriangleAlert,
} from "lucide-react";
import { GOAL_TAGS, DIFFICULTY_OPTIONS, getTagLabel } from "@/lib/goalConstants";
import { GoalImageUpload } from "@/components/GoalImageUpload";
import { CostItemsEditor, type CostItemData } from "@/components/goals/CostItemsEditor";
import { EditStepsList, type EditStepItem } from "@/components/goals/EditStepsList";
import {
  GoalSelectionList, AutoBuildRuleEditor, filterGoalsByRule, type SuperGoalRule,
} from "@/components/goals/super";
import type { Goal } from "@/hooks/useGoals";
import { encreSurFond } from "@/components/goals/detail/dossier/encre";
import type { GoalDetailData } from "@/hooks/useGoalDetail";
import "@/styles/cyberpunk.css";
import "@/styles/goal-dossier.css";
import "@/styles/goal-editeur.css";

interface Step {
  id: string;
  title: string;
  order: number;
  /* Nullable en base : une etape peut ne pas avoir de statut. */
  status: string | null;
  notes?: string | null;
}

interface GoalDetailEditOverlayProps {
  isOpen: boolean;
  goal: GoalDetailData;
  userId: string | undefined;
  steps: Step[];
  editName: string; setEditName: (v: string) => void;
  /* Le selecteur ne propose que des paliers valides : le type le dit,
     au lieu d accepter n importe quelle chaine. */
  editDifficulty: string; setEditDifficulty: (v: Difficulte) => void;
  editTags: string[]; toggleEditTag: (tag: string) => void;
  editNotes: string; setEditNotes: (v: string) => void;
  editStartDate: string; setEditStartDate: (v: string) => void;
  editCompletionDate: string; setEditCompletionDate: (v: string) => void;
  editDeadline: string; setEditDeadline: (v: string) => void;
  editImage: string; setEditImage: (v: string) => void;
  editStepItems: EditStepItem[];
  onStepItemsChange: (items: EditStepItem[]) => void;
  editCostItems: CostItemData[];
  setEditCostItems: (items: CostItemData[]) => void;
  /* La composition d un groupe — ce qu il demande, comme les etapes
     sont ce que demande un objectif ordinaire. */
  allGoals: Goal[];
  editMembresIds: string[]; setEditMembresIds: (v: string[]) => void;
  editRegle: SuperGoalRule; setEditRegle: (v: SuperGoalRule) => void;
  editVivant: boolean; setEditVivant: (v: boolean) => void;
  editModeGroupe: "manual" | "auto"; setEditModeGroupe: (v: "manual" | "auto") => void;
  /* La duree d une habitude — ce qu elle demande, comme les etapes
     pour un objectif ordinaire et les astres pour une constellation. */
  editDuree: number; setEditDuree: (v: number) => void;
  customDifficultyActive: boolean;
  customDifficultyName: string;
  customDifficultyColor: string;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  onAddToWishlist?: (item: CostItemData) => void;
}

const NOTES_MAX = 500;

export const GoalDetailEditOverlay = React.memo(function GoalDetailEditOverlay(props: GoalDetailEditOverlayProps) {
  const { t } = useTranslation();
  const {
    isOpen, goal, userId, steps,
    editName, setEditName, editDifficulty, setEditDifficulty,
    editTags, toggleEditTag, editNotes, setEditNotes,
    editStartDate, setEditStartDate, editCompletionDate, setEditCompletionDate,
    editDeadline, setEditDeadline, editImage, setEditImage,
    editStepItems, onStepItemsChange, editCostItems, setEditCostItems,
    allGoals, editMembresIds, setEditMembresIds, editRegle, setEditRegle,
    editVivant, setEditVivant, editModeGroupe, setEditModeGroupe,
    editDuree, setEditDuree,
    customDifficultyActive, customDifficultyName, customDifficultyColor,
    saving, onSave, onClose, onAddToWishlist,
  } = props;

  /* Echap ferme l atelier — en passant par onClose, qui porte la garde
     des modifications non enregistrees. Et la page dessous cesse de
     defiler tant qu il est ouvert : deux barres de defilement
     imbriquees donnent l impression que rien ne bouge. */
  useEffect(() => {
    if (!isOpen) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", surTouche);
    const defilementInitial = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", surTouche);
      document.body.style.overflow = defilementInitial;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const paliers = [
    ...DIFFICULTY_OPTIONS,
    ...(customDifficultyActive
      ? [{ value: "custom" as const, label: customDifficultyName || "Custom", color: customDifficultyColor }]
      : []),
  ];
  const teinte = paliers.find((p) => p.value === editDifficulty)?.color || "#94a3b8";

  const estHabitude = goal.goal_type === "habit";
  const estGroupe = goal.goal_type === "super";

  /* Le vivier : tout sauf les groupes, et sauf lui-meme. On ne met pas
     un groupe dans un groupe, ni un groupe dans lui-meme. */
  const vivier = allGoals.filter((g) => g.id !== goal.id && g.goal_type !== "super");
  const nombreDeMembres = editModeGroupe === "manual"
    ? editMembresIds.length
    : filterGoalsByRule(vivier, editRegle).length;

  /* RACCOURCIR UNE HABITUDE PEUT EFFACER DES JOURS TENUS.
   *
   * La duree commande la taille du tableau de cases. L allonger ajoute
   * des jours vides, ce qui ne coute rien. La raccourcir coupe la fin
   * du tableau — et avec elle, les jours qu on avait tenus au-dela de
   * la nouvelle limite. On compte donc ce qui serait perdu et on le dit
   * avant, plutot que de le decouvrir apres. */
  const cochesActuelles = goal.habit_checks ?? [];
  const dureeActuelle = goal.habit_duration_days ?? cochesActuelles.length;
  const joursPerdus = estHabitude && editDuree < dureeActuelle
    ? cochesActuelles.slice(editDuree).filter(Boolean).length
    : 0;
  const TypeIcone = estGroupe ? Crown : estHabitude ? Sparkles : ListOrdered;
  const typeNom = estGroupe
    ? t("goals.edit.typeGroup", "Constellation")
    : estHabitude
      ? t("goals.edit.typeHabit", "Habitude")
      : t("goals.edit.typeNormal", "Objectif ordinaire");

  const contenu = (
    <div className="ge" role="dialog" aria-modal="true" aria-label={t("goals.edit.title", "Modifier l'objectif")}>
      <span className="ge-fond" aria-hidden="true" />

      <header className="ge-barre">
        <button type="button" className="ge-bouton ge-bouton--retour" onClick={onClose} disabled={saving}>
          <ArrowLeft size={13} aria-hidden="true" />
          <span className="ge-mot">{t("goals.detail.back", "Retour")}</span>
        </button>
        <h1 className="ge-titre">
          <span className="ge-mot">{t("goals.edit.title", "Modifier")}</span>
          <b>{goal.name}</b>
        </h1>
        <div className="ge-barre-fin">
          <button
            type="button"
            className="ge-bouton"
            onClick={onClose}
            disabled={saving}
            aria-label={t("common.cancel", "Annuler")}
          >
            <X size={13} aria-hidden="true" />
            <span className="ge-mot">{t("common.cancel", "Annuler")}</span>
          </button>
          <button type="button" className="ge-bouton ge-bouton--valider" onClick={onSave} disabled={saving}>
            <Check size={13} aria-hidden="true" />
            {saving ? t("goals.edit.saving", "Enregistrement…") : t("goals.edit.save", "Enregistrer")}
          </button>
        </div>
      </header>

      <div className="ge-corps">
        <div className="ge-grille">
          {/* ── Ce qu est l objectif ── */}
          <div className="ge-colonne">
            <section className="ge-volet">
              <header className="ge-tete">
                <Target size={12} aria-hidden="true" />
                {t("goals.edit.identity", "Identité")}
              </header>
              <div className="ge-corps-volet">
                <div className="ge-identite">
                  {userId && (
                    <div className="ge-vignette" style={{ ["--t" as string]: teinte }}>
                      <GoalImageUpload value={editImage} onChange={setEditImage} userId={userId} />
                    </div>
                  )}
                  <div className="ge-identite-corps">
                    <div className="ge-champ">
                      <label className="ge-etiquette" htmlFor="ge-nom">
                        {t("goals.edit.name", "Nom")} <i aria-hidden="true">*</i>
                      </label>
                      <input
                        id="ge-nom"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={100}
                      />
                    </div>
                    <div className="ge-type">
                      <TypeIcone size={12} aria-hidden="true" />
                      {typeNom}
                      <span>{t("goals.edit.typeFixed", "fixé à la création")}</span>
                    </div>
                  </div>
                </div>

                <div className="ge-champ">
                  <span className="ge-etiquette">{t("goals.edit.difficulty", "Palier")}</span>
                  <div className="ge-pastilles">
                    {paliers.map((p) => {
                      const choisi = editDifficulty === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          className="ge-pastille"
                          aria-pressed={choisi}
                          onClick={() => setEditDifficulty(p.value)}
                          style={choisi
                            ? { ["--c" as string]: p.color, ["--encre" as string]: encreSurFond(p.color) }
                            : undefined}
                        >
                          {p.value === "custom"
                            ? customDifficultyName || t("goals.difficulties.custom")
                            : t(`goals.difficulties.${p.value}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ge-champ">
                  <span className="ge-etiquette">
                    <Tag size={11} aria-hidden="true" />
                    {t("goals.edit.tags", "Étiquettes")} <i aria-hidden="true">*</i>
                  </span>
                  <div className="ge-pastilles">
                    {GOAL_TAGS.map((tag) => {
                      const choisi = editTags.includes(tag.value);
                      return (
                        <button
                          key={tag.value}
                          type="button"
                          className="ge-pastille"
                          aria-pressed={choisi}
                          onClick={() => toggleEditTag(tag.value)}
                          style={choisi
                            ? { ["--c" as string]: tag.color, ["--encre" as string]: encreSurFond(tag.color) }
                            : undefined}
                        >
                          {choisi && <Check size={10} aria-hidden="true" />}
                          {getTagLabel(tag.value, t)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="ge-aide">
                    {t("goals.edit.tagsHint", "La première sélectionnée devient l'étiquette principale.")}
                  </p>
                </div>
              </div>
            </section>

            <section className="ge-volet">
              <header className="ge-tete">
                <Calendar size={12} aria-hidden="true" />
                {t("goals.edit.dates", "Calendrier")}
              </header>
              <div className="ge-corps-volet">
                <div className="ge-duo">
                  <div className="ge-champ">
                    <label className="ge-etiquette" htmlFor="ge-debut">{t("goals.detail.startDate", "Début")}</label>
                    <input id="ge-debut" type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                  </div>
                  <div className="ge-champ">
                    <label className="ge-etiquette" htmlFor="ge-fin">{t("goals.detail.completionDate", "Fin")}</label>
                    <input id="ge-fin" type="date" value={editCompletionDate} onChange={(e) => setEditCompletionDate(e.target.value)} />
                  </div>
                </div>
                <div className="ge-champ">
                  <label className="ge-etiquette" htmlFor="ge-echeance">{t("goals.edit.deadline", "Échéance")}</label>
                  <input id="ge-echeance" type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                  <p className="ge-aide">
                    {t("goals.edit.deadlineHint", "Une échéance allume le compte à rebours sur la carte de l'objectif.")}
                  </p>
                </div>
              </div>
            </section>

            <section className="ge-volet">
              <header className="ge-tete">
                <StickyNote size={12} aria-hidden="true" />
                {t("goals.detail.notes", "Notes")}
                <b>{editNotes.length}/{NOTES_MAX}</b>
              </header>
              <div className="ge-corps-volet">
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={5}
                  maxLength={NOTES_MAX}
                  placeholder={t("goals.edit.notesPlaceholder", "Ce qu'il faut se rappeler à propos de cet objectif…")}
                  aria-label={t("goals.detail.notes", "Notes")}
                />
              </div>
            </section>
          </div>

          {/* ── Ce qu il demande ── */}
          <div className="ge-colonne">
            {!estHabitude && !estGroupe ? (
              <section className="ge-volet">
                <header className="ge-tete">
                  <ListOrdered size={12} aria-hidden="true" />
                  {t("goals.detail.steps", "Étapes")}
                  <b>{editStepItems.length}</b>
                </header>
                <div className="ge-embarque">
                  <EditStepsList items={editStepItems} onItemsChange={onStepItemsChange} />
                </div>
              </section>
            ) : estGroupe ? (
              <section className="ge-volet">
                <header className="ge-tete">
                  <Crown size={12} aria-hidden="true" />
                  {t("goals.new.members", "Astres")}
                  <b>{nombreDeMembres}</b>
                </header>
                <div className="ge-corps-volet">
                  <div className="ge-champ">
                    <span className="ge-etiquette">{t("goals.new.buildMode", "Composition")}</span>
                    <div className="ge-pastilles">
                      <button
                        type="button"
                        className="ge-pastille ge-pastille--bascule"
                        aria-pressed={editModeGroupe === "manual"}
                        onClick={() => setEditModeGroupe("manual")}
                      >
                        <HandIcon size={10} aria-hidden="true" />
                        {t("goals.new.manual", "Choisis à la main")}
                      </button>
                      <button
                        type="button"
                        className="ge-pastille ge-pastille--bascule"
                        aria-pressed={editModeGroupe === "auto"}
                        onClick={() => setEditModeGroupe("auto")}
                      >
                        <Filter size={10} aria-hidden="true" />
                        {t("goals.new.auto", "Par une règle")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ge-embarque">
                  {editModeGroupe === "manual" ? (
                    <GoalSelectionList
                      goals={vivier}
                      selectedIds={editMembresIds}
                      onSelectionChange={setEditMembresIds}
                      customDifficultyName={customDifficultyName}
                      customDifficultyColor={customDifficultyColor}
                    />
                  ) : (
                    <AutoBuildRuleEditor
                      rule={editRegle}
                      onRuleChange={setEditRegle}
                      goals={vivier}
                      customDifficultyName={customDifficultyName}
                      customDifficultyActive={customDifficultyActive}
                    />
                  )}
                </div>

                {editModeGroupe === "auto" && (
                  <div className="ge-corps-volet">
                    <div className="ge-champ">
                      <div className="ge-pastilles">
                        <button
                          type="button"
                          className="ge-pastille ge-pastille--bascule"
                          aria-pressed={editVivant}
                          onClick={() => setEditVivant(!editVivant)}
                        >
                          <Zap size={10} aria-hidden="true" />
                          {t("goals.new.dynamic", "Constellation vivante")}
                        </button>
                      </div>
                      <p className="ge-aide">
                        {editVivant
                          ? t("goals.new.dynamicOn", "La règle est rejouée en permanence : tout objectif qui y répondra plus tard rejoindra la constellation.")
                          : t("goals.new.dynamicOff", "La règle sert une fois, au moment où tu enregistres. Les membres sont ensuite figés.")}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section className="ge-volet">
                <header className="ge-tete">
                  <Sparkles size={12} aria-hidden="true" />
                  {t("goals.new.rhythm", "Rythme")}
                  <b>{editDuree}{t("goals.new.daysShort", " j")}</b>
                </header>
                <div className="ge-corps-volet">
                  <div className="ge-champ">
                    <label className="ge-etiquette" htmlFor="ge-jours">
                      {t("goals.new.durationDays", "Durée en jours")}
                    </label>
                    <input
                      id="ge-jours"
                      type="number"
                      min={1}
                      max={365}
                      value={editDuree}
                      onChange={(e) =>
                        setEditDuree(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))
                      }
                      autoComplete="off"
                    />
                    <p className="ge-aide">
                      {t("goals.new.durationHint", "Une case à cocher par jour, et l'habitude est franchie au dernier.")}
                    </p>
                  </div>

                  {joursPerdus > 0 && (
                    <p className="ge-alerte">
                      <TriangleAlert size={11} aria-hidden="true" />
                      {t("goals.edit.habitShrink", {
                        defaultValue:
                          "Raccourcir à {{duree}} jours effacera {{perdus}} jour(s) déjà tenu(s) au-delà.",
                        duree: editDuree,
                        perdus: joursPerdus,
                      })}
                    </p>
                  )}

                  <p className="ge-aide">
                    {t("goals.edit.habitNoSteps", "Une habitude n'a pas d'étapes : elle se coche jour après jour.")}
                  </p>
                </div>
              </section>
            )}

            <section className="ge-volet">
              <header className="ge-tete">
                <Receipt size={12} aria-hidden="true" />
                {t("goals.detail.ledger", "Registre")}
                <b>{editCostItems.length}</b>
              </header>
              <div className="ge-embarque">
                <CostItemsEditor
                  items={editCostItems}
                  onChange={setEditCostItems}
                  legacyTotal={goal.estimated_cost ?? 0}
                  steps={steps}
                  onAddToWishlist={onAddToWishlist}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(contenu, document.body);
});
