import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, History } from "lucide-react";
import { format } from "date-fns";
import { CyberBackground } from "@/components/CyberBackground";
import { motion } from "framer-motion";

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
      const { data: stepData, error: stepError } = await supabase.from("steps").select("*").eq("id", stepId).single();
      if (stepError) throw stepError;
      setStep(stepData);
      setTitle(stepData.title);
      setDescription(stepData.description || "");
      setNotes(stepData.notes || "");
      setStatus(stepData.status);
      setDueDate(stepData.due_date || "");
      setCompletionDate(stepData.completion_date ? format(new Date(stepData.completion_date), "yyyy-MM-dd'T'HH:mm") : "");

      const { data: historyData, error: historyError } = await supabase.from("step_status_history").select("*").eq("step_id", stepId).order("changed_at", { ascending: false });
      if (historyError) throw historyError;
      setStatusHistory(historyData || []);
    } catch (error: any) {
      console.error("Error loading step:", error);
      toast({ title: "Error", description: "Failed to load step details", variant: "destructive" });
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

      if (status === "completed" && !completionDate) {
        updates.completion_date = new Date().toISOString();
        updates.validated_at = new Date().toISOString();
      }
      if (status === "completed" && !step.validated_at) {
        updates.validated_at = new Date().toISOString();
      }

      const { error } = await supabase.from("steps").update(updates).eq("id", step.id);
      if (error) throw error;

      await recalculateGoalProgress(step.goal_id);
      toast({ title: "Success", description: "Step updated successfully" });
      await loadStepData();
    } catch (error: any) {
      console.error("Error saving step:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const recalculateGoalProgress = async (goalId: string) => {
    try {
      const { data: stepsData, error: stepsError } = await supabase.from("steps").select("id, status").eq("goal_id", goalId);
      if (stepsError) throw stepsError;
      const completedCount = stepsData?.filter(s => s.status === "completed").length || 0;
      await supabase.from("goals").update({ validated_steps: completedCount }).eq("id", goalId);
    } catch (error) {
      console.error("Error recalculating goal progress:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/15 text-green-400 border-green-500/30";
      case "in_progress": return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "blocked": return "bg-red-500/15 text-red-400 border-red-500/30";
      default: return "bg-muted text-muted-foreground border-border";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="relative z-10 max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4 pt-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => step && navigate(`/goals/${step.goal_id}`)} 
            disabled={!step}
            className="border border-border hover:bg-card hover:border-primary/40 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-orbitron tracking-wider">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                EDIT STEP
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-rajdhani">
              Created {format(new Date(step.created_at), "MMM d, yyyy")}
            </p>
          </div>
          <Badge className={getStatusColor(step.status)}>
            {step.status.replace("_", " ")}
          </Badge>
        </motion.div>

        {/* Form Card */}
        <motion.div variants={itemVariants} className="relative rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6 space-y-6">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative space-y-5">
            {/* Step Name */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-rajdhani tracking-wide uppercase text-muted-foreground">
                Step Name *
              </Label>
              <Input 
                id="title" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Enter step name" 
                className="bg-card/60 border-border focus:border-primary/60" 
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-rajdhani tracking-wide uppercase text-muted-foreground">
                Notes
              </Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Additional notes or context" 
                rows={5} 
                className="bg-card/60 border-border focus:border-primary/60 resize-none" 
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-rajdhani tracking-wide uppercase text-muted-foreground">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="bg-card/60 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full mt-4">
              <span className="font-rajdhani tracking-wider">
                {saving ? "SAVING..." : "SAVE CHANGES"}
              </span>
            </Button>
          </div>
        </motion.div>

        {/* Status History */}
        {statusHistory.length > 0 && (
          <motion.div variants={itemVariants} className="relative rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-4 w-4 text-primary" />
                <span className="font-orbitron text-sm tracking-wider">Status History</span>
              </div>
              <div className="space-y-2">
                {statusHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 font-rajdhani">
                      {entry.old_status && (
                        <>
                          <span className="text-muted-foreground capitalize">{entry.old_status}</span>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <span className="capitalize text-foreground">{entry.new_status}</span>
                    </div>
                    <span className="text-muted-foreground text-xs font-rajdhani">
                      {format(new Date(entry.changed_at), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
