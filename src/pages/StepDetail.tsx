/**
 * L ETABLI — modifier une etape.
 *
 * Troisieme membre de la famille de l atelier, apres la creation d un
 * objectif et sa modification. Il parlait encore la langue qu on a
 * retiree des deux autres : un titre en degrade de quarante-huit
 * pixels, des cartes de statut de deux cents pixels pour un choix qui
 * n en compte que deux, et le bouton qui engage tout en bas.
 *
 * Il reprend donc le meme chassis — meme calque plein cadre, meme
 * barre de commande qui ne defile pas, memes volets, memes jetons.
 *
 * Deux choses qu il ne disait pas.
 *
 * De quel objectif l etape vient. On modifiait une etape sans savoir
 * a quoi elle appartenait, alors que c est la premiere chose qu on
 * veut verifier en arrivant. L objectif s affiche, avec sa teinte, et
 * son nom mene a sa fiche.
 *
 * Ce que l etape est. Une etape ultime ne compte pas dans
 * l avancement et porte l objectif au zenith une fois franchie : la
 * page le dit, meme si c est la fiche de l objectif qui la designe.
 */
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { synchroniserGroupes } from "@/lib/superGoals";
import { getDifficultyColor } from "@/lib/utils";
import { encreSurFond } from "@/components/goals/detail/dossier/encre";
import { toast } from "sonner";
import {
  ArrowLeft, Check, X, Target, StickyNote, Dices, Sparkle, ListOrdered, Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { DSPageLoader } from "@/components/ds";
import "@/styles/cyberpunk.css";
import "@/styles/goal-dossier.css";
import "@/styles/goal-editeur.css";

interface Step {
  id: string;
  goal_id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  order: number;
  status: string | null;
  due_date?: string | null;
  completion_date?: string | null;
  validated_at?: string | null;
  exclude_from_spin: boolean;
  is_ultimate?: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface ObjectifPorteur {
  id: string;
  name: string;
  difficulty: string;
}

const NOTES_MAX = 500;

export default function StepDetail() {
  const { stepId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step | null>(null);
  const [objectif, setObjectif] = useState<ObjectifPorteur | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  /* La colonne steps.status n accepte que ces deux valeurs. L etat
     local etait une chaine libre, et le transtypage en Record cachait
     l ecart : on pouvait envoyer n importe quoi a la base. */
  const [status, setStatus] = useState<"pending" | "completed">("pending");
  const [excludeFromSpin, setExcludeFromSpin] = useState(false);

  const loadStepData = useCallback(async () => {
    /* stepId vient de l URL : il peut manquer, et une requete sur un
       identifiant absent ne rendrait rien de bon. */
    if (!stepId) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data: stepData, error: stepError } = await supabase
        .from("steps").select("*").eq("id", stepId).single();
      if (stepError) throw stepError;
      setStep(stepData);
      setTitle(stepData.title);
      setNotes(stepData.notes || "");
      setStatus(stepData.status === "completed" ? "completed" : "pending");
      setExcludeFromSpin(stepData.exclude_from_spin ?? false);

      /* L objectif porteur, pour sa teinte et son nom : on ne modifie
         pas une etape sans savoir a quoi elle appartient. */
      const { data: goalData } = await supabase
        .from("goals").select("id, name, difficulty").eq("id", stepData.goal_id).maybeSingle();
      if (goalData) setObjectif(goalData as ObjectifPorteur);
    } catch (error) {
      console.error("Error loading step:", error);
      toast.error("Error", { description: "Failed to load step details" });
    } finally {
      setLoading(false);
    }
  }, [stepId]);

  useEffect(() => {
    if (user && stepId) loadStepData();
  }, [user, stepId, loadStepData]);

  /* Le calque prend tout l ecran : la page dessous cesse de defiler,
     comme pour les deux autres editeurs. */
  useEffect(() => {
    const defilementInitial = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = defilementInitial; };
  }, []);

  const quitter = useCallback(() => {
    if (step) navigate(`/goals/${step.goal_id}`);
    else navigate("/goals");
  }, [step, navigate]);

  const recalculateGoalProgress = async (goalId: string) => {
    try {
      const { data: stepsData, error: stepsError } = await supabase
        .from("steps")
        .select("id, status")
        .eq("goal_id", goalId)
        // L etape ultime ne compte pas dans l avancement.
        .eq("is_ultimate", false);
      if (stepsError) throw stepsError;
      const completedCount = stepsData?.filter((s) => s.status === "completed").length || 0;
      const { data: majGoal } = await supabase
        .from("goals")
        .update({ validated_steps: completedCount })
        .eq("id", goalId)
        .select("pact_id")
        .maybeSingle();

      /* Un objectif ne vit pas seul : les constellations qui le
         comptent suivent son avancement. La fiche le faisait deja,
         cette page non — cocher une derniere etape depuis ici laissait
         donc la constellation en arriere. */
      if (majGoal?.pact_id) await synchroniserGroupes(majGoal.pact_id);
    } catch (error) {
      console.error("Error recalculating goal progress:", error);
    }
  };

  const handleSave = async () => {
    if (!step || saving) return;
    try {
      setSaving(true);
      /* Le type de la table, pas un Record libre : un objet a
         signature d index fait echouer RejectExcessProperties de
         Supabase, qui ne peut plus prouver l absence de proprietes en
         trop. C est la cause de l erreur TS2345 qui trainait ici. */
      const updates: TablesUpdate<"steps"> = {
        title,
        notes,
        status,
        exclude_from_spin: excludeFromSpin,
        updated_at: new Date().toISOString(),
      };

      if (status === "completed" && !step.validated_at) {
        updates.completion_date = new Date().toISOString();
        updates.validated_at = new Date().toISOString();
      }

      const { error } = await supabase.from("steps").update(updates).eq("id", step.id);
      if (error) throw error;

      await recalculateGoalProgress(step.goal_id);

      /* « goals » couvre aussi le front : sa cle commence par ce
         prefixe, et React Query invalide par prefixe. */
      queryClient.invalidateQueries({ queryKey: ["goal-detail", step.goal_id] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });

      toast.success("Success", { description: "Step updated successfully" });
      navigate(`/goals/${step.goal_id}`);
    } catch (error) {
      console.error("Error saving step:", error);
      toast.error("Error", { description: error instanceof Error ? error.message : String(error) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DSPageLoader />;

  if (!step) {
    return (
      <div className="ge" role="dialog" aria-modal="true">
        <span className="ge-fond" aria-hidden="true" />
        <header className="ge-barre">
          <button type="button" className="ge-bouton" onClick={() => navigate("/goals")}>
            <ArrowLeft size={13} aria-hidden="true" />
            {t("goals.detail.back", "Retour")}
          </button>
        </header>
        <div className="ge-corps">
          <p className="ge-aide">{t("steps.notFound", "Étape introuvable")}</p>
        </div>
      </div>
    );
  }

  const teinte = getDifficultyColor(objectif?.difficulty);
  const faite = status === "completed";
  const dateFr = (v?: string | null) => (v ? format(new Date(v), "d MMM yyyy") : null);

  const contenu = (
    <div className="ge" role="dialog" aria-modal="true" aria-label={t("steps.edit", "Modifier l'étape")}>
      <span className="ge-fond" aria-hidden="true" />

      <header className="ge-barre">
        <button type="button" className="ge-bouton ge-bouton--retour" onClick={quitter} disabled={saving}>
          <ArrowLeft size={13} aria-hidden="true" />
          <span className="ge-mot">{t("goals.detail.back", "Retour")}</span>
        </button>
        <h1 className="ge-titre">
          <span className="ge-mot">{t("steps.edit", "Modifier")}</span>
          <b>{title.trim() || t("steps.untitled", "Étape sans nom")}</b>
        </h1>
        <div className="ge-barre-fin">
          <button type="button" className="ge-bouton" onClick={quitter} disabled={saving}>
            <X size={13} aria-hidden="true" />
            <span className="ge-mot">{t("common.cancel", "Annuler")}</span>
          </button>
          <button
            type="button"
            className="ge-bouton ge-bouton--valider"
            onClick={handleSave}
            disabled={saving || !title.trim()}
          >
            <Check size={13} aria-hidden="true" />
            {saving ? t("goals.edit.saving", "Enregistrement…") : t("goals.edit.save", "Enregistrer")}
          </button>
        </div>
      </header>

      <div className="ge-corps">
        <div className="ge-grille ge-grille--simple">
          <div className="ge-colonne">
            <section className="ge-volet">
              <header className="ge-tete">
                <Target size={12} aria-hidden="true" />
                {t("goals.edit.identity", "Identité")}
              </header>
              <div className="ge-corps-volet">
                <div className="ge-champ">
                  <label className="ge-etiquette" htmlFor="et-nom">
                    {t("steps.name", "Nom de l'étape")} <i aria-hidden="true">*</i>
                  </label>
                  <input
                    id="et-nom"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    autoComplete="off"
                    placeholder={t("steps.namePlaceholder", "Ce qu'il y a à faire…")}
                  />
                </div>

                {/* D ou vient cette etape : la premiere chose a verifier
                    en arrivant, et elle manquait. */}
                {objectif && (
                  <button
                    type="button"
                    className="ge-porteur"
                    onClick={() => navigate(`/goals/${objectif.id}`)}
                    style={{ ["--t" as string]: teinte }}
                    title={t("steps.openGoal", "Ouvrir l'objectif")}
                  >
                    <ListOrdered size={12} aria-hidden="true" />
                    <span>{objectif.name}</span>
                    <b>#{step.order}</b>
                  </button>
                )}

                {step.is_ultimate && (
                  <p className="ge-alerte">
                    <Sparkle size={11} aria-hidden="true" />
                    {t("steps.isUltimate", "Étape ultime : hors avancement, elle porte l'objectif au zénith.")}
                  </p>
                )}
              </div>
            </section>

            <section className="ge-volet">
              <header className="ge-tete">
                <Check size={12} aria-hidden="true" />
                {t("steps.state", "État")}
              </header>
              <div className="ge-corps-volet">
                {/* Une etape n a que deux etats : faite, ou pas. Deux
                    pastilles suffisent la ou il y avait deux cartes de
                    deux cents pixels. */}
                <div className="ge-champ">
                  <div className="ge-pastilles">
                    <button
                      type="button"
                      className="ge-pastille"
                      aria-pressed={!faite}
                      onClick={() => setStatus("pending")}
                      style={!faite
                        ? { ["--c" as string]: teinte, ["--encre" as string]: encreSurFond(teinte) }
                        : undefined}
                    >
                      {t("steps.pending", "À faire")}
                    </button>
                    <button
                      type="button"
                      className="ge-pastille"
                      aria-pressed={faite}
                      onClick={() => setStatus("completed")}
                      style={faite
                        ? { ["--c" as string]: "#00ff88", ["--encre" as string]: encreSurFond("#00ff88") }
                        : undefined}
                    >
                      <Check size={10} aria-hidden="true" />
                      {t("steps.completed", "Faite")}
                    </button>
                  </div>
                </div>

                <div className="ge-releve">
                  <Calendar size={11} aria-hidden="true" />
                  <span>{t("steps.created", "Créée")}</span>
                  <b>{dateFr(step.created_at) ?? "—"}</b>
                  {step.validated_at && (
                    <>
                      <span>{t("steps.validated", "Franchie")}</span>
                      <b>{dateFr(step.validated_at)}</b>
                    </>
                  )}
                </div>
              </div>
            </section>

            <section className="ge-volet">
              <header className="ge-tete">
                <Dices size={12} aria-hidden="true" />
                {t("steps.draw", "Tirage")}
              </header>
              <div className="ge-corps-volet">
                <div className="ge-champ">
                  <div className="ge-pastilles">
                    <button
                      type="button"
                      className="ge-pastille ge-pastille--bascule"
                      aria-pressed={excludeFromSpin}
                      onClick={() => setExcludeFromSpin(!excludeFromSpin)}
                    >
                      <Dices size={10} aria-hidden="true" />
                      {t("steps.excluded", "Hors tirage")}
                    </button>
                  </div>
                  <p className="ge-aide">
                    {excludeFromSpin
                      ? t("steps.excludedOn", "Le tirage de mission ne proposera jamais cette étape.")
                      : t("steps.excludedOff", "Le tirage de mission peut proposer cette étape.")}
                  </p>
                </div>
              </div>
            </section>

            <section className="ge-volet">
              <header className="ge-tete">
                <StickyNote size={12} aria-hidden="true" />
                {t("goals.detail.notes", "Notes")}
                <b>{notes.length}/{NOTES_MAX}</b>
              </header>
              <div className="ge-corps-volet">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  maxLength={NOTES_MAX}
                  placeholder={t("steps.notesPlaceholder", "Ce qu'il faut se rappeler à propos de cette étape…")}
                  aria-label={t("goals.detail.notes", "Notes")}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(contenu, document.body);
}
