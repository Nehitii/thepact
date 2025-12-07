import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PactSettingsCard } from "./PactSettingsCard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDifficultyCardProps {
  userId: string;
  customDifficultyName: string;
  customDifficultyActive: boolean;
  customDifficultyColor: string;
  onCustomDifficultyNameChange: (value: string) => void;
  onCustomDifficultyActiveChange: (value: boolean) => void;
  onCustomDifficultyColorChange: (value: string) => void;
}

export function CustomDifficultyCard({
  userId,
  customDifficultyName,
  customDifficultyActive,
  customDifficultyColor,
  onCustomDifficultyNameChange,
  onCustomDifficultyActiveChange,
  onCustomDifficultyColorChange,
}: CustomDifficultyCardProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        custom_difficulty_name: customDifficultyName.trim() || null,
        custom_difficulty_active: customDifficultyActive,
        custom_difficulty_color: customDifficultyColor,
      })
      .eq("id", userId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Custom Difficulty Updated",
        description: "Your custom difficulty settings have been saved.",
      });
    }

    setSaving(false);
  };

  return (
    <PactSettingsCard
      icon={<Zap className="h-5 w-5 text-primary" />}
      title="Custom Difficulty"
      description="Create your own difficulty level for goals"
    >
      {/* Name Input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground font-orbitron uppercase tracking-widest">
          Difficulty Name
        </label>
        <Input
          placeholder="Enter custom difficulty name"
          value={customDifficultyName}
          onChange={(e) => onCustomDifficultyNameChange(e.target.value)}
          maxLength={50}
          className="h-12"
        />
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground font-orbitron uppercase tracking-widest">
          Difficulty Color
        </label>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg border-2 border-primary/40 overflow-hidden flex-shrink-0"
            style={{ backgroundColor: customDifficultyColor }}
          >
            <input
              type="color"
              value={customDifficultyColor}
              onChange={(e) => onCustomDifficultyColorChange(e.target.value)}
              className="w-full h-full cursor-pointer opacity-0"
            />
          </div>
          <Input
            type="text"
            value={customDifficultyColor}
            onChange={(e) => onCustomDifficultyColorChange(e.target.value)}
            placeholder="#a855f7"
            maxLength={7}
            className="h-12 flex-1"
          />
        </div>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border-2 border-primary/20">
        <div className="space-y-1">
          <span className="text-sm font-semibold text-foreground font-rajdhani uppercase tracking-wide">
            Activate Custom Difficulty
          </span>
          <p className="text-xs text-muted-foreground font-rajdhani">
            {customDifficultyActive 
              ? "Available in goal creation" 
              : "Hidden from difficulty selectors"}
          </p>
        </div>
        <Switch
          checked={customDifficultyActive}
          onCheckedChange={onCustomDifficultyActiveChange}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className={cn(
          "w-full h-11 font-orbitron uppercase tracking-wider text-sm",
          "bg-primary/20 border-2 border-primary/40 rounded-lg",
          "text-primary hover:bg-primary/30 hover:border-primary/60",
          "transition-all duration-200"
        )}
      >
        {saving ? "SAVING..." : "SAVE DIFFICULTY"}
      </Button>
    </PactSettingsCard>
  );
}
