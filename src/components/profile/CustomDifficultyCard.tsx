import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PactSettingsCard } from "./PactSettingsCard";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Zap, Palette } from "lucide-react";
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
      <div className="space-y-4">
        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-[#8ACBFF] font-orbitron uppercase tracking-widest drop-shadow-[0_0_4px_rgba(138,203,255,0.4)]">
            Difficulty Name
          </label>
          <Input
            placeholder="Enter custom difficulty name"
            value={customDifficultyName}
            onChange={(e) => onCustomDifficultyNameChange(e.target.value)}
            maxLength={50}
            className="h-11 bg-[#0d1a2d]/90 border border-primary/40 focus:border-primary/70 text-[#e0f0ff] placeholder:text-[#6b9ec4] shadow-[inset_0_0_10px_rgba(91,180,255,0.1)]"
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-[#8ACBFF] font-orbitron uppercase tracking-widest flex items-center gap-1.5 drop-shadow-[0_0_4px_rgba(138,203,255,0.4)]">
            <Palette className="h-3 w-3 text-[#8ACBFF]" />
            Difficulty Color
          </label>
          <div className="flex items-center gap-3">
            <label 
              className="relative w-12 h-12 rounded-lg border border-primary/40 overflow-hidden flex-shrink-0 shadow-[0_0_15px_rgba(91,180,255,0.1)] cursor-pointer group transition-all duration-200 hover:border-primary/70 hover:shadow-[0_0_20px_rgba(91,180,255,0.25)] active:scale-95"
              style={{ backgroundColor: customDifficultyColor }}
            >
              <input
                type="color"
                value={customDifficultyColor}
                onChange={(e) => onCustomDifficultyColorChange(e.target.value)}
                className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0"
              />
              {/* Inner glow effect - pointer-events-none to not block clicks */}
              <div 
                className="absolute inset-0 rounded-lg pointer-events-none transition-all duration-200 group-hover:opacity-80"
                style={{ 
                  boxShadow: `inset 0 0 20px ${customDifficultyColor}40`
                }}
              />
              {/* Hover indicator */}
              <div className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
            </label>
            <Input
              type="text"
              value={customDifficultyColor}
              onChange={(e) => onCustomDifficultyColorChange(e.target.value)}
              placeholder="#a855f7"
              maxLength={7}
              className="h-11 flex-1 bg-[#0d1a2d]/90 border border-primary/40 focus:border-primary/70 font-mono text-sm text-[#e0f0ff] placeholder:text-[#6b9ec4] shadow-[inset_0_0_10px_rgba(91,180,255,0.1)]"
            />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d1a2d]/80 border border-primary/30 hover:border-primary/40 transition-colors">
          <div className="space-y-0.5 min-w-0 flex-1 mr-3">
            <span className="text-sm font-semibold text-[#e0f0ff] font-rajdhani uppercase tracking-wide block truncate">
              Activate Custom Difficulty
            </span>
            <p className="text-xs text-[#8ACBFF] font-rajdhani truncate">
              {customDifficultyActive 
                ? "Available in goal creation" 
                : "Hidden from selectors"}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Switch
              checked={customDifficultyActive}
              onCheckedChange={onCustomDifficultyActiveChange}
            />
          </div>
        </div>

        {/* Preview */}
        {customDifficultyName && (
          <div className="p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
            <p className="text-[10px] text-[#7eb3d9] font-orbitron uppercase tracking-widest mb-2">Preview</p>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: customDifficultyColor }}
              />
              <span 
                className="font-orbitron uppercase tracking-wide text-sm font-semibold"
                style={{ color: customDifficultyColor }}
              >
                {customDifficultyName}
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "w-full h-10 font-orbitron uppercase tracking-wider text-xs",
            "bg-primary/20 border border-primary/40 rounded-lg",
            "text-primary hover:bg-primary/30 hover:border-primary/60",
            "transition-all duration-200"
          )}
        >
          {saving ? "SAVING..." : "SAVE DIFFICULTY"}
        </Button>
      </div>
    </PactSettingsCard>
  );
}
