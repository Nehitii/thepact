import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { trackGoalCreated } from "@/domaines/succes";
import { insertGoalTags } from "@/hooks/useGoalTags";
import { useGoals } from "@/hooks/useGoals";
import { usePact } from "@/hooks/usePact";
import {
  ArrowLeft, Target, Sparkles, Calendar, ListOrdered, StickyNote,
  Receipt, Tag, Zap, Check, X, Crown, Filter, HandIcon, Compass,
} from "lucide-react";
import { EditStepsList, EditStepItem } from "@/components/goals/EditStepsList";
import { toast } from "sonner";
import { GoalImageUpload } from "@/components/GoalImageUpload";
import { CostItemsEditor, CostItemData } from "@/components/goals/CostItemsEditor";
import { GoalSelectionList, AutoBuildRuleEditor, SuperGoalRule, filterGoalsByRule } from "@/components/goals/super";
import { GOAL_TAGS, DIFFICULTY_OPTIONS, getTagLabel } from "@/lib/goalConstants";
import { encreSurFond } from "@/components/goals/detail/dossier/encre";
import { z } from "zod";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { Sparkles as SparklesIcon, Loader2 } from "lucide-react";
import "@/styles/cyberpunk.css";
import "@/styles/goal-dossier.css";
import "@/styles/goal-editeur.css";
import { messageDErreur } from "@/lib/erreurs";
import type { Json } from "@/integrations/supabase/types";

// ... (Le schéma Zod reste inchangé)
const goalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Goal name is required" })
    .max(100, { message: "Goal name must be less than 100 characters" }),
  type: z.array(z.string()).min(1, { message: "At least one tag is required" }),
  /* L'enum de la base, moins « custom » qui se règle ailleurs. Le
     déclarer « z.string() » laissait n'importe quelle valeur descendre
     jusqu'au refus de Postgres. */
  difficulty: z.enum(["easy", "medium", "hard", "extreme", "impossible", "custom"]),
  goalType: z.enum(["normal", "habit", "super"]),
  stepCount: z
    .number()
    .int()
    .min(1, { message: "Must have at least 1 step" })
    .max(20, { message: "Cannot have more than 20 steps" })
    .optional(),
  habitDurationDays: z
    .number()
    .int()
    .min(1, { message: "Must be at least 1 day" })
    .max(365, { message: "Cannot exceed 365 days" })
    .optional(),
  notes: z.string().max(500, { message: "Notes must be less than 500 characters" }).optional(),
});

const NOTES_MAX = 500;

export default function NewGoal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: pactData } = usePact(user?.id);
  const { data: existingGoals = [] } = useGoals(pactData?.id, { includeStepCounts: true, includeTags: true });

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["personal"]);
  const [difficulty, setDifficulty] = useState("medium");
  const [notes, setNotes] = useState("");
  const [stepCount, setStepCount] = useState(5);
  const [goalType, setGoalType] = useState<"normal" | "habit" | "super">("normal");
  const [habitDurationDays, setHabitDurationDays] = useState(7);
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyActive, setCustomDifficultyActive] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [costItems, setCostItems] = useState<CostItemData[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [deadline, setDeadline] = useState("");
  const [stepItems, setStepItems] = useState<EditStepItem[]>(
    Array.from({ length: 5 }, (_, i) => ({ name: `Step ${i + 1}`, key: `init-${i}` })),
  );

  // Super Goal specific state
  const [superBuildMode, setSuperBuildMode] = useState<"manual" | "auto">("manual");
  const [selectedChildGoalIds, setSelectedChildGoalIds] = useState<string[]>([]);
  const [superGoalRule, setSuperGoalRule] = useState<SuperGoalRule>({});
  const [isDynamicSuper, setIsDynamicSuper] = useState(false);

  // Custom difficulty state
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");

  const { enabled: aiDecomposeEnabled } = useFeatureFlag("goal_decompose_ai");
  const [aiDecomposing, setAiDecomposing] = useState(false);

  const handleAiDecompose = async () => {
    if (!name.trim()) {
      toast.error("Renseigne d'abord un nom");
      return;
    }
    setAiDecomposing(true);
    try {
      const { data, error } = await supabase.functions.invoke("goal-decompose", {
        body: { name, description: notes, deadline, difficulty },
      });
      if (error) throw error;
      const steps = (data?.steps ?? []) as Array<{ title: string }>;
      if (!steps.length) throw new Error("Aucune étape suggérée");
      const items: EditStepItem[] = steps.slice(0, 20).map((s, i) => ({
        key: `ai-${Date.now()}-${i}`,
        name: s.title,
      }));
      setStepItems(items);
      setStepCount(items.length);
      if (data?.rationale) {
        toast.success("Décomposition IA appliquée", { description: data.rationale });
      } else {
        toast.success("Décomposition IA appliquée");
      }
    } catch (e: unknown) {
      toast.error("Échec décomposition IA", { description: messageDErreur(e) });
    } finally {
      setAiDecomposing(false);
    }
  };

  // Load custom difficulty settings
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("custom_difficulty_name, custom_difficulty_active, custom_difficulty_color")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setCustomDifficultyName(data.custom_difficulty_name || "Custom");
        setCustomDifficultyActive(data.custom_difficulty_active || false);
        if (data.custom_difficulty_color) {
          setCustomDifficultyColor(data.custom_difficulty_color);
        }
      }
    };
    loadProfile();
  }, [user]);

  /* LE MEME CALQUE QUE L ATELIER, DONC LES MEMES REGLAGES.
   *
   * La creation se pose par-dessus tout, comme la modification : deux
   * editeurs du meme objet ne peuvent pas s ouvrir de deux facons.
   * La page dessous cesse donc de defiler tant qu il est ouvert — deux
   * barres de defilement imbriquees donnent l impression que rien ne
   * bouge.
   *
   * Echap ne ferme que tant que rien n a ete saisi. Au-dela il
   * jetterait un formulaire a moitie rempli sans rien demander, la ou
   * l atelier, lui, a une garde sur les modifications non
   * enregistrees. Les etapes par defaut ne comptent pas comme une
   * saisie : elles sont la avant qu on ait touche a quoi que ce soit.
   */
  const rienSaisi =
    !name.trim() && !notes.trim() && !imageUrl &&
    costItems.length === 0 && selectedChildGoalIds.length === 0;

  useEffect(() => {
    const defilementInitial = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = defilementInitial; };
  }, []);

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape" && rienSaisi) {
        e.preventDefault();
        navigate("/goals");
      }
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [rienSaisi, navigate]);

  const allDifficulties = [
    ...DIFFICULTY_OPTIONS,
    ...(customDifficultyActive
      ? [{ value: "custom" as const, label: customDifficultyName || "Custom", color: customDifficultyColor }]
      : []),
  ];

  const toggleTag = (tagValue: string) => {
    setSelectedTags((prev) => (prev.includes(tagValue) ? prev.filter((t) => t !== tagValue) : [...prev, tagValue]));
  };

  const handleCreate = async () => {
    if (!user) {
      toast.error("Error", { description: "You must be logged in to create goals" });
      return;
    }

    // Validate super goal has child goals
    if (goalType === "super") {
      const childIds =
        superBuildMode === "manual"
          ? selectedChildGoalIds
          : filterGoalsByRule(existingGoals, superGoalRule).map((g) => g.id);

      if (childIds.length === 0) {
        toast.error("Error", { description: "Super Goal must contain at least one child goal" });
        return;
      }
    }

    try {
      const validatedData = goalSchema.parse({
        name: name.trim(),
        type: selectedTags,
        difficulty,
        goalType,
        stepCount: goalType === "normal" ? stepCount : undefined,
        habitDurationDays: goalType === "habit" ? habitDurationDays : undefined,
        notes: notes.trim(),
      });

      setLoading(true);

      const { data: pactResult } = await supabase.from("pacts").select("id").eq("user_id", user.id).single();
      if (!pactResult) {
        toast.error("Error", { description: "Pact not found" });
        setLoading(false);
        return;
      }

      const scoreMap = { easy: 10, medium: 25, hard: 50, extreme: 100, impossible: 200, custom: 500 };
      const potentialScore = scoreMap[difficulty as keyof typeof scoreMap] || 25;
      const habitChecks = goalType === "habit" ? Array(habitDurationDays).fill(false) : null;
      const totalEstimatedCost = costItems.reduce((sum, item) => sum + (item.price || 0), 0);

      /* ═══════════════════════════════════════════════════════════
         UNE ÉTIQUETTE N'EST PAS UN TYPE, ET LA BASE LE SAIT.

         `goals.type` est un enum à neuf valeurs. GOAL_TAGS en propose
         dix-huit, dont NEUF que l'enum refuse — arts, tech, travel,
         work, community, nature, spiritual, lifestyle, buying_selling.
         Vérifié en base : `select 'arts'::goal_type` échoue.

         Choisir « Arts » en PREMIÈRE étiquette faisait donc échouer la
         création de l'objectif, avec pour seul message « Failed to
         create goal ». Le `as any` sur l'insert rendait ce chemin muet
         à la compilation ; c'est l'utilisateur qui le découvrait.

         Les étiquettes sont de toute façon enregistrées à part, par
         `insertGoalTags` : rien n'est perdu à retomber sur « other ».
         ═══════════════════════════════════════════════════════════ */
      const TYPES_EN_BASE = [
        "personal", "professional", "health", "creative",
        "financial", "learning", "relationship", "diy", "other",
      ] as const;
      type TypeObjectif = (typeof TYPES_EN_BASE)[number];
      const estTypeDeBase = (v: string): v is TypeObjectif =>
        (TYPES_EN_BASE as readonly string[]).includes(v);

      const premiere = selectedTags[0] || "personal";
      const primaryType: TypeObjectif = estTypeDeBase(premiere) ? premiere : "other";

      /* La regle d'un groupe est une colonne jsonb : le type applicatif
         est plus etroit que Json, et la conversion a lieu ici, une fois. */
      let superGoalData: { child_goal_ids?: string[] | null; super_goal_rule?: Json; is_dynamic_super?: boolean } =
        {};
      if (goalType === "super") {
        if (superBuildMode === "manual") {
          superGoalData = {
            child_goal_ids: selectedChildGoalIds,
            is_dynamic_super: false,
          };
        } else {
          const matchedIds = filterGoalsByRule(existingGoals, superGoalRule).map((g) => g.id);
          superGoalData = {
            child_goal_ids: isDynamicSuper ? null : matchedIds,
            super_goal_rule: superGoalRule as unknown as Json,
            is_dynamic_super: isDynamicSuper,
          };
        }
      }

      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .insert({
          pact_id: pactResult.id,
          name: validatedData.name,
          type: primaryType,
          difficulty: validatedData.difficulty,
          estimated_cost: totalEstimatedCost,
          notes: validatedData.notes || null,
          /* L etape ultime est un bonus : elle n entre pas dans le
             total qui sert d avancement. */
          total_steps: goalType === "normal"
            ? stepItems.filter((i) => !i.estUltime).length
            : goalType === "habit" ? habitDurationDays : 0,
          potential_score: potentialScore,
          start_date: new Date(startDate).toISOString(),
          status: "not_started",
          goal_type: goalType,
          habit_duration_days: goalType === "habit" ? habitDurationDays : null,
          habit_checks: habitChecks,
          image_url: imageUrl || null,
          ...superGoalData,
          deadline: deadline || null,
        })
        .select()
        .single();

      if (goalError) throw goalError;

      await insertGoalTags(goalData.id, selectedTags);

      let createdSteps: { id: string; order: number }[] = [];
      if (goalType === "normal" && stepItems.length > 0) {
        const stepsToInsert = stepItems.map((item, i) => ({
          goal_id: goalData.id,
          title: item.name?.trim() || `Step ${i + 1}`,
          description: "",
          notes: "",
          order: i + 1,
          exclude_from_spin: item.excludeFromSpin ?? false,
          is_ultimate: item.estUltime ?? false,
        }));
        const { data: stepsData, error: stepsError } = await supabase
          .from("steps")
          .insert(stepsToInsert)
          .select("id, order");
        if (stepsError) throw stepsError;
        createdSteps = stepsData || [];
      }

      if (costItems.length > 0) {
        const stepIndexToId = new Map(createdSteps.map((s) => [`step-index-${s.order - 1}`, s.id]));
        const costItemsData = costItems.map((item) => ({
          goal_id: goalData.id,
          name: item.name,
          price: item.price || 0,
          category: item.category || null,
          step_id: item.stepId ? stepIndexToId.get(item.stepId) || null : null,
        }));
        await supabase.from("goal_cost_items").insert(costItemsData);

        // Recalculate estimated_cost from actual inserted items to guarantee sync
        const recalculatedCost = costItemsData.reduce((sum, item) => sum + item.price, 0);
        if (recalculatedCost !== totalEstimatedCost) {
          await supabase.from("goals").update({ estimated_cost: recalculatedCost }).eq("id", goalData.id);
        }
      }

      setTimeout(() => {
        trackGoalCreated(user.id, difficulty);
      }, 0);
      toast.success(goalType === "super" ? "Super Goal Created" : "Goal Created", { description: "Your Pact evolution has been added" });
      navigate(`/goals/${goalData.id}`);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        toast.error("Validation Error", { description: error.errors[0].message });
      } else {
        toast.error("Error", { description: messageDErreur(error, "Failed to create goal") });
      }
    } finally {
      setLoading(false);
    }
  };

  const paliers = allDifficulties;
  const teinte = paliers.find((p) => p.value === difficulty)?.color || "#94a3b8";

  const estOrdinaire = goalType === "normal";
  const estHabitude = goalType === "habit";
  const estGroupe = goalType === "super";

  /* Le nombre de membres qu aura le groupe : declares en mode manuel,
     calcules par la regle en mode automatique. C est ce que le volet
     annonce, et c est la condition que la creation verifie. */
  const membresDuGroupe = estGroupe
    ? (superBuildMode === "manual"
        ? selectedChildGoalIds.length
        : filterGoalsByRule(existingGoals, superGoalRule).length)
    : 0;

  const TYPES = [
    {
      valeur: "normal" as const,
      icone: ListOrdered,
      nom: t("goals.edit.typeNormal", "Objectif"),
      quoi: t("goals.new.typeNormalWhat", "Des étapes à franchir"),
    },
    {
      valeur: "habit" as const,
      icone: Sparkles,
      nom: t("goals.edit.typeHabit", "Habitude"),
      quoi: t("goals.new.typeHabitWhat", "Un jour après l'autre"),
    },
    {
      valeur: "super" as const,
      icone: Crown,
      nom: t("goals.edit.typeGroup", "Constellation"),
      quoi: t("goals.new.typeGroupWhat", "Des objectifs lus comme un seul"),
    },
  ];

  /* Ce qui manque pour creer. On le dit avant de refuser, plutot que de
     laisser un bouton eteint sans raison visible. */
  const manque = !name.trim()
    ? t("goals.new.needName", "Il manque le nom")
    : selectedTags.length === 0
      ? t("goals.new.needTag", "Il manque une étiquette")
      : estGroupe && membresDuGroupe === 0
        ? t("goals.new.needMembers", "Il manque au moins un membre")
        : null;

  /* PAR-DESSUS TOUT, DONC PAR LE MEME CHEMIN QUE L ATELIER.
   *
   * « position: fixed » et « z-index: 9999 » ne suffisent pas : un
   * z-index ne se compare qu a l interieur de son contexte
   * d empilement. Rendu dans <main>, ce cadre restait sous la barre
   * laterale — mesure faite, un lien de navigation repondait encore au
   * pointeur a l endroit ou le cadre etait cense se trouver, alors
   * meme qu il portait 9999 contre 50. La barre laterale ne gagnait
   * pas par son z-index mais par celui de son parent.
   *
   * L atelier de modification n avait pas ce probleme parce qu il se
   * rend dans <body> par un portail. La creation emprunte le meme
   * chemin : c est ce qui fait que les deux se posent vraiment de la
   * meme facon, et non seulement qu ils se ressemblent.
   */
  const contenu = (
    <div className="ge" role="dialog" aria-modal="true" aria-label={t("goals.new.title", "Créer")}>
      <span className="ge-fond" aria-hidden="true" />

      <header className="ge-barre">
        <button
          type="button"
          className="ge-bouton ge-bouton--retour"
          onClick={() => navigate("/goals")}
          disabled={loading}
        >
          <ArrowLeft size={13} aria-hidden="true" />
          <span className="ge-mot">{t("goals.detail.back", "Retour")}</span>
        </button>
        <h1 className="ge-titre">
          <span className="ge-mot">{t("goals.new.title", "Créer")}</span>
          <b>{name.trim() || t("goals.new.untitled", "Sans nom")}</b>
        </h1>
        <div className="ge-barre-fin">
          {manque && <span className="ge-aide">{manque}</span>}
          <button type="button" className="ge-bouton" onClick={() => navigate("/goals")} disabled={loading}>
            <X size={13} aria-hidden="true" />
            <span className="ge-mot">{t("common.cancel", "Annuler")}</span>
          </button>
          <button
            type="button"
            className="ge-bouton ge-bouton--valider"
            onClick={handleCreate}
            disabled={loading || !!manque}
          >
            <Check size={13} aria-hidden="true" />
            {loading ? t("goals.new.creating", "Création…") : t("goals.new.create", "Créer")}
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
                  {user && (
                    <div className="ge-vignette" style={{ ["--t" as string]: teinte }}>
                      <GoalImageUpload value={imageUrl} onChange={setImageUrl} userId={user.id} />
                    </div>
                  )}
                  <div className="ge-identite-corps">
                    <div className="ge-champ">
                      <label className="ge-etiquette" htmlFor="ge-nom">
                        {t("goals.edit.name", "Nom")} <i aria-hidden="true">*</i>
                      </label>
                      <input
                        id="ge-nom"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        autoComplete="off"
                        placeholder={t("goals.new.namePlaceholder", "Ce qu'on se promet…")}
                      />
                    </div>
                  </div>
                </div>

                {/* Le seul choix de ce formulaire qui ne se reprend pas. */}
                <div className="ge-champ">
                  <span className="ge-etiquette">
                    {t("goals.new.type", "Type")}
                    <span className="ge-aide">{t("goals.edit.typeFixed", "fixé à la création")}</span>
                  </span>
                  <div className="ge-types" role="group" aria-label={t("goals.new.type", "Type")}>
                    {TYPES.map(({ valeur, icone: Icone, nom, quoi }) => (
                      <button
                        key={valeur}
                        type="button"
                        className="ge-type-seg"
                        aria-pressed={goalType === valeur}
                        onClick={() => setGoalType(valeur)}
                      >
                        <Icone size={14} aria-hidden="true" />
                        {nom}
                        <small>{quoi}</small>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Un groupe n a pas de palier propre : il herite de ses
                    membres. */}
                {!estGroupe && (
                  <div className="ge-champ">
                    <span className="ge-etiquette">{t("goals.edit.difficulty", "Palier")}</span>
                    <div className="ge-pastilles">
                      {paliers.map((p) => {
                        const choisi = difficulty === p.value;
                        return (
                          <button
                            key={p.value}
                            type="button"
                            className="ge-pastille"
                            aria-pressed={choisi}
                            onClick={() => setDifficulty(p.value)}
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
                )}

                <div className="ge-champ">
                  <span className="ge-etiquette">
                    <Tag size={11} aria-hidden="true" />
                    {t("goals.edit.tags", "Étiquettes")} <i aria-hidden="true">*</i>
                  </span>
                  <div className="ge-pastilles">
                    {GOAL_TAGS.map((tag) => {
                      const choisi = selectedTags.includes(tag.value);
                      return (
                        <button
                          key={tag.value}
                          type="button"
                          className="ge-pastille"
                          aria-pressed={choisi}
                          onClick={() => toggleTag(tag.value)}
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
                    <label className="ge-etiquette" htmlFor="ge-debut">
                      {t("goals.detail.startDate", "Début")}
                    </label>
                    <input
                      id="ge-debut"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="ge-champ">
                    <label className="ge-etiquette" htmlFor="ge-echeance">
                      {t("goals.edit.deadline", "Échéance")}
                    </label>
                    <input
                      id="ge-echeance"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                </div>
                <p className="ge-aide">
                  {t("goals.edit.deadlineHint", "Une échéance allume le compte à rebours sur la carte de l'objectif.")}
                </p>
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
                  placeholder={t("goals.edit.notesPlaceholder", "Ce qu'il faut se rappeler à propos de cet objectif…")}
                  aria-label={t("goals.detail.notes", "Notes")}
                />
              </div>
            </section>
          </div>

          {/* ── Ce qu il demande ──
              Le type commande ce volet : des etapes, une duree, ou des
              membres. */}
          <div className="ge-colonne">
            {estOrdinaire && (
              <section className="ge-volet">
                <header className="ge-tete">
                  <ListOrdered size={12} aria-hidden="true" />
                  {t("goals.detail.steps", "Étapes")}
                  {aiDecomposeEnabled && (
                    <button
                      type="button"
                      className="ge-bouton ge-bouton--mince"
                      onClick={handleAiDecompose}
                      disabled={aiDecomposing || !name.trim()}
                      title={t("goals.new.aiHint", "Proposer une décomposition à partir du nom")}
                    >
                      {aiDecomposing
                        ? <Loader2 size={11} className="ge-tourne" aria-hidden="true" />
                        : <SparklesIcon size={11} aria-hidden="true" />}
                      {t("goals.new.ai", "Décomposer")}
                    </button>
                  )}
                  <b>{stepItems.length}/20</b>
                </header>
                <div className="ge-embarque">
                  <EditStepsList
                    items={stepItems}
                    onItemsChange={(items) => {
                      setStepItems(items);
                      setStepCount(items.length);
                    }}
                  />
                </div>
              </section>
            )}

            {estHabitude && (
              <section className="ge-volet">
                <header className="ge-tete">
                  <Sparkles size={12} aria-hidden="true" />
                  {t("goals.new.rhythm", "Rythme")}
                  <b>{habitDurationDays}{t("goals.new.daysShort", " j")}</b>
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
                      value={habitDurationDays}
                      onChange={(e) =>
                        setHabitDurationDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))
                      }
                      autoComplete="off"
                    />
                    <p className="ge-aide">
                      {t("goals.new.durationHint", "Une case à cocher par jour, et l'habitude est franchie au dernier.")}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {estGroupe && (
              <section className="ge-volet">
                <header className="ge-tete">
                  <Crown size={12} aria-hidden="true" />
                  {t("goals.new.members", "Astres")}
                  <b>{membresDuGroupe}</b>
                </header>
                <div className="ge-corps-volet">
                  <div className="ge-champ">
                    <span className="ge-etiquette">{t("goals.new.buildMode", "Composition")}</span>
                    <div className="ge-pastilles">
                      <button
                        type="button"
                        className="ge-pastille ge-pastille--bascule"
                        aria-pressed={superBuildMode === "manual"}
                        onClick={() => setSuperBuildMode("manual")}
                      >
                        <HandIcon size={10} aria-hidden="true" />
                        {t("goals.new.manual", "Choisis à la main")}
                      </button>
                      <button
                        type="button"
                        className="ge-pastille ge-pastille--bascule"
                        aria-pressed={superBuildMode === "auto"}
                        onClick={() => setSuperBuildMode("auto")}
                      >
                        <Filter size={10} aria-hidden="true" />
                        {t("goals.new.auto", "Par une règle")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ge-embarque">
                  {superBuildMode === "manual" ? (
                    <GoalSelectionList
                      goals={existingGoals}
                      selectedIds={selectedChildGoalIds}
                      onSelectionChange={setSelectedChildGoalIds}
                      customDifficultyName={customDifficultyName}
                      customDifficultyColor={customDifficultyColor}
                    />
                  ) : (
                    <AutoBuildRuleEditor
                      rule={superGoalRule}
                      onRuleChange={setSuperGoalRule}
                      goals={existingGoals}
                      customDifficultyName={customDifficultyName}
                      customDifficultyActive={customDifficultyActive}
                    />
                  )}
                </div>

                {superBuildMode === "auto" && (
                  <div className="ge-corps-volet">
                    <div className="ge-champ">
                      <div className="ge-pastilles">
                        <button
                          type="button"
                          className="ge-pastille ge-pastille--bascule"
                          aria-pressed={isDynamicSuper}
                          onClick={() => setIsDynamicSuper(!isDynamicSuper)}
                        >
                          <Zap size={10} aria-hidden="true" />
                          {t("goals.new.dynamic", "Constellation vivante")}
                        </button>
                      </div>
                      <p className="ge-aide">
                        {isDynamicSuper
                          ? t("goals.new.dynamicOn", "La règle est rejouée en permanence : tout objectif qui y répondra plus tard rejoindra la constellation.")
                          : t("goals.new.dynamicOff", "La règle sert une fois, à la création. Les membres sont ensuite figés.")}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className="ge-volet">
              <header className="ge-tete">
                <Receipt size={12} aria-hidden="true" />
                {t("goals.detail.ledger", "Registre")}
                <b>{costItems.length}</b>
              </header>
              <div className="ge-embarque">
                <CostItemsEditor
                  items={costItems}
                  onChange={setCostItems}
                  steps={
                    estOrdinaire
                      ? stepItems.map((item, i) => ({
                          id: `step-index-${i}`,
                          title: item.name,
                          order: i + 1,
                        }))
                      : undefined
                  }
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
