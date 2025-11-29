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
  const {
    stepId
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
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
      const {
        data: stepData,
        error: stepError
      } = await supabase.from("steps").select("*").eq("id", stepId).single();
      if (stepError) throw stepError;
      setStep(stepData);
      setTitle(stepData.title);
      setDescription(stepData.description || "");
      setNotes(stepData.notes || "");
      setStatus(stepData.status);
      setDueDate(stepData.due_date || "");
      setCompletionDate(stepData.completion_date ? format(new Date(stepData.completion_date), "yyyy-MM-dd'T'HH:mm") : "");

      // Fetch status history
      const {
        data: historyData,
        error: historyError
      } = await supabase.from("step_status_history").select("*").eq("step_id", stepId).order("changed_at", {
        ascending: false
      });
      if (historyError) throw historyError;
      setStatusHistory(historyData || []);
    } catch (error: any) {
      console.error("Error loading step:", error);
      toast({
        title: "Error",
        description: "Failed to load step details",
        variant: "destructive"
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
        updated_at: new Date().toISOString()
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
      const {
        error
      } = await supabase.from("steps").update(updates).eq("id", step.id);
      if (error) throw error;

      // Update goal's validated_steps count
      await recalculateGoalProgress(step.goal_id);
      toast({
        title: "Success",
        description: "Step updated successfully"
      });

      // Reload data to show updated history
      await loadStepData();
    } catch (error: any) {
      console.error("Error saving step:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const recalculateGoalProgress = async (goalId: string) => {
    try {
      // Count completed steps
      const {
        data: stepsData,
        error: stepsError
      } = await supabase.from("steps").select("id, status").eq("goal_id", goalId);
      if (stepsError) throw stepsError;
      const completedCount = stepsData?.filter(s => s.status === "completed").length || 0;

      // Update goal
      await supabase.from("goals").update({
        validated_steps: completedCount
      }).eq("id", goalId);
    } catch (error) {
      console.error("Error recalculating goal progress:", error);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "in_progress":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "blocked":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  if (!step) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Step not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen relative pb-20" style={{
    background: '#00050B'
  }}>
      {/* Dark sci-fi background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00050B] via-[#050A13] to-[#00050B] opacity-90" />
      
      <div className="container max-w-2xl mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 pt-8 relative z-30">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => step && navigate(`/goals/${step.goal_id}`)} 
            disabled={!step}
            className="relative border-2 border-primary/60 rounded-lg bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:border-primary/80 active:scale-95 active:shadow-[0_0_40px_rgba(91,180,255,0.6)] transition-all duration-200 shadow-[0_0_20px_rgba(91,180,255,0.3)] hover:shadow-[0_0_30px_rgba(91,180,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-5 w-5 text-[#E7F8FF] drop-shadow-[0_0_8px_rgba(190,235,255,0.4)]" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-glow to-primary">
              EDIT STEP
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created {format(new Date(step.created_at), "MMM d, yyyy")}
            </p>
          </div>
          <Badge className={getStatusColor(step.status)}>
            {step.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Simplified Edit Form - Only Step Name and Notes */}
        <div className="relative overflow-hidden rounded-lg">
          {/* Holographic border effect */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/30 via-transparent to-primary/20 p-[2px]">
            <div className="h-full w-full rounded-lg bg-[#00050B]" />
          </div>
          
          <Card className="relative border-2 border-primary/30 bg-[#00050B]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(91,180,255,0.15)]">
            <CardHeader className="border-b border-primary/20">
              <CardTitle className="text-lg font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-glow">
                STEP DETAILS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Step Name */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                  Step Name *
                </Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter step name" className="bg-background/40 border-primary/30 focus:border-primary/60 text-foreground placeholder:text-muted-foreground/50" />
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                  Notes
                </Label>
                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes or context" rows={5} className="bg-background/40 border-primary/30 focus:border-primary/60 text-foreground placeholder:text-muted-foreground/50 resize-none" />
              </div>

              {/* Status (kept for functionality but styled minimally) */}
              <div className="space-y-3 pt-2">
                <Label htmlFor="status" className="text-sm font-rajdhani tracking-wide uppercase text-primary/90">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="bg-background/40 border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#00050B] border-primary/30">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full mt-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary-glow/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 font-rajdhani tracking-wider">
                  {saving ? "SAVING..." : "SAVE CHANGES"}
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}