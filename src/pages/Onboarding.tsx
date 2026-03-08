import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Heart, Target, Sparkles, Rocket, Shield, ChevronRight, ChevronLeft, User, Palette } from "lucide-react";
import { createPact } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const symbols = [
  { icon: Flame, label: "Flame", value: "flame" },
  { icon: Heart, label: "Heart", value: "heart" },
  { icon: Target, label: "Target", value: "target" },
  { icon: Sparkles, label: "Sparkles", value: "sparkles" },
];

const colors = [
  { name: "Amber", value: "amber", class: "bg-amber-500" },
  { name: "Rose", value: "rose", class: "bg-rose-500" },
  { name: "Emerald", value: "emerald", class: "bg-emerald-500" },
  { name: "Sky", value: "sky", class: "bg-sky-500" },
  { name: "Violet", value: "violet", class: "bg-violet-500" },
  { name: "Cyan", value: "cyan", class: "bg-cyan-500" },
];

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [name, setName] = useState("");
  const [mantra, setMantra] = useState("");
  const [symbol, setSymbol] = useState("flame");
  const [color, setColor] = useState("amber");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const canNext = () => {
    if (step === 0) return true; // Welcome
    if (step === 1) return displayName.trim().length > 0;
    if (step === 2) return name.trim().length > 0 && mantra.trim().length > 0;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // Update profile display name
      if (displayName.trim()) {
        await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", user.id);
      }

      // Create pact
      await createPact(user.id, name, mantra, symbol, color);

      toast({ title: "Welcome aboard, Agent!", description: "Your pact has been sealed." });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Step counter */}
      <div className="fixed top-6 right-6 z-50">
        <span className="text-xs font-mono text-muted-foreground">
          {step + 1} / {TOTAL_STEPS}
        </span>
      </div>

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 0: Welcome */}
          {step === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="text-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 mx-auto bg-primary/10 border border-primary/30 flex items-center justify-center" style={{ clipPath: "polygon(20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%, 0% 20%)" }}>
                  <Rocket className="h-10 w-10 text-primary" />
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-black font-orbitron text-foreground mb-3">Welcome to The Pact</h1>
                <p className="text-muted-foreground font-rajdhani leading-relaxed">
                  You're about to embark on a transformative journey. Let's set up your command center and seal your first pact.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                {[
                  { icon: Target, label: "Track Goals" },
                  { icon: Shield, label: "Build Habits" },
                  { icon: Sparkles, label: "Level Up" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="p-3 rounded-lg bg-card border border-border/50 text-center">
                    <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-xs font-mono text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 1: Profile */}
          {step === 1 && (
            <motion.div key="profile" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-card border border-border/50 rounded-full flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-black font-orbitron text-foreground mb-2">Agent Identity</h2>
                <p className="text-sm text-muted-foreground">How should we call you?</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your agent name..."
                  className="text-center text-lg font-rajdhani"
                  maxLength={30}
                />
              </div>
            </motion.div>
          )}

          {/* STEP 2: Create Pact */}
          {step === 2 && (
            <motion.div key="pact" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-card border border-border/50 rounded-full flex items-center justify-center">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-black font-orbitron text-foreground mb-2">Seal Your Pact</h2>
                <p className="text-sm text-muted-foreground">Define your mission and commitment</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Pact Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My personal evolution..." maxLength={50} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Your Mantra</label>
                  <Textarea value={mantra} onChange={(e) => setMantra(e.target.value)} placeholder="A phrase that drives you forward..." rows={3} maxLength={150} />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Customize */}
          {step === 3 && (
            <motion.div key="customize" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-card border border-border/50 rounded-full flex items-center justify-center">
                  <Palette className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-black font-orbitron text-foreground mb-2">Customize</h2>
                <p className="text-sm text-muted-foreground">Choose your symbol and color</p>
              </div>

              {/* Symbol selection */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Symbol</label>
                <div className="grid grid-cols-4 gap-3">
                  {symbols.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSymbol(s.value)}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        symbol === s.value
                          ? "border-primary bg-primary/10 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.4)]"
                          : "border-border/50 bg-card hover:border-border"
                      }`}
                    >
                      <s.icon className={`h-6 w-6 ${symbol === s.value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-[10px] font-mono">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selection */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Color</label>
                <div className="grid grid-cols-6 gap-3">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`aspect-square rounded-lg ${c.class} transition-all ${
                        color === c.value
                          ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-10">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-2 font-orbitron text-sm px-6">
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={isSubmitting || !canNext()} className="gap-2 font-orbitron text-sm px-6">
              {isSubmitting ? "Sealing..." : "Seal the Pact"}
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
