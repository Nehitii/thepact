import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Heart, Target, Sparkles } from "lucide-react";
import { createPact } from "@/lib/supabase";
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
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [mantra, setMantra] = useState("");
  const [symbol, setSymbol] = useState("flame");
  const [color, setColor] = useState("amber");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const introScreens = [
    {
      title: "Welcome to Pacte",
      description: "Your personal alignment system for a meaningful life",
      icon: Flame,
    },
    {
      title: "One Commitment",
      description: "Define your life's direction through a single, evolving Pact",
      icon: Target,
    },
    {
      title: "Continuous Evolution",
      description: "Track goals, health, and finance - all aligned with your Pact",
      icon: Sparkles,
    },
  ];

  const handleCreatePact = async () => {
    if (!user) return;
    if (!name.trim() || !mantra.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a name and commitment statement",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await createPact({
      user_id: user.id,
      name: name.trim(),
      mantra: mantra.trim(),
      symbol,
      color,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      toast({
        title: "Pact Created",
        description: "Your journey begins now",
      });
      navigate("/");
    }
  };

  if (step < 3) {
    const screen = introScreens[step];
    const Icon = screen.icon;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary">
        <Card className="w-full max-w-lg border-2 shadow-xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-primary/10">
                <Icon className="h-16 w-16 text-primary animate-float" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">{screen.title}</CardTitle>
              <CardDescription className="text-lg">{screen.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setStep(step + 1)} className="w-full" size="lg">
              {step === 2 ? "Create My Pact" : "Continue"}
            </Button>
            {step > 0 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            )}
            <div className="flex justify-center gap-2 pt-2">
              {introScreens.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === step ? "bg-primary w-6" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary">
      <Card className="w-full max-w-2xl border-2 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Define Your Pact</CardTitle>
          <CardDescription>
            This is your commitment - make it meaningful
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Pact Name</Label>
            <Input
              id="name"
              placeholder="My Life Commitment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mantra">Commitment Statement</Label>
            <Textarea
              id="mantra"
              placeholder="I commit to..."
              value={mantra}
              onChange={(e) => setMantra(e.target.value)}
              rows={4}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Symbol</Label>
            <div className="grid grid-cols-4 gap-4">
              {symbols.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.value}
                    onClick={() => setSymbol(s.value)}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      symbol === s.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs text-center">{s.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color Theme</Label>
            <div className="grid grid-cols-4 gap-4">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    color === c.value
                      ? "border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`h-8 w-8 mx-auto mb-2 rounded-full ${c.class}`} />
                  <p className="text-xs text-center">{c.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={() => setStep(2)}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleCreatePact}
              disabled={loading || !name.trim() || !mantra.trim()}
              className="flex-1"
            >
              {loading ? "Creating..." : "Seal My Pact"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
