import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { trackGoalCreated } from "@/lib/achievements";
import { insertGoalTags } from "@/hooks/useGoalTags";
import { useGoals } from "@/hooks/useGoals";
import { usePact } from "@/hooks/usePact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Target, Sparkles, Calendar, ListOrdered, Image, StickyNote, DollarSign, Tag, Zap, Check, X, Crown, Layers, Filter, HandIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GoalImageUpload } from "@/components/GoalImageUpload";
import { CostItemsEditor, CostItemData } from "@/components/goals/CostItemsEditor";
import { GoalSelectionList, AutoBuildRuleEditor, SuperGoalRule, filterGoalsByRule } from "@/components/goals/super";
import { GOAL_TAGS, DIFFICULTY_OPTIONS, getTagLabel, getDifficultyLabel } from "@/lib/goalConstants";
import { z } from "zod";
import { motion } from "framer-motion";

const goalSchema = z.object({
  name: z.string().trim().min(1, { message: "Goal name is required" }).max(100, { message: "Goal name must be less than 100 characters" }),
  type: z.array(z.string()).min(1, { message: "At least one tag is required" }),
  difficulty: z.string(),
  goalType: z.enum(["normal", "habit", "super"]),
  stepCount: z.number().int().min(1, { message: "Must have at least 1 step" }).max(20, { message: "Cannot have more than 20 steps" }).optional(),
  habitDurationDays: z.number().int().min(1, { message: "Must be at least 1 day" }).max(365, { message: "Cannot exceed 365 days" }).optional(),
  notes: z.string().max(500, { message: "Notes must be less than 500 characters" }).optional()
});

export default function NewGoal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [stepNames, setStepNames] = useState<string[]>(Array.from({ length: 5 }, (_, i) => `Step ${i + 1}`));

  // Super Goal specific state
  const [superBuildMode, setSuperBuildMode] = useState<"manual" | "auto">("manual");
  const [selectedChildGoalIds, setSelectedChildGoalIds] = useState<string[]>([]);
  const [superGoalRule, setSuperGoalRule] = useState<SuperGoalRule>({});
  const [isDynamicSuper, setIsDynamicSuper] = useState(false);

  // Custom difficulty state
  const [customDifficultyColor, setCustomDifficultyColor] = useState("#a855f7");

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

  const allDifficulties = [
    ...DIFFICULTY_OPTIONS,
    ...(customDifficultyActive ? [{ value: "custom" as const, label: customDifficultyName || "Custom", color: customDifficultyColor }] : [])
  ];

  const toggleTag = (tagValue: string) => {
    setSelectedTags(prev => 
      prev.includes(tagValue) 
        ? prev.filter(t => t !== tagValue)
        : [...prev, tagValue]
    );
  };

  const handleCreate = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create goals", variant: "destructive" });
      return;
    }

    // Validate super goal has child goals
    if (goalType === "super") {
      const childIds = superBuildMode === "manual" 
        ? selectedChildGoalIds 
        : filterGoalsByRule(existingGoals, superGoalRule).map(g => g.id);
      
      if (childIds.length === 0) {
        toast({ title: "Error", description: "Super Goal must contain at least one child goal", variant: "destructive" });
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
        notes: notes.trim()
      });
      
      setLoading(true);

      const { data: pactResult } = await supabase.from("pacts").select("id").eq("user_id", user.id).single();
      if (!pactResult) {
        toast({ title: "Error", description: "Pact not found", variant: "destructive" });
        setLoading(false);
        return;
      }

      const scoreMap = { easy: 10, medium: 25, hard: 50, extreme: 100, impossible: 200, custom: 500 };
      const potentialScore = scoreMap[difficulty as keyof typeof scoreMap] || 25;
      const habitChecks = goalType === "habit" ? Array(habitDurationDays).fill(false) : null;
      const totalEstimatedCost = costItems.reduce((sum, item) => sum + (item.price || 0), 0);

      // Use first tag as primary type for DB compatibility
      const primaryType = selectedTags[0] || "personal";

      // Prepare Super Goal specific data
      let superGoalData: { child_goal_ids?: string[]; super_goal_rule?: SuperGoalRule; is_dynamic_super?: boolean } = {};
      if (goalType === "super") {
        if (superBuildMode === "manual") {
          superGoalData = {
            child_goal_ids: selectedChildGoalIds,
            is_dynamic_super: false,
          };
        } else {
          // Auto-build mode
          const matchedIds = filterGoalsByRule(existingGoals, superGoalRule).map(g => g.id);
          superGoalData = {
            child_goal_ids: isDynamicSuper ? null : matchedIds,
            super_goal_rule: superGoalRule,
            is_dynamic_super: isDynamicSuper,
          };
        }
      }

      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .insert({
          pact_id: pactResult.id,
          name: validatedData.name,
          type: primaryType as any,
          difficulty: validatedData.difficulty as any,
          estimated_cost: totalEstimatedCost,
          notes: validatedData.notes || null,
          total_steps: goalType === "normal" ? validatedData.stepCount : goalType === "habit" ? habitDurationDays : 0,
          potential_score: potentialScore,
          start_date: new Date(startDate).toISOString(),
          status: "not_started",
          goal_type: goalType,
          habit_duration_days: goalType === "habit" ? habitDurationDays : null,
          habit_checks: habitChecks,
          image_url: imageUrl || null,
          ...superGoalData,
        } as any)
        .select()
        .single();

      if (goalError) throw goalError;

      // Insert all selected tags into goal_tags junction table
      await insertGoalTags(goalData.id, selectedTags);

      // Insert cost items
      if (costItems.length > 0) {
        const costItemsData = costItems.map((item) => ({
          goal_id: goalData.id,
          name: item.name,
          price: item.price || 0
        }));
        await supabase.from("goal_cost_items").insert(costItemsData);
      }

      // Create default steps only for normal goals
      if (goalType === "normal" && validatedData.stepCount) {
        const steps = Array.from({ length: validatedData.stepCount }, (_, i) => ({
          goal_id: goalData.id,
          title: stepNames[i]?.trim() || `Step ${i + 1}`,
          description: "",
          notes: "",
          order: i + 1
        }));
        const { error: stepsError } = await supabase.from("steps").insert(steps);
        if (stepsError) throw stepsError;
      }

      setTimeout(() => { trackGoalCreated(user.id, difficulty); }, 0);
      toast({ title: goalType === "super" ? "Super Goal Created" : "Goal Created", description: "Your Pact evolution has been added" });
      navigate(`/goals/${goalData.id}`);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message || "Failed to create goal", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedDifficulty = allDifficulties.find(d => d.value === difficulty);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Deep space background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="space-y-6 mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/goals")}
            className="text-primary/70 hover:text-primary hover:bg-primary/10 -ml-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goals
          </Button>
          
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_30px_rgba(91,180,255,0.6)] font-orbitron">
              Create New Goal
            </h1>
            <p className="text-primary/60 tracking-wide font-rajdhani text-lg">
              Add an evolution to your Pact journey
            </p>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div 
          className="relative rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative p-8 md:p-10 space-y-10">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Basic Information</h2>
              </div>
              
              {/* Goal Name */}
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                  Goal Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your goal name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  variant="light"
                  className="h-12 text-base rounded-xl"
                />
              </div>

              {/* Tags Multi-Select */}
              <div className="space-y-3">
                <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag.value);
                    return (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => toggleTag(tag.value)}
                        className={`
                          relative px-4 py-2 rounded-xl font-rajdhani text-sm font-medium transition-all duration-200
                          ${isSelected 
                            ? 'text-white shadow-lg' 
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
                          }
                        `}
                        style={isSelected ? { 
                          background: tag.color,
                          boxShadow: `0 0 20px ${tag.color}40`
                        } : {}}
                      >
                        <span className="flex items-center gap-1.5">
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                          {getTagLabel(tag.value, t)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Select one or more tags to categorize your goal</p>
              </div>
            </div>

            {/* Section 2: Goal Type & Difficulty */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                <Zap className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Type & Difficulty</h2>
              </div>

              {/* Goal Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">
                  Goal Type
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setGoalType("normal")}
                    className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                      goalType === "normal"
                        ? "border-primary bg-primary/10 shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
                        : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      goalType === "normal" ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {goalType === "normal" && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    <ListOrdered className={`h-6 w-6 mb-2 ${goalType === "normal" ? "text-primary" : "text-muted-foreground"}`} />
                    <div className={`font-rajdhani font-bold text-base mb-0.5 ${goalType === "normal" ? "text-primary" : "text-foreground"}`}>
                      Standard
                    </div>
                    <div className="text-xs text-muted-foreground">Steps-based progress</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setGoalType("habit")}
                    className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                      goalType === "habit"
                        ? "border-primary bg-primary/10 shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
                        : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      goalType === "habit" ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {goalType === "habit" && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    <Sparkles className={`h-6 w-6 mb-2 ${goalType === "habit" ? "text-primary" : "text-muted-foreground"}`} />
                    <div className={`font-rajdhani font-bold text-base mb-0.5 ${goalType === "habit" ? "text-primary" : "text-foreground"}`}>
                      Habit
                    </div>
                    <div className="text-xs text-muted-foreground">Daily check-ins</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGoalType("super")}
                    className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                      goalType === "super"
                        ? "border-yellow-500 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.3)]"
                        : "border-border bg-muted/30 hover:border-yellow-500/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      goalType === "super" ? "border-yellow-500 bg-yellow-500" : "border-muted-foreground/30"
                    }`}>
                      {goalType === "super" && <Check className="h-2.5 w-2.5 text-yellow-900" />}
                    </div>
                    <Crown className={`h-6 w-6 mb-2 ${goalType === "super" ? "text-yellow-500" : "text-muted-foreground"}`} />
                    <div className={`font-rajdhani font-bold text-base mb-0.5 ${goalType === "super" ? "text-yellow-500" : "text-foreground"}`}>
                      Super Goal
                    </div>
                    <div className="text-xs text-muted-foreground">Meta-goal of goals</div>
                  </button>
                </div>
              </div>

              {/* Super Goal Configuration */}
              {goalType === "super" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 p-5 rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/5"
                >
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-orbitron text-sm uppercase tracking-wider text-yellow-500">Super Goal Configuration</h3>
                  </div>

                  {/* Build Mode Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSuperBuildMode("manual")}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        superBuildMode === "manual"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card/50 hover:border-primary/40"
                      }`}
                    >
                      <HandIcon className={`h-5 w-5 mb-1 ${superBuildMode === "manual" ? "text-primary" : "text-muted-foreground"}`} />
                      <div className={`font-medium text-sm ${superBuildMode === "manual" ? "text-primary" : "text-foreground"}`}>Manual Selection</div>
                      <div className="text-xs text-muted-foreground">Pick specific goals</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuperBuildMode("auto")}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        superBuildMode === "auto"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card/50 hover:border-primary/40"
                      }`}
                    >
                      <Filter className={`h-5 w-5 mb-1 ${superBuildMode === "auto" ? "text-primary" : "text-muted-foreground"}`} />
                      <div className={`font-medium text-sm ${superBuildMode === "auto" ? "text-primary" : "text-foreground"}`}>Auto-Build</div>
                      <div className="text-xs text-muted-foreground">Use smart rules</div>
                    </button>
                  </div>

                  {/* Manual Selection Mode */}
                  {superBuildMode === "manual" && (
                    <GoalSelectionList
                      goals={existingGoals}
                      selectedIds={selectedChildGoalIds}
                      onSelectionChange={setSelectedChildGoalIds}
                      customDifficultyName={customDifficultyName}
                      customDifficultyColor={customDifficultyColor}
                    />
                  )}

                  {/* Auto-Build Mode */}
                  {superBuildMode === "auto" && (
                    <div className="space-y-4">
                      <AutoBuildRuleEditor
                        rule={superGoalRule}
                        onRuleChange={setSuperGoalRule}
                        goals={existingGoals}
                        customDifficultyName={customDifficultyName}
                        customDifficultyActive={customDifficultyActive}
                      />
                      
                      {/* Dynamic vs Static toggle */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-card/80 border border-border">
                        <div>
                          <Label className="font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4 text-purple-500" />
                            Dynamic Super Goal
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Auto-updates when new goals match rules
                          </p>
                        </div>
                        <Switch
                          checked={isDynamicSuper}
                          onCheckedChange={setIsDynamicSuper}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Difficulty Selection - hide for super goals since they aggregate */}
              {goalType !== "super" && (
                <div className="space-y-3">
                  <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">
                    Difficulty
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {allDifficulties.map((diff) => {
                      const isSelected = difficulty === diff.value;
                      return (
                        <button
                          key={diff.value}
                          type="button"
                          onClick={() => setDifficulty(diff.value)}
                          className={`
                            relative px-5 py-2.5 rounded-xl font-rajdhani font-bold text-sm uppercase tracking-wide transition-all duration-200
                            ${isSelected 
                              ? 'text-white shadow-lg scale-105' 
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
                            }
                          `}
                          style={isSelected ? { 
                            background: diff.color,
                            boxShadow: `0 0 25px ${diff.color}50`
                          } : {}}
                        >
                          {getDifficultyLabel(diff.value, t)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Steps / Duration based on goal type - not for super goals */}
              {goalType !== "super" && (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goalType === "normal" ? (
                  <div className="space-y-3">
                    <Label htmlFor="steps" className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                      <ListOrdered className="h-4 w-4" />
                      Number of Steps
                    </Label>
                    <Input
                      id="steps"
                      type="number"
                      min="1"
                      max="20"
                      value={stepCount}
                      onChange={(e) => {
                        const newCount = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                        setStepCount(newCount);
                        setStepNames(prev => {
                          const updated = [...prev];
                          if (newCount > updated.length) {
                            for (let i = updated.length; i < newCount; i++) {
                              updated.push(`Step ${i + 1}`);
                            }
                          } else {
                            updated.length = newCount;
                          }
                          return updated;
                        });
                      }}
                      autoComplete="off"
                      variant="light"
                      className="h-12 text-base rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">1-20 steps allowed</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="habitDays" className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Duration (Days)
                    </Label>
                    <Input
                      id="habitDays"
                      type="number"
                      min="1"
                      max="365"
                      value={habitDurationDays}
                      onChange={(e) => setHabitDurationDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                      autoComplete="off"
                      variant="light"
                      className="h-12 text-base rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Complete daily for {habitDurationDays} day{habitDurationDays !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* Start Date */}
                <div className="space-y-3">
                  <Label htmlFor="startDate" className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    variant="light"
                    className="h-12 text-base rounded-xl"
                  />
                </div>
              </div>

              {/* Step Names Editor - only for normal goals */}
              {goalType === "normal" && stepCount > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                    <ListOrdered className="h-4 w-4" />
                    Name Your Steps
                  </Label>
                  <div className="space-y-2">
                    {stepNames.map((sName, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">{idx + 1}.</span>
                        <Input
                          value={sName}
                          onChange={(e) => {
                            const updated = [...stepNames];
                            updated[idx] = e.target.value;
                            setStepNames(updated);
                          }}
                          placeholder={`Step ${idx + 1}`}
                          maxLength={100}
                          autoComplete="off"
                          variant="light"
                          className="h-10 text-sm rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">You can rename them later from the goal detail page</p>
                </div>
              )}
              </>
              )}
            </div>

            {/* Section 3: Cost & Budget */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                <DollarSign className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Budget & Cost</h2>
              </div>
              
              <CostItemsEditor items={costItems} onChange={setCostItems} />
            </div>

            {/* Section 4: Media & Notes */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                <Image className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Media & Notes</h2>
              </div>

              {/* Image Upload */}
              {user && (
                <GoalImageUpload value={imageUrl} onChange={setImageUrl} userId={user.id} />
              )}

              {/* Notes */}
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details, motivation, or reminders about this goal..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  maxLength={500}
                  variant="light"
                  className="resize-none rounded-xl text-base"
                />
                <p className="text-xs text-muted-foreground text-right">{notes.length}/500</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-primary/20">
              <Button
                variant="outline"
                onClick={() => navigate("/goals")}
                className="flex-1 h-12 rounded-xl border-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 font-rajdhani tracking-wider text-base"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim() || selectedTags.length === 0}
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-rajdhani tracking-wider text-base shadow-[0_0_20px_rgba(91,180,255,0.3)] hover:shadow-[0_0_30px_rgba(91,180,255,0.5)] transition-all duration-300"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
