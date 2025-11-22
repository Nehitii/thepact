import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const goalTypes = [
  "personal",
  "professional",
  "health",
  "creative",
  "financial",
  "learning",
  "other",
];

const difficulties = ["easy", "medium", "hard", "extreme"];

export default function NewGoal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("personal");
  const [difficulty, setDifficulty] = useState("medium");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");
  const [stepCount, setStepCount] = useState(5);

  const handleCreate = async () => {
    if (!user || !name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a goal name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
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
        return;
      }

      // Calculate potential score based on difficulty
      const scoreMap = { easy: 10, medium: 25, hard: 50, extreme: 100 };
      const potentialScore = scoreMap[difficulty as keyof typeof scoreMap] || 25;

      // Create goal
      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .insert({
          pact_id: pactData.id,
          name: name.trim(),
          type: type as any,
          difficulty: difficulty as any,
          estimated_cost: estimatedCost ? parseFloat(estimatedCost) : 0,
          notes: notes.trim() || null,
          total_steps: stepCount,
          potential_score: potentialScore,
          start_date: new Date().toISOString(),
          status: "not_started",
        } as any)
        .select()
        .single();

      if (goalError) throw goalError;

      // Create default steps
      const steps = Array.from({ length: stepCount }, (_, i) => ({
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

      toast({
        title: "Goal Created",
        description: "Your Pact evolution has been added",
      });

      navigate(`/goals/${goalData.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <div className="max-w-2xl mx-auto p-6 space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 pt-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/goals")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">New Goal</h1>
            <p className="text-muted-foreground">Add an evolution to your Pact</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Goal Details</CardTitle>
            <CardDescription>Define what you want to achieve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name *</Label>
              <Input
                id="name"
                placeholder="Learn a new skill"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="steps">Number of Steps (1-20)</Label>
              <Input
                id="steps"
                type="number"
                min="1"
                max="20"
                value={stepCount}
                onChange={(e) => setStepCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Estimated Cost (optional)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional details about this goal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={500}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/goals")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
