import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { trackGoalCreated } from "@/lib/achievements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GoalImageUpload } from "@/components/GoalImageUpload";
import { CostItemsEditor, CostItemData } from "@/components/goals/CostItemsEditor";
import { z } from "zod";

const goalSchema = z.object({
  name: z.string().trim().min(1, { message: "Goal name is required" }).max(100, { message: "Goal name must be less than 100 characters" }),
  type: z.string(),
  difficulty: z.string(),
  goalType: z.enum(["normal", "habit"]),
  stepCount: z.number().int().min(1, { message: "Must have at least 1 step" }).max(20, { message: "Cannot have more than 20 steps" }).optional(),
  habitDurationDays: z.number().int().min(1, { message: "Must be at least 1 day" }).max(365, { message: "Cannot exceed 365 days" }).optional(),
  notes: z.string().max(500, { message: "Notes must be less than 500 characters" }).optional()
});

const goalTypes = [
  { value: "personal", label: "Personal" },
  { value: "professional", label: "Professional" },
  { value: "health", label: "Health" },
  { value: "creative", label: "Creative" },
  { value: "financial", label: "Financial" },
  { value: "learning", label: "Learning" },
  { value: "relationship", label: "Relationship" },
  { value: "diy", label: "DIY" },
  { value: "other", label: "Other" }
];

export default function NewGoal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("personal");
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
        .select("custom_difficulty_name, custom_difficulty_active")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setCustomDifficultyName(data.custom_difficulty_name || "Custom");
        setCustomDifficultyActive(data.custom_difficulty_active || false);
      }
    };
    loadProfile();
  }, [user]);

  const difficulties = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
    { value: "extreme", label: "Extreme" },
    { value: "impossible", label: "Impossible" },
    ...(customDifficultyActive ? [{ value: "custom", label: customDifficultyName || "Custom" }] : [])
  ];

  const handleCreate = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create goals", variant: "destructive" });
      return;
    }

    try {
      const validatedData = goalSchema.parse({
        name: name.trim(),
        type,
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

      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .insert({
          pact_id: pactData.id,
          name: validatedData.name,
          type: validatedData.type as any,
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

  return (
    <div className="min-h-screen bg-[#00050B] relative overflow-hidden">
      {/* Deep space background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
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

      <div className="max-w-2xl mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="pt-8 space-y-4 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate("/goals")}
            className="text-primary/70 hover:text-primary hover:bg-primary/10 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goals
          </Button>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron">
            New Goal
          </h1>
          <p className="text-primary/70 tracking-wide font-rajdhani">
            Add an evolution to your Pact
          </p>
        </div>

        {/* Form Card */}
        <div 
          className="relative rounded-xl border border-primary/20 bg-[#050A13]/80 backdrop-blur-xl p-6 space-y-6 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative space-y-6">
            {/* Goal Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                Goal Name *
              </Label>
              <Input
                id="name"
                placeholder="Learn a new skill"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                autoComplete="off"
                className="bg-[#050A13]/60 border-primary/30 focus:border-primary/60"
              />
            </div>

            {/* Type & Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                  Category
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type" className="bg-[#050A13]/60 border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                  Difficulty
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty" className="bg-[#050A13]/60 border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Goal Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                Goal Type
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGoalType("normal")}
                  className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                    goalType === "normal"
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(91,180,255,0.2)]"
                      : "border-primary/30 bg-[#050A13]/60 hover:border-primary/50"
                  }`}
                >
                  <div className="font-rajdhani font-bold text-primary mb-1">Normal Goal</div>
                  <div className="text-xs text-primary/60">Track progress with steps</div>
                </button>
                <button
                  type="button"
                  onClick={() => setGoalType("habit")}
                  className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                    goalType === "habit"
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(91,180,255,0.2)]"
                      : "border-primary/30 bg-[#050A13]/60 hover:border-primary/50"
                  }`}
                >
                  <div className="font-rajdhani font-bold text-primary mb-1">Habit Goal</div>
                  <div className="text-xs text-primary/60">Daily check-ins for X days</div>
                </button>
              </div>
            </div>

            {/* Normal Goal: Number of Steps */}
            {goalType === "normal" && (
              <div className="space-y-2">
                <Label htmlFor="steps" className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                  Number of Steps (1-20)
                </Label>
                <Input
                  id="steps"
                  type="number"
                  min="1"
                  max="20"
                  value={stepCount}
                  onChange={(e) => setStepCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  autoComplete="off"
                  className="bg-[#050A13]/60 border-primary/30 focus:border-primary/60"
                />
              </div>
            )}

            {/* Habit Goal: Duration in Days */}
            {goalType === "habit" && (
              <div className="space-y-2">
                <Label htmlFor="habitDays" className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                  Habit Duration (days)
                </Label>
                <Input
                  id="habitDays"
                  type="number"
                  min="1"
                  max="365"
                  value={habitDurationDays}
                  onChange={(e) => setHabitDurationDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                  autoComplete="off"
                  className="bg-[#050A13]/60 border-primary/30 focus:border-primary/60"
                />
                <p className="text-xs text-primary/60">
                  Complete daily for {habitDurationDays} day{habitDurationDays !== 1 ? "s" : ""} to finish this habit
                </p>
              </div>
            )}

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#050A13]/60 border-primary/30 focus:border-primary/60"
              />
            </div>

            {/* Itemized Cost */}
            <CostItemsEditor items={costItems} onChange={setCostItems} />

            {/* Image Upload */}
            {user && (
              <div className="space-y-2">
                <Label className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                  Goal Image (optional)
                </Label>
                <GoalImageUpload value={imageUrl} onChange={setImageUrl} userId={user.id} />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional details about this goal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={500}
                className="bg-[#050A13]/60 border-primary/30 focus:border-primary/60 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/goals")}
                className="flex-1 border-primary/30 hover:bg-primary/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-rajdhani tracking-wider"
              >
                {loading ? "CREATING..." : "CREATE GOAL"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
