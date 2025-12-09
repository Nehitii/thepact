import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/lib/supabase";
import { trackGoalCreated } from "@/lib/achievements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CyberBackground } from "@/components/CyberBackground";
import { z } from "zod";
import { getCurrencySymbol } from "@/lib/currency";

const goalSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Goal name is required" })
    .max(100, { message: "Goal name must be less than 100 characters" }),
  type: z.string(),
  difficulty: z.string(),
  goalType: z.enum(["normal", "habit"]),
  stepCount: z.number()
    .int()
    .min(1, { message: "Must have at least 1 step" })
    .max(20, { message: "Cannot have more than 20 steps" })
    .optional(),
  habitDurationDays: z.number()
    .int()
    .min(1, { message: "Must be at least 1 day" })
    .max(365, { message: "Cannot exceed 365 days" })
    .optional(),
  estimatedCost: z.number()
    .min(0, { message: "Cost cannot be negative" })
    .optional(),
  notes: z.string()
    .max(500, { message: "Notes must be less than 500 characters" })
    .optional(),
});

// Goal types with display labels (value matches database enum)
const goalTypes = [
  { value: "personal", label: "Personal" },
  { value: "professional", label: "Professional" },
  { value: "health", label: "Health" },
  { value: "creative", label: "Creative" },
  { value: "financial", label: "Financial" },
  { value: "learning", label: "Learning" },
  { value: "other", label: "Other" },
];

export default function NewGoal() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("personal");
  const [difficulty, setDifficulty] = useState("medium");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");
  const [stepCount, setStepCount] = useState(5);
  const [goalType, setGoalType] = useState<"normal" | "habit">("normal");
  const [habitDurationDays, setHabitDurationDays] = useState(7);
  
  const [customDifficultyName, setCustomDifficultyName] = useState("");
  const [customDifficultyActive, setCustomDifficultyActive] = useState(false);

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

  // Build difficulties array based on custom difficulty settings
  const difficulties = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
    { value: "extreme", label: "Extreme" },
    { value: "impossible", label: "Impossible" },
    ...(customDifficultyActive ? [{ value: "custom", label: customDifficultyName || "Custom" }] : []),
  ];

  const handleCreate = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create goals",
        variant: "destructive",
      });
      return;
    }

    // Validate input
    try {
      const validatedData = goalSchema.parse({
        name: name.trim(),
        type,
        difficulty,
        goalType,
        stepCount: goalType === "normal" ? stepCount : undefined,
        habitDurationDays: goalType === "habit" ? habitDurationDays : undefined,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        notes: notes.trim(),
      });

      setLoading(true);

      // Get user's pact
      const { data: pactData } = await supabase
        .from("pacts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pactData) {
        toast({
          title: "Error",
          description: "Pact not found",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Calculate potential score based on difficulty
      const scoreMap = { 
        easy: 10, 
        medium: 25, 
        hard: 50, 
        extreme: 100, 
        impossible: 200,
        custom: 500 
      };
      const potentialScore = scoreMap[difficulty as keyof typeof scoreMap] || 25;

      // Prepare habit checks array if habit goal
      const habitChecks = goalType === "habit" 
        ? Array(habitDurationDays).fill(false) 
        : null;

      // Create goal
      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .insert({
          pact_id: pactData.id,
          name: validatedData.name,
          type: validatedData.type as any,
          difficulty: validatedData.difficulty as any,
          estimated_cost: validatedData.estimatedCost || 0,
          notes: validatedData.notes || null,
          total_steps: goalType === "normal" ? validatedData.stepCount : habitDurationDays,
          potential_score: potentialScore,
          start_date: new Date().toISOString(),
          status: "not_started",
          goal_type: goalType,
          habit_duration_days: goalType === "habit" ? habitDurationDays : null,
          habit_checks: habitChecks,
        } as any)
        .select()
        .single();

      if (goalError) throw goalError;

      // Create default steps only for normal goals
      if (goalType === "normal" && validatedData.stepCount) {
        const steps = Array.from({ length: validatedData.stepCount }, (_, i) => ({
          goal_id: goalData.id,
          title: `Step ${i + 1}`,
          description: "",
          notes: "",
          order: i + 1,
        }));

        const { error: stepsError } = await supabase
          .from("steps")
          .insert(steps);

        if (stepsError) throw stepsError;
      }

      // Track achievement
      setTimeout(() => {
        trackGoalCreated(user.id, difficulty);
      }, 0);

      toast({
        title: "Goal Created",
        description: "Your Pact evolution has been added",
      });

      navigate(`/goals/${goalData.id}`);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create goal",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative pb-20" style={{ background: '#00050B' }}>
      {/* Ultra-dark background with radial gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00050B] via-[#050A13] to-[#00050B]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <CyberBackground />
      <div className="relative z-10">
        <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 pt-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/goals")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-glow to-primary drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
              NEW GOAL
            </h1>
            <p className="text-muted-foreground font-rajdhani tracking-wide mt-1">Add an evolution to your Pact</p>
          </div>
        </div>

        {/* Form */}
        <Card className="relative border-2 border-primary/30 bg-[#00050B]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(91,180,255,0.15)]">
          <CardHeader className="border-b border-primary/20">
            <CardTitle className="font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-glow">
              GOAL DETAILS
            </CardTitle>
            <CardDescription className="font-rajdhani tracking-wide">Define what you want to achieve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 relative z-10">
            <div className="space-y-3">
              <Label htmlFor="name" className="cursor-pointer text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                Goal Name *
              </Label>
              <Input
                id="name"
                placeholder="Learn a new skill"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                autoComplete="off"
                className="bg-background/40 border-primary/30 focus:border-primary/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="type" className="cursor-pointer text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                  Type
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type" className="bg-background/40 border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#00050B] border-primary/30 text-gray-100">
                    {goalTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-gray-100 hover:text-white focus:text-white data-[state=checked]:text-primary">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="difficulty" className="cursor-pointer text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                  Difficulty
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty" className="bg-background/40 border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#00050B] border-primary/30">
                    {difficulties.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Goal Type Selection */}
            <div className="space-y-3">
              <Label className="cursor-pointer text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                Goal Type
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGoalType("normal")}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                    goalType === "normal"
                      ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(91,180,255,0.3)]"
                      : "border-primary/30 bg-background/40 hover:border-primary/50"
                  }`}
                >
                  <div className="font-rajdhani font-bold text-primary mb-1">Normal Goal</div>
                  <div className="text-xs text-muted-foreground">Track progress with steps</div>
                </button>
                <button
                  type="button"
                  onClick={() => setGoalType("habit")}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                    goalType === "habit"
                      ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(91,180,255,0.3)]"
                      : "border-primary/30 bg-background/40 hover:border-primary/50"
                  }`}
                >
                  <div className="font-rajdhani font-bold text-primary mb-1">Habit Goal</div>
                  <div className="text-xs text-muted-foreground">Daily check-ins for X days</div>
                </button>
              </div>
            </div>

            {/* Normal Goal: Number of Steps */}
            {goalType === "normal" && (
              <div className="space-y-3">
                <Label htmlFor="steps" className="cursor-pointer text-sm font-rajdhani tracking-wide uppercase text-primary/90">
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
                  className="bg-background/40 border-primary/30 focus:border-primary/60"
                />
              </div>
            )}

            {/* Habit Goal: Duration in Days */}
            {goalType === "habit" && (
              <div className="space-y-3">
                <Label htmlFor="habitDays" className="cursor-pointer text-sm font-rajdhani tracking-wide uppercase text-primary/90">
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
                  className="bg-background/40 border-primary/30 focus:border-primary/60"
                />
                <p className="text-xs text-muted-foreground">
                  Complete daily for {habitDurationDays} day{habitDurationDays !== 1 ? 's' : ''} to finish this habit
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="cost" className="cursor-pointer text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                Estimated Cost (optional)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7 bg-background/40 border-primary/30 focus:border-primary/60"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="notes" className="cursor-pointer text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional details about this goal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={500}
                className="bg-background/40 border-primary/30 focus:border-primary/60 resize-none"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => navigate("/goals")}
                className="flex-1 border-primary/30"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="flex-1 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary-glow/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 font-rajdhani tracking-wider">
                  {loading ? "CREATING..." : "CREATE GOAL"}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
