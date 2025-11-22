import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Smile, Meh, Frown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Health() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const today = new Date().toISOString().split("T")[0];
  const [mood, setMood] = useState(3);
  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState("");
  const [activity, setActivity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadTodayData = async () => {
      const { data } = await supabase
        .from("health")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (data) {
        setMood(data.mood || 3);
        setWeight(data.weight?.toString() || "");
        setSleep(data.sleep?.toString() || "");
        setActivity(data.activity || "");
        setNotes(data.notes || "");
      }
    };

    loadTodayData();
  }, [user, today]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    const healthData = {
      user_id: user.id,
      date: today,
      mood,
      weight: weight ? parseFloat(weight) : null,
      sleep: sleep ? parseFloat(sleep) : null,
      activity: activity.trim() || null,
      notes: notes.trim() || null,
    };

    const { error } = await supabase
      .from("health")
      .upsert(healthData, { onConflict: "user_id,date" });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Health Data Saved",
        description: "Your daily health metrics have been recorded",
      });
    }

    setLoading(false);
  };

  const moodIcons = [
    { value: 1, Icon: Frown, label: "Poor" },
    { value: 2, Icon: Frown, label: "Below Average" },
    { value: 3, Icon: Meh, label: "Average" },
    { value: 4, Icon: Smile, label: "Good" },
    { value: 5, Icon: Smile, label: "Excellent" },
  ];

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-secondary">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="pt-8">
          <h1 className="text-3xl font-bold mb-2">Health</h1>
          <p className="text-muted-foreground">Track your daily well-being</p>
        </div>

        {/* Today's Entry */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Log</CardTitle>
            <CardDescription>{new Date(today).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mood */}
            <div className="space-y-3">
              <Label>Mood</Label>
              <div className="flex justify-between gap-2">
                {moodIcons.map(({ value, Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setMood(value)}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      mood === value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 ${
                        mood === value ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="70.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            {/* Sleep */}
            <div className="space-y-2">
              <Label htmlFor="sleep">Sleep (hours)</Label>
              <Input
                id="sleep"
                type="number"
                step="0.5"
                placeholder="8"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
              />
            </div>

            {/* Activity */}
            <div className="space-y-2">
              <Label htmlFor="activity">Activity</Label>
              <Input
                id="activity"
                placeholder="Running, yoga, gym..."
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="How are you feeling today?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Today's Data"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}
