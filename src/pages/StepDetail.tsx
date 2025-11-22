import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, History } from "lucide-react";
import { format } from "date-fns";

interface Step {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  notes?: string;
  order: number;
  status: string;
  due_date?: string;
  completion_date?: string;
  validated_at?: string;
  created_at: string;
  updated_at: string;
}

interface StatusHistory {
  id: string;
  old_status?: string;
  new_status: string;
  changed_at: string;
}

export default function StepDetail() {
  const { stepId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");
  const [dueDate, setDueDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");

  useEffect(() => {
    if (user && stepId) {
      loadStepData();
    }
  }, [user, stepId]);

  const loadStepData = async () => {
    try {
      setLoading(true);

      // Fetch step data
      const { data: stepData, error: stepError } = await supabase
        .from("steps")
        .select("*")
        .eq("id", stepId)
        .single();

      if (stepError) throw stepError;

      setStep(stepData);
      setTitle(stepData.title);
      setDescription(stepData.description || "");
      setNotes(stepData.notes || "");
      setStatus(stepData.status);
      setDueDate(stepData.due_date || "");
      setCompletionDate(stepData.completion_date ? format(new Date(stepData.completion_date), "yyyy-MM-dd'T'HH:mm") : "");

      // Fetch status history
      const { data: historyData, error: historyError } = await supabase
        .from("step_status_history")
        .select("*")
        .eq("step_id", stepId)
        .order("changed_at", { ascending: false });

      if (historyError) throw historyError;
      setStatusHistory(historyData || []);
    } catch (error: any) {
      console.error("Error loading step:", error);
      toast({
        title: "Error",
        description: "Failed to load step details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!step) return;

    try {
      setSaving(true);

      const updates: any = {
        title,
        description,
        notes,
        status,
        due_date: dueDate || null,
        completion_date: completionDate ? new Date(completionDate).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      // If marking as completed and no completion date set, use current time
      if (status === "completed" && !completionDate) {
        updates.completion_date = new Date().toISOString();
        updates.validated_at = new Date().toISOString();
      }

      // If marking as validated and no validated_at, set it
      if (status === "completed" && !step.validated_at) {
        updates.validated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("steps")
        .update(updates)
        .eq("id", step.id);

      if (error) throw error;

      // Update goal's validated_steps count
      await recalculateGoalProgress(step.goal_id);

      toast({
        title: "Success",
        description: "Step updated successfully",
      });

      // Reload data to show updated history
      await loadStepData();
    } catch (error: any) {
      console.error("Error saving step:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const recalculateGoalProgress = async (goalId: string) => {
    try {
      // Count completed steps
      const { data: stepsData, error: stepsError } = await supabase
        .from("steps")
        .select("id, status")
        .eq("goal_id", goalId);

      if (stepsError) throw stepsError;

      const completedCount = stepsData?.filter(s => s.status === "completed").length || 0;

      // Update goal
      await supabase
        .from("goals")
        .update({ validated_steps: completedCount })
        .eq("id", goalId);
    } catch (error) {
      console.error("Error recalculating goal progress:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-300 border-green-500/50";
      case "in_progress": return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "blocked": return "bg-red-500/20 text-red-300 border-red-500/50";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Step not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Edit Step</h1>
            <p className="text-sm text-muted-foreground">
              Created {format(new Date(step.created_at), "MMM d, yyyy")}
            </p>
          </div>
          <Badge className={getStatusColor(step.status)}>
            {step.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Edit Form */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Step Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Step Name *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter step name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what needs to be done"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or context"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Completion Date (for retroactive entries)
              </Label>
              <Input
                id="completion_date"
                type="datetime-local"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set a past date if this step was actually completed earlier
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Status Change History */}
        {statusHistory.length > 0 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Status Change History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statusHistory.map((change) => (
                  <div key={change.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-2">
                      {change.old_status && (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {change.old_status.replace("_", " ")}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <Badge className={`text-xs ${getStatusColor(change.new_status)}`}>
                        {change.new_status.replace("_", " ")}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(change.changed_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
