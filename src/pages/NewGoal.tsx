import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { trackGoalCreated } from "@/lib/achievements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Target, Sparkles, Calendar, ListOrdered, Image, StickyNote, DollarSign, Tag, Zap, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GoalImageUpload } from "@/components/GoalImageUpload";
import { CostItemsEditor, CostItemData } from "@/components/goals/CostItemsEditor";
import { z } from "zod";
import { motion } from "framer-motion";

const goalSchema = z.object({
  name: z.string().trim().min(1, { message: "Goal name is required" }).max(100, { message: "Goal name must be less than 100 characters" }),
  type: z.array(z.string()).min(1, { message: "At least one tag is required" }),
  difficulty: z.string(),
  goalType: z.enum(["normal", "habit"]),
  stepCount: z.number().int().min(1, { message: "Must have at least 1 step" }).max(20, { message: "Cannot have more than 20 steps" }).optional(),
  habitDurationDays: z.number().int().min(1, { message: "Must be at least 1 day" }).max(365, { message: "Cannot exceed 365 days" }).optional(),
  notes: z.string().max(500, { message: "Notes must be less than 500 characters" }).optional()
});

const goalTags = [
  { value: "personal", label: "Personal", color: "hsl(200 100% 67%)" },
  { value: "professional", label: "Professional", color: "hsl(45 95% 55%)" },
  { value: "health", label: "Health", color: "hsl(142 70% 50%)" },
  { value: "creative", label: "Creative", color: "hsl(280 75% 55%)" },
  { value: "financial", label: "Financial", color: "hsl(212 90% 55%)" },
  { value: "learning", label: "Learning", color: "hsl(25 100% 60%)" },
  { value: "relationship", label: "Relationship", color: "hsl(340 75% 55%)" },
  { value: "diy", label: "DIY", color: "hsl(175 70% 45%)" },
  { value: "other", label: "Other", color: "hsl(210 30% 50%)" }
];

const difficulties = [
  { value: "easy", label: "Easy", color: "hsl(142 70% 50%)" },
  { value: "medium", label: "Medium", color: "hsl(45 95% 55%)" },
  { value: "hard", label: "Hard", color: "hsl(25 100% 60%)" },
  { value: "extreme", label: "Extreme", color: "hsl(0 90% 65%)" },
  { value: "impossible", label: "Impossible", color: "hsl(280 75% 45%)" }
];

export default function NewGoal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["personal"]);
  const [difficulty, setDifficulty] = useState("medium");
  const [notes, setNotes] = useState("");
  const [stepCount, setStepCount] = useState(5);
  const [goalType, setGoalType] = useState<"normal" | "habit">("normal");
  const [habitDurationDays, setHabitDurationDays] = useState(7);
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyActive, setCustomDifficultyActive] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [costItems, setCostItems] = useState<CostItemData[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

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
      }
    };
    loadProfile();
  }, [user]);

  const allDifficulties = [
    ...difficulties,
    ...(customDifficultyActive ? [{ value: "custom", label: customDifficultyName || "Custom", color: "hsl(270 90% 65%)" }] : [])
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

      const { data: pactData } = await supabase.from("pacts").select("id").eq("user_id", user.id).single();
      if (!pactData) {
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

      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .insert({
          pact_id: pactData.id,
          name: validatedData.name,
          type: primaryType as any,
          difficulty: validatedData.difficulty as any,
          estimated_cost: totalEstimatedCost,
          notes: validatedData.notes || null,
          total_steps: goalType === "normal" ? validatedData.stepCount : habitDurationDays,
          potential_score: potentialScore,
          start_date: new Date(startDate).toISOString(),
          status: "not_started",
          goal_type: goalType,
          habit_duration_days: goalType === "habit" ? habitDurationDays : null,
          habit_checks: habitChecks,
          image_url: imageUrl || null
        } as any)
        .select()
        .single();

      if (goalError) throw goalError;

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
          title: `Step ${i + 1}`,
          description: "",
          notes: "",
          order: i + 1
        }));
        const { error: stepsError } = await supabase.from("steps").insert(steps);
        if (stepsError) throw stepsError;
      }

      setTimeout(() => { trackGoalCreated(user.id, difficulty); }, 0);
      toast({ title: "Goal Created", description: "Your Pact evolution has been added" });
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

      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
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
                  {goalTags.map((tag) => {
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
                          {tag.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Select one or more tags for your goal</p>
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
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setGoalType("normal")}
                    className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                      goalType === "normal"
                        ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(91,180,255,0.2)]"
                        : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      goalType === "normal" ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {goalType === "normal" && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <ListOrdered className={`h-7 w-7 mb-3 ${goalType === "normal" ? "text-primary" : "text-muted-foreground"}`} />
                    <div className={`font-rajdhani font-bold text-lg mb-1 ${goalType === "normal" ? "text-primary" : "text-foreground"}`}>
                      Normal Goal
                    </div>
                    <div className="text-sm text-muted-foreground">Track progress with customizable steps</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setGoalType("habit")}
                    className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                      goalType === "habit"
                        ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(91,180,255,0.2)]"
                        : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      goalType === "habit" ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {goalType === "habit" && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <Sparkles className={`h-7 w-7 mb-3 ${goalType === "habit" ? "text-primary" : "text-muted-foreground"}`} />
                    <div className={`font-rajdhani font-bold text-lg mb-1 ${goalType === "habit" ? "text-primary" : "text-foreground"}`}>
                      Habit Goal
                    </div>
                    <div className="text-sm text-muted-foreground">Daily check-ins for a set duration</div>
                  </button>
                </div>
              </div>

              {/* Difficulty Selection */}
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
                        {diff.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Steps / Duration based on goal type */}
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
                      onChange={(e) => setStepCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
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
