import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Target, Check, StickyNote, ListOrdered } from "lucide-react";
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

export default function StepDetail() {
  const { stepId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");

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
      setNotes(stepData.notes || "");
      setStatus(stepData.status);
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
        notes,
        status,
        updated_at: new Date().toISOString()
      };

      if (status === "completed" && !step.validated_at) {
        updates.completion_date = new Date().toISOString();
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
          <p className="text-muted-foreground mb-4 font-rajdhani">Step not found</p>
          <Button onClick={() => navigate(-1)} className="rounded-xl">Go Back</Button>
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
      
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="relative z-10 max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => step && navigate(`/goals/${step.goal_id}`)}
            disabled={!step}
            className="text-primary/70 hover:text-primary hover:bg-primary/10 -ml-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goal
          </Button>
          
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_30px_rgba(91,180,255,0.6)] font-orbitron">
              Edit Step
            </h1>
            <p className="text-primary/60 tracking-wide font-rajdhani text-lg">
              Created {format(new Date(step.created_at), "MMM d, yyyy")}
            </p>
            <Badge className={`${getStatusColor(step.status)} font-rajdhani`}>
              {step.status.replace("_", " ")}
            </Badge>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div 
          variants={itemVariants} 
          className="relative rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-xl overflow-hidden"
        >
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative p-8 md:p-10 space-y-10">
            
            {/* Section 1: Basic Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Step Information</h2>
              </div>

              {/* Step Name */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                  Step Name <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Enter step name"
                  variant="light"
                  className="h-12 text-base rounded-xl"
                />
              </div>

              {/* Status Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80 flex items-center gap-2">
                  <ListOrdered className="h-4 w-4" />
                  Status
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setStatus("pending")}
                    className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                      status === "pending"
                        ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(91,180,255,0.2)]"
                        : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      status === "pending" ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {status === "pending" && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className={`font-rajdhani font-bold text-lg ${status === "pending" ? "text-primary" : "text-foreground"}`}>
                      Pending
                    </div>
                    <div className="text-sm text-muted-foreground">Step is not yet complete</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setStatus("completed")}
                    className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                      status === "completed"
                        ? "border-green-500 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                        : "border-border bg-muted/30 hover:border-green-500/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      status === "completed" ? "border-green-500 bg-green-500" : "border-muted-foreground/30"
                    }`}>
                      {status === "completed" && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className={`font-rajdhani font-bold text-lg ${status === "completed" ? "text-green-400" : "text-foreground"}`}>
                      Completed
                    </div>
                    <div className="text-sm text-muted-foreground">Step has been finished</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Notes */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-primary/20">
                <StickyNote className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-orbitron uppercase tracking-wider text-primary">Notes</h2>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-sm font-rajdhani tracking-wide uppercase text-foreground/80">
                  Step Notes
                </Label>
                <Textarea 
                  id="notes" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Add notes or context for this step..."
                  rows={5}
                  maxLength={500}
                  variant="light"
                  className="rounded-xl resize-none text-base"
                />
                <p className="text-xs text-muted-foreground text-right">{notes.length}/500</p>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-primary/20">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-rajdhani uppercase tracking-wider text-base shadow-[0_0_20px_rgba(91,180,255,0.3)]"
              >
                <Check className="h-5 w-5 mr-2" />
                {saving ? "SAVING..." : "SAVE CHANGES"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
